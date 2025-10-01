# OS-Level Button Remapping Strategy

## Philosophy

Since the MX Master 2S firmware doesn't accept configuration over Bluetooth, we'll provide value through:
1. **Device Monitoring** - Battery, charging status, connection type
2. **OS-Level Button Remapping** - Map buttons to system actions via Linux input system

This is actually MORE flexible than hardware remapping because we can map to ANY system action!

## What We Can Monitor (Hardware)

✅ **Battery Level** - Via GATT Battery Service (0x180f)
✅ **Charging Status** - Via GATT Battery Service  
✅ **Connection Type** - Bluetooth/USB/Receiver detection
✅ **Device Model** - Product ID, name, serial
✅ **Real-time Updates** - Battery notifications

## What We Can Remap (OS Level)

### Available Buttons on MX Master 2S
1. **Forward Button** (Button 9) - Side button
2. **Back Button** (Button 8) - Side button  
3. **Middle Click** (Button 2) - Scroll wheel click
4. **Gesture Button** - Thumb button
5. **Horizontal Scroll** - Scroll wheel tilt left/right

### Remapping Methods

#### Option 1: xbindkeys (Simplest, Works on X11/Wayland)
- Config file: `~/.xbindkeysrc`
- Captures button events and executes commands
- Works for forward/back/middle buttons
- Example:
  ```bash
  # Forward button → Switch workspace right
  "xdotool set_desktop --relative 1"
    b:9
  
  # Back button → Switch workspace left  
  "xdotool set_desktop --relative -- -1"
    b:8
  ```

#### Option 2: libinput Quirks (System-wide, Best for Wayland)
- Config: `/etc/libinput/local-overrides.quirks`
- Maps button numbers to different actions
- Survives reboots
- Requires root but more reliable

#### Option 3: Custom Event Handler (Our App)
- Read from `/dev/input/event12` directly
- Intercept button events
- Execute custom actions
- Most flexible but requires event permissions

## Implementation Plan

### Phase 1: Device Info Display ✅
1. Show battery level (50%)
2. Show charging status  
3. Show connection type (Bluetooth)
4. Real-time battery updates

### Phase 2: Button Detection
1. Monitor `/dev/input/event12` for button presses
2. Detect which buttons user presses
3. Show current button mappings

### Phase 3: Button Remapping UI
Allow user to map buttons to:
- **Workspaces**: Switch left/right, Show all
- **Windows**: Mission Control, Show Desktop, Minimize all
- **Media**: Play/Pause, Next/Previous track
- **Volume**: Up/Down/Mute
- **Brightness**: Up/Down
- **Custom**: Run any command

### Phase 4: Apply Mappings
1. Generate xbindkeys config
2. Or write libinput quirks file
3. Restart input services
4. Verify mappings work

## Button Event Codes

From `/proc/bus/input/devices`:
```
event12 - Mouse buttons and movement
event11 - Keyboard events from extra buttons
```

Standard button codes:
- BTN_LEFT = 272 (Button 1)
- BTN_RIGHT = 273 (Button 2) 
- BTN_MIDDLE = 274 (Button 3)
- BTN_SIDE = 275 (Button 4) - Back
- BTN_EXTRA = 276 (Button 5) - Forward
- BTN_FORWARD = 277 (Button 6)
- BTN_BACK = 278 (Button 7)

MX Master 2S specific:
- Forward: Button 9 (BTN_TASK = 279)
- Back: Button 8 (BTN_BACK = 278)
- Gesture: Depends on mode (sends keyboard events)

## Actions We Can Map To

### GNOME/Mutter (Zorin OS default)
```bash
# Show overview (Mission Control equivalent)
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval "Main.overview.toggle();"

# Show desktop
wmctrl -k on

# Switch workspace
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval "Main.wm.actionMoveWorkspace(Meta.MotionDirection.UP);"

# Volume
pactl set-sink-volume @DEFAULT_SINK@ +5%
pactl set-sink-volume @DEFAULT_SINK@ -5%

# Brightness  
brightnessctl set +10%
brightnessctl set 10%-
```

## Advantages Over Logitech Options+

✅ **More Actions** - Can map to ANY Linux command
✅ **System Integration** - Native GNOME/KDE actions
✅ **No USB Required** - Works immediately with Bluetooth
✅ **Open Source** - User can customize configs
✅ **Lightweight** - No daemon constantly running
✅ **Battery Monitoring** - Real-time, no polling device

## Example: Complete Button Mapping

```
Forward Button → Next Workspace
Back Button → Previous Workspace
Middle Click → Show All Windows
Horizontal Scroll Left → Volume Down
Horizontal Scroll Right → Volume Up
Gesture Button Up → Mission Control
Gesture Button Down → Show Desktop
```

## Next Steps

1. ✅ Verify battery charging status reading
2. Create button event listener service
3. Build UI for button mapping
4. Generate and apply xbindkeys config
5. Test all mappings with physical device
6. Document user-facing features
