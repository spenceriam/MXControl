# HID++ 2.0 Protocol Implementation Tasks

## Overview

This document outlines the remaining work to implement HID++ 2.0 protocol communication with the MX Master 2S. Currently, the application scaffold is complete, but actual device communication is stubbed with TODOs in `src/main/hid/service.ts`.

## Current Status

### Completed
- Device detection via node-hid (enumerate and filter by vendor/product ID)
- Connection to hidraw device
- Basic service architecture with state management
- IPC contracts between Renderer and Main process
- UI scaffolding with all tabs (Mouse, Pointer, Scrolling, Profiles)

### Not Implemented (Critical Gap)
- HID++ 2.0 protocol packet construction and parsing
- Feature discovery and capability probing
- All device configuration commands

## Required HID++ 2.0 Features

### 1. Root Feature (0x0000) - Device Information
**Status:** Not implemented  
**Priority:** High (required for device identification)

**Capabilities:**
- Get protocol version
- Get feature count
- Get feature ID by index
- Ping device

**Implementation Notes:**
- Required to discover what features the device supports
- Must be implemented first before any other features

**References:**
- HID++ 2.0 Specification Section 4.1

---

### 2. Feature Set (0x0001) - Feature Enumeration
**Status:** Not implemented  
**Priority:** High

**Capabilities:**
- Query feature by feature ID
- Get feature index

**Implementation Notes:**
- Works with Root feature to map feature IDs to indexes
- Required before sending any feature-specific commands

---

### 3. Battery Status (0x1000 or 0x1001)
**Status:** Not implemented (currently mocked at 85%)  
**Priority:** High  
**Location:** `src/main/hid/service.ts:71`

**Capabilities:**
- Read battery percentage (0-100)
- Read charging state (charging/discharging)
- Battery level states (full, good, low, critical)

**Current Mock:**
```javascript
// TODO: implement HID++ battery query. For now mock steady 85%.
this.state.batteryPct = 85;
this.state.charging = false;
```

**Implementation Requirements:**
- Send GetBatteryLevelStatus command
- Parse response for percentage and charging state
- Handle low battery thresholds (10% = low, 5% = critical)
- Poll every 60 seconds (already implemented)

**References:**
- Feature 0x1000: Battery Level Status
- Feature 0x1001: Battery Status (Unified)

---

### 4. Adjustable DPI (0x2201)
**Status:** Not implemented  
**Priority:** High  
**Location:** `src/main/hid/service.ts:93`

**Capabilities:**
- Get current DPI value
- Set DPI value (200-4000 in 50 DPI steps)
- Get supported DPI range

**Current Stub:**
```javascript
setDpi(value: number): boolean {
  // TODO: Implement HID++ DPI set. Validate range handled by IPC.
  return !!this.device;
}
```

**Implementation Requirements:**
- Validate DPI range (200-4000) and step (50)
- Send SetSensorDPI command
- Verify command success
- Update UI state on confirmation

**References:**
- Feature 0x2201: Adjustable DPI

---

### 5. Reprogrammable Keys (0x1b04)
**Status:** Not implemented  
**Priority:** High  
**Location:** `src/main/hid/service.ts:98`

**Capabilities:**
- Enumerate reprogrammable keys (middle, back, forward, gesture button)
- Get current key mapping
- Set key mapping to predefined actions
- Remap horizontal scroll function

**Current Stub:**
```javascript
updateButtons(): boolean {
  // TODO: Implement 0x1b04
  return !!this.device;
}
```

**Implementation Requirements:**
- Query supported Control IDs (CIDs)
- Map UI actions to HID++ action codes
- Send RemapKey commands for middle/back/forward buttons
- Handle horizontal scroll mode changes

**Action Mappings (from behavior spec):**
- Middle: middle-click, copy, paste, app-switcher, mission-control, play-pause
- Back: back, forward, copy, paste, undo, desktop-left, mission-control, play-pause, keystroke
- Forward: forward, back, copy, paste, redo, desktop-right, show-desktop, next-track, keystroke
- Horizontal scroll: horizontal-scroll, volume, zoom, tab-nav, timeline, brush-size, page-nav

**References:**
- Feature 0x1b04: Reprogrammable Keys v4

---

### 6. Gesture 2.0 (0x6501 or similar)
**Status:** Not implemented  
**Priority:** High  
**Location:** `src/main/hid/service.ts:103`

**Capabilities:**
- Set gesture button mode (single action vs. 4-directional gestures)
- Configure gesture sensitivity (1-10)
- Map gesture directions to actions (up/down/left/right)

**Current Stub:**
```javascript
updateGesture(): boolean {
  // TODO: Implement 0x6501
  return !!this.device;
}
```

**Implementation Requirements:**
- Toggle between single-action mode and gesture mode
- Set sensitivity level
- Configure 4-direction gesture mappings (when in gesture mode)

**Gesture Actions (from behavior spec):**
- Up: mission-control, volume-up, zoom-in, track-next
- Down: show-desktop, volume-down, zoom-out, track-prev
- Left: desktop-left, tab-prev
- Right: desktop-right, tab-next

**References:**
- Feature 0x6501: Gesture 2.0 (or device-specific variant)

---

## Implementation Strategy

### Phase 1: Protocol Foundation
1. Implement HID++ packet structure (short/long reports)
2. Implement Root feature (0x0000) for ping and feature discovery
3. Implement Feature Set (0x0001) for feature index lookup
4. Create feature capability probing on device connection

### Phase 2: Core Features
1. Battery Status (0x1000/0x1001)
2. Adjustable DPI (0x2201)
3. Reprogrammable Keys (0x1b04)
4. Gesture configuration (0x6501)

### Phase 3: Error Handling
1. Timeout handling for unresponsive devices
2. Retry logic with exponential backoff
3. User-facing error messages via IPC
4. Graceful degradation if features unsupported

### Phase 4: Testing
1. Hardware-in-loop testing with real MX Master 2S
2. Verify all button mappings work correctly
3. Test DPI changes in real-time
4. Validate battery polling accuracy
5. Test gesture sensitivity and direction mapping

---

## HID++ 2.0 Packet Structure

### Short Report (7 bytes)
```
Byte 0: Report ID (0x10)
Byte 1: Device Index (0x00 for receiver, 0xFF for Bluetooth)
Byte 2: Feature Index
Byte 3: Function ID | Software ID
Bytes 4-6: Parameters
```

### Long Report (20 bytes)
```
Byte 0: Report ID (0x11)
Byte 1: Device Index
Byte 2: Feature Index
Byte 3: Function ID | Software ID
Bytes 4-19: Parameters
```

---

## References and Resources

### Official Documentation
- Logitech HID++ 2.0 Specification (if available via Logitech developer portal)
- USB HID Usage Tables: https://usb.org/hid

### Community Resources
- libratbag: https://github.com/libratbag/libratbag (HID++ implementation reference)
- Solaar: https://github.com/pwr-Solaar/Solaar (Python HID++ implementation)
- OpenRazer: https://github.com/openrazer/openrazer (similar device protocol work)

### Reverse Engineering Notes
- Many features are documented through community reverse engineering
- Feature codes are standardized but may vary slightly by device
- MX Master 2S (product ID 0xb019) is well-documented in Solaar

---

## Next Actions

1. Study libratbag and Solaar HID++ implementations
2. Create `src/main/hid/hidpp.ts` module for protocol packet handling
3. Implement Root feature and feature discovery
4. Add feature index caching to avoid repeated lookups
5. Implement battery status as first functional feature (simplest to test)
6. Progressively implement DPI, buttons, and gestures
7. Add comprehensive error handling and logging
8. Test with physical MX Master 2S device