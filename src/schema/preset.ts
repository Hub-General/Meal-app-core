import z from "zod";

export const presetSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    userId: z.number().int().positive(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const createPresetRequestSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    menuId: z.number(),
    userId: z.number().int().positive(),
});

export const presetItemSchema = z.object({
    id: z.number().int().positive(),
    presetId: z.number().int().positive(),
    menuDayId: z.number().int().positive(),
    dayMealId: z.number().int().positive(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const createPresetItemDataRequestSchema = z.object({
    menuDayId: z.number().int().positive(),
    dayMealId: z.number().int().positive(),
});

export type Preset = z.infer<typeof presetSchema>;
export type CreatePresetRequest = z.infer<typeof createPresetRequestSchema>;
export type PresetItem = z.infer<typeof presetItemSchema>;
export type CreatePresetItemDataRequest = z.infer<typeof createPresetItemDataRequestSchema>;