#!/usr/bin/env node

/**
 * Test: Monitor battery level and detect charging status
 * Run this while the mouse is charging to see if we can detect it
 */

const dbus = require('dbus-next');

const BATTERY_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
const BATTERY_LEVEL_UUID = '00002a19-0000-1000-8000-00805f9b34fb';
const DEVICE_ADDRESS = 'CD:37:EE:48:C1:6A';

async function main() {
  console.log('🔋 Battery Monitoring Test\n');
  console.log('This will read battery level every 5 seconds.');
  console.log('Keep the mouse plugged in via USB to see if charging is detected.\n');

  const bus = dbus.systemBus();
  const bluez = await bus.getProxyObject('org.bluez', '/');
  const objectManager = bluez.getInterface('org.freedesktop.DBus.ObjectManager');
  const objects = await objectManager.GetManagedObjects();

  // Find battery characteristic
  let batteryCharPath = null;
  let devicePath = null;

  for (const [path, interfaces] of Object.entries(objects)) {
    const deviceAddr = interfaces['org.bluez.Device1']?.Address;
    const deviceAddrValue = deviceAddr?.value || deviceAddr;
    
    if (deviceAddrValue === DEVICE_ADDRESS) {
      devicePath = path;
      console.log(`✅ Found device: ${path}`);
    }

    const charUUID = interfaces['org.bluez.GattCharacteristic1']?.UUID;
    const charUUIDValue = charUUID?.value || charUUID;
    
    if (charUUIDValue === BATTERY_LEVEL_UUID && path.includes(DEVICE_ADDRESS.replace(/:/g, '_'))) {
      batteryCharPath = path;
      console.log(`✅ Found battery characteristic: ${path}`);
    }
  }

  if (!batteryCharPath) {
    console.error('❌ Battery characteristic not found');
    process.exit(1);
  }

  // Check if device has Battery property (some Bluetooth devices expose this)
  if (devicePath) {
    try {
      const deviceProxy = await bus.getProxyObject('org.bluez', devicePath);
      const deviceProps = deviceProxy.getInterface('org.freedesktop.DBus.Properties');
      
      // Try to get Battery property from device
      try {
        const battery = await deviceProps.Get('org.bluez.Device1', 'Battery');
        console.log(`✅ Device has Battery property: ${battery.value}%`);
      } catch (e) {
        console.log('ℹ️  Device does not expose Battery property via D-Bus');
      }

      // Check for Battery1 interface (some devices use this)
      try {
        const batteryInterface = deviceProxy.getInterface('org.bluez.Battery1');
        const percentage = await deviceProps.Get('org.bluez.Battery1', 'Percentage');
        console.log(`✅ Battery1 interface percentage: ${percentage.value}%`);
      } catch (e) {
        console.log('ℹ️  Device does not have Battery1 interface');
      }
    } catch (e) {
      console.log('ℹ️  Could not query device properties');
    }
  }

  console.log('\n📊 Starting battery monitoring (reading every 5 seconds)...\n');
  console.log('Time      | Battery % | Change | Notes');
  console.log('----------|-----------|--------|------------------');

  const charProxy = await bus.getProxyObject('org.bluez', batteryCharPath);
  const char = charProxy.getInterface('org.bluez.GattCharacteristic1');

  let previousLevel = null;
  let readCount = 0;

  // Monitor battery with notifications
  await char.StartNotify();
  
  const propsInterface = charProxy.getInterface('org.freedesktop.DBus.Properties');
  propsInterface.on('PropertiesChanged', (iface, changed) => {
    if (changed.Value) {
      const level = Buffer.from(changed.Value.value)[0];
      const now = new Date().toLocaleTimeString();
      const change = previousLevel !== null ? (level - previousLevel) : 0;
      const changeStr = change > 0 ? `+${change}` : change.toString();
      
      console.log(`${now} | ${level.toString().padStart(9)}% | ${changeStr.padStart(6)} | Notification`);
      previousLevel = level;
    }
  });

  // Also poll every 5 seconds
  const interval = setInterval(async () => {
    try {
      const value = await char.ReadValue({});
      const level = Buffer.from(value)[0];
      
      const now = new Date().toLocaleTimeString();
      const change = previousLevel !== null ? (level - previousLevel) : 0;
      const changeStr = change > 0 ? `+${change}` : change.toString();
      
      readCount++;
      
      let notes = 'Poll';
      if (change > 0) {
        notes = '🔌 CHARGING!';
      } else if (change < 0) {
        notes = '🔋 Discharging';
      }
      
      console.log(`${now} | ${level.toString().padStart(9)}% | ${changeStr.padStart(6)} | ${notes}`);
      
      previousLevel = level;
      
      // After 12 reads (1 minute), show summary
      if (readCount === 12) {
        console.log('\n📈 One minute of monitoring complete.');
        console.log('If the battery % is increasing, charging is working!');
        console.log('Press Ctrl+C to stop monitoring.\n');
      }
    } catch (err) {
      console.error('Error reading battery:', err.message);
    }
  }, 5000);

  // Cleanup on exit
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Stopping battery monitoring...');
    clearInterval(interval);
    await char.StopNotify();
    process.exit(0);
  });

  // Initial read
  const value = await char.ReadValue({});
  const level = Buffer.from(value)[0];
  const now = new Date().toLocaleTimeString();
  console.log(`${now} | ${level.toString().padStart(9)}% | ${' '.padStart(6)} | Initial`);
  previousLevel = level;
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
