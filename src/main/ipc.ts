import { ipcMain } from 'electron';
import { Channels, DeviceStatusSchema, PingResponseSchema, SetDPIRequestSchema, SetDPIResponseSchema } from '@shared/ipc';

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
}


