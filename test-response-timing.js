#!/usr/bin/env node

// Test to understand response timing and caching
const dbus = require('dbus-next');

const DEVICE_ADDRESS = 'CD_37_EE_48_C1_6A';
const LOGITECH_CHAR_PATH = `/org/bluez/hci0/dev_${DEVICE_ADDRESS}/service003f/char0040`;

async function main() {
  const bus = dbus.systemBus();
  
  const obj = await bus.getProxyObject('org.bluez', LOGITECH_CHAR_PATH);
  const char = obj.getInterface('org.bluez.GattCharacteristic1');
  const propsObj = obj.getInterface('org.freedesktop.DBus.Properties');
  
  console.log('Subscribing to notifications...');
  await char.StartNotify();
  
  let responseCount = 0;
  const responses = [];
  
  // Listen for ALL notifications
  propsObj.on('PropertiesChanged', (iface, changed, invalidated) => {
    if (changed.Value) {
      const data = Buffer.from(changed.Value.value);
      responseCount++;
      responses.push({
        time: Date.now(),
        data: data.toString('hex'),
        parsed: {
          devIdx: data[0],
          featIdx: data[1],
          funcSwId: data[2]
        }
      });
      console.log(`[${responseCount}] ${data.toString('hex')}`);
    }
  });
  
  console.log('\nWaiting 2 seconds to see if there are any unsolicited notifications...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`\nReceived ${responseCount} unsolicited notifications`);
  
  // Now send a command
  console.log('\n--- Sending getProtocolVersion (device index 0x02) ---');
  const cmd1 = [0x02, 0x00, 0x02, 0x00, 0x00, 0x00];
  console.log('Command:', Buffer.from(cmd1).toString('hex'));
  await char.WriteValue(cmd1, {});
  
  const before1 = responseCount;
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(`Received ${responseCount - before1} responses\n`);
  
  // Send a different command
  console.log('--- Sending getFeatureCount (device index 0x02) ---');
  const cmd2 = [0x02, 0x00, 0x03, 0x00, 0x00, 0x00];
  console.log('Command:', Buffer.from(cmd2).toString('hex'));
  await char.WriteValue(cmd2, {});
  
  const before2 = responseCount;
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(`Received ${responseCount - before2} responses\n`);
  
  // Try with a longer delay
  console.log('--- Waiting 5 seconds before next command ---');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('--- Sending ping (device index 0x02) ---');
  const cmd3 = [0x02, 0x00, 0x11, 0x00, 0x00, 0xaa];
  console.log('Command:', Buffer.from(cmd3).toString('hex'));
  await char.WriteValue(cmd3, {});
  
  const before3 = responseCount;
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(`Received ${responseCount - before3} responses\n`);
  
  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total responses: ${responseCount}`);
  console.log('\nAll responses:');
  responses.forEach((r, i) => {
    console.log(`${i+1}. ${r.data} (devIdx=${r.parsed.devIdx}, featIdx=${r.parsed.featIdx}, funcSwId=0x${r.parsed.funcSwId.toString(16)})`);
  });
  
  // Check if all responses are the same
  const uniqueResponses = new Set(responses.map(r => r.data));
  console.log(`\nUnique responses: ${uniqueResponses.size}`);
  if (uniqueResponses.size === 1) {
    console.log('⚠️  All responses are identical - device is sending cached data');
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
