import { Days } from "../generated/prisma";
import z from "zod";


// Export zod schemas
export const createMenuRequestSchema = z.object({
   title: z.string().min(1).max(100),
   description: z.string().optional(),
   isActive: z.boolean().optional()
});

export const updateMenuRequestSchema = z.object({
   title: z.string().min(1).max(100).optional(),
   description: z.string().optional(),
   isActive: z.boolean().optional(),
   order: z.number().int().optional()
});

export const createMenuDayMealsRequestSchema = z.object({
    menuDayId: z.number(),
    meals: z.array(z.number())
});

export const updateMenuDayMealRequestSchema = z.object({
    isActive: z.boolean()
});

export const getMenuMealsRequestSchema = z.object({
    id: z.coerce.number().int().positive(),
    userId: z.coerce.number().int().positive().optional()
});

// Export interfaces / types

export interface Menu {
    id: number;
    title: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
}

export type CreateMenuRequest = z.infer<typeof createMenuRequestSchema>;
export type UpdateMenuRequest = z.infer<typeof updateMenuRequestSchema>;
export type CreateMenuDayMealsRequest = z.infer<typeof createMenuDayMealsRequestSchema>;