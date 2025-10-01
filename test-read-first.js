#!/usr/bin/env node

// Try reading characteristic first to clear any cached data
const dbus = require('dbus-next');

const DEVICE_ADDRESS = 'CD_37_EE_48_C1_6A';
const LOGITECH_CHAR_PATH = `/org/bluez/hci0/dev_${DEVICE_ADDRESS}/service003f/char0040`;

async function main() {
  const bus = dbus.systemBus();
  
  const obj = await bus.getProxyObject('org.bluez', LOGITECH_CHAR_PATH);
  const char = obj.getInterface('org.bluez.GattCharacteristic1');
  const propsObj = obj.getInterface('org.freedesktop.DBus.Properties');
  
  console.log('Trying to READ the characteristic first...\n');
  
  try {
    const readData = await char.ReadValue({});
    console.log('Read result:', Buffer.from(readData).toString('hex'));
    console.log('Length:', readData.length, 'bytes\n');
  } catch (err) {
    console.log('Read failed:', err.message);
    console.log('(This is expected if characteristic is write/notify only)\n');
  }
  
  console.log('Now subscribing to notifications...\n');
  await char.StartNotify();
  
  let responseCount = 0;
  
  propsObj.on('PropertiesChanged', (iface, changed, invalidated) => {
    if (changed.Value) {
      const data = Buffer.from(changed.Value.value);
      responseCount++;
      console.log(`[${responseCount}] ${data.toString('hex')}`);
    }
  });
  
  // Wait a bit to see if there are buffered notifications
  console.log('Waiting 2 seconds for buffered notifications...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log(`Received ${responseCount} buffered notifications\n`);
  
  // Now send a fresh command
  console.log('Sending fresh getFeatureId(1) command...');
  const cmd = [0x02, 0x00, 0x15, 0x01, 0x00, 0x00]; // SW ID 5, feature index 1
  console.log('Command:', Buffer.from(cmd).toString('hex'));
  
  await char.WriteValue(cmd, {});
  
  const beforeCmd = responseCount;
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`\nReceived ${responseCount - beforeCmd} responses to our command`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
