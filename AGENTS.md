## AGENTS.md

### Project overview

- **Name**: MX Control
- **Type**: Electron + React + TypeScript desktop app
- **Purpose**: Linux-native configuration tool for Logitech MX Master mice (Options+ alternative)
- **Primary device (MVP)**: MX Master 2S (extendable to 3/3S)
- **Target platforms**: Linux (Ubuntu, Fedora, Arch/AUR, Debian, openSUSE, Bazzite/SteamOS)
- **Core values**: Fast, simple, reliable, familiar

### Tech stack

- **Runtime**: Node.js 18+
- **App shell**: Electron (Main/Preload/Renderer)
- **UI**: React + TypeScript, Radix UI (headless), Tailwind CSS, Framer Motion
- **State**: Zustand
- **HID**: node-hid, HID++ 2.0 protocol
- **Persistence**: electron-store (JSON on disk)

### Local development runbook

Prerequisites
- Node.js 18+
- Git
- Linux kernel 5.4+ with USB HID support
- User in `input` group; appropriate udev rules for device access

Common commands (expected in `package.json`)
- Install: `npm ci`
- Dev (hot reload): `npm run dev`
- Lint: `npm run lint`
- Type-check: `npm run typecheck`
- Unit tests: `npm test`
- Build (renderer/main/preload): `npm run build`
- Package (AppImage/DEB/RPM): `npm run package:linux`

Environment
- Ensure `contextIsolation: true`, `sandbox: true` where possible
- All device I/O isolated to Main process (no HID in Renderer)
- IPC channels are typed, validated, and namespaced (see IPC policy)

### Security policy (Electron)

- Disable Node integration in Renderer
- Enable `contextIsolation`
- Use `preload` with a minimal, typed IPC bridge
- Validate all IPC payloads (zod or io-ts)
- Restrict navigation and new windows (`setWindowOpenHandler`)
- Content Security Policy (no remote code)
- Avoid `eval`/`new Function`
- Keep dependency surface minimal; `npm audit` on CI

### Architecture

Processes
- Main: boot, HID service, tray, auto-start, profile IO, logging
- Preload: safe bridge exposing typed, whitelisted API to Renderer
- Renderer: React UI (tabs: Mouse, Pointer, Scrolling, Profiles)

Core services (Main)
- HIDService: discovery, connection type detection, battery polling, DPI, button mapping, gestures
- ProfileService: read/write profiles under `~/.config/mx-control/profiles` and `settings.json`
- TrayService: status, quick switches
- AutoStartService: create desktop entry and toggles

IPC policy
- Channels are versioned: `mxc/v1/<domain>/<action>`
- One request/response type per channel; strict schema validation
- No wildcards or arbitrary eval

Data locations
```
~/.config/mx-control/
├─ profiles/
│  ├─ default.json
│  ├─ work.json
│  └─ <profile>.json
├─ settings.json
├─ device-cache.json
└─ logs/
   └─ mx-control.log
```

Profile JSON shape (canonical excerpt)
```json
{
  "id": "uuid-v4",
  "name": "Profile Name",
  "deviceId": "device-serial",
  "settings": {
    "dpi": { "value": 1600, "acceleration": false, "precision": true },
    "buttons": {
      "middle": "middle-click",
      "back": "back",
      "forward": "forward",
      "gesture": {
        "mode": "gestures",
        "sensitivity": 5,
        "actions": { "up": "mission-control", "down": "show-desktop", "left": "desktop-left", "right": "desktop-right" }
      }
    },
    "scrolling": {
      "vertical": { "direction": "standard", "speed": 5, "smooth": true, "lines": 3 },
      "horizontal": { "function": "volume", "sensitivity": 5, "direction": "standard" }
    }
  }
}
```

HID++ capabilities (MVP)
- Device detection and identification
- Battery status (0–100, charging)
- DPI adjustment (200–4000, 50 DPI steps)
- Button remapping (feature 0x1b04)
- Gesture configuration (feature 0x6501)
- Connection type: USB cable/receiver/Bluetooth

UI style guardrails
- Monochrome only; red reserved for warnings
- Window: 900×650, non-resizable (MVP)
- Tabs: Mouse, Pointer, Scrolling, Profiles
- Mouse tab uses illustration with callouts and dropdown actions
- Provide instant feedback on changes

### Agents and responsibilities

- UI Agent
  - Build React views for Mouse/Pointer/Scrolling/Profiles per wireframes
  - Enforce monochrome design, Radix primitives, Tailwind tokens
  - Acceptance: UI parity with wireframes; keyboard nav; a11y labels

- HID Agent
  - Implement HID++ operations in Main (node-hid)
  - Device discovery, battery polling, DPI, mappings, gestures
  - Acceptance: Real device loopback tests on MX Master 2S; error handling

- Profile Agent
  - Define schema, migrations, read/write with electron-store
  - Import/export JSON; default profile bootstrap
  - Acceptance: Deterministic serialization; schema-validated IO

- System Integration Agent
  - System tray, auto-start, udev rules, input group guidance
  - Cross-DE tray compatibility; connection/battery indicators
  - Acceptance: Tray works on GNOME/KDE; autostart toggles persist

- Packaging/Distribution Agent
  - Scripts for AppImage, DEB, RPM, AUR scaffolding
  - Flatpak feasibility assessment (HID permissions constraints)
  - Acceptance: Reproducible packages; install/uninstall docs

- QA Agent
  - Unit, integration (IPC contract), and basic e2e smoke on CI
  - Multi-distro matrix plan (containerized or VM-backed manual plan)
  - Acceptance: Green pipeline; manual test checklist

- Security Agent
  - IPC validation, CSP, preload boundary review, dependency audit
  - Acceptance: Security checklist satisfied; no high CVEs

- Docs Agent
  - Keep README, AGENTS, CONTRIBUTING, and user guide updated
  - Acceptance: Task-driven docs with accurate commands

### BMAD/spec-driven task plan (numbered with dependencies)

Legend
- Requires: prerequisite task IDs that must be completed first
- Blocks: tasks that cannot proceed until this completes

B-01 Define top-level behaviors and acceptance criteria (from PRD)
- Output: behavior spec per tab (Mouse/Pointer/Scrolling/Profiles), tray, autostart
- Requires: —
- Blocks: M-01, A-01, UI-01

B-02 Define device behaviors for MX Master 2S (DPI ranges, mappings, gestures)
- Output: HID behavior table mapped to HID++ features
- Requires: B-01
- Blocks: M-01, A-02

M-01 Model the application state (Zustand stores + types)
- Output: Type-safe state slices for device, dpi, buttons, gestures, profiles, scrolling
- Requires: B-01
- Blocks: UI-01, A-01, D-01

M-02 Define persistence schema and migrations (electron-store)
- Output: JSON schema, versioning, migration plan
- Requires: M-01, B-02
- Blocks: D-01, P-01

A-01 IPC contract (typed, versioned) between Renderer and Main
- Output: `mxc/v1/*` channels, request/response types, validation
- Requires: B-01, M-01
- Blocks: UI-01, HID-01

A-02 HID service surface in Main
- Output: methods for detect/connect, battery, dpi, mappings, gestures
- Requires: B-02, A-01
- Blocks: UI-02, QA-02

D-01 Data adapters for profiles and settings
- Output: read/write, import/export, defaults bootstrap
- Requires: M-02
- Blocks: UI-03, QA-01

S-01 Security baseline
- Output: contextIsolation on, no Node in Renderer, CSP, IPC validation
- Requires: A-01
- Blocks: P-01, QA-01

ENV-01 Dev environment & scripts
- Output: `npm run dev|build|lint|test|package:linux` scripts
- Requires: —
- Blocks: P-01, CI-01

UI-01 Scaffold app shell and tab navigation
- Output: window, tabs, layout, theme tokens
- Requires: M-01, A-01
- Blocks: UI-02, UI-03

UI-02 Mouse tab with interactive callouts
- Output: callout controls, dropdown actions (wired to IPC stubs)
- Requires: UI-01, A-02
- Blocks: QA-02

UI-03 Pointer/Scrolling/Profiles tabs
- Output: DPI slider and presets; vertical/horizontal scroll; profile table (CRUD)
- Requires: UI-01, D-01
- Blocks: QA-01

SYS-01 System tray integration
- Output: tray icon, battery %, connection status, profile switcher
- Requires: A-02
- Blocks: QA-03, P-01

SYS-02 Auto-start implementation
- Output: desktop entry toggle, start minimized option
- Requires: SYS-01
- Blocks: P-01

PERM-01 HID permissions guidance
- Output: udev rules template, `input` group docs, troubleshooting
- Requires: B-02
- Blocks: P-01, DOC-01

QA-01 Contract tests: IPC and persistence
- Output: unit tests for IPC schemas; persistence read/write roundtrips
- Requires: A-01, D-01, S-01
- Blocks: CI-01

QA-02 HID integration tests (device-in-the-loop or mocked layer)
- Output: simulated packets and optional hardware smoke
- Requires: A-02, UI-02
- Blocks: CI-01

QA-03 Tray and autostart manual smoke checklist
- Output: manual test doc across GNOME/KDE
- Requires: SYS-01, SYS-02
- Blocks: REL-01

CI-01 Continuous integration pipeline
- Output: lint, typecheck, unit, contract tests; artifacts for packages
- Requires: ENV-01, QA-01, QA-02
- Blocks: P-01

P-01 Packaging for Linux (AppImage, DEB, RPM)
- Output: reproducible builds; install scripts; post-install notes (permissions)
- Requires: ENV-01, S-01, SYS-01, SYS-02, PERM-01, CI-01
- Blocks: REL-01

PKG-ALT-01 AUR recipe scaffold
- Output: PKGBUILD draft with build steps
- Requires: P-01
- Blocks: REL-01

PKG-ALT-02 Flatpak feasibility report
- Output: assessment of HID permission limitations and options
- Requires: P-01
- Blocks: —

DOC-01 User guide and troubleshooting
- Output: README sections for setup, permissions, profiles, FAQs
- Requires: PERM-01, D-01
- Blocks: REL-01

REL-01 Release 1.0 (MVP)
- Output: GitHub release with artifacts and docs
- Requires: P-01, QA-03, DOC-01
- Blocks: —

### Acceptance targets (from PRD)

- Device detection < 1s; settings apply < 100ms; launch < 2s
- Memory < 150 MB; CPU < 1% idle; battery polling 60s

### Quick command reference (to standardize in scripts)

- `npm ci` — install
- `npm run dev` — start Electron in dev with React HMR
- `npm run lint && npm run typecheck` — quality gates
- `npm test` — unit and contract tests
- `npm run build` — production bundles
- `npm run package:linux` — AppImage/DEB/RPM

### Open questions for clarification

Resolved decisions
- Packaging priority: AppImage first for MVP; DEB/RPM secondary; Flatpak deferred/feasibility report
- Tray targets: GNOME and KDE are required test targets
- Schema: Include placeholders for future application-specific profiles
- Actions list: Use PRD defaults; no additions/removals for MVP
- DPI presets: 800/1200/1600/2400/3200 confirmed
- Bluetooth: Detect-only if already paired; no in-app pairing for MVP
- Logging: File-based logs by default at info level to `~/.config/mx-control/logs/mx-control.log`; optional console logs in dev; redact device serials in error payloads

### Working rules for this repository

- After completing each task (as defined in `tasks.md`), create a git commit locally. Do not push until explicitly approved.
- Do not start the development server (`npm run dev`) until all tasks in `tasks.md` are complete.
- Defer tasks related to CI/CD, tests, or testing in general until instructed otherwise.

### Progress Log

#### 2025-09-29: Environment Setup and HID++ Implementation Gap Analysis

Completed environment setup for MX Master 2S development on Zorin OS:

1. Dependencies installed
   - Ran `npm install` to install all Node.js dependencies
   - Verified node-hid compiled and available
   - Created .gitignore for node_modules and build artifacts

2. System permissions configured
   - Added user to `input` group for hidraw device access
   - Created udev rule `/etc/udev/rules.d/99-mx-control.rules` for MX Master 2S
   - Rule handles both USB/receiver and Bluetooth connections
   - Verified hidraw4 permissions: crw-rw---- root:input

3. Device detection verified
   - Created `scripts/test-detect.cjs` for device enumeration
   - Confirmed MX Master 2S detected via Bluetooth (vendorId: 0x046d, productId: 0xb019)
   - Device exposes 4 HID interfaces including HID++ interface (Usage Page 0xff43)
   - Documented results in `docs/detection.md`

4. HID++ implementation gap documented
   - Created `docs/HIDPP_TODO.md` outlining all missing protocol work
   - Critical gap: A-02 (HID service) is scaffolded but not functional
   - All device communication is stubbed (battery, DPI, buttons, gestures)
   - Documented required features: Root (0x0000), Battery (0x1000), DPI (0x2201), Buttons (0x1b04), Gestures (0x6501)
   - Provided implementation strategy and reference resources

Next steps:
- Study libratbag and Solaar HID++ implementations
- Implement HID++ 2.0 protocol packet handling
- Begin with Root feature and feature discovery
- Progressively implement battery, DPI, button remapping, and gesture configuration

Note: User must log out and back in for `input` group membership to take effect before device access will work.

