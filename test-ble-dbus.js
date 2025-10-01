#!/usr/bin/env node

// Test BLE GATT communication using BlueZ D-Bus API
const dbus = require('dbus-next');

const DEVICE_ADDRESS = 'CD_37_EE_48_C1_6A';
const LOGITECH_CHAR_PATH = `/org/bluez/hci0/dev_${DEVICE_ADDRESS}/service003f/char0040`;

async function main() {
  console.log('Connecting to D-Bus...');
  const bus = dbus.systemBus();
  
  console.log('Getting BlueZ object...');
  const obj = await bus.getProxyObject('org.bluez', LOGITECH_CHAR_PATH);
  const char = obj.getInterface('org.bluez.GattCharacteristic1');
  
  console.log('✓ Got GATT characteristic interface');
  
  // Get characteristic properties
  const propsObj = obj.getInterface('org.freedesktop.DBus.Properties');
  const uuid = await propsObj.Get('org.bluez.GattCharacteristic1', 'UUID');
  const flags = await propsObj.Get('org.bluez.GattCharacteristic1', 'Flags');
  
  console.log(`\nCharacteristic UUID: ${uuid.value}`);
  console.log(`Flags: ${flags.value.join(', ')}`);
  
  // Subscribe to notifications
  console.log('\nStarting notifications...');
  try {
    await char.StartNotify();
    console.log('✓ Notifications started');
    
    // Listen for property changes (notifications)
    propsObj.on('PropertiesChanged', (iface, changed, invalidated) => {
      if (changed.Value) {
        const data = Buffer.from(changed.Value.value);
        console.log('[NOTIFICATION] Received:', data.length, 'bytes:', data.toString('hex'));
      }
    });
  } catch (err) {
    console.log('Note: Could not start notifications:', err.message);
  }
  
  // Send HID++ ping command
  // Format without report ID (BLE doesn't use report IDs)
  const pingCommand = [
    0xff,       // Device Index (Bluetooth)
    0x00,       // Feature Index (Root)
    0x11,       // Function 0x1 (ping), Software ID 0x1
    0x00, 0x00, 0xaa  // Ping params
  ];
  
  console.log('\nSending HID++ ping command...');
  console.log('Command:', Buffer.from(pingCommand).toString('hex'));
  
  try {
    await char.WriteValue(pingCommand, {});
    console.log('✓ Command sent successfully');
  } catch (err) {
    console.error('✗ Write failed:', err.message);
    
    // Try with WriteWithoutResponse if write failed
    if (flags.value.includes('write-without-response')) {
      console.log('\nTrying WriteWithoutResponse...');
      try {
        await char.WriteValue(pingCommand, { type: 'command' });
        console.log('✓ Command sent without response');
      } catch (err2) {
        console.error('✗ Also failed:', err2.message);
      }
    }
  }
  
  // Wait for response
  console.log('\nWaiting for response (5 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\nDone');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
