# Bluetooth BLE - Next Steps for Production Implementation

## Status: Research Complete ✅

We've successfully proven that Bluetooth Low Energy communication works with the MX Master 2S. All research, testing, and protocol decoding is **complete**.

## What We Learned

### 1. Device Index for BLE
- **USB/Unifying Receiver**: Device index `0xff`
- **Bluetooth**: Device index `0x02` ✅

### 2. Two Ways to Get Battery
**Option A: HID++ Protocol** (complex)
- Via Logitech vendor GATT service
- Requires HID++ feature queries
- Extended response format
- Device echoes feature index

**Option B: Standard GATT Battery Service** (simple) ⭐ **RECOMMENDED**
- Service UUID: `0000180f-0000-1000-8000-00805f9b34fb`
- Characteristic UUID: `00002a19-0000-1000-8000-00805f9b34fb`
- Simple read returns battery percentage (0-100)
- Supports notifications for real-time updates
- Works: Tested and confirmed at 50%

### 3. Extended Response Format
When querying via HID++ over BLE, the device responds with:
```
[Device Idx] [Feature Idx] [SW ID] [Protocol] [Feature Count] [Product ID] [Serial...]
0x02         echoed back   0x04    9.246      31              0xb019       ...
```

This is **correct behavior**, not a bug. The device includes extra metadata in responses.

## Implementation Tasks

### Task 1: Update BLE Transport (`src/main/hid/ble.ts`)
**Changes needed:**
1. Update device index detection
   ```typescript
   // Change from:
   const deviceIndex = 0xff;
   
   // To:
   const deviceIndex = 0x02; // For Bluetooth
   ```

2. Handle extended response format
   - Parse the extra bytes after standard HID++ response
   - Extract product ID (bytes 6-7) for device identification
   - Use feature index from response for matching (not SW ID)

### Task 2: Add GATT Battery Service Support (`src/main/hid/ble-battery.ts`) ⭐
**Create new module for simple battery reading:**

```typescript
import dbus from 'dbus-next';

const BATTERY_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
const BATTERY_LEVEL_UUID = '00002a19-0000-1000-8000-00805f9b34fb';

export class BLEBatteryService {
  async readBatteryLevel(deviceAddress: string): Promise<number> {
    // 1. Connect to BlueZ D-Bus
    // 2. Find battery characteristic for device
    // 3. Read value
    // 4. Return percentage
  }
  
  async subscribeToBatteryUpdates(
    deviceAddress: string,
    callback: (level: number) => void
  ): Promise<() => void> {
    // 1. Subscribe to GATT notifications
    // 2. Call callback on updates
    // 3. Return unsubscribe function
  }
}
```

See `test-gatt-battery.js` for working reference implementation.

### Task 3: Update HID Service (`src/main/hid/service.ts`)
**Battery method logic:**

```typescript
async getBatteryStatus(): Promise<BatteryStatus> {
  if (this.isBluetoothConnection()) {
    // Use GATT Battery Service (simple, reliable)
    return await this.bleBatteryService.readBatteryLevel(this.deviceAddress);
  } else {
    // Use HID++ protocol for USB/Unifying
    return await this.hidppProtocol.getBatteryStatus();
  }
}
```

### Task 4: Update Response Matching
**In HIDPPProtocol when using BLE transport:**

Currently matches responses by software ID. For BLE, match by **feature index** instead:

```typescript
// In sendCommand when isBLE:
const expectedFeatureIndex = command[1]; // Feature index is byte 1

// In response handler:
if (response[1] === expectedFeatureIndex) {
  // This is our response!
}
```

### Task 5: Testing
**Test with physical device:**
1. Connect MX Master 2S via Bluetooth
2. Test battery reading (should show ~50% based on our tests)
3. Test battery notifications (change device, see if app updates)
4. Test DPI changes (if implemented via HID++)
5. Verify no timeout errors

## Reference Files

### Working Test Scripts
- `test-gatt-battery.js` - **Use this as reference for GATT battery**
- `test-battery-after-cache.js` - Shows multiple HID++ queries
- `decode-payload.js` - Decodes extended response format
- `debug-bluez-paths.js` - Explores BlueZ D-Bus objects

### Documentation
- `docs/BLE_STATUS.md` - Complete status and findings
- `docs/BLUETOOTH_NEXT_STEPS.md` - This file

### Existing Implementation
- `src/main/hid/ble.ts` - BLE transport layer (needs device index update)
- `src/main/hid/hidpp.ts` - HID++ protocol (already supports BLE)
- `src/main/hid/service.ts` - Main HID service (needs battery routing)

## Priority Order

1. **GATT Battery Service** (easiest, biggest impact)
   - Add `BLEBatteryService` class
   - Update `HIDService.getBatteryStatus()` to use it for BLE
   - Test battery reading and notifications
   - Estimated time: 1-2 hours

2. **Update Device Index** (required for HID++ features)
   - Change device index to 0x02 in BLE transport
   - Update response matching to use feature index
   - Estimated time: 30 minutes

3. **Test DPI/Button/Gesture via HID++** (advanced features)
   - Test if existing HID++ features work over BLE
   - May need response format adjustments
   - Estimated time: 2-3 hours

## Success Criteria

✅ Battery reading works for Bluetooth devices
✅ Battery notifications work (real-time updates)
✅ No timeout errors for Bluetooth connections
✅ Device index 0x02 used correctly
✅ Extended response format parsed properly

## Notes

- **Don't overthink the "cached response"** - it's the correct extended format
- **Use GATT Battery Service first** - it's simpler and more reliable
- **Device index 0x02 is confirmed** - this is unique to MX Master 2S over BLE
- **All research is done** - just need to integrate into production code

## Questions?

Check these resources:
1. Run the test scripts to see working examples
2. Read `docs/BLE_STATUS.md` for detailed findings
3. Check `AGENTS.md` progress log for full history
