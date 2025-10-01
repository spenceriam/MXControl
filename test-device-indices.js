#!/usr/bin/env node

// Test different device indices to find what works
const dbus = require('dbus-next');

const DEVICE_ADDRESS = 'CD_37_EE_48_C1_6A';
const LOGITECH_CHAR_PATH = `/org/bluez/hci0/dev_${DEVICE_ADDRESS}/service003f/char0040`;

async function testDeviceIndex(deviceIndex) {
  const bus = dbus.systemBus();
  
  try {
    const obj = await bus.getProxyObject('org.bluez', LOGITECH_CHAR_PATH);
    const char = obj.getInterface('org.bluez.GattCharacteristic1');
    const propsObj = obj.getInterface('org.freedesktop.DBus.Properties');
    
    // Subscribe to notifications
    try {
      await char.StartNotify();
    } catch (err) {
      // May already be subscribed
    }
    
    let responseReceived = false;
    
    // Listen for notifications
    propsObj.on('PropertiesChanged', (iface, changed, invalidated) => {
      if (changed.Value) {
        const data = Buffer.from(changed.Value.value);
        console.log(`  Response: ${data.toString('hex')}`);
        responseReceived = true;
        
        // Parse response
        const devIdx = data[0];
        const featIdx = data[1];
        const funcSwId = data[2];
        
        console.log(`    devIdx=0x${devIdx.toString(16).padStart(2, '0')}, featIdx=0x${featIdx.toString(16).padStart(2, '0')}, funcSwId=0x${funcSwId.toString(16).padStart(2, '0')}`);
        
        if (featIdx !== 0xff && featIdx !== 0x8f) {
          console.log(`  ✓ SUCCESS! This device index works!`);
        }
      }
    });
    
    // Try getProtocolVersion with this device index
    const command = [
      deviceIndex,  // Device Index
      0x00,         // Feature Index (Root)
      0x02,         // Function 0x0 (getProtocolVersion), Software ID 0x2
      0x00, 0x00, 0x00  // Padding
    ];
    
    console.log(`\nTesting device index 0x${deviceIndex.toString(16).padStart(2, '0')}`);
    console.log(`  Command: ${Buffer.from(command).toString('hex')}`);
    
    await char.WriteValue(command, {});
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!responseReceived) {
      console.log(`  No response received`);
    }
    
  } catch (err) {
    console.error(`  Error: ${err.message}`);
  }
}

async function main() {
  console.log('Testing different device indices...\n');
  
  // Try common indices
  const indices = [0xff, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05];
  
  for (const idx of indices) {
    await testDeviceIndex(idx);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\nTest complete');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
