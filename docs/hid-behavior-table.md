# HID Behavior Table (B-02)

Device: MX Master 2S (MVP)
Protocol: HID++ 2.0

## Capabilities
- Detect/identify device
- Battery percentage and charging
- DPI set/get (200–4000, 50-DPI steps)
- Button remapping (feature 0x1b04)
- Gesture configuration (feature 0x6501)
- Connection type: USB cable/receiver/Bluetooth (read-only)

## Polling & timing
- Battery poll: every 60s
- Apply settings target: < 100ms

## Feature map

| Area | Behavior | HID++ feature | Notes |
|---|---|---|---|
| Identification | Read device info (name, serial) | Root, GetDeviceInfo | Redact serials in logs |
| Connection | Detect transport (USB cable/receiver/Bluetooth) | Root/Unifying/Bolt queries | Read-only in MVP |
| Battery | Read % and charging state | BatteryStatus | Low: 10%, Critical: 5% |
| DPI | Get/Set pointer resolution | HighResolutionMouse / DPI feature | Range 200–4000, step 50 |
| Buttons | Remap middle/back/forward | 0x1b04 (Reprogrammable Keys) | Validate allowed actions per PRD |
| Gesture btn | Single-action or gestures mode | 0x6501 (Gesture) | Sensitivity 1–10, 4-direction mapping |
| HScroll | Function mode & sensitivity | 0x1b04 or device-specific | Volume/Zoom/Tab/Timeline/Brush/Page |
| SmartShift | Enable/threshold (if supported) | SmartShift feature | Optional; device capability check |

## Actions catalog (MVP)
- Middle: middle-click, copy, paste, app switcher, mission control, play/pause
- Back: back, forward, copy, paste, undo, desktop left, mission control, play/pause, custom keystroke
- Forward: forward, back, copy, paste, redo, desktop right, show desktop, next track, custom keystroke
- Gestures: up/down/left/right -> mission control, show desktop, desktop left/right, volume +/- , zoom +/- , tab prev/next, track prev/next
- Horizontal scroll modes: horizontal scroll, volume, zoom, tab nav, timeline, brush size, page nav

## Validation
- Bounds check: DPI within range and 50-step increments
- Action whitelist per button type
- Gesture mode exclusivity vs single-action mode
- Capability probing: gracefully disable unsupported features

## Error handling
- Timeouts and retries for feature reports
- Surface user errors via IPC with sanitized payloads
- Rollback UI state if write fails

## Telemetry (local logs)
- Success/failure counts per feature write
- Battery readings over time (info level)
- Errors with redacted serials
