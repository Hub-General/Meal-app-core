import z from "zod";
import { Days, SelectionStatus } from "../generated/prisma";

export const SelectionType = ["MEAL", "UNAVAILABLE", "HOLIDAY"] as const;
export type SelectionType = (typeof SelectionType)[number];

// Export zod schemas
export const createMealSelectionRequestSchema = z.object({
    id: z.number().optional(), 
    dayMealId: z.number().nullable().optional(),
    selectionType: z.enum(SelectionType).optional().default("MEAL"),
    createdFor: z.number().int().positive().nullable(),
    guestCount: z.number().int().positive().optional(),
    weekMenuScheduleId: z.number(),
    menuDayId: z.number()
}).superRefine((selection, context) => {
    if (selection.selectionType === "MEAL" && (!selection.dayMealId || selection.dayMealId <= 0)) {
        context.addIssue({
            code: "custom",
            path: ["dayMealId"],
            message: "A meal selection requires a valid dayMealId"
        });
    }

    if (selection.createdFor === null && selection.guestCount === undefined) {
        context.addIssue({
            code: "custom",
            path: ["guestCount"],
            message: "Guest selections require a guest count"
        });
    }

    if (selection.createdFor !== null && selection.guestCount !== undefined) {
        context.addIssue({
            code: "custom",
            path: ["guestCount"],
            message: "Guest count is only valid for guest selections"
        });
    }
});


export const getUsersWithoutSelectionsRequestSchema = z.object({
    date: z.coerce.date(),
    maxSelections: z.coerce.number().int().positive().default(5)
});

export const mealSelectionFilterSchema = z.object({
    createdBy: z.coerce.number().optional(),
    createdFor: z.coerce.number().optional(),
    week: z.coerce.number().optional(),
    mealId: z.coerce.number().optional(),
    day: z.enum(Days).optional(),
    menuId: z.coerce.number().optional()
});

export const createMealSelectionBatchRequestSchema = z.array(createMealSelectionRequestSchema);

export const updateMealSelectionRequestSchema =
    createMealSelectionRequestSchema.safeExtend({
        id: z.number().int().positive()
    });

export const updateMealSelectionsBatchRequestSchema =
    z.array(updateMealSelectionRequestSchema);

export const submitWeeklySelectionsRequestSchema = z.object({
    weekNumber: z.number().int().min(1).max(53),
    year: z.number().int().min(2000).max(2100),
    status: z.enum(SelectionStatus)
});

export const submitSelectionsRequestSchema = z.object({
    selectionIds: z.array(z.number().int().positive()),
    status: z.enum(SelectionStatus)
});

export const replaceWeeklyMealRequestSchema = z.object({
    weekNumber: z.number().int().min(1).max(53),
    year: z.number().int().min(2000).max(2100),
    unavailableDayMealId: z.number().int().positive(),
    replacementDayMealId: z.number().int().positive()
}).refine(
    request => request.unavailableDayMealId !== request.replacementDayMealId,
    { message: "The replacement meal must be different from the unavailable meal" }
);

export const replaceWeeklyMealsBatchRequestSchema = z.object({
    weekNumber: z.number().int().min(1).max(53),
    year: z.number().int().min(2000).max(2100),
    replacements: z.array(z.object({
        unavailableDayMealId: z.number().int().positive(),
        replacementDayMealId: z.number().int().positive()
    }).refine(
        replacement => replacement.unavailableDayMealId !== replacement.replacementDayMealId,
        { message: "The replacement meal must be different from the unavailable meal" }
    )).min(1)
});

export const weeklyHistoryFilterSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(20),
    startWeek: z.coerce.number().int().min(1).max(53).optional(),
    fromWeek: z.coerce.number().int().min(1).max(53).optional(),
    startYear: z.coerce.number().int().min(2000).max(2100).optional(),
    fromYear: z.coerce.number().int().min(2000).max(2100).optional(),
    endWeek: z.coerce.number().int().min(1).max(53).optional(),
    toWeek: z.coerce.number().int().min(1).max(53).optional(),
    endYear: z.coerce.number().int().min(2000).max(2100).optional(),
    toYear: z.coerce.number().int().min(2000).max(2100).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    order: z.enum(["asc", "desc"]).default("desc"),
    userId: z.coerce.number().int().positive().optional()
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
            imagePath: string | null;
            calories: number | null;
            foodCode: string;
        }
    } | null;
    createdByUser: {
        id: number;
        name: string;
    };
    createdForUser: {
        id: number | null;
        name: string | null;
    } | null;
    guestCount: number;
    selectionStatus: SelectionStatus;
    selectionType?: SelectionType;
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
    imagePath: string | null
    calories: number | null
    foodCode: string
    count: number
    users:{
        id: number | null
        name:string
        createdForName: string | null
        createdByName: string | null
        isGuest: boolean
        quantity: number
    }[]
}

export interface HistoryPagination {
    page: number;
    limit: number;
    totalWeeks: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface WeeklyHistoryReportItem {
    weekMenuScheduleId: number;
    week: number;
    year: number;
    menu: {
        id: number;
        title: string;
    };
    status: string;
    totalResponses: number;
    selections: WeekMealSelectionResponse;
}

export interface WeeklyHistoryReportResponse {
    pagination: HistoryPagination;
    data: WeeklyHistoryReportItem[];
}

export interface UserWeeklyMealSelectionItem {
    id: number;
    selectionType: SelectionType | string;
    mealName: string;
    mealID: number | null;
    mealImagePath: string | null;
    foodCode: string | null;
    calories: number | null;
}

export interface UserWeeklySelectionDetails {
    createdById: number | null;
    createdBy: string | null;
    createdForId: number | null;
    createdFor: string | null;
    selectionStatus: SelectionStatus | string | null;
    mealSelections: Record<string, unknown>;
}

export interface UserWeeklyHistoryItem {
    weekMenuScheduleId: number;
    week: number;
    year: number;
    menu: {
        id: number;
        title: string;
    };
    status: string;
    selection: UserWeeklySelectionDetails;
}

export interface UserWeeklyHistoryResponse {
    pagination: HistoryPagination;
    data: UserWeeklyHistoryItem[];
}

export type CreateMealSelectionRequest = z.infer<typeof createMealSelectionRequestSchema>;
export type MealSelectionFilter = z.infer<typeof mealSelectionFilterSchema>;
export type CreateMealSelectionBatchRequest = z.infer<typeof createMealSelectionBatchRequestSchema>;
export type UpdateMealSelectionRequest = z.infer<typeof updateMealSelectionRequestSchema>;
export type UpdateMealSelectionsBatchRequest = z.infer<typeof updateMealSelectionsBatchRequestSchema>;
export type SubmitWeeklySelectionsRequest = z.infer<typeof submitWeeklySelectionsRequestSchema>;
export type SubmitSelectionsRequest = z.infer<typeof submitSelectionsRequestSchema>;
export type ReplaceWeeklyMealRequest = z.infer<typeof replaceWeeklyMealRequestSchema>;
export type ReplaceWeeklyMealsBatchRequest = z.infer<typeof replaceWeeklyMealsBatchRequestSchema>;
export type WeeklyHistoryFilter = z.infer<typeof weeklyHistoryFilterSchema>;