#!/usr/bin/env node

/**
 * Test: Send DPI commands via hidraw device instead of BLE GATT
 * 
 * This uses the actual HID interface which might work better than BLE GATT
 */

const HID = require('node-hid');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Testing DPI via hidraw device...\\n');

  // Find the MX Master 2S
  const devices = HID.devices();
  const mxMaster = devices.find(d => 
    d.vendorId === 0x046d && 
    d.productId === 0xb019 &&
    d.usagePage === 0xff43  // HID++ interface
  );

  if (!mxMaster) {
    console.error('MX Master 2S not found!');
    process.exit(1);
  }

  console.log(`Found device: ${mxMaster.path}`);
  console.log(`Product: ${mxMaster.product}`);
  console.log(`Serial: ${mxMaster.serialNumber}\\n`);

  try {
    const device = new HID.HID(mxMaster.path);
    console.log('Device opened successfully\\n');

    // Set up response handler
    device.on('data', (data) => {
      console.log(`<< Response: ${data.toString('hex')}`);
      const reportId = data[0];
      const devIdx = data[1];
      const featIdx = data[2];
      const funcId = (data[3] >> 4) & 0x0f;
      const swId = data[3] & 0x0f;
      console.log(`   Report: 0x${reportId.toString(16).padStart(2, '0')}, Device: 0x${devIdx.toString(16).padStart(2, '0')}, Feature: 0x${featIdx.toString(16).padStart(2, '0')}, Func: 0x${funcId.toString(16)}, SW: 0x${swId.toString(16)}`);
      
      // Try to parse DPI if this is DPI feature
      if (featIdx === 0x09 && data.length >= 6) {
        const dpi = (data[5] << 8) | data[6];
        if (dpi >= 200 && dpi <= 4000) {
          console.log(`   *** DPI in response: ${dpi} ***`);
        }
      }
      console.log();
    });

    device.on('error', (err) => {
      console.error('Device error:', err);
    });

    // For Bluetooth, use device index 0x02
    const DEVICE_IDX = 0x02;
    const DPI_FEATURE_IDX = 0x09; // From earlier discovery

    // Step 1: Read current DPI (function 0x01)
    console.log('Step 1: Reading current DPI...');
    const getDpiCmd = Buffer.from([
      0x10,           // Report ID (short)
      DEVICE_IDX,     // Device index
      DPI_FEATURE_IDX,// Feature index (DPI)
      0x11,           // Function 0x01, SW ID 0x01
      0x00,           // Sensor 0
      0x00, 0x00      // Padding
    ]);
    console.log(`>> Sending: ${getDpiCmd.toString('hex')}`);
    device.write(Array.from(getDpiCmd));
    await sleep(1000);

    // Step 2: Set DPI to 2400
    console.log('Step 2: Setting DPI to 2400...');
    const setDpi2400Cmd = Buffer.from([
      0x10,           // Report ID
      DEVICE_IDX,     // Device index
      DPI_FEATURE_IDX,// Feature index
      0x22,           // Function 0x02, SW ID 0x02
      0x00,           // Sensor 0
      0x09, 0x60      // DPI = 2400
    ]);
    console.log(`>> Sending: ${setDpi2400Cmd.toString('hex')}`);
    device.write(Array.from(setDpi2400Cmd));
    await sleep(1000);

    // Step 3: Read back DPI
    console.log('Step 3: Reading back DPI...');
    const getDpiCmd2 = Buffer.from([
      0x10,
      DEVICE_IDX,
      DPI_FEATURE_IDX,
      0x13,           // Function 0x01, SW ID 0x03
      0x00,
      0x00, 0x00
    ]);
    console.log(`>> Sending: ${getDpiCmd2.toString('hex')}`);
    device.write(Array.from(getDpiCmd2));
    await sleep(1000);

    // Step 4: Set DPI to 800
    console.log('Step 4: Setting DPI to 800...');
    const setDpi800Cmd = Buffer.from([
      0x10,
      DEVICE_IDX,
      DPI_FEATURE_IDX,
      0x24,           // Function 0x02, SW ID 0x04
      0x00,
      0x03, 0x20      // DPI = 800
    ]);
    console.log(`>> Sending: ${setDpi800Cmd.toString('hex')}`);
    device.write(Array.from(setDpi800Cmd));
    await sleep(1000);

    // Step 5: Read back DPI again
    console.log('Step 5: Reading back DPI again...');
    const getDpiCmd3 = Buffer.from([
      0x10,
      DEVICE_IDX,
      DPI_FEATURE_IDX,
      0x15,           // Function 0x01, SW ID 0x05
      0x00,
      0x00, 0x00
    ]);
    console.log(`>> Sending: ${getDpiCmd3.toString('hex')}`);
    device.write(Array.from(getDpiCmd3));
    await sleep(1000);

    console.log('\\n=== Test Complete ===');
    console.log('Move the mouse now - did the sensitivity change?');
    console.log('You should feel a big difference between 800 DPI (slow) and 2400 DPI (fast)');

    device.close();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
