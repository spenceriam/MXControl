# HID Permissions (PERM-01)

## udev rules (example)
Create `/etc/udev/rules.d/99-mx-control.rules` with:
```
SUBSYSTEM=="input", GROUP="input", MODE="0660"
KERNEL=="hidraw*", SUBSYSTEM=="hidraw", MODE="0660", GROUP="input"
```
Then reload udev and replug the device:
```
sudo udevadm control --reload-rules && sudo udevadm trigger
```

## User group
Add your user to the `input` group and re-login:
```
sudo usermod -aG input $USER
```

## Troubleshooting
- Ensure the mouse enumerates as `hidraw` device
- Verify group ownership: `ls -l /dev/hidraw*`
- Some distros require policy kits; consult distro docs
- Wayland environments may restrict low-level input; app uses HID++ directly
