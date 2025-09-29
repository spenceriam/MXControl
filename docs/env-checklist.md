# MXControl Development Environment Checklist

This checklist verifies that your Linux system is properly configured for MXControl development and testing with the MX Master 2S.

## Prerequisites

- Linux kernel 5.4+ with USB HID support
- Node.js 18+
- MX Master 2S connected (Bluetooth or USB receiver)

---

## Validation Steps

### 1. Check Node.js and npm versions

```bash
node --version
npm --version
```

Expected:
- Node.js: v18.0.0 or higher
- npm: v8.0.0 or higher

---

### 2. Verify node-hid availability

```bash
cd /home/spencer/Documents/GitHub/MXControl
node -e "require('node-hid'); console.log('node-hid OK');"
```

Expected output:
```
node-hid OK
```

If this fails, run `npm install` to compile node-hid.

---

### 3. Check user group membership

```bash
groups
```

Expected output should include `input`:
```
spencer adm cdrom sudo dip plugdev lpadmin sambashare input
```

If `input` is missing:
```bash
sudo usermod -aG input $USER
```

IMPORTANT: You must log out and log back in for group changes to take effect.

---

### 4. Inspect udev rule

```bash
cat /etc/udev/rules.d/99-mx-control.rules
```

Expected content:
```
# Logitech MX Master 2S via USB/Receiver
KERNEL=="hidraw*", ATTRS{idVendor}=="046d", ATTRS{idProduct}=="b019", GROUP="input", MODE="0660"
# Logitech MX Master 2S via Bluetooth (uhid)
KERNEL=="hidraw*", KERNELS=="*046D:B019*", GROUP="input", MODE="0660"
```

If missing, create the file:
```bash
sudo tee /etc/udev/rules.d/99-mx-control.rules > /dev/null << 'EOF'
# Logitech MX Master 2S via USB/Receiver
KERNEL=="hidraw*", ATTRS{idVendor}=="046d", ATTRS{idProduct}=="b019", GROUP="input", MODE="0660"
# Logitech MX Master 2S via Bluetooth (uhid)
KERNEL=="hidraw*", KERNELS=="*046D:B019*", GROUP="input", MODE="0660"
EOF

sudo udevadm control --reload-rules && sudo udevadm trigger
```

---

### 5. Verify hidraw permissions

```bash
ls -l /dev/hidraw*
```

Look for the MX Master 2S device (typically the one with `input` group):
```
crw-rw---- 1 root input 236, 4 Sep 29 17:36 /dev/hidraw4
```

Key requirements:
- Group: `input`
- Permissions: `crw-rw----` (0660)

If permissions are incorrect, reload udev rules:
```bash
sudo udevadm control --reload-rules && sudo udevadm trigger
```

---

### 6. Run device detection test

```bash
cd /home/spencer/Documents/GitHub/MXControl
node scripts/test-detect.cjs
```

Expected output:
```
Enumerating all HID devices...

Total HID devices found: 10

Logitech devices (vendorId 0x046d): 4

[1] MX Master 2S
    Path: /dev/hidraw4
    VendorId: 0x046d
    ProductId: 0xb019
    Serial: cd:37:ee:48:c1:6a
    ...

============================================================
MX MASTER 2S DETECTED (vendorId: 0x046d, productId: 0xb019)
============================================================
```

If the device is not detected:
1. Ensure the mouse is powered on
2. Check Bluetooth connection: `bluetoothctl devices`
3. Verify you've logged out and back in after adding to `input` group
4. Check hidraw permissions (step 5)

---

### 7. Verify Bluetooth connection (if using Bluetooth)

```bash
bluetoothctl devices | grep -i "MX Master"
```

Expected output:
```
Device CD:37:EE:48:C1:6A MX Master 2S
```

If not connected, pair the device:
```bash
bluetoothctl
scan on
# Wait for device to appear
pair CD:37:EE:48:C1:6A
connect CD:37:EE:48:C1:6A
trust CD:37:EE:48:C1:6A
exit
```

---

### 8. Verify dependencies are installed

```bash
cd /home/spencer/Documents/GitHub/MXControl
ls -d node_modules
```

Expected: `node_modules` directory exists

If missing:
```bash
npm install
```

---

## Common Issues and Solutions

### Issue: "Cannot open HID device"

Solution:
1. Verify you're in the `input` group: `groups`
2. Log out and log back in if group was just added
3. Check hidraw permissions: `ls -l /dev/hidraw*`
4. Verify udev rule is present and reload: `sudo udevadm control --reload-rules && sudo udevadm trigger`

### Issue: "Device not detected"

Solution:
1. Check Bluetooth connection: `bluetoothctl devices`
2. Power cycle the mouse (turn off and on)
3. Re-run detection: `node scripts/test-detect.cjs`
4. Check kernel messages: `sudo dmesg | grep -i "mx master"`

### Issue: "Permission denied" when running detection script

Solution:
1. Ensure user is in `input` group
2. Log out and log back in
3. Verify hidraw device has group `input` and mode `0660`

### Issue: "require is not defined" error

Solution:
The script file has a `.js` extension but should be `.cjs` (CommonJS). Rename:
```bash
mv scripts/test-detect.js scripts/test-detect.cjs
```

---

## Environment Validation Summary

Once all steps pass, your environment is ready for MXControl development:

- Node.js and dependencies installed
- User in `input` group
- udev rules configured for hidraw access
- MX Master 2S detected via node-hid
- Device accessible for read/write operations

Next step: Begin implementing HID++ 2.0 protocol (see `docs/HIDPP_TODO.md`)