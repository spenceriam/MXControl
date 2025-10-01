#!/usr/bin/env node

// Decode the response we keep getting
const response = Buffer.from('02000409f6101f0006b01940690000030000', 'hex');

console.log('Response:', response.toString('hex'));
console.log('Length:', response.length, 'bytes\n');

console.log('=== HID++ Format ===');
console.log('Device Index:', '0x' + response[0].toString(16).padStart(2, '0'));
console.log('Feature Index:', '0x' + response[1].toString(16).padStart(2, '0'), '(Root)');
console.log('Function/SW ID:', '0x' + response[2].toString(16).padStart(2, '0'));
console.log('  Function:', (response[2] >> 4) & 0x0f, '(0 = getProtocolVersion or getFeatureCount)');
console.log('  Software ID:', response[2] & 0x0f, '(SW ID 4)');

console.log('\n=== Response Data ===');
const data = response.slice(3);
console.log('Data bytes:', data.toString('hex'));

// Try parsing as getProtocolVersion response (function 0)
// Format: [major, minor, ...]
console.log('\nIf this is getProtocolVersion:');
console.log('  Major:', data[0]); // Should be protocol major
console.log('  Minor:', data[1]); // Should be protocol minor

// The response 09 f6 would be version 9.246 (0x09, 0xf6 = 246)
console.log('  Version:', data[0] + '.' + data[1]);

// Try parsing feature count (also function 0, but from byte 6)
console.log('\nIf this is getFeatureCount:');
console.log('  Feature count:', data[3]); // Byte 6 in full response

// Look at all the data
console.log('\n=== All Data Bytes ===');
for (let i = 0; i < data.length; i++) {
  console.log(`  [${i + 3}] 0x${data[i].toString(16).padStart(2, '0')} = ${data[i]}`);
}

// This looks like it might be a response to IFeatureSet.getFeature() 
// Let's check if bytes 3-4 are a feature ID
const featureId = (data[2] << 8) | data[3];
console.log('\n=== Possible Feature ID ===');
console.log('Feature ID:', '0x' + featureId.toString(16).padStart(4, '0'));

// Common feature IDs:
const knownFeatures = {
  0x0000: 'Root',
  0x0001: 'Feature Set',
  0x1000: 'Battery Status',
  0x1001: 'Battery Unified',
  0x2201: 'Adjustable DPI',
  0x1b04: 'Reprogrammable Keys',
  0x6501: 'Gesture'
};

if (knownFeatures[featureId]) {
  console.log('  Known as:', knownFeatures[featureId]);
}
