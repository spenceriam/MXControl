# Product Requirements Document
# MX Control - Linux Options+ Alternative for MX Master Mice

## Executive Summary

**Product Name:** MX Control  
**Version:** 1.0 MVP  
**Purpose:** Native Linux configuration tool for Logitech MX Master mice  
**Target Platform:** Linux (Bazzite, Ubuntu, Fedora, Arch)  
**Initial Device Support:** MX Master 2S (expandable to MX Master 3/3S)

## 1. Product Vision & Goals

### Vision Statement
Create a fast, simple, and reliable configuration tool for MX Master mice on Linux that matches the essential functionality of Logitech Options+, providing Linux users with a native solution for their premium peripherals.

### Core Values
- **Fast:** Instant device detection, real-time setting changes
- **Simple:** Minimal clicks to configure, intuitive UI
- **Reliable:** Settings persist across reboots, stable operation
- **Familiar:** UI patterns similar to Options+ for easy transition

### Design Principles
- **Monochrome aesthetic** - Black and white interface with minimal color (red for warnings only)
- **Hand-drawn/sketch style** - Technical drawings feel for buttons and UI elements
- **Visual clarity** - Clear button callouts on mouse illustration
- **Instant feedback** - Real-time preview of changes

## 2. User Requirements

### Target Users
- Linux developers using MX Master mice
- Creative professionals on Linux workstations
- Linux enthusiasts who switched from Windows/Mac
- Bazzite/Gaming-focused distribution users

### Core User Stories
1. **As a user**, I want to see my mouse visually with clear button labels so I know what I'm configuring
2. **As a user**, I want to adjust my mouse DPI quickly so I can switch between precision and speed
3. **As a user**, I want to remap my mouse buttons to match my workflow
4. **As a user**, I want to configure horizontal scroll for different functions (volume, tabs, etc.)
5. **As a user**, I want to save different profiles for different activities
6. **As a user**, I want to see my battery level and connection type at a glance
7. **As a user**, I want to be warned when battery is low (<10%)

## 3. Feature Specifications

### 3.1 Device Detection & Status

#### Connection Types
- **USB Cable** (wired mode or charging)
- **USB Receiver** (Unifying/Bolt)
- **Bluetooth**

#### Battery Monitoring
- Real-time battery percentage (0-100%)
- Charging indicator
- Low battery warning at 10%
- Critical battery alert at 5%
- Update frequency: Every 60 seconds

### 3.2 Mouse Controls Configuration

#### Button Mappings Available

**Primary Buttons:**
- **Left Click** - Primary click (not remappable in MVP)
- **Right Click** - Secondary click (not remappable in MVP)
- **Middle Mouse Click** - Scroll wheel click
  - Options: Middle click, Copy, Paste, Application switcher, Mission control, Play/Pause

**Navigation Buttons:**
- **Back Button**
  - Options: Back, Forward, Copy, Paste, Undo, Desktop left, Mission control, Play/Pause, Custom keystroke
- **Forward Button**  
  - Options: Forward, Back, Copy, Paste, Redo, Desktop right, Show desktop, Next track, Custom keystroke

**Special Buttons:**
- **Gesture Button** (thumb button)
  - Mode 1: Single click action (same options as navigation buttons)
  - Mode 2: Gesture mode with directional swipes
    - Swipe up: Mission control, Desktop up, Volume up, Zoom in
    - Swipe down: Show desktop, Desktop down, Volume down, Zoom out
    - Swipe left: Previous desktop, Back, Previous tab, Previous track
    - Swipe right: Next desktop, Forward, Next tab, Next track
  - Sensitivity: 1-10 scale

**Horizontal Scroll Wheel:**
- **Function modes:**
  1. Horizontal scroll (default)
  2. Volume control
  3. Zoom in/out
  4. Tab navigation
  5. Timeline scrubbing
  6. Brush size adjustment
  7. Page navigation (Previous/Next)
- **Sensitivity:** 1-10 scale
- **Direction:** Natural or Inverted

### 3.3 Pointer/DPI Configuration

#### DPI Settings
- Range: 200-4000 DPI
- Step increment: 50 DPI
- Quick presets: 800, 1200, 1600, 2400, 3200
- Custom value input
- Real-time preview (changes apply immediately)

#### Advanced Pointer Options
- Enable/Disable pointer acceleration
- Enable/Disable enhanced precision
- Pointer speed multiplier (0.5x - 3.0x)

### 3.4 Scrolling Configuration

#### Vertical Scroll
- Direction: Natural (Mac-style) or Standard (Traditional)
- Speed: 1-10 scale
- Smooth scrolling: Enable/Disable
- Lines per scroll: 1-10

#### SmartShift (if supported by device)
- Enable/Disable auto-shift between ratchet and free-scroll
- Threshold sensitivity: 1-10

### 3.5 Profile Management

#### Profile Features
- Create unlimited profiles
- Name profiles (e.g., "Work", "Gaming", "Design")
- Set default profile
- Quick switch via system tray
- Import/Export profiles as JSON
- Duplicate existing profiles

#### Profile Contents
- All button mappings
- DPI settings
- Scroll settings
- Gesture configurations

### 3.6 System Integration

#### System Tray
- Always accessible icon
- Quick profile switcher
- Battery level display
- Connection status
- Quick access to main window

#### Auto-start Options
- Launch on system startup
- Start minimized to tray
- Auto-connect to last device

## 4. User Interface Design

### 4.1 Design System

#### Color Palette (Monochrome)
- Primary Background: #000000 (Pure Black)
- Secondary Background: #0A0A0A (Near Black)
- Panel Background: #1A1A1A (Dark Gray)
- Borders: #2D2D2D (Gray)
- Disabled Text: #595959 (Mid Gray)
- Primary Text: #FFFFFF (Pure White)
- Hover States: #A6A6A6 (Light Gray)
- Warning Only: #FF4444 (Red - battery warnings only)

#### Typography
- Font Family: System default sans-serif
- Headers: 16px Medium
- Body: 14px Regular
- Labels: 12px Regular
- Button Text: 14px Medium

### 4.2 Main Window Layout

**Window Specifications:**
- Size: 900x650px (fixed)
- Non-resizable (MVP)
- Centered on screen
- Dark theme only

**Layout Structure:**
```
┌──────────────────────────────────────────────────────┐
│ [Icon] MX Control                         [_][□][X]  │
├──────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────┐   │
│ │ MX Master 2S  [USB] [🔋85%] [✓Connected]       │   │
│ └────────────────────────────────────────────────┘   │
│                                                       │
│ [Mouse] [Pointer] [Scrolling] [Profiles]             │
│ ──────────────────────────────────────────────────   │
│                                                       │
│              [Tab Content Area]                      │
│                                                       │
│ [Restore Defaults]              [Apply]    [Save]    │
└──────────────────────────────────────────────────────┘
```

### 4.3 Mouse Tab - Visual Button Mapping

The Mouse tab displays the device illustration with interactive callout buttons for each control:

```
             [Scroll Wheel Click]
                Middle Mouse ▼
                      │
        [Back] ◄──── ● ────► [Forward]
         Back ▼             Forward ▼
                      
                [Gesture Button]
                 Gestures ▼
                      
              [Horizontal Scroll]
                 Volume ▼
```

**Interaction Pattern:**
1. User clicks on callout button
2. Dropdown menu appears with available actions
3. Selection applies immediately
4. Visual feedback confirms change

### 4.4 Screen Specifications

#### Mouse Tab
- Visual mouse illustration as background (10% opacity)
- Callout buttons with labels floating over mouse image
- Each button shows current assignment
- Dropdown on click with categorized actions
- "Swap left/right buttons" checkbox at bottom

#### Pointer Tab  
- Large DPI slider (200-4000)
- Preset buttons in a row
- Custom DPI input field
- Acceleration checkbox
- Precision checkbox

#### Scrolling Tab
- Vertical scroll section
  - Direction radio buttons
  - Speed slider
  - Smooth scrolling toggle
  - Lines per scroll dropdown
- Horizontal scroll section
  - Function dropdown
  - Sensitivity slider
  - Direction toggle

#### Profiles Tab
- Profile list table
- Active profile highlighted
- Action buttons per profile (Activate, Edit, Delete)
- Global action buttons (New, Import, Export)
- Auto-start checkboxes

## 5. Technical Requirements

### 5.1 Technology Stack

- **Frontend Framework:** Electron + React + TypeScript
- **UI Components:** Radix UI (headless components)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **State Management:** Zustand
- **HID Communication:** node-hid
- **Data Persistence:** electron-store

### 5.2 System Requirements

**Minimum Requirements:**
- Linux kernel 5.4+
- Node.js 18+
- USB HID support enabled
- 100MB free disk space
- 256MB RAM
- User must be in 'input' group for HID access

**Supported Distributions:**
- Ubuntu 20.04+
- Fedora 38+
- Arch Linux (via AUR)
- Bazzite/SteamOS
- Debian 11+
- openSUSE Tumbleweed

### 5.3 HID Protocol

**Communication Method:** HID++ 2.0 Protocol
**Supported Features:**
- Device detection and identification
- Battery status reporting
- DPI adjustment (200-4000)
- Button remapping via feature 0x1b04
- Gesture configuration via feature 0x6501
- Connection type detection

## 6. File Storage & Configuration

### Configuration Location
```
~/.config/mx-control/
├── profiles/
│   ├── default.json
│   ├── work.json
│   └── [profile-name].json
├── settings.json
├── device-cache.json
└── logs/
    └── mx-control.log
```

### Profile JSON Structure
```json
{
  "id": "uuid-v4",
  "name": "Profile Name",
  "deviceId": "device-serial",
  "settings": {
    "dpi": {
      "value": 1600,
      "acceleration": false,
      "precision": true
    },
    "buttons": {
      "middle": "middle-click",
      "back": "back",
      "forward": "forward",
      "gesture": {
        "mode": "gestures",
        "sensitivity": 5,
        "actions": {
          "up": "mission-control",
          "down": "show-desktop",
          "left": "desktop-left",
          "right": "desktop-right"
        }
      }
    },
    "scrolling": {
      "vertical": {
        "direction": "standard",
        "speed": 5,
        "smooth": true,
        "lines": 3
      },
      "horizontal": {
        "function": "volume",
        "sensitivity": 5,
        "direction": "standard"
      }
    }
  }
}
```

## 7. Development Roadmap

### Phase 1: Foundation (Week 1-2)
- Electron + React setup
- HID device detection
- Basic DPI control
- Profile storage system

### Phase 2: Core Features (Week 3-4)
- Mouse tab with visual mapping
- All button configurations
- Scrolling configuration
- Battery monitoring

### Phase 3: Polish (Week 5)
- System tray integration
- Profile import/export
- Low battery warnings
- Auto-start functionality

### Phase 4: Testing & Release (Week 6)
- Multi-distribution testing
- Package creation (AppImage, DEB, RPM)
- Documentation
- GitHub release

## 8. MVP Scope

### Included in v1.0
✅ MX Master 2S support
✅ Visual mouse button mapping
✅ DPI adjustment
✅ All button remapping
✅ Horizontal scroll functions
✅ Profile management
✅ Battery monitoring
✅ Connection type detection
✅ System tray
✅ Low battery warnings

### Future Versions (v1.1+)
⏳ MX Master 3/3S support
⏳ Application-based profile switching
⏳ More custom shortcuts
⏳ Backup to cloud
⏳ Multi-device support
⏳ Flow (multi-computer) support

## 9. Success Metrics

- Device detection < 1 second
- Settings apply < 100ms  
- Application launch < 2 seconds
- Memory usage < 150MB
- CPU usage < 1% idle
- Battery check interval: 60 seconds

## 10. Distribution

### Package Formats
- **AppImage** - Universal Linux package
- **DEB** - Ubuntu/Debian package
- **RPM** - Fedora/RHEL package
- **AUR** - Arch User Repository
- **Flatpak** - Sandboxed universal package

### Installation Requirements
- Add user to 'input' group for HID access
- Create udev rules for device permissions
- Optional: Auto-start entry in desktop environment

---

**Document Version:** 1.1  
**Last Updated:** Current  
**Status:** Ready for Development