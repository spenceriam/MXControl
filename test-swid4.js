#!/usr/bin/env node

// Test using SW ID 4 consistently since that's what device responds with
const dbus = require('dbus-next');

const DEVICE_ADDRESS = 'CD_37_EE_48_C1_6A';
const LOGITECH_CHAR_PATH = `/org/bluez/hci0/dev_${DEVICE_ADDRESS}/service003f/char0040`;

async function sendCommand(char, devIdx, featIdx, funcId, swId, params = []) {
  const cmd = [devIdx, featIdx, (funcId << 4) | (swId & 0x0f), ...params];
  // Pad to 6 bytes if needed
  while (cmd.length < 6) cmd.push(0x00);
  
  console.log(`\nSending: devIdx=0x${devIdx.toString(16)} featIdx=0x${featIdx.toString(16)} func=${funcId} swId=${swId}`);
  console.log(`Command: ${Buffer.from(cmd).toString('hex')}`);
  
  await char.WriteValue(cmd, {});
}

async function main() {
  const bus = dbus.systemBus();
  
  const obj = await bus.getProxyObject('org.bluez', LOGITECH_CHAR_PATH);
  const char = obj.getInterface('org.bluez.GattCharacteristic1');
  const propsObj = obj.getInterface('org.freedesktop.DBus.Properties');
  
  console.log('Subscribing to notifications...\n');
  await char.StartNotify();
  
  const responses = [];
  
  propsObj.on('PropertiesChanged', (iface, changed, invalidated) => {
    if (changed.Value) {
      const data = Buffer.from(changed.Value.value);
      const devIdx = data[0];
      const featIdx = data[1];
      const funcSwId = data[2];
      const func = (funcSwId >> 4) & 0x0f;
      const swId = funcSwId & 0x0f;
      
      responses.push(data.toString('hex'));
      console.log(`Response: ${data.toString('hex')}`);
      console.log(`  devIdx=0x${devIdx.toString(16)} featIdx=0x${featIdx.toString(16)} func=${func} swId=${swId}`);
      
      // Parse based on function
      if (featIdx === 0 && func === 0) {
        const major = data[3];
        const minor = data[4];
        const featureCount = data[6];
        console.log(`  Protocol: v${major}.${minor}, Features: ${featureCount}`);
      }
    }
  });
  
  // Try sending commands with SW ID 4
  console.log('=== Testing with SW ID 4 ===');
  
  await sendCommand(char, 0x02, 0x00, 0, 4); // getProtocolVersion with SW ID 4
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await sendCommand(char, 0x02, 0x00, 1, 4, [0x00]); // getFeatureId(0) with SW ID 4
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await sendCommand(char, 0x02, 0x00, 1, 4, [0x01]); // getFeatureId(1) with SW ID 4
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Now try incrementing SW ID
  console.log('\n=== Testing with incrementing SW ID (5, 6, 7) ===');
  
  await sendCommand(char, 0x02, 0x00, 1, 5, [0x02]); // getFeatureId(2) with SW ID 5
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await sendCommand(char, 0x02, 0x00, 1, 6, [0x03]); // getFeatureId(3) with SW ID 6
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await sendCommand(char, 0x02, 0x00, 1, 7, [0x04]); // getFeatureId(4) with SW ID 7
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n=== Summary ===');
  console.log(`Total responses: ${responses.length}`);
  const uniqueCount = new Set(responses).size;
  console.log(`Unique responses: ${uniqueCount}`);
  
  if (uniqueCount > 1) {
    console.log('\n✓ Got different responses!');
    responses.forEach((r, i) => {
      console.log(`  ${i+1}. ${r}`);
    });
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
