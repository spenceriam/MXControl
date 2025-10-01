#!/usr/bin/env node

// Try using Feature Set (0x0001) which is always at feature index 0x01
const dbus = require('dbus-next');

const DEVICE_ADDRESS = 'CD_37_EE_48_C1_6A';
const LOGITECH_CHAR_PATH = `/org/bluez/hci0/dev_${DEVICE_ADDRESS}/service003f/char0040`;

async function main() {
  const bus = dbus.systemBus();
  
  const obj = await bus.getProxyObject('org.bluez', LOGITECH_CHAR_PATH);
  const char = obj.getInterface('org.bluez.GattCharacteristic1');
  const propsObj = obj.getInterface('org.freedesktop.DBus.Properties');
  
  await char.StartNotify();
  
  console.log('Subscribed to notifications\n');
  
  const responses = [];
  
  propsObj.on('PropertiesChanged', (iface, changed, invalidated) => {
    if (changed.Value) {
      const data = Buffer.from(changed.Value.value);
      responses.push(data.toString('hex'));
      console.log(`Response: ${data.toString('hex')}`);
      
      const devIdx = data[0];
      const featIdx = data[1];
      const funcSwId = data[2];
      const func = (funcSwId >> 4) & 0x0f;
      const swId = funcSwId & 0x0f;
      
      console.log(`  devIdx=0x${devIdx.toString(16)} featIdx=0x${featIdx.toString(16)} func=${func} swId=${swId}`);
      
      if (featIdx === 1 && func === 0) {
        // Feature Set getFeatureIndex response
        const resultFeatureIdx = data[3];
        const featureType = data[4];
        console.log(`  Result: Feature index=${resultFeatureIdx}, type=${featureType}`);
      }
    }
  });
  
  console.log('=== Query Feature Set for Battery (0x1000) ===');
  // Feature Set (index 0x01), function 0 (getFeatureIndex), param: feature ID 0x1000
  let cmd = [0x02, 0x01, 0x01, 0x10, 0x00, 0x00]; // devIdx=0x02, featIdx=0x01, func=0/sw=1, featureID=0x1000
  console.log('Command:', Buffer.from(cmd).toString('hex'));
  await char.WriteValue(cmd, {});
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n=== Query Feature Set for DPI (0x2201) ===');
  cmd = [0x02, 0x01, 0x02, 0x22, 0x01, 0x00]; // SW ID 2
  console.log('Command:', Buffer.from(cmd).toString('hex'));
  await char.WriteValue(cmd, {});
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n=== Query Feature Set for Buttons (0x1b04) ===');
  cmd = [0x02, 0x01, 0x03, 0x1b, 0x04, 0x00]; // SW ID 3
  console.log('Command:', Buffer.from(cmd).toString('hex'));
  await char.WriteValue(cmd, {});
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n=== Summary ===');
  console.log(`Total responses: ${responses.length}`);
  const uniqueCount = new Set(responses).size;
  console.log(`Unique responses: ${uniqueCount}`);
  
  if (uniqueCount > 1) {
    console.log('\n✓✓✓ SUCCESS - Got different responses! ✓✓✓');
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
