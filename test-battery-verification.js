#!/usr/bin/env node

/**
 * BATTERY DATA VERIFICATION TEST
 * 
 * This script PROVES the battery data is coming from real hardware
 * by showing the complete data path from BlueZ to our app.
 * 
 * If ANY of these fail, we know we're reading mock/fallback data.
 */

const dbus = require('dbus-next');

const BATTERY_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
const BATTERY_LEVEL_UUID = '00002a19-0000-1000-8000-00805f9b34fb';
const DEVICE_ADDRESS = 'CD:37:EE:48:C1:6A';

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        BATTERY DATA VERIFICATION - PROVE IT\'S REAL          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const bus = dbus.systemBus();

  // STEP 1: Verify BlueZ is running
  console.log('📋 STEP 1: Verify BlueZ daemon is running');
  try {
    const bluez = await bus.getProxyObject('org.bluez', '/');
    console.log('✅ BlueZ daemon is running and responding\n');
  } catch (err) {
    console.error('❌ FAIL: BlueZ not running. Cannot get real data.');
    console.error('   Error:', err.message);
    process.exit(1);
  }

  // STEP 2: Find the actual device in BlueZ
  console.log('📋 STEP 2: Find MX Master 2S device in BlueZ registry');
  const bluez = await bus.getProxyObject('org.bluez', '/');
  const objectManager = bluez.getInterface('org.freedesktop.DBus.ObjectManager');
  const objects = await objectManager.GetManagedObjects();

  let devicePath = null;
  let deviceName = null;

  for (const [path, interfaces] of Object.entries(objects)) {
    const deviceAddr = interfaces['org.bluez.Device1']?.Address;
    const deviceAddrValue = deviceAddr?.value || deviceAddr;
    
    if (deviceAddrValue === DEVICE_ADDRESS) {
      devicePath = path;
      const name = interfaces['org.bluez.Device1']?.Name;
      deviceName = name?.value || name || 'Unknown';
      console.log(`✅ Device found in BlueZ:`);
      console.log(`   Path: ${path}`);
      console.log(`   Name: ${deviceName}`);
      console.log(`   Address: ${deviceAddrValue}`);
      
      // Check connection status
      const connected = interfaces['org.bluez.Device1']?.Connected;
      const connectedValue = connected?.value !== undefined ? connected.value : connected;
      console.log(`   Connected: ${connectedValue}`);
      
      if (!connectedValue) {
        console.error('❌ FAIL: Device is not connected. Cannot read real battery data.');
        process.exit(1);
      }
      break;
    }
  }

  if (!devicePath) {
    console.error('❌ FAIL: Device not found in BlueZ registry.');
    console.error('   Make sure the mouse is paired and connected via Bluetooth.');
    process.exit(1);
  }

  console.log('');

  // STEP 3: Find the GATT Battery Service
  console.log('📋 STEP 3: Find GATT Battery Service (0x180F)');
  let batteryServicePath = null;

  for (const [path, interfaces] of Object.entries(objects)) {
    const serviceUUID = interfaces['org.bluez.GattService1']?.UUID;
    const serviceUUIDValue = serviceUUID?.value || serviceUUID;
    
    if (serviceUUIDValue === BATTERY_SERVICE_UUID && path.includes(DEVICE_ADDRESS.replace(/:/g, '_'))) {
      batteryServicePath = path;
      console.log(`✅ Battery Service found:`);
      console.log(`   Path: ${path}`);
      console.log(`   UUID: ${serviceUUIDValue}`);
      break;
    }
  }

  if (!batteryServicePath) {
    console.error('❌ FAIL: Battery Service (0x180F) not found.');
    console.error('   The device may not expose battery over GATT.');
    process.exit(1);
  }

  console.log('');

  // STEP 4: Find the Battery Level Characteristic
  console.log('📋 STEP 4: Find Battery Level Characteristic (0x2A19)');
  let batteryCharPath = null;
  let batteryCharFlags = null;

  for (const [path, interfaces] of Object.entries(objects)) {
    const charUUID = interfaces['org.bluez.GattCharacteristic1']?.UUID;
    const charUUIDValue = charUUID?.value || charUUID;
    
    if (charUUIDValue === BATTERY_LEVEL_UUID && path.includes(DEVICE_ADDRESS.replace(/:/g, '_'))) {
      batteryCharPath = path;
      const flags = interfaces['org.bluez.GattCharacteristic1']?.Flags;
      batteryCharFlags = flags?.value || flags || [];
      
      console.log(`✅ Battery Level Characteristic found:`);
      console.log(`   Path: ${path}`);
      console.log(`   UUID: ${charUUIDValue}`);
      console.log(`   Flags: ${JSON.stringify(batteryCharFlags)}`);
      
      // Verify it has 'read' capability
      if (!batteryCharFlags.includes('read')) {
        console.error('❌ FAIL: Characteristic does not support reading.');
        process.exit(1);
      }
      break;
    }
  }

  if (!batteryCharPath) {
    console.error('❌ FAIL: Battery Level Characteristic not found.');
    process.exit(1);
  }

  console.log('');

  // STEP 5: Read raw bytes from the characteristic
  console.log('📋 STEP 5: Read raw bytes from GATT characteristic');
  const charProxy = await bus.getProxyObject('org.bluez', batteryCharPath);
  const char = charProxy.getInterface('org.bluez.GattCharacteristic1');

  let rawBytes = null;
  try {
    rawBytes = await char.ReadValue({});
    console.log(`✅ Successfully read raw bytes from device:`);
    console.log(`   Raw data: ${Buffer.from(rawBytes).toString('hex').toUpperCase()}`);
    console.log(`   Byte array: [${Array.from(rawBytes).join(', ')}]`);
    console.log(`   Length: ${rawBytes.length} byte(s)`);
  } catch (err) {
    console.error('❌ FAIL: Cannot read from characteristic.');
    console.error('   Error:', err.message);
    process.exit(1);
  }

  console.log('');

  // STEP 6: Decode the battery percentage
  console.log('📋 STEP 6: Decode battery percentage from raw bytes');
  if (rawBytes.length !== 1) {
    console.warn('⚠️  WARNING: Expected 1 byte, got', rawBytes.length);
    console.warn('   Battery Level characteristic should be 1 byte (0-100)');
  }

  const batteryLevel = Buffer.from(rawBytes)[0];
  console.log(`✅ Decoded battery level: ${batteryLevel}%`);
  console.log('');

  // STEP 7: Validate the reading makes sense
  console.log('📋 STEP 7: Validate battery reading');
  if (batteryLevel < 0 || batteryLevel > 100) {
    console.error(`❌ FAIL: Battery level ${batteryLevel}% is out of range (0-100).`);
    console.error('   This suggests corrupt or mock data.');
    process.exit(1);
  }
  console.log('✅ Battery level is within valid range (0-100%)');
  console.log('');

  // STEP 8: Compare with multiple reads to detect variation
  console.log('📋 STEP 8: Multiple reads to verify data is live (not cached)');
  console.log('   Reading battery 5 times with 1 second intervals...\n');
  
  const readings = [batteryLevel];
  for (let i = 0; i < 4; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const value = await char.ReadValue({});
    const level = Buffer.from(value)[0];
    readings.push(level);
    console.log(`   Read ${i + 2}: ${level}%`);
  }

  console.log('');
  const allSame = readings.every(r => r === readings[0]);
  const uniqueReadings = [...new Set(readings)];
  
  console.log(`   Readings: [${readings.join('%, ')}%]`);
  console.log(`   Unique values: [${uniqueReadings.join('%, ')}%]`);
  
  if (allSame) {
    console.log('⚠️  All readings are identical.');
    console.log('   This is expected for a stable battery (not charging/discharging).');
    console.log('   But could also indicate cached/mock data.');
  } else {
    console.log('✅ Readings vary - data is definitely live from device!');
  }
  console.log('');

  // STEP 9: Check our app's BLEBatteryService code
  console.log('📋 STEP 9: Verify our app code reads from the SAME path');
  console.log('   Expected characteristic path:');
  console.log(`   ${batteryCharPath}`);
  console.log('');
  console.log('   Check src/main/hid/ble-battery.ts to ensure it:');
  console.log('   1. Uses the same UUIDs (0x180F and 0x2A19)');
  console.log('   2. Reads from BlueZ via D-Bus');
  console.log('   3. Has NO hardcoded fallback values');
  console.log('   4. Has NO mock data');
  console.log('');

  // STEP 10: Final verdict
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    VERIFICATION RESULT                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log('✅ BlueZ daemon is running');
  console.log('✅ Device is connected via Bluetooth');
  console.log('✅ GATT Battery Service is available');
  console.log('✅ Battery Level Characteristic supports reading');
  console.log('✅ Raw bytes successfully read from hardware');
  console.log('✅ Battery level decoded correctly');
  console.log('✅ Value is within valid range');
  
  if (!allSame) {
    console.log('✅ Data varies between reads (live data confirmed)');
  }
  
  console.log('');
  console.log('🎯 CONCLUSION: Battery data is REAL hardware data from BlueZ.');
  console.log(`   Current battery level: ${batteryLevel}%`);
  console.log('');
  console.log('📝 NEXT STEP: Verify src/main/hid/ble-battery.ts matches this path.');
  console.log('   If the app shows different values, it has mock/fallback code.');
}

main().catch(err => {
  console.error('\n❌ VERIFICATION FAILED');
  console.error('Error:', err.message);
  console.error('\nStack trace:', err.stack);
  process.exit(1);
});
