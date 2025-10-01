#!/usr/bin/env node

// Test BLE GATT communication with Logitech MX Master 2S
const noble = require('@abandonware/noble');

// Logitech vendor-specific GATT service and characteristic
const LOGITECH_SERVICE_UUID = '000100000000100080001 1f2000046d';
const LOGITECH_CHAR_UUID = '00010001000010008000011f2000046d';

const TARGET_NAME = 'MX Master 2S';
const TARGET_ADDRESS = 'cd:37:ee:48:c1:6a';

let targetPeripheral = null;

console.log('Starting BLE scan...');

noble.on('stateChange', (state) => {
  console.log('BLE state:', state);
  if (state === 'poweredOn') {
    console.log('Scanning for', TARGET_NAME);
    noble.startScanning([], false);
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', async (peripheral) => {
  const name = peripheral.advertisement.localName;
  const address = peripheral.address;
  
  console.log(`Found: ${name || 'Unknown'} (${address})`);
  
  if (name === TARGET_NAME || address === TARGET_ADDRESS) {
    console.log('\n✓ Found target device!');
    targetPeripheral = peripheral;
    noble.stopScanning();
    
    try {
      await connectAndTest(peripheral);
    } catch (err) {
      console.error('Error:', err);
      process.exit(1);
    }
  }
});

async function connectAndTest(peripheral) {
  console.log('\nConnecting to device...');
  
  await new Promise((resolve, reject) => {
    peripheral.connect((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  
  console.log('✓ Connected!');
  
  console.log('\nDiscovering services and characteristics...');
  const { services, characteristics } = await new Promise((resolve, reject) => {
    peripheral.discoverAllServicesAndCharacteristics((err, services, characteristics) => {
      if (err) reject(err);
      else resolve({ services, characteristics });
    });
  });
  
  console.log(`\nFound ${services.length} services:`);
  for (const service of services) {
    console.log(`  Service: ${service.uuid}`);
  }
  
  console.log(`\nFound ${characteristics.length} characteristics:`);
  for (const char of characteristics) {
    console.log(`  Char: ${char.uuid} | Properties: ${char.properties.join(', ')}`);
  }
  
  // Find the Logitech vendor-specific characteristic
  const logitechChar = characteristics.find(c => 
    c.uuid === '00010001000010008000011f2000046d' ||
    c.uuid.includes('00010001')
  );
  
  if (!logitechChar) {
    console.error('\n✗ Logitech characteristic not found!');
    process.exit(1);
  }
  
  console.log(`\n✓ Found Logitech characteristic: ${logitechChar.uuid}`);
  console.log(`  Properties: ${logitechChar.properties.join(', ')}`);
  
  // Subscribe to notifications if available
  if (logitechChar.properties.includes('notify')) {
    console.log('\nSubscribing to notifications...');
    await new Promise((resolve, reject) => {
      logitechChar.subscribe((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    logitechChar.on('data', (data) => {
      console.log('[NOTIFICATION] Received:', data.length, 'bytes:', data.toString('hex'));
    });
    console.log('✓ Subscribed to notifications');
  }
  
  // Try to send a HID++ ping command
  // HID++ 2.0 over BLE uses same format but without report ID
  const pingCommand = Buffer.from([
    0xff,       // Device Index (Bluetooth)
    0x00,       // Feature Index (Root)
    0x11,       // Function 0x1 (ping), Software ID 0x1
    0x00, 0x00, 0xaa,  // Ping params
    0x00        // Padding if needed
  ]);
  
  console.log('\nSending HID++ ping command...');
  console.log('Command:', pingCommand.toString('hex'));
  
  if (logitechChar.properties.includes('write') || logitechChar.properties.includes('writeWithoutResponse')) {
    await new Promise((resolve, reject) => {
      logitechChar.write(pingCommand, false, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✓ Command sent');
    
    // Wait for response
    console.log('\nWaiting for response (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('\nDisconnecting...');
  await new Promise((resolve) => {
    peripheral.disconnect(() => resolve());
  });
  
  console.log('✓ Done');
  process.exit(0);
}

// Timeout
setTimeout(() => {
  console.log('\nTimeout - device not found');
  process.exit(1);
}, 30000);
