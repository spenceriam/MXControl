import { contextBridge, ipcRenderer } from 'electron';
import {
  Channels,
  SetDPIRequest,
  UpdateButtonsRequest,
  UpdateGestureRequest,
  UpdateScrollRequest,
  ProfilesSaveRequest,
  SettingsSaveRequest
} from '@shared/ipc';

export type PingResponse = { ok: true };

const api = {
  ping: async (): Promise<PingResponse> => ipcRenderer.invoke(Channels.Ping),
  getDeviceStatus: async () => ipcRenderer.invoke(Channels.GetDeviceStatus),
  setDpi: async (req: SetDPIRequest) => ipcRenderer.invoke(Channels.SetDPI, req),
  updateButtons: async (req: UpdateButtonsRequest) => ipcRenderer.invoke(Channels.UpdateButtons, req),
  updateGesture: async (req: UpdateGestureRequest) => ipcRenderer.invoke(Channels.UpdateGesture, req),
  updateScroll: async (req: UpdateScrollRequest) => ipcRenderer.invoke(Channels.UpdateScroll, req),
  listProfiles: async () => ipcRenderer.invoke(Channels.ProfilesList),
  saveProfiles: async (req: ProfilesSaveRequest) => ipcRenderer.invoke(Channels.ProfilesSave, req),
  getSettings: async () => ipcRenderer.invoke(Channels.SettingsGet),
  saveSettings: async (req: SettingsSaveRequest) => ipcRenderer.invoke(Channels.SettingsSave, req)
};

contextBridge.exposeInMainWorld('mxc', api);

declare global {
  interface Window {
    mxc: typeof api;
  }
}


