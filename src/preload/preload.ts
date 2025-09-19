import { contextBridge, ipcRenderer } from 'electron';

export type PingResponse = { ok: true };

const api = {
  ping: async (): Promise<PingResponse> => ipcRenderer.invoke('mxc/v1/ping')
};

contextBridge.exposeInMainWorld('mxc', api);

declare global {
  interface Window {
    mxc: typeof api;
  }
}


