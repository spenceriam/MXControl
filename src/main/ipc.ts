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
}


