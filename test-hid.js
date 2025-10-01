#!/usr/bin/env node

// Simple test script to debug HID++ communication
const HID = require('node-hid');

const DEVICE_PATH = '/dev/hidraw4';

console.log('Opening device:', DEVICE_PATH);
const device = new HID.HID(DEVICE_PATH);

console.log('Device opened successfully');

// Set up data listener
device.on('data', (data) => {
  console.log('[DATA] Received:', data.length, 'bytes:', Buffer.from(data).toString('hex'));
});

device.on('error', (err) => {
  console.error('[ERROR]', err);
});

// Try a simple ping command
// HID++ 2.0 Short Message Format:
// Byte 0: Report ID (0x10 for short)
// Byte 1: Device Index (0xff for Bluetooth)
// Byte 2: Feature Index (0x00 for Root)
// Byte 3: Function ID (high nibble) + Software ID (low nibble)
// Bytes 4-6: Parameters

console.log('\nSending ping command...');

// Try different device indices
const deviceIndices = [0xff, 0x01, 0x00];
let currentIndex = 0;

function sendPing() {
  if (currentIndex >= deviceIndices.length) {
    console.log('\nAll attempts failed');
    return;
  }
  
  const devIdx = deviceIndices[currentIndex];
  console.log(`\nAttempt ${currentIndex + 1}: Device index 0x${devIdx.toString(16).padStart(2, '0')}`);
  
  const pingReport = Buffer.from([
    0x10,       // Report ID (short message)
    devIdx,     // Device Index
    0x00,       // Feature Index (Root)
    0x11,       // Function 0x1 (ping), Software ID 0x1
    0x00, 0x00, 0xaa  // Ping params
  ]);
  
  console.log('Ping report:', pingReport.toString('hex'));
  
  try {
    const written = device.write(Array.from(pingReport));
    console.log('Write returned:', written, 'bytes');
  } catch (err) {
    console.error('Write error:', err);
  }
  
  currentIndex++;
  if (currentIndex < deviceIndices.length) {
    setTimeout(sendPing, 1500);
  }
}

setTimeout(sendPing, 1000);

// Keep running for 10 seconds to receive response from all attempts
setTimeout(() => {
  console.log('\nClosing device...');
  try {
    device.close();
  } catch (err) {
    // Ignore close errors
  }
  process.exit(0);
}, 10000);
