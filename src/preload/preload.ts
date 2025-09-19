import { contextBridge, ipcRenderer } from 'electron';
import { Channels, SetDPIRequest } from '@shared/ipc';

export type PingResponse = { ok: true };

const api = {
  ping: async (): Promise<PingResponse> => ipcRenderer.invoke(Channels.Ping),
  getDeviceStatus: async () => ipcRenderer.invoke(Channels.GetDeviceStatus),
  setDpi: async (req: SetDPIRequest) => ipcRenderer.invoke(Channels.SetDPI, req)
};

contextBridge.exposeInMainWorld('mxc', api);

declare global {
  interface Window {
    mxc: typeof api;
  }
}


