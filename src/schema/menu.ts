import { Days } from "../generated/prisma";
import z from "zod";


// Export zod schemas
export const createMenuRequestSchema = z.object({
   title: z.string().min(1).max(100),
   description: z.string().optional(),
   isActive: z.boolean().optional()
});

export const createMenuDayMealsRequestSchema = z.object({
    menuDayId: z.number(),
    meals: z.array(z.number())
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
export type CreateMenuDayMealsRequest = z.infer<typeof createMenuDayMealsRequestSchema>;