#!/usr/bin/env node

const HID = require('node-hid');

console.log('Enumerating all HID devices...\n');

const allDevices = HID.devices();
console.log(`Total HID devices found: ${allDevices.length}\n`);

// Filter for Logitech devices (vendor 0x046d)
const logitechDevices = allDevices.filter(d => d.vendorId === 0x046d);
console.log(`Logitech devices (vendorId 0x046d): ${logitechDevices.length}\n`);

if (logitechDevices.length > 0) {
  logitechDevices.forEach((device, idx) => {
    console.log(`[${idx + 1}] ${device.product || 'Unknown Product'}`);
    console.log(`    Path: ${device.path}`);
    console.log(`    VendorId: 0x${device.vendorId.toString(16).padStart(4, '0')}`);
    console.log(`    ProductId: 0x${device.productId.toString(16).padStart(4, '0')}`);
    console.log(`    Serial: ${device.serialNumber || 'N/A'}`);
    console.log(`    Manufacturer: ${device.manufacturer || 'N/A'}`);
    console.log(`    Interface: ${device.interface ?? 'N/A'}`);
    console.log('');
  });
}

// Specifically look for MX Master 2S (product ID 0xb019)
const mxMaster2S = allDevices.filter(d => 
  d.vendorId === 0x046d && d.productId === 0xb019
);

if (mxMaster2S.length > 0) {
  console.log('='.repeat(60));
  console.log('MX MASTER 2S DETECTED (vendorId: 0x046d, productId: 0xb019)');
  console.log('='.repeat(60));
  mxMaster2S.forEach((device, idx) => {
    console.log(`\n[Instance ${idx + 1}]`);
    console.log(`    Product: ${device.product || 'MX Master 2S'}`);
    console.log(`    Path: ${device.path}`);
    console.log(`    Serial: ${device.serialNumber || 'N/A'}`);
    console.log(`    Interface: ${device.interface ?? 'N/A'}`);
    console.log(`    Usage Page: 0x${(device.usagePage || 0).toString(16)}`);
    console.log(`    Usage: 0x${(device.usage || 0).toString(16)}`);
  });
  console.log('');
} else {
  console.log('WARNING: No MX Master 2S detected.');
  console.log('Expected: vendorId=0x046d, productId=0xb019');
  console.log('');
  console.log('Troubleshooting:');
  console.log('  1. Ensure device is powered on and connected (Bluetooth or USB receiver)');
  console.log('  2. Check permissions: ls -l /dev/hidraw*');
  console.log('  3. Verify user is in "input" group: groups');
  console.log('  4. Log out and back in if group was just added');
  console.log('');
}