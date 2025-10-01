#!/usr/bin/env node

/**
 * Test: Read battery from standard GATT Battery Service
 * 
 * The device exposes a standard BLE Battery Service (0x180f) with
 * Battery Level characteristic (0x2a19). Let's try reading from that first
 * before diving deeper into HID++ over BLE.
 */

const dbus = require('dbus-next');

const BATTERY_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
const BATTERY_LEVEL_UUID = '00002a19-0000-1000-8000-00805f9b34fb';
const DEVICE_ADDRESS = 'CD:37:EE:48:C1:6A';

async function main() {
  console.log('Testing standard GATT Battery Service...\n');

  const bus = dbus.systemBus();
  const bluez = await bus.getProxyObject('org.bluez', '/');
  const objectManager = bluez.getInterface('org.freedesktop.DBus.ObjectManager');
  const objects = await objectManager.GetManagedObjects();

  // Find battery characteristic
  let batteryCharPath = null;

  for (const [path, interfaces] of Object.entries(objects)) {
    const deviceAddr = interfaces['org.bluez.Device1']?.Address;
    const deviceAddrValue = deviceAddr?.value || deviceAddr;
    
    if (deviceAddrValue === DEVICE_ADDRESS) {
      console.log(`Found device: ${path}`);
    }

    const charUUID = interfaces['org.bluez.GattCharacteristic1']?.UUID;
    const charUUIDValue = charUUID?.value || charUUID;
    
    if (charUUIDValue === BATTERY_LEVEL_UUID) {
      batteryCharPath = path;
      console.log(`Found battery characteristic: ${path}`);
      
      const flags = interfaces['org.bluez.GattCharacteristic1']?.Flags;
      const flagsValue = flags?.value || flags;
      console.log(`  Flags: ${Array.isArray(flagsValue) ? flagsValue.join(', ') : flagsValue}`);
    }
  }

  if (!batteryCharPath) {
    console.error('Could not find battery characteristic');
    process.exit(1);
  }

  // Read battery level
  const charProxy = await bus.getProxyObject('org.bluez', batteryCharPath);
  const char = charProxy.getInterface('org.bluez.GattCharacteristic1');

  console.log('\nReading battery level...');
  const value = await char.ReadValue({});
  const batteryLevel = Buffer.from(value)[0];
  
  console.log(`\n✅ Battery Level: ${batteryLevel}%`);
  
  // Subscribe to notifications to see if it updates
  console.log('\nSubscribing to battery notifications for 5 seconds...');
  await char.StartNotify();
  
  charProxy.getInterface('org.freedesktop.DBus.Properties').on('PropertiesChanged', (iface, changed) => {
    if (changed.Value) {
      const level = Buffer.from(changed.Value.value)[0];
      console.log(`Battery level update: ${level}%`);
    }
  });

  await new Promise(resolve => setTimeout(resolve, 5000));
  await char.StopNotify();
  
  console.log('\nDone!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
