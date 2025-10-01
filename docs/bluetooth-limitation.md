# Bluetooth Limitation

## Summary

**MXControl does NOT work with Bluetooth-connected Logitech MX mice.**

The application requires a **Logitech Unifying USB receiver** to communicate with the mouse.

## Technical Details

### Why Bluetooth Doesn't Work

Logitech MX Master mice (including 2S, 3, and 3S) have different behavior depending on how they're connected:

1. **Via Logitech Unifying Receiver (USB dongle)**:
   - Device speaks HID++ 2.0 protocol
   - Allows advanced features: battery status, DPI control, button remapping, gestures, etc.
   - This is what MXControl requires

2. **Via Bluetooth**:
   - Device operates as a standard HID mouse
   - NO HID++ protocol support
   - Only basic mouse functionality (movement, clicks, scroll)
   - No way to query battery, change DPI, remap buttons, or configure advanced features

### What We Discovered

During testing with MX Master 2S over Bluetooth:
- Device opens successfully at `/dev/hidraw4`
- Writes to the device succeed
- NO responses are received from the device
- Device does not respond to HID++ ping commands
- Device does not respond to HID++ protocol version queries

This confirms that Bluetooth-connected Logitech MX mice do not implement the HID++ protocol at all.

### Why This Limitation Exists

Logitech's design decision:
- **Unifying receiver**: Proprietary protocol (HID++) allows full control
- **Bluetooth**: Standard HID only for maximum compatibility with all OS's

The Logitech Options/Options+ software works around this by:
- Using HID++ when connected via Unifying receiver
- Using OS-level APIs (not HID++) when connected via Bluetooth
- Different feature sets depending on connection type

### User Impact

Users MUST:
1. Have a Logitech Unifying USB receiver
2. Pair their mouse with the Unifying receiver (using Logitech's pairing utility or Solaar)
3. Connect the mouse via the Unifying receiver (not Bluetooth)

### Error Handling

The application now:
1. Detects Bluetooth connections (by MAC-formatted serial number)
2. Attempts to communicate via HID++
3. Provides a clear error message if HID++ fails on Bluetooth:
   ```
   HID++ protocol not supported over Bluetooth.
   Logitech MX mice only support HID++ when connected via a
   Logitech Unifying USB receiver. Please connect your mouse
   to a Unifying receiver to use this application.
   ```

## References

- [HID++ Specification](https://lekensteyn.nl/files/logitech/logitech_hidpp_2.0_specification_draft_2012-06-04.pdf)
- [Solaar Documentation](https://github.com/pwr-Solaar/Solaar)
- Node-hid library: Bluetooth HID devices present as `uhid` (user-space HID) on Linux

## Testing Notes

Test environment:
- Logitech MX Master 2S
- Connected via Bluetooth
- Linux (Zorin OS)
- Device: `/dev/hidraw4` (usagePage 0xff43 for HID++ interface)

Commands sent (no responses):
```
10ff00110000aa  # Ping (device index 0xff)
100100110000aa  # Ping (device index 0x01)
100000110000aa  # Ping (device index 0x00)
10ff0002000000  # GetProtocolVersion
```

All writes succeeded but device never responded.
