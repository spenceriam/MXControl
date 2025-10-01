#!/usr/bin/env node

/**
 * Test: Set DPI and read it back to verify it was applied
 */

const dbus = require('dbus-next');

const LOGITECH_SERVICE_UUID = '00010000-0000-1000-8000-011f2000046d';
const LOGITECH_CHAR_UUID = '00010001-0000-1000-8000-011f2000046d';
const DEVICE_ADDRESS = 'CD:37:EE:48:C1:6A';

async function main() {
  console.log('Testing DPI set and readback...\n');

  const bus = dbus.systemBus();
  const bluez = await bus.getProxyObject('org.bluez', '/');
  const objectManager = bluez.getInterface('org.freedesktop.DBus.ObjectManager');
  const objects = await objectManager.GetManagedObjects();

  // Find the Logitech characteristic
  let charPath = null;
  for (const [path, interfaces] of Object.entries(objects)) {
    const charUUID = interfaces['org.bluez.GattCharacteristic1']?.UUID;
    const uuid = charUUID?.value || charUUID;
    
    if (path.includes(DEVICE_ADDRESS.replace(/:/g, '_')) && uuid === LOGITECH_CHAR_UUID) {
      charPath = path;
      console.log(`Found characteristic: ${path}\n`);
      break;
    }
  }

  if (!charPath) {
    console.error('Could not find Logitech characteristic');
    process.exit(1);
  }

  const charProxy = await bus.getProxyObject('org.bluez', charPath);
  const char = charProxy.getInterface('org.bluez.GattCharacteristic1');

  const responses = [];
  
  // Subscribe to notifications
  await char.StartNotify();
  
  charProxy.getInterface('org.freedesktop.DBus.Properties').on('PropertiesChanged', (iface, changed) => {
    if (changed.Value) {
      const data = Buffer.from(changed.Value.value);
      responses.push(data);
      console.log(`Response: ${data.toString('hex')}`);
      
      // Parse response
      const devIdx = data[0];
      const featIdx = data[1];
      const funcSwId = data[2];
      const funcId = (funcSwId >> 4) & 0x0f;
      const swId = funcSwId & 0x0f;
      
      console.log(`  Device: 0x${devIdx.toString(16).padStart(2, '0')}, Feature: 0x${featIdx.toString(16).padStart(2, '0')}, Function: 0x${funcId.toString(16)}, SW ID: 0x${swId.toString(16)}`);
      
      // If this looks like a DPI response (feature 0x09, has DPI data)
      if (featIdx === 0x09 && data.length >= 6) {
        const dpi = (data[4] << 8) | data[5];
        if (dpi >= 200 && dpi <= 4000) {
          console.log(`  *** Possible DPI value in response: ${dpi} ***`);
        }
      }
      
      console.log();
    }
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  // Step 1: Get feature index for DPI feature (0x2201)
  console.log('Step 1: Getting feature index for DPI (0x2201)...');
  const getFeatureIndexCmd = Buffer.from([0x02, 0x01, 0x01, 0x22, 0x01, 0x00]);
  await char.WriteValue(Array.from(getFeatureIndexCmd), {});
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Assuming feature index 0x09 based on earlier logs
  const dpiFeatureIndex = 0x09;
  console.log(`Using DPI feature index: 0x${dpiFeatureIndex.toString(16).padStart(2, '0')}\n`);

  // Step 2: Read current DPI (function 0x01)
  console.log('Step 2: Reading current DPI...');
  const getDpiCmd = Buffer.from([0x02, dpiFeatureIndex, 0x12, 0x00, 0x00, 0x00]); // func 0x01, sw id 0x02
  await char.WriteValue(Array.from(getDpiCmd), {});
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Step 3: Set DPI to 2400
  console.log('Step 3: Setting DPI to 2400...');
  const setDpiCmd = Buffer.from([0x02, dpiFeatureIndex, 0x23, 0x00, 0x09, 0x60]); // func 0x02, sw id 0x03, dpi=2400
  await char.WriteValue(Array.from(setDpiCmd), {});
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Step 4: Read back DPI to verify
  console.log('Step 4: Reading back DPI to verify...');
  const getDpiCmd2 = Buffer.from([0x02, dpiFeatureIndex, 0x14, 0x00, 0x00, 0x00]); // func 0x01, sw id 0x04
  await char.WriteValue(Array.from(getDpiCmd2), {});
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Step 5: Try setting to 800 (very different to test)
  console.log('Step 5: Setting DPI to 800...');
  const setDpiCmd2 = Buffer.from([0x02, dpiFeatureIndex, 0x25, 0x00, 0x03, 0x20]); // func 0x02, sw id 0x05, dpi=800
  await char.WriteValue(Array.from(setDpiCmd2), {});
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Step 6: Read back again
  console.log('Step 6: Reading back DPI again...');
  const getDpiCmd3 = Buffer.from([0x02, dpiFeatureIndex, 0x16, 0x00, 0x00, 0x00]); // func 0x01, sw id 0x06
  await char.WriteValue(Array.from(getDpiCmd3), {});
  await new Promise(resolve => setTimeout(resolve, 1500));

  await char.StopNotify();
  
  console.log('\n=== Summary ===');
  console.log(`Total responses: ${responses.length}`);
  console.log('\nMove the mouse and see if sensitivity changed!');
  console.log('If DPI is actually changing, you should feel the difference between 800 and 2400.');
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
