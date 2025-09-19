# Behavior Spec (B-01)

## Scope
- App: MX Control (Electron + React)
- Tabs: Mouse, Pointer, Scrolling, Profiles
- System integration: Tray, Autostart
- Device: MX Master 2S (MVP), detect 3/3S for future

## Global acceptance
- Launch < 2s, idle CPU < 1%, memory < 150MB
- Device detection < 1s, setting apply < 100ms
- Battery polling interval 60s; low 10%, critical 5%

## Mouse tab
- Visual illustration with callout controls for: middle click, back, forward, gesture button, horizontal scroll
- Interaction
  - Click callout -> dropdown actions (per PRD) -> selection applies immediately via IPC
  - Feedback: current assignment label updates instantly; error toast on failure
- Options
  - Middle: middle-click, copy, paste, app switcher, mission control, play/pause
  - Back: back, forward, copy, paste, undo, desktop left, mission control, play/pause, custom keystroke
  - Forward: forward, back, copy, paste, redo, desktop right, show desktop, next track, custom keystroke
  - Gesture button: single-action mode OR gestures mode (up/down/left/right actions from PRD), sensitivity 1–10
  - Horizontal scroll: function mode (horizontal scroll, volume, zoom, tab nav, timeline, brush size, page nav); sensitivity 1–10; direction toggle
- Additional control: swap left/right buttons (renderer-only toggle; does not change hardware mapping)

## Pointer tab
- DPI
  - Slider 200–4000 in 50-DPI steps; presets: 800/1200/1600/2400/3200; custom input
  - Apply in real-time; validation on bounds/step
- Advanced
  - Pointer acceleration (on/off)
  - Enhanced precision (on/off)
  - Pointer speed multiplier 0.5–3.0x

## Scrolling tab
- Vertical
  - Direction: standard/natural
  - Speed: 1–10
  - Smooth scrolling: on/off
  - Lines per scroll: 1–10
- Horizontal
  - Mode: as per Mouse tab horizontal function list
  - Sensitivity 1–10
  - Direction toggle
- SmartShift (if supported)
  - On/off; threshold 1–10

## Profiles tab
- CRUD: create, duplicate, rename, delete
- Set default profile
- Import/export JSON; schema per `AGENTS.md`
- Auto-start checkboxes (ties into system integration)
- Quick actions per row: Activate, Edit, Delete

## Tray
- Always visible icon while app runs
- Menu
  - Battery % and connection type
  - Active profile; quick profile switcher
  - Open main window
  - Quit
- Latency: switching profile applies within 100ms target

## Autostart
- Option to launch on system startup and start minimized to tray
- Persist choice in `settings.json`; create/remove desktop entry accordingly

## Error handling & UX
- All IPC calls validated; user-facing toasts on errors, with retry suggestions
- Log errors to file (redact serials), optional console in dev
- No navigation outside app; window non-resizable (900×650)

## Non-goals (MVP)
- In-app Bluetooth pairing (detect-only if already paired)
- App-specific profile switching
- Multiple device management in UI (future)
