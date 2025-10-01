# Gesture Direction Action Mapping - Implementation Notes

## Date: 2025-10-01

## Overview

The MX Master 2S gesture button (thumb button) supports 4-direction gestures: up, down, left, right. This document explains how gesture actions are configured and mapped to system actions.

## HID++ Protocol Support

### Feature 0x6501: Gesture Configuration

The HID++ protocol provides **basic** gesture support via Feature 0x6501:

**What IS supported:**
- Enable/disable gesture mode
- Set sensitivity (1-10, where 10 = most sensitive)
- Device reports gesture button is in "gesture mode"

**What is NOT supported:**
- Configuring individual direction actions (up/down/left/right)
- Mapping directions to specific system actions
- This must be handled at the application/OS level

### How It Works

1. **Enable Gesture Mode** (via HID++)
   - Use `setGestureConfig(enabled: true, sensitivity: 5)`
   - Device enables gesture detection on the thumb button
   - Device will now send gesture events instead of button clicks

2. **Divert Gesture Button** (via HID++)
   - Use `setControlIdReporting(GESTURE_BUTTON, DIVERT | PERSIST)`
   - This diverts gesture button events to our application
   - Application receives raw gesture events from device

3. **Detect Gesture Direction** (application-level)
   - Application listens for diverted gesture button events
   - Parse HID++ events to determine direction (up/down/left/right)
   - This requires implementing HID++ event listener

4. **Execute System Action** (OS-level)
   - Once direction is detected, execute configured action
   - Use X11/Wayland input injection to trigger keyboard shortcuts
   - Map direction → action → keyboard shortcut

## Implementation Strategy

### Option A: Full Implementation (Recommended for Production)

**Pros:**
- Complete control over gesture behavior
- Can customize actions per application
- Native Linux integration

**Cons:**
- Complex implementation
- Requires HID++ event listening
- Needs X11/Wayland input injection

**Steps:**
1. Implement HID++ event listener in Main process
2. Parse gesture events to determine direction
3. Map direction to configured action
4. Use `robotjs` or native X11/Wayland bindings to trigger shortcuts
5. Handle per-application profiles

**Estimated effort:** 6-8 hours

### Option B: Basic Implementation (MVP)

**Pros:**
- Simple and fast
- Leverages existing functionality
- Good enough for initial release

**Cons:**
- Limited customization
- Actions configured at device level only
- No per-application profiles

**Steps:**
1. Enable gesture mode via HID++ ✅ (already implemented)
2. Set sensitivity ✅ (already implemented)
3. Let device handle gesture → action mapping
4. Document default gesture actions in UI

**Estimated effort:** Already complete

### Option C: Hybrid Approach (Recommended for MVP)

**Pros:**
- Balances functionality and complexity
- Can be enhanced later
- Works out of the box

**Cons:**
- Limited to predefined mappings
- No dynamic per-app profiles yet

**Steps:**
1. Enable gesture mode ✅ (done)
2. Document default gesture mappings in UI ✅ (can add to UI)
3. Future: Add event listener for custom actions

**Estimated effort:** 1 hour (UI documentation only)

## Current Implementation Status

✅ **Complete:**
- `setGestureConfig(enabled, sensitivity)` - Enable/disable and set sensitivity
- `getGestureConfig()` - Read current gesture configuration
- Basic gesture button support via HID++

❌ **Not Implemented:**
- HID++ event listener (to receive gesture events)
- Direction detection (parse up/down/left/right from events)
- Action execution (trigger keyboard shortcuts)
- Per-application profiles

## Default Gesture Actions

When gesture mode is enabled on the device, the MX Master 2S has default behavior:

| Direction | Default Action (Logitech) | Linux Equivalent |
|-----------|---------------------------|------------------|
| Up | Mission Control (macOS) | Activities/Overview |
| Down | Show Desktop | Show Desktop |
| Left | Previous Desktop | Workspace Left |
| Right | Next Desktop | Workspace Right |

These actions are **device firmware defaults** and may vary by OS configuration.

## Recommendation for MVP

**Use Option C (Hybrid Approach):**

1. Enable gesture mode via HID++ (already done)
2. Set sensitivity based on user preference (already done)
3. Let device use default gesture → action mapping
4. Document the default actions in UI:
   - "Gestures enabled with sensitivity X"
   - "Up: Overview, Down: Show Desktop, Left/Right: Switch Workspace"
5. Add note: "Custom gesture actions coming in future release"

**For Post-MVP:**
Implement Option A with:
- HID++ event listener
- Direction detection
- OS-level keyboard shortcut injection
- Per-application gesture profiles

## References

- HID++ 2.0 Spec: Feature 0x6501 (Gesture Configuration)
- Solaar implementation: https://github.com/pwr-Solaar/Solaar
- X11 input injection: `xdotool`, `libxdo`
- Wayland input injection: `ydotool`, `wtype`
- Electron-friendly: `robotjs` (cross-platform but may have permissions issues)

## Implementation Notes

The current implementation provides:
- ✅ Gesture enable/disable
- ✅ Sensitivity configuration (1-10)
- ✅ IPC handlers (to be added)
- ❌ Direction-specific action mapping (deferred to post-MVP)

This is **sufficient for MVP** as the device has sensible firmware defaults.

## Testing Checklist

- [ ] Enable gesture mode
- [ ] Set sensitivity to various levels (1, 5, 10)
- [ ] Verify gesture button responds to swipes
- [ ] Confirm default actions work (up/down/left/right)
- [ ] Document behavior in user guide

## Future Enhancements

1. **HID++ Event Listener**
   - Listen for diverted button events
   - Parse gesture direction from HID++ packets
   
2. **Custom Action Mapping**
   - UI for direction → action configuration
   - Save mappings to profile
   
3. **OS-Level Input Injection**
   - Implement keyboard shortcut trigger
   - Support X11 and Wayland
   
4. **Per-Application Profiles**
   - Detect active application
   - Switch gesture mappings based on context
