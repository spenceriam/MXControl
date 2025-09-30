import { ipcMain, BrowserWindow } from 'electron';
import {
  Channels,
  DeviceStatusSchema,
  DeviceDiscoverResponseSchema,
  DeviceConnectRequestSchema,
  DeviceConnectResponseSchema,
  DeviceDisconnectResponseSchema,
  PingResponseSchema,
  SetDPIRequestSchema,
  SetDPIResponseSchema,
  UpdateButtonsRequestSchema,
  UpdateButtonsResponseSchema,
  UpdateGestureRequestSchema,
  UpdateGestureResponseSchema,
  UpdateScrollRequestSchema,
  UpdateScrollResponseSchema,
  ProfilesListResponseSchema,
  ProfilesSaveRequestSchema,
  ProfilesSaveResponseSchema,
  SettingsGetResponseSchema,
  SettingsSaveRequestSchema,
  SettingsSaveResponseSchema,
  WindowResizeRequestSchema,
  WindowResizeResponseSchema,
  Channels
} from '../shared/ipc';
import { getSettings, listProfiles, saveProfiles, setSettings } from './persistence';
import { disableAutostart, enableAutostart } from './autostart';
import { hidService } from './hid/service';

export function registerIpcHandlers() {
  ipcMain.handle(Channels.Ping, async () => {
    const res = { ok: true } as const;
    return PingResponseSchema.parse(res);
  });

  ipcMain.handle(Channels.GetDeviceStatus, async () => {
    const s = hidService.getState();
    const dto = {
      name: s.info?.product ?? 'MX Master',
      serialRedacted: (s.info?.serialNumber ?? 'XXXX-XXXX').replace(/.(?=.{4})/g, 'X'),
      connection: s.connection,
      battery: { percentage: s.batteryPct, charging: s.charging },
      connected: s.connected
    };
    return DeviceStatusSchema.parse(dto);
  });

  ipcMain.handle(Channels.DeviceDiscover, async () => {
    const devices = hidService.discover();
    const dto = { devices };
    return DeviceDiscoverResponseSchema.parse(dto);
  });

  ipcMain.handle(Channels.DeviceConnect, async (_e, payload) => {
    const req = DeviceConnectRequestSchema.parse(payload);
    try {
      // Find the device info by path
      const devices = hidService.discover();
      const device = devices.find(d => d.path === req.path);
      
      if (!device) {
        return DeviceConnectResponseSchema.parse({
          success: false,
          error: 'Device not found'
        });
      }
      
      await hidService.connect(device);
      return DeviceConnectResponseSchema.parse({ success: true });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      return DeviceConnectResponseSchema.parse({ success: false, error });
    }
  });

  ipcMain.handle(Channels.DeviceDisconnect, async () => {
    hidService.close();
    return DeviceDisconnectResponseSchema.parse({ success: true });
  });

  ipcMain.handle(Channels.SetDPI, async (_e, payload) => {
    const req = SetDPIRequestSchema.parse(payload);
    const ok = await hidService.setDpi(req.value);
    const res = { success: ok };
    return SetDPIResponseSchema.parse(res);
  });

  ipcMain.handle(Channels.UpdateButtons, async (_e, payload) => {
    const req = UpdateButtonsRequestSchema.parse(payload);
    const ok = await hidService.updateButtons();
    const res = { success: ok };
    return UpdateButtonsResponseSchema.parse(res);
  });

  ipcMain.handle(Channels.UpdateGesture, async (_e, payload) => {
    const req = UpdateGestureRequestSchema.parse(payload);
    const ok = await hidService.updateGesture();
    const res = { success: ok };
    return UpdateGestureResponseSchema.parse(res);
  });

  ipcMain.handle(Channels.UpdateScroll, async (_e, payload) => {
    const req = UpdateScrollRequestSchema.parse(payload);
    const res = { success: !!req };
    return UpdateScrollResponseSchema.parse(res);
  });

  ipcMain.handle(Channels.ProfilesList, async () => {
    const profiles = listProfiles();
    return ProfilesListResponseSchema.parse(profiles);
  });

  ipcMain.handle(Channels.ProfilesSave, async (_e, payload) => {
    const req = ProfilesSaveRequestSchema.parse(payload);
    saveProfiles(req);
    return ProfilesSaveResponseSchema.parse({ success: true });
  });

  ipcMain.handle(Channels.SettingsGet, async () => {
    const s = getSettings();
    return SettingsGetResponseSchema.parse(s);
  });

  ipcMain.handle(Channels.SettingsSave, async (_e, payload) => {
    const req = SettingsSaveRequestSchema.parse(payload);
    setSettings(req);
    if (req.autostart) enableAutostart();
    else disableAutostart();
    return SettingsSaveResponseSchema.parse({ success: true });
  });

  // Resize window to requested content size
  ipcMain.handle(Channels.WindowResize, async (_e, payload) => {
    const req = WindowResizeRequestSchema.parse(payload);
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return WindowResizeResponseSchema.parse({ success: false });
    win.setContentSize(req.width, req.height);
    return WindowResizeResponseSchema.parse({ success: true });
  });
}


