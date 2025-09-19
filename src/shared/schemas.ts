import { z } from 'zod';

export const ButtonSimpleActionSchema = z.union([
  z.literal('middle-click'),
  z.literal('copy'),
  z.literal('paste'),
  z.literal('app-switcher'),
  z.literal('mission-control'),
  z.literal('play-pause'),
  z.literal('back'),
  z.literal('forward'),
  z.literal('undo'),
  z.literal('redo'),
  z.literal('desktop-left'),
  z.literal('desktop-right'),
  z.literal('show-desktop'),
  z.literal('next-track'),
  z.literal('prev-track'),
  z.object({ type: z.literal('keystroke'), value: z.string().min(1) })
]);

export const GestureDirectionSchema = z.enum(['up', 'down', 'left', 'right']);

export const GestureConfigSchema = z.object({
  mode: z.enum(['single', 'gestures']),
  sensitivity: z.number().int().min(1).max(10),
  singleAction: ButtonSimpleActionSchema.optional(),
  actions: z.record(GestureDirectionSchema, ButtonSimpleActionSchema).partial().optional()
});

export const HorizontalFunctionSchema = z.enum([
  'horizontal-scroll',
  'volume',
  'zoom',
  'tab-navigation',
  'timeline',
  'brush-size',
  'page-navigation'
]);

export const DPISettingsSchema = z.object({
  value: z.number().int().min(200).max(4000).refine((v) => v % 50 === 0, 'DPI must be multiple of 50'),
  acceleration: z.boolean(),
  precision: z.boolean()
});

export const ButtonsMappingSchema = z.object({
  middle: ButtonSimpleActionSchema,
  back: ButtonSimpleActionSchema,
  forward: ButtonSimpleActionSchema,
  gesture: GestureConfigSchema
});

export const ScrollingSettingsSchema = z.object({
  vertical: z.object({
    direction: z.enum(['standard', 'natural']),
    speed: z.number().int().min(1).max(10),
    smooth: z.boolean(),
    lines: z.number().int().min(1).max(10)
  }),
  horizontal: z.object({
    function: HorizontalFunctionSchema,
    sensitivity: z.number().int().min(1).max(10),
    direction: z.enum(['standard', 'natural'])
  })
});

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  deviceId: z.string().min(1),
  settings: z.object({
    dpi: DPISettingsSchema,
    buttons: ButtonsMappingSchema,
    scrolling: ScrollingSettingsSchema
  })
});

export const SettingsSchema = z.object({
  defaultProfileId: z.string().uuid().nullable().default(null),
  autostart: z.boolean().default(false),
  startMinimized: z.boolean().default(false)
});

export type ProfileDto = z.infer<typeof ProfileSchema>;
export type SettingsDto = z.infer<typeof SettingsSchema>;


