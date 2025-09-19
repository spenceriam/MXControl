# Flatpak Feasibility (PKG-ALT-02)

Summary: Flatpak sandbox limits raw HID (`/dev/hidraw*`) access by default. Achieving HID++ communication requires extra permissions that defeat Flatpak isolation goals.

## Constraints
- Requires `--device=all` or `--device=hidraw` access via `--filesystem=/dev` which is generally discouraged
- Portals do not provide HID raw interfaces
- Udev rules inside Flatpak are ineffective

## Options
- Avoid Flatpak for MVP; prefer AppImage/DEB/RPM (chosen)
- Explore `flatpak-spawn --host` helper service for HID, but adds complexity and host dependency
- Consider a companion host service exposing a limited IPC API (security review required)

## Recommendation
- Defer Flatpak packaging; provide documentation on limitations
- Re-evaluate if a community-supported HID portal emerges or if design shifts to a host service approach
