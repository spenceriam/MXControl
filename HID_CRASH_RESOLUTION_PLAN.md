# HID Module Crash Resolution Plan

## Current Issue
Electron crashes with `SIGSEGV` (segmentation fault) when attempting to connect to HID devices that are not present or fail to respond. This is a native module crash in `node-hid` that terminates the entire application.

## Root Cause Analysis

### What's Happening:
1. `main.ts` line 46: `hidService.discover()` calls `HID.devices()` from `node-hid`
2. If devices are found, `hidService.connect()` is called (line 50)
3. `service.ts` line 60: Creates new `HID.HID(info.path)` instance
4. `service.ts` line 70: Attempts `hidpp.ping()` which times out
5. When ping fails, error is caught but native module has already corrupted memory
6. Later operations or cleanup cause SIGSEGV in the native code

### Why it Crashes:
- `node-hid` is a native addon wrapping `libusb`/`hidapi`
- Native code doesn't handle all error conditions gracefully
- Potential issues:
  - USB device disconnection during operation
  - Invalid device paths
  - Race conditions in device enumeration
  - Memory corruption in native layer
  - Signal handling issues in native code

## Resolution Strategy

### Phase 1: Immediate Stabilization (Quick Win)
**Goal**: Prevent app crash, allow graceful degradation

#### Actions:
1. **Wrap HID operations in process isolation** (Option A - Recommended)
   - Move HID operations to a separate Node.js child process
   - Use IPC to communicate between main process and HID worker
   - If HID worker crashes, main app continues running
   - Implement automatic worker restart

2. **Add comprehensive error boundaries** (Option B - Fallback)
   - Wrap all `node-hid` calls in try-catch with native error handling
   - Add process-level exception handlers
   - Implement graceful shutdown on critical errors
   - Disable HID features if native module fails

3. **Defer device initialization** (Option C - Combined)
   - Don't connect to devices on startup
   - Only attempt connection when user explicitly requests it
   - Show "No device" state by default
   - Add "Retry Connection" button in UI

### Phase 2: Robust Error Handling
**Goal**: Proper error handling throughout HID layer

#### Changes needed:

1. **In `src/main/main.ts`:**
   ```typescript
   // Change from immediate connection to deferred
   app.whenReady().then(async () => {
     createMainWindow();
     registerIpcHandlers();
     createTray();
     
     // DON'T connect immediately - wait for user action
     // Just initialize the service
     try {
       hidService.initialize(); // Safe initialization only
     } catch (err) {
       console.error('HID service initialization failed:', err);
       // App continues without HID support
     }
   });
   ```

2. **In `src/main/hid/service.ts`:**
   ```typescript
   // Add safe initialization
   initialize(): void {
     // Set up listeners, but don't enumerate devices yet
     this.state = { 
       connected: false, 
       connection: 'unknown', 
       batteryPct: 0, 
       charging: false 
     };
   }
   
   // Make discover() safer
   discover(): HidDeviceInfo[] {
     try {
       const allDevices = HID.devices();
       // ... rest of logic
     } catch (err) {
       console.error('Device discovery failed:', err);
       return []; // Return empty array instead of crashing
     }
   }
   
   // Add timeout wrapper for connect
   async connect(info: HidDeviceInfo): Promise<void> {
     const timeout = new Promise((_, reject) => 
       setTimeout(() => reject(new Error('Connection timeout')), 5000)
     );
     
     try {
       await Promise.race([this._connectInternal(info), timeout]);
     } catch (err) {
       console.error('Connection failed:', err);
       this.close(); // Ensure cleanup
       throw err; // Re-throw for caller to handle
     }
   }
   ```

3. **In `src/main/hid/hidpp.ts`:**
   ```typescript
   // Add device validation before operations
   private ensureDevice(): void {
     if (!this.device) {
       throw new HIDPPError('Device not connected', -1);
     }
   }
   
   // Add guards to all methods
   async ping(): Promise<boolean> {
     try {
       this.ensureDevice();
       // ... existing logic
     } catch (err) {
       console.error('Ping failed:', err);
       return false; // Don't throw, return false
     }
   }
   ```

### Phase 3: Device Connection UI
**Goal**: User-initiated connection instead of auto-connect

#### Changes:

1. **Add connection state to UI** (in renderer)
   - Show "No device connected" state
   - Add "Connect Device" button
   - Show "Searching..." during discovery
   - Display connection errors to user

2. **Add IPC handlers for device management:**
   ```typescript
   // New IPC channels
   Channels.DeviceDiscover = 'device:discover'
   Channels.DeviceConnect = 'device:connect'
   Channels.DeviceDisconnect = 'device:disconnect'
   ```

3. **Manual connection workflow:**
   - User clicks "Connect Device"
   - App discovers available devices
   - User selects device from list
   - App attempts connection
   - Show success/failure feedback

### Phase 4: Process Isolation (Advanced)
**Goal**: Complete isolation of native HID code

#### Implementation:

1. **Create HID worker process:**
   ```
   src/main/hid/worker.ts  // Separate process for HID operations
   ```

2. **Use Electron utility process or child_process:**
   ```typescript
   // In main process
   import { fork } from 'child_process';
   const hidWorker = fork('./hid/worker.js');
   
   hidWorker.on('message', (msg) => {
     // Handle HID events
   });
   
   hidWorker.on('exit', (code) => {
     if (code !== 0) {
       console.error('HID worker crashed, restarting...');
       // Restart worker
     }
   });
   ```

3. **Benefits:**
   - Native crashes only kill worker process
   - Main app remains responsive
   - Can restart worker automatically
   - Better debugging and logging

## Implementation Priority

### Must Have (Phase 1 + 2):
- [ ] Remove auto-connect on app startup
- [ ] Add try-catch around all HID.devices() calls
- [ ] Add try-catch around HID constructor
- [ ] Add timeout protection for connect operations
- [ ] Add safe fallback states throughout
- [ ] Test app launch with no devices connected
- [ ] Test app launch with device connected but unresponsive

### Should Have (Phase 3):
- [ ] Add manual "Connect Device" UI
- [ ] Add device discovery IPC handler
- [ ] Add connection status UI indicators
- [ ] Add user-friendly error messages
- [ ] Add connection retry mechanism

### Nice to Have (Phase 4):
- [ ] Implement HID worker process isolation
- [ ] Add automatic worker restart logic
- [ ] Add worker health monitoring
- [ ] Add comprehensive logging

## Testing Strategy

### Test Cases:
1. ✅ App launch with no USB devices
2. ✅ App launch with device connected
3. ✅ App launch with device that doesn't respond
4. ✅ Device disconnected during operation
5. ✅ Device reconnected after disconnection
6. ✅ Multiple device connections
7. ✅ Invalid device paths
8. ✅ Permission denied scenarios

### Validation:
- App must never crash (SIGSEGV)
- UI must show appropriate status
- Errors logged but not thrown to user
- Recovery possible without restart

## Timeline Estimate

- **Phase 1** (Immediate): 2-3 hours
- **Phase 2** (Robust Errors): 3-4 hours  
- **Phase 3** (UI): 4-6 hours
- **Phase 4** (Isolation): 8-12 hours

**Recommended Start**: Phase 1 + Phase 2 (combined ~5-6 hours)

## Next Steps

1. Implement Phase 1 Option C (defer initialization)
2. Add comprehensive error handling to HIDService
3. Test with no devices connected
4. Verify app stays running
5. Commit changes with detailed explanation
6. Move to Phase 3 for better UX

## Success Criteria

- ✅ App launches successfully without any HID devices
- ✅ App remains running when device connection fails
- ✅ User can manually retry connection
- ✅ Clear error messages displayed to user
- ✅ No SIGSEGV crashes under any circumstances
- ✅ Device connection works when device is available

---

**Status**: Plan created, awaiting implementation approval
**Created**: 2025-09-29
**Priority**: HIGH (blocking production use)