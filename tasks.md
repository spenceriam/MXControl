## Tasks (BMAD/Spec-driven)

Legend
- Requires: prerequisite task IDs that must be completed first
- Blocks: tasks that cannot proceed until this completes

Conventions
- IDs are stable; do not rename after being referenced
- Outputs are concrete artifacts or measurable outcomes
- Owners suggest default agent; can be shared if noted

### Behavior (B-*)

B-01 Define top-level behaviors and acceptance criteria (from PRD)
- Owner: Product, UI Agent
- Output: Behavior spec per tab (Mouse/Pointer/Scrolling/Profiles), tray, autostart; success metrics
- Requires: —
- Blocks: M-01, A-01, UI-01

B-02 Define device behaviors for MX Master 2S (DPI ranges, mappings, gestures)
- Owner: HID Agent, Product
- Output: HID behavior table mapped to HID++ 2.0 features (0x1b04, 0x6501), connection types, battery thresholds
- Requires: B-01
- Blocks: M-01, A-02

### Model (M-*)

M-01 Model the application state (Zustand stores + types)
- Owner: UI Agent
- Output: State slices for device, dpi, buttons, gestures, scrolling, profiles; derived selectors; types
- Requires: B-01
- Blocks: UI-01, A-01, D-01

M-02 Define persistence schema and migrations (electron-store)
- Owner: Profile Agent
- Output: JSON schema, version key, forward migrations; defaults; validation plan
- Requires: M-01, B-02
- Blocks: D-01, P-01

### Actions/IPC (A-*)

A-01 IPC contract (typed, versioned) between Renderer and Main
- Owner: Security Agent, UI Agent
- Output: Namespaced channels `mxc/v1/<domain>/<action>`, zod/io-ts validators, request/response types
- Requires: B-01, M-01
- Blocks: UI-01, HID-01

A-02 HID service surface in Main
- Owner: HID Agent
- Output: Methods for detect/connect, battery poll, dpi set/get, button map, gestures config; robust error handling
- Requires: B-02, A-01
- Blocks: UI-02, QA-02

### Data (D-*)

D-01 Data adapters for profiles and settings
- Owner: Profile Agent
- Output: Read/write adapters; import/export JSON; bootstrap defaults in `~/.config/mx-control`
- Requires: M-02
- Blocks: UI-03, QA-01

### Security (S-*)

S-01 Security baseline
- Owner: Security Agent
- Output: `contextIsolation` on, disable nodeIntegration, CSP, `setWindowOpenHandler`, IPC validation guards
- Requires: A-01
- Blocks: P-01, QA-01

### Environment (ENV-*)

ENV-01 Dev environment & scripts
- Owner: Docs Agent
- Output: `npm run dev|build|lint|typecheck|test|package:linux`; README dev setup
- Requires: —
- Blocks: P-01, CI-01

### UI (UI-*)

UI-01 Scaffold app shell and tab navigation
- Owner: UI Agent
- Output: 900×650 fixed window; tabs (Mouse/Pointer/Scrolling/Profiles); theme tokens; Radix primitives
- Requires: M-01, A-01
- Blocks: UI-02, UI-03

UI-02 Mouse tab with interactive callouts
- Owner: UI Agent
- Output: Illustration with callouts; dropdown actions; live state wiring via IPC stubs
- Requires: UI-01, A-02
- Blocks: QA-02

UI-03 Pointer/Scrolling/Profiles tabs
- Owner: UI Agent
- Output: DPI slider/presets; vertical/horizontal scroll controls; profile table (CRUD)
- Requires: UI-01, D-01
- Blocks: QA-01

### System Integration (SYS-*)

SYS-01 System tray integration
- Owner: System Integration Agent
- Output: Tray icon; battery %, connection status; quick profile switcher; menu actions
- Requires: A-02
- Blocks: QA-03, P-01

SYS-02 Auto-start implementation
- Owner: System Integration Agent
- Output: Desktop entry toggle; start minimized; persist choice
- Requires: SYS-01
- Blocks: P-01

### Permissions (PERM-*)

PERM-01 HID permissions guidance
- Owner: Docs Agent, System Integration Agent
- Output: udev rules template; `input` group instructions; troubleshooting
- Requires: B-02
- Blocks: P-01, DOC-01

### Quality (QA-*)

QA-01 Contract tests: IPC and persistence
- Owner: QA Agent
- Output: Unit tests for IPC schemas; persistence roundtrip tests; RLS-like data validation strategy
- Requires: A-01, D-01, S-01
- Blocks: CI-01

QA-02 HID integration tests (mock or hardware-in-loop)
- Owner: QA Agent, HID Agent
- Output: Simulated feature reports; optional hardware smoke; determinism docs
- Requires: A-02, UI-02
- Blocks: CI-01

QA-03 Tray and autostart manual smoke checklist
- Owner: QA Agent, System Integration Agent
- Output: Manual checklist across GNOME/KDE; screenshots; known issues
- Requires: SYS-01, SYS-02
- Blocks: REL-01

### CI/CD (CI-*)

CI-01 Continuous integration pipeline
- Owner: QA Agent, Docs Agent
- Output: Lint, typecheck, unit, contract tests; build artifacts for packages; cache tuning
- Requires: ENV-01, QA-01, QA-02
- Blocks: P-01

### Packaging (P-*, PKG-ALT-*)

P-01 Packaging for Linux (AppImage, DEB, RPM)
- Owner: Packaging/Distribution Agent
- Output: Reproducible builds; install scripts; post-install notes (permissions)
- Requires: ENV-01, S-01, SYS-01, SYS-02, PERM-01, CI-01
- Blocks: REL-01

PKG-ALT-01 AUR recipe scaffold
- Owner: Packaging/Distribution Agent
- Output: PKGBUILD draft with build steps
- Requires: P-01
- Blocks: REL-01

PKG-ALT-02 Flatpak feasibility report
- Owner: Packaging/Distribution Agent
- Output: Assessment of HID permission limitations and options; portal exploration
- Requires: P-01
- Blocks: —

### Documentation (DOC-*)

DOC-01 User guide and troubleshooting
- Owner: Docs Agent
- Output: README sections for setup, permissions, profiles, FAQs
- Requires: PERM-01, D-01
- Blocks: REL-01

### Release (REL-*)

REL-01 Release 1.0 (MVP)
- Owner: Packaging/Distribution Agent, Docs Agent
- Output: GitHub release with artifacts (AppImage/DEB/RPM), release notes, basic support doc
- Requires: P-01, QA-03, DOC-01
- Blocks: —

---

Open questions affecting scope
- Packaging priority: AppImage for MVP (DEB/RPM secondary); Flatpak deferred to feasibility report
- Target DEs for tray testing: GNOME and KDE are required
- Application-specific profiles: reserve schema placeholders now (post-1.0 scope)
- Actions list: keep PRD set unchanged for MVP
- Default DPI presets: 800/1200/1600/2400/3200 confirmed
- Bluetooth: detect-only if paired already (no pairing UI in MVP)
- Logging: file-based logs at info level; console in dev; redact device serials in errors

---

## Progress checklist

- [ ] B-01 Define top-level behaviors and acceptance criteria
- [ ] B-02 Define device behaviors for MX Master 2S
- [ ] M-01 Model the application state (Zustand)
- [ ] M-02 Define persistence schema and migrations
- [ ] A-01 IPC contract (typed, versioned)
- [ ] A-02 HID service surface in Main
- [ ] D-01 Data adapters for profiles and settings
- [ ] S-01 Security baseline
- [ ] ENV-01 Dev environment & scripts
- [ ] UI-01 Scaffold app shell and tabs
- [ ] UI-02 Mouse tab with interactive callouts
- [ ] UI-03 Pointer/Scrolling/Profiles tabs
- [ ] SYS-01 System tray integration
- [ ] SYS-02 Auto-start implementation
- [ ] PERM-01 HID permissions guidance
- [ ] QA-01 Contract tests (IPC, persistence)
- [ ] QA-02 HID integration tests
- [ ] QA-03 Tray/autostart manual checklist
- [ ] CI-01 Continuous integration pipeline
- [ ] P-01 Packaging (AppImage, DEB, RPM)
- [ ] PKG-ALT-01 AUR recipe scaffold
- [ ] PKG-ALT-02 Flatpak feasibility report
- [ ] DOC-01 User guide and troubleshooting
- [ ] REL-01 Release 1.0 (MVP)

---

## Dependency-ordered execution plan (phased)

Phase 0: Foundations
1) ENV-01 Dev env & scripts
2) B-01 Behaviors, acceptance
3) B-02 Device behaviors (2S)

Phase 1: Contracts & Models
4) M-01 App state model
5) A-01 IPC contract
6) S-01 Security baseline
7) M-02 Persistence schema/migrations

Phase 2: Data & UI Scaffolding
8) D-01 Data adapters
9) UI-01 App shell & tabs

Phase 3: HID & Core UI
10) A-02 HID service
11) UI-02 Mouse tab (callouts wired to IPC)
12) QA-02 HID integration tests (mock/hardware)

Phase 4: Remaining UI (QA deferred)
13) UI-03 Pointer/Scrolling/Profiles tabs
14) [Deferred] QA-01 Contract tests (IPC, persistence)

Phase 5: System Integration
15) SYS-01 Tray
16) SYS-02 Auto-start
17) [Deferred] QA-03 Manual tray/autostart checklist

Phase 6: Packaging (CI deferred)
18) [Deferred] CI-01 CI pipeline (build, tests, artifacts)
19) P-01 Packaging (AppImage priority; DEB/RPM secondary)
20) PKG-ALT-01 AUR scaffold
21) PKG-ALT-02 Flatpak feasibility

Phase 7: Docs & Release
22) PERM-01 HID permissions guidance
23) DOC-01 User guide & troubleshooting
24) REL-01 Release 1.0 (MVP)

---

Repository working rules (applies to all tasks here)
- Create a local git commit after completing each task. Do not push until approved.
- Do not run `npm run dev` until all tasks in this document are complete.
- Tasks related to CI/CD and testing (QA-*, CI-*) are deferred until explicitly re-enabled.


