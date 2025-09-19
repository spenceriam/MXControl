import { z } from 'zod';

// A-01: Channel naming and schemas
export const Channels = {
  Ping: 'mxc/v1/ping' as const,
  GetDeviceStatus: 'mxc/v1/device/get-status' as const,
  SetDPI: 'mxc/v1/pointer/set-dpi' as const
};

export const PingResponseSchema = z.object({ ok: z.literal(true) });
export type PingResponse = z.infer<typeof PingResponseSchema>;

export const DeviceStatusSchema = z.object({
  name: z.string(),
  serialRedacted: z.string(),
  connection: z.enum(['usb', 'receiver', 'bluetooth', 'unknown']),
  battery: z.object({ percentage: z.number().min(0).max(100), charging: z.boolean() }),
  connected: z.boolean()
});
export type DeviceStatusDto = z.infer<typeof DeviceStatusSchema>;

export const SetDPIRequestSchema = z.object({ value: z.number().int().min(200).max(4000).refine(v => v % 50 === 0, 'DPI must be multiple of 50') });
export type SetDPIRequest = z.infer<typeof SetDPIRequestSchema>;
export const SetDPIResponseSchema = z.object({ success: z.boolean() });
export type SetDPIResponse = z.infer<typeof SetDPIResponseSchema>;


