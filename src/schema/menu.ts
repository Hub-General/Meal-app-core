import { Days } from "../generated/prisma";
import z from "zod";


// Export zod schemas
export const createMenuRequestSchema = z.object({
   title: z.string().min(1).max(100),
   description: z.string().optional(),
   isActive: z.boolean().optional()
});

export const updateMenuRequestSchema = createMenuRequestSchema.partial().refine(
    (menu) => Object.keys(menu).length > 0,
    { message: "At least one menu field must be provided" }
);

export const createMenuDayMealsRequestSchema = z.object({
    menuDayId: z.number(),
    meals: z.array(z.number())
});

export const updateMenuDayMealRequestSchema = z.object({
    isActive: z.boolean()
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