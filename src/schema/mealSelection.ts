import z from "zod";
import { Days, SelectionStatus } from "../generated/prisma";


// Export zod schemas
export const createMealSelectionRequestSchema = z.object({
    dayMealId: z.number(),
    createdBy: z.number(),
    createdFor: z.number(),
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

export const createMealSelectionBatchRequestSchema = z.array(createMealSelectionRequestSchema);

export const updateMealSelectionRequestSchema = createMealSelectionRequestSchema;

export const updateMealSelectionsBatchRequestSchema = z.array(z.object({
    id: z.number().int().positive(),
    data: createMealSelectionRequestSchema,
}));

export const submitWeeklySelectionsRequestSchema = z.object({
    weekNumber: z.number().int().min(1).max(53),
    year: z.number().int().min(2000).max(2100),
});

export const submitSelectionsRequestSchema = z.object({
    selectionIds: z.array(z.number().int().positive()),
});


// Export interfaces / types
export interface MealSelection {
    id: number;
    menuDay:{
        id:number,
        day: Days
    }
    dayMeal: {
        id: number;
        meal: {
            id: number;
            name: string;
            image: string | null;
            calories: number | null;
            foodCode: string;
        }
    };
    createdByUser: {
        id: number;
        name: string;
    };
    createdForUser: {
        id: number | null;
        name: string | null;
    } | null;
    selectionStatus: SelectionStatus

}

export interface WeekMealSelectionResponse {
    [day: string]: {
        total: number;
        response: DayMealSelections[];
    };
}

export interface DayMealSelections {
    id:number
    name: string
    imageUrl: string | null
    calories: number | null
    foodCode: string
    count: number
    users:{
        id: number | null
        name:string
    }[]
}

export type CreateMealSelectionRequest = z.infer<typeof createMealSelectionRequestSchema>;
export type MealSelectionFilter = z.infer<typeof mealSelectionFilterSchema>;
export type CreateMealSelectionBatchRequest = z.infer<typeof createMealSelectionBatchRequestSchema>;
export type UpdateMealSelectionRequest = z.infer<typeof updateMealSelectionRequestSchema>;
export type UpdateMealSelectionsBatchRequest = z.infer<typeof updateMealSelectionsBatchRequestSchema>;
export type SubmitWeeklySelectionsRequest = z.infer<typeof submitWeeklySelectionsRequestSchema>;
export type SubmitSelectionsRequest = z.infer<typeof submitSelectionsRequestSchema>;