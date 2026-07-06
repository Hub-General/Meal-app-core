import z from "zod";
import { Days } from "../generated/prisma";


// Export zod schemas
export const createMealSelectionRequestSchema = z.object({
    dayMealId: z.number(),
    createdBy: z.number(),
    createdFor: z.number().optional(),
    weekMenuScheduleId: z.number(),
    menuDayId: z.number()
});

export const mealSelectionFilterSchema = z.object({
    createdBy: z.number().optional(),
    createdFor: z.number().optional(),
    week: z.number().optional(),
    mealId: z.number().optional(),
    day: z.enum(Days).optional(),
    menuId: z.number().optional()
});


// Export interfaces / types
export interface MealSelection {
    id: number;
    dayMeal: {
        id: number;
        day: string;
        meal: {
            id: number;
            name: string;
            image?: string;
        }
    };
    createdByUser: {
        id: number;
        name: string;
    };
    createdForUser: {
        id: number;
        name:string;
    }

}

export type CreateMealSelectionRequest = z.infer<typeof createMealSelectionRequestSchema>;
export type MealSelectionFilter = z.infer<typeof mealSelectionFilterSchema>;