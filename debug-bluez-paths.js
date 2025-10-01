#!/usr/bin/env node

const dbus = require('dbus-next');

async function main() {
  const bus = dbus.systemBus();
  const bluez = await bus.getProxyObject('org.bluez', '/');
  const objectManager = bluez.getInterface('org.freedesktop.DBus.ObjectManager');
  const objects = await objectManager.GetManagedObjects();

  console.log('=== BlueZ D-Bus Objects ===\n');

  for (const [path, interfaces] of Object.entries(objects)) {
    console.log(`Path: ${path}`);
    
    if (interfaces['org.bluez.Device1']) {
      const dev = interfaces['org.bluez.Device1'];
      console.log(`  [Device]`);
      console.log(`    Address: ${dev.Address?.value || dev.Address}`);
      console.log(`    Name: ${dev.Name?.value || dev.Name || 'N/A'}`);
      console.log(`    Connected: ${dev.Connected?.value || dev.Connected}`);
    }
    
    if (interfaces['org.bluez.GattService1']) {
      const svc = interfaces['org.bluez.GattService1'];
      console.log(`  [Service]`);
      console.log(`    UUID: ${svc.UUID?.value || svc.UUID}`);
    }
    
    if (interfaces['org.bluez.GattCharacteristic1']) {
      const char = interfaces['org.bluez.GattCharacteristic1'];
      console.log(`  [Characteristic]`);
      const uuid = char.UUID?.value || char.UUID;
      const flags = char.Flags?.value || char.Flags;
      console.log(`    UUID: ${uuid}`);
      console.log(`    Flags: ${Array.isArray(flags) ? flags.join(', ') : flags}`);
    }
    
    console.log();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
