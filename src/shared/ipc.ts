import { z } from 'zod';

// A-01: Channel naming and base schema utilities
export const Channels = {
  Ping: 'mxc/v1/ping' as const
};

export const PingResponseSchema = z.object({ ok: z.literal(true) });
export type PingResponse = z.infer<typeof PingResponseSchema>;


