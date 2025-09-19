import { ipcMain } from 'electron';
import {
  Channels,
  DeviceStatusSchema,
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
  SettingsSaveResponseSchema
} from '@shared/ipc';
import { getSettings, listProfiles, saveProfiles, setSettings } from './persistence';
import { disableAutostart, enableAutostart } from './autostart';

// Simple in-memory mock state while HID is not wired (A-02 later)
let mockDevice = {
  name: 'MX Master 2S',
  serialRedacted: 'XXXX-XXXX',
  connection: 'receiver',
  battery: { percentage: 85, charging: false },
  connected: true
} as const;

export function registerIpcHandlers() {
  ipcMain.handle(Channels.Ping, async () => {
    const res = { ok: true } as const;
    return PingResponseSchema.parse(res);
  });

  ipcMain.handle(Channels.GetDeviceStatus, async () => {
    return DeviceStatusSchema.parse(mockDevice);
  });

  ipcMain.handle(Channels.SetDPI, async (_e, payload) => {
    const req = SetDPIRequestSchema.parse(payload);
    // A-02 will apply to device via HID; here we only validate
    const res = { success: !!req };
    return SetDPIResponseSchema.parse(res);
  });

  ipcMain.handle(Channels.UpdateButtons, async (_e, payload) => {
    const req = UpdateButtonsRequestSchema.parse(payload);
    const res = { success: !!req };
    return UpdateButtonsResponseSchema.parse(res);
  });

  ipcMain.handle(Channels.UpdateGesture, async (_e, payload) => {
    const req = UpdateGestureRequestSchema.parse(payload);
    const res = { success: !!req };
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
}


