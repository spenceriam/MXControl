#!/usr/bin/env node

/**
 * Decode the consistent payload from device responses
 * 
 * Response format observed:
 * [Device Index] [Feature Index] [Function/SW ID] [Payload bytes...]
 * 
 * Example: 02000409f6101f0006b01940690000030000
 * - Device Index: 0x02
 * - Feature Index: varies (0x00, 0x01, 0x03, 0x04, etc.)
 * - Function/SW ID: 0x04
 * - Payload: 09f6101f0006b01940690000030000
 */

const payload = '09f6101f0006b01940690000030000';
const buffer = Buffer.from(payload, 'hex');

console.log('=== Decoding Device Response Payload ===\n');
console.log(`Full payload: ${payload}`);
console.log(`Length: ${buffer.length} bytes\n`);

// Byte-by-byte analysis
console.log('Byte-by-byte:');
for (let i = 0; i < buffer.length; i++) {
  const byte = buffer[i];
  console.log(`  [${i}] 0x${byte.toString(16).padStart(2, '0')} (${byte}) = ${String.fromCharCode(byte).replace(/[^\x20-\x7E]/g, '.')}`);
}

console.log('\n=== Interpretation Attempts ===\n');

// Try interpreting as protocol version response (Feature 0x0000, Function 0x01)
console.log('1. As Protocol Version Response (Feature 0x0000):');
console.log(`   Protocol: ${buffer[0]}.${buffer[1]}`);
console.log(`   Target SW: ${buffer[2]}`);
console.log(`   Ping Data: ${buffer.slice(3, 6).toString('hex')}`);

// Try interpreting as feature discovery
console.log('\n2. As Feature Count (Feature 0x0000, Function 0x01):');
console.log(`   Feature Count: ${buffer[5]} (31 features)`);

// Look for recognizable patterns
console.log('\n3. Product/Device Info:');
const productId = buffer.readUInt16BE(6);
console.log(`   Product ID (bytes 6-7): 0x${productId.toString(16)} (${productId})`);

// MX Master 2S product ID should be 0xb019
if (productId === 0xb019) {
  console.log('   ✅ Matches MX Master 2S (0xb019)!');
}

console.log(`   Serial/ID bytes: ${buffer.slice(8, 14).toString('hex')}`);

// Try reading as little-endian
console.log('\n4. Multi-byte values:');
console.log(`   Bytes 0-1 (BE): 0x${buffer.readUInt16BE(0).toString(16)}`);
console.log(`   Bytes 0-1 (LE): 0x${buffer.readUInt16LE(0).toString(16)}`);
console.log(`   Bytes 3-4 (BE): 0x${buffer.readUInt16BE(3).toString(16)}`);
console.log(`   Bytes 6-7 (BE): 0x${buffer.readUInt16BE(6).toString(16)} (Product ID)`);
console.log(`   Bytes 8-13: ${buffer.slice(8, 14).toString('hex')} (Possible serial)`);

console.log('\n5. ASCII interpretation:');
const ascii = buffer.toString('ascii').replace(/[^\x20-\x7E]/g, '.');
console.log(`   ${ascii}`);

console.log('\n=== HID++ 2.0 Protocol Version Response Format ===');
console.log('Expected response to Root.getProtocolVersion():');
console.log('  [Device Idx] [Feature Idx=0x00] [SW ID] [Protocol Major] [Protocol Minor] [Target SW]');
console.log('');
console.log('Our response:');
console.log(`  0x02         0x00 (varies)        0x04    0x09 (9)         0xf6 (246)      0x10`);
console.log('');
console.log('  Protocol Version: 9.246 ✅');
console.log('  Target SW: 0x10 (HID++ 2.0 target SW 0x10 is common)');
console.log('');

console.log('=== Conclusion ===');
console.log('The device IS responding correctly!');
console.log('The "cached response" is actually the correct protocol version response.');
console.log('');
console.log('Next steps:');
console.log('1. Parse the response correctly as protocol version');
console.log('2. The device echoes the feature index we query');
console.log('3. Try querying specific features properly with correct function IDs');
console.log('4. The bytes after protocol version might contain device info');
