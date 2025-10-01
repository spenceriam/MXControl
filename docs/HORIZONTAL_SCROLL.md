# Horizontal Scroll Configuration - Research Findings

## Date: 2025-10-01

## Overview

The MX Master 2S features a horizontal scroll wheel (thumb wheel) that can be configured for various functions. This document summarizes the research findings on how to configure it via HID++ protocol.

## HID++ Features

### Feature 0x2150: Thumb Wheel

The horizontal scroll wheel on MX Master mice is controlled by Feature 0x2150 (Thumb Wheel).

**Capabilities:**
- Get/set thumb wheel reporting mode
- Configure direction (standard/inverted)
- Set resolution (lines per detent)
- Enable/disable smooth scrolling

**Functions:**
- `0x00`: getThumbwheelInfo() - Get capabilities
- `0x10`: getThumbwheelStatus() - Get current configuration
- `0x20`: setThumbwheelStatus() - Set configuration

**Status Parameters:**
- Reporting mode:
  - 0x00 = Standard horizontal scroll
  - 0x01 = Volume control
  - 0x02 = Zoom
  - 0x03 = Custom (diverted to software)
- Direction: 0=standard, 1=inverted
- Resolution: Lines per detent (typically 1-3)

### Feature 0x2130: Smart Shift (MX Master 3/3S only)

**NOT applicable to MX Master 2S** - this feature is only available on MX Master 3 and later models.

SmartShift provides automatic switching between click-to-click and free-spin scrolling modes based on scroll speed.

## Implementation Status

### Current Implementation: ❌ Not Implemented

The horizontal scroll feature (0x2150) is **not yet implemented** in our codebase.

### Recommended Implementation

1. **Add Feature 0x2150 to hidpp.ts**
   ```typescript
   async getThumbwheelStatus(): Promise<ThumbwheelConfig> {
     // Query feature 0x2150, function 0x10
   }
   
   async setThumbwheelMode(mode: 'scroll' | 'volume' | 'zoom'): Promise<void> {
     // Set feature 0x2150, function 0x20
   }
   
   async setThumbwheelDirection(inverted: boolean): Promise<void> {
     // Set direction bit in status
   }
   ```

2. **Add to HIDService**
   ```typescript
   async setHorizontalScrollMode(mode: 'scroll' | 'volume' | 'zoom'): Promise<boolean> {
     if (!this.hidpp) return false;
     await this.hidpp.setThumbwheelMode(mode);
     return true;
   }
   ```

3. **Add IPC Handler**
   ```typescript
   ipcMain.handle(Channels.HorizontalScrollSet, async (_e, payload) => {
     const req = HorizontalScrollSetRequestSchema.parse(payload);
     const success = await hidService.setHorizontalScrollMode(req.mode);
     return { success };
   });
   ```

4. **Add UI Control**
   - Dropdown in Scrolling tab: "Horizontal Scroll Function"
   - Options: Horizontal Scroll, Volume Control, Zoom
   - Direction toggle: Standard / Inverted

## Priority Assessment

**Priority: Medium (Post-MVP)**

**Reasoning:**
- Not a critical MVP feature
- Horizontal scroll typically has sensible defaults
- Most users expect volume control on thumb wheel (default)
- Can be added in v1.1 release

**Complexity:** Low (2-3 hours implementation)

## Default Behavior

Without configuration, the MX Master 2S horizontal scroll wheel operates in **volume control mode** by default on most systems. This is the expected behavior and matches Logitech Options+ defaults.

Users can manually configure it using:
- OS-level settings (if supported)
- Logitech Options+ (if dual-booting or using Wine)
- Our app once Feature 0x2150 is implemented

## References

- HID++ 2.0 Specification (Feature 0x2150)
- Solaar: https://github.com/pwr-Solaar/Solaar/blob/master/lib/logitech_receiver/settings_templates.py
- MX Master 2S Product Spec

## Testing Notes

When implementing Feature 0x2150:

1. Verify device supports the feature (via Feature Set query)
2. Test all three modes:
   - Horizontal scroll (should scroll left/right)
   - Volume control (should adjust system volume)
   - Zoom (should trigger Ctrl+/Ctrl- typically)
3. Test direction inversion
4. Ensure settings persist across disconnect/reconnect
5. Test on multiple desktop environments (GNOME, KDE, XFCE)

## MVP Decision

**For MVP**: Do not implement horizontal scroll configuration.

**Rationale:**
- Device has sensible defaults (volume control)
- Not a blocker for core functionality
- Users can configure via OS settings if needed
- Adds complexity for minimal user benefit at launch

**Post-MVP**: Implement Feature 0x2150 in v1.1 or v1.2 release.
