import { z } from 'zod';
import { ButtonsMappingSchema, DPISettingsSchema, ScrollingSettingsSchema, GestureConfigSchema, ProfileSchema, SettingsSchema } from './schemas';

// A-01: Channel naming and schemas
export const Channels = {
  Ping: 'mxc/v1/ping' as const,
  GetDeviceStatus: 'mxc/v1/device/get-status' as const,
  SetDPI: 'mxc/v1/pointer/set-dpi' as const,
  UpdateButtons: 'mxc/v1/mouse/update-buttons' as const,
  UpdateGesture: 'mxc/v1/mouse/update-gesture' as const,
  UpdateScroll: 'mxc/v1/scrolling/update' as const,
  ProfilesList: 'mxc/v1/profiles/list' as const,
  ProfilesSave: 'mxc/v1/profiles/save' as const,
  SettingsGet: 'mxc/v1/settings/get' as const,
  SettingsSave: 'mxc/v1/settings/save' as const
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

export const UpdateButtonsRequestSchema = ButtonsMappingSchema;
export type UpdateButtonsRequest = z.infer<typeof UpdateButtonsRequestSchema>;
export const UpdateButtonsResponseSchema = z.object({ success: z.boolean() });
export type UpdateButtonsResponse = z.infer<typeof UpdateButtonsResponseSchema>;

export const UpdateGestureRequestSchema = GestureConfigSchema;
export type UpdateGestureRequest = z.infer<typeof UpdateGestureRequestSchema>;
export const UpdateGestureResponseSchema = z.object({ success: z.boolean() });
export type UpdateGestureResponse = z.infer<typeof UpdateGestureResponseSchema>;

export const UpdateScrollRequestSchema = ScrollingSettingsSchema;
export type UpdateScrollRequest = z.infer<typeof UpdateScrollRequestSchema>;
export const UpdateScrollResponseSchema = z.object({ success: z.boolean() });
export type UpdateScrollResponse = z.infer<typeof UpdateScrollResponseSchema>;

export const ProfilesListResponseSchema = z.array(ProfileSchema);
export type ProfilesListResponse = z.infer<typeof ProfilesListResponseSchema>;
export const ProfilesSaveRequestSchema = z.array(ProfileSchema);
export type ProfilesSaveRequest = z.infer<typeof ProfilesSaveRequestSchema>;
export const ProfilesSaveResponseSchema = z.object({ success: z.boolean() });
export type ProfilesSaveResponse = z.infer<typeof ProfilesSaveResponseSchema>;

export const SettingsGetResponseSchema = SettingsSchema;
export type SettingsGetResponse = z.infer<typeof SettingsGetResponseSchema>;
export const SettingsSaveRequestSchema = SettingsSchema;
export type SettingsSaveRequest = z.infer<typeof SettingsSaveRequestSchema>;
export const SettingsSaveResponseSchema = z.object({ success: z.boolean() });
export type SettingsSaveResponse = z.infer<typeof SettingsSaveResponseSchema>;


