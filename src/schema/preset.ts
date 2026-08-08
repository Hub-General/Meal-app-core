import z from "zod";
import { Days } from "../generated/prisma";

export const presetSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    userId: z.number().int().positive(),
    createdAt: z.date(),
    updatedAt: z.date(),
    isDefault: z.boolean(),
});

export const GetUserPresetsRequestSchema = z.object({
    id: z.coerce.number(),
    menuId: z.coerce.number().optional()
})

export const createPresetRequestSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    isDefault: z.boolean().optional(),
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


export interface PresetItem {
    id: number;
    presetId: number;
    menuDayId: number;
    menuDay:{
        day: Days
    }
    dayMealId: number;
    menuDayMeals:{
        meal:{
            id: number
            name:string
            foodCode: string
            calories: number | null
            imagePath: string | null
            isActive: boolean
        }
    }
}

export type Preset = z.infer<typeof presetSchema>;
export type CreatePresetRequest = z.infer<typeof createPresetRequestSchema>;
export type CreatePresetItemDataRequest = z.infer<typeof createPresetItemDataRequestSchema>;