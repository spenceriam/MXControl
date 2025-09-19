# MX Control - User Guide

## Installation (Linux)
- AppImage: download and mark executable
- DEB/RPM: install via distro package manager
- First run may require HID permissions (see `docs/permissions.md`)

## Getting Started
- Connect your MX Master 2S (USB receiver/cable/Bluetooth already paired)
- Launch MX Control
- The top bar shows connection type and battery level

## Tabs
- Mouse: Assign actions for middle/back/forward and gesture button; set gesture mode/sensitivity
- Pointer: Adjust DPI (200–4000, step 50); presets (800/1200/1600/2400/3200); acceleration/precision
- Scrolling: Vertical direction/speed/smooth/lines; Horizontal mode and sensitivity
- Profiles: Create/duplicate/delete; set default; import/export JSON

## System Tray
- Quick profile switching
- Battery and connection status
- Show main window or quit

## Autostart
- Enable launch on system startup and start minimized to tray in Profiles

## Troubleshooting
- Ensure HID permissions are configured
- Replug the device after updating udev rules
- Verify user is in `input` group
- Check logs under `~/.config/mx-control/logs/mx-control.log`
