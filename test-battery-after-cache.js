#!/usr/bin/env node

/**
 * Test: Accept the cached response, then immediately query battery status
 * 
 * Theory: The device sends a "device info" packet on connection. We should accept
 * it, then proceed with actual feature queries like battery status.
 * 
 * This test will:
 * 1. Connect to the device
 * 2. Accept the initial cached response (protocol version)
 * 3. Immediately send a Feature Set query to find battery feature index
 * 4. Send battery status query
 * 5. Parse and display results
 */

const dbus = require('dbus-next');

const SERVICE_UUID = '00010000-0000-1000-8000-011f2000046d';
const CHAR_UUID = '00010001-0000-1000-8000-011f2000046d';
const DEVICE_ADDRESS = 'CD_37_EE_48_C1_6A';

async function main() {
  console.log('Starting BLE battery test with cache acceptance...\n');

  const bus = dbus.systemBus();
  const bluez = await bus.getProxyObject('org.bluez', '/');
  const objectManager = bluez.getInterface('org.freedesktop.DBus.ObjectManager');
  const objects = await objectManager.GetManagedObjects();

  // Find device
  let devicePath = null;
  let servicePath = null;
  let charPath = null;

  for (const [path, interfaces] of Object.entries(objects)) {
    const deviceAddr = interfaces['org.bluez.Device1']?.Address;
    const deviceAddrValue = deviceAddr?.value || deviceAddr;
    
    if (deviceAddrValue === DEVICE_ADDRESS.replace(/_/g, ':')) {
      devicePath = path;
      console.log(`Found device: ${path}`);
    }
    
    if (devicePath && path.startsWith(devicePath)) {
      const svcUUID = interfaces['org.bluez.GattService1']?.UUID;
      const svcUUIDValue = svcUUID?.value || svcUUID;
      
      if (svcUUIDValue === SERVICE_UUID) {
        servicePath = path;
        console.log(`Found service: ${path}`);
      }
    }
    
    if (servicePath && path.startsWith(servicePath)) {
      const charUUID = interfaces['org.bluez.GattCharacteristic1']?.UUID;
      const charUUIDValue = charUUID?.value || charUUID;
      
      if (charUUIDValue === CHAR_UUID) {
        charPath = path;
        console.log(`Found characteristic: ${path}`);
      }
    }
  }

  if (!charPath) {
    console.error('Could not find device, service, or characteristic');
    process.exit(1);
  }

  const charProxy = await bus.getProxyObject('org.bluez', charPath);
  const char = charProxy.getInterface('org.bluez.GattCharacteristic1');

  const responses = [];
  let responseCount = 0;

  // Subscribe to notifications
  await char.StartNotify();
  console.log('Subscribed to notifications\n');

  charProxy.getInterface('org.freedesktop.DBus.Properties').on('PropertiesChanged', (iface, changed) => {
    if (changed.Value) {
      const data = Buffer.from(changed.Value.value);
      responseCount++;
      responses.push({ time: Date.now(), data });
      console.log(`Response ${responseCount}: ${data.toString('hex')}`);
      console.log(`  Device Index: 0x${data[0].toString(16).padStart(2, '0')}`);
      console.log(`  Feature Index: 0x${data[1].toString(16).padStart(2, '0')}`);
      console.log(`  Function/SW ID: 0x${data[2].toString(16).padStart(2, '0')}`);
      console.log();
    }
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  // Step 1: Send getProtocolVersion and accept the cached response
  console.log('Step 1: Sending getProtocolVersion (accepting cached response)...');
  const getProtocolCmd = Buffer.from([0x02, 0x00, 0x01, 0x00, 0x00, 0x00]);
  await char.WriteValue(Array.from(getProtocolCmd), {});
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 2: Query Feature Set to find battery feature index
  // Feature ID 0x1000 (Unified Battery) or 0x1001 (Battery Status)
  console.log('Step 2: Querying Feature Set for battery feature (0x1000)...');
  const featureSetCmd = Buffer.from([0x02, 0x01, 0x12, 0x10, 0x00, 0x00]); // getFeatureIndex(0x1000)
  await char.WriteValue(Array.from(featureSetCmd), {});
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 3: Try alternative battery feature (0x1001)
  console.log('Step 3: Querying Feature Set for battery feature (0x1001)...');
  const featureSetCmd2 = Buffer.from([0x02, 0x01, 0x13, 0x10, 0x01, 0x00]); // getFeatureIndex(0x1001)
  await char.WriteValue(Array.from(featureSetCmd2), {});
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 4: If we got a valid feature index, query battery
  // For now, let's try with feature index 0x03 (guessing from 31 features)
  console.log('Step 4: Attempting battery query with guessed feature index 0x03...');
  const batteryCmd = Buffer.from([0x02, 0x03, 0x24, 0x00, 0x00, 0x00]); // getBatteryStatus
  await char.WriteValue(Array.from(batteryCmd), {});
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 5: Try a few more feature indices
  for (let featureIdx = 0x04; featureIdx <= 0x06; featureIdx++) {
    console.log(`Step 5.${featureIdx}: Trying battery query with feature index 0x${featureIdx.toString(16).padStart(2, '0')}...`);
    const cmd = Buffer.from([0x02, featureIdx, 0x25, 0x00, 0x00, 0x00]);
    await char.WriteValue(Array.from(cmd), {});
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  // Step 6: Try DPI query (feature 0x2201)
  console.log('\nStep 6: Querying Feature Set for DPI feature (0x2201)...');
  const dpiFeatureCmd = Buffer.from([0x02, 0x01, 0x16, 0x22, 0x01, 0x00]); // getFeatureIndex(0x2201)
  await char.WriteValue(Array.from(dpiFeatureCmd), {});
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Cleanup
  await char.StopNotify();
  console.log('\n=== Summary ===');
  console.log(`Total responses received: ${responseCount}`);
  console.log('\nResponse analysis:');
  const uniqueResponses = [...new Set(responses.map(r => r.data.toString('hex')))];
  console.log(`Unique responses: ${uniqueResponses.length}`);
  uniqueResponses.forEach((hex, i) => {
    console.log(`  ${i + 1}. ${hex}`);
  });

  if (uniqueResponses.length > 1) {
    console.log('\n✅ SUCCESS: Device sent different responses!');
  } else {
    console.log('\n⚠️  ISSUE: Device only sent one response type (cached)');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
