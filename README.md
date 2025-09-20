# MX Control

Linux-native configuration tool for Logitech MX Master mice (Options+ alternative). Electron + React + TypeScript.

## Features (MVP)
- MX Master 2S support (3/3S planned)
- Device detection, connection type, battery status
- DPI control (200–4000 in 50 DPI steps) with presets
- Button remapping (middle/back/forward), gesture button (single/gestures)
- Vertical/horizontal scrolling configuration
- Profiles: create/duplicate/delete, import/export JSON
- System tray (GNOME/KDE), autostart toggle

## Tech
- Electron (Main/Preload/Renderer), React + TS, Tailwind, Zustand
- HID++ 2.0 via `node-hid`
- Persistence via `electron-store`

## Prereqs (Linux)
- Node.js 18+
- USB HID support, user in `input` group, udev rules for `hidraw`
- See `docs/permissions.md`

## Quick start (dev)
```bash
npm ci
npm run build
npm run dev
```

## Package (Linux)
```bash
npm run package:linux
# AppImage/DEB/RPM in ./release
```

## File locations
```
~/.config/mx-control/
├─ profiles/*.json
├─ settings.json
├─ device-cache.json
└─ logs/mx-control.log
```

## Project docs
- Behavior spec: `docs/behavior-spec.md`
- HID table: `docs/hid-behavior-table.md`
- Permissions: `docs/permissions.md`
- User Guide: `docs/USER_GUIDE.md`
- Flatpak feasibility: `docs/flatpak-feasibility.md`
- Agents/tasks: `AGENTS.md`, `tasks.md`

## Security
- No Node in Renderer; `contextIsolation` on; strict IPC with zod validation; CSP enabled.

## License
MIT
