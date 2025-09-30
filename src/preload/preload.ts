import { contextBridge, ipcRenderer } from 'electron';
import {
  Channels,
  DeviceConnectRequest,
  SetDPIRequest,
  UpdateButtonsRequest,
  UpdateGestureRequest,
  UpdateScrollRequest,
  ProfilesSaveRequest,
  SettingsSaveRequest,
  WindowResizeRequest
} from '../shared/ipc';

export type PingResponse = { ok: true };

const api = {
  ping: async (): Promise<PingResponse> => ipcRenderer.invoke(Channels.Ping),
  getDeviceStatus: async () => ipcRenderer.invoke(Channels.GetDeviceStatus),
  discoverDevices: async () => ipcRenderer.invoke(Channels.DeviceDiscover),
  connectDevice: async (req: DeviceConnectRequest) => ipcRenderer.invoke(Channels.DeviceConnect, req),
  disconnectDevice: async () => ipcRenderer.invoke(Channels.DeviceDisconnect),
  setDpi: async (req: SetDPIRequest) => ipcRenderer.invoke(Channels.SetDPI, req),
  updateButtons: async (req: UpdateButtonsRequest) => ipcRenderer.invoke(Channels.UpdateButtons, req),
  updateGesture: async (req: UpdateGestureRequest) => ipcRenderer.invoke(Channels.UpdateGesture, req),
  updateScroll: async (req: UpdateScrollRequest) => ipcRenderer.invoke(Channels.UpdateScroll, req),
  listProfiles: async () => ipcRenderer.invoke(Channels.ProfilesList),
  saveProfiles: async (req: ProfilesSaveRequest) => ipcRenderer.invoke(Channels.ProfilesSave, req),
  getSettings: async () => ipcRenderer.invoke(Channels.SettingsGet),
  saveSettings: async (req: SettingsSaveRequest) => ipcRenderer.invoke(Channels.SettingsSave, req),
  resizeWindow: async (req: WindowResizeRequest) => ipcRenderer.invoke(Channels.WindowResize, req)
};

contextBridge.exposeInMainWorld('mxc', api);

declare global {
  interface Window {
    mxc: typeof api;
  }
}


