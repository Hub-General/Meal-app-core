import { SelectionStatus } from "../generated/prisma";
import { CreateMealSelectionRequest, MealSelectionFilter, ReplaceWeeklyMealRequest, ReplaceWeeklyMealsBatchRequest, UpdateMealSelectionRequest } from "../schema/mealSelection";
export declare class SelectionConflictError extends Error {
    constructor(message: string);
}
export declare const mealSelectionService: {
    getAllSelections: (filter?: MealSelectionFilter) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDay: {
            id: number;
            day: import("../generated/prisma").$Enums.Days;
        };
        guestCount: number;
        weekMenuScheduleId: number;
        selectionStatus: import("../generated/prisma").$Enums.SelectionStatus;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
                imagePath: string | null;
                foodCode: string;
                calories: number | null;
            };
        };
        createdByUser: {
            name: string;
            id: number;
        };
        createdForUser: {
            name: string;
            id: number;
        } | null;
    }[]>;
    getSelectionsByIds: (ids: number[]) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDay: {
            id: number;
            day: import("../generated/prisma").$Enums.Days;
        };
        guestCount: number;
        weekMenuScheduleId: number;
        selectionStatus: import("../generated/prisma").$Enums.SelectionStatus;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
                imagePath: string | null;
                foodCode: string;
                calories: number | null;
            };
        };
        createdByUser: {
            name: string;
            id: number;
        };
        createdForUser: {
            name: string;
            id: number;
        } | null;
    }[]>;
    getSelectionsByDateRange: (startDate: Date, endDate: Date) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDay: {
            id: number;
            day: import("../generated/prisma").$Enums.Days;
        };
        guestCount: number;
        weekMenuScheduleId: number;
        selectionStatus: import("../generated/prisma").$Enums.SelectionStatus;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
                imagePath: string | null;
                foodCode: string;
                calories: number | null;
            };
        };
        createdByUser: {
            name: string;
            id: number;
        };
        createdForUser: {
            name: string;
            id: number;
        } | null;
    }[]>;
    getSelectionsByMealId: (mealId: number) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDay: {
            id: number;
            day: import("../generated/prisma").$Enums.Days;
        };
        guestCount: number;
        weekMenuScheduleId: number;
        selectionStatus: import("../generated/prisma").$Enums.SelectionStatus;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
                imagePath: string | null;
                foodCode: string;
                calories: number | null;
            };
        };
        createdByUser: {
            name: string;
            id: number;
        };
        createdForUser: {
            name: string;
            id: number;
        } | null;
    }[]>;
    getSelectionsByMenuId: (menuId: number) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDay: {
            id: number;
            day: import("../generated/prisma").$Enums.Days;
        };
        guestCount: number;
        weekMenuScheduleId: number;
        selectionStatus: import("../generated/prisma").$Enums.SelectionStatus;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
                imagePath: string | null;
                foodCode: string;
                calories: number | null;
            };
        };
        createdByUser: {
            name: string;
            id: number;
        };
        createdForUser: {
            name: string;
            id: number;
        } | null;
    }[]>;
    getSelectionById: (selectionId: number) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDay: {
            id: number;
            day: import("../generated/prisma").$Enums.Days;
        };
        guestCount: number;
        weekMenuScheduleId: number;
        selectionStatus: import("../generated/prisma").$Enums.SelectionStatus;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
                imagePath: string | null;
                foodCode: string;
                calories: number | null;
            };
        };
        createdByUser: {
            name: string;
            id: number;
        };
        createdForUser: {
            name: string;
            id: number;
        } | null;
    } | null>;
    getSelectionsByUserId: (userId: number) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDay: {
            id: number;
            day: import("../generated/prisma").$Enums.Days;
        };
        guestCount: number;
        weekMenuScheduleId: number;
        selectionStatus: import("../generated/prisma").$Enums.SelectionStatus;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
                imagePath: string | null;
                foodCode: string;
                calories: number | null;
            };
        };
        createdByUser: {
            name: string;
            id: number;
        };
        createdForUser: {
            name: string;
            id: number;
        } | null;
    }[]>;
    getSelectionsByCreatorId: (creatorId: number) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDay: {
            id: number;
            day: import("../generated/prisma").$Enums.Days;
        };
        guestCount: number;
        weekMenuScheduleId: number;
        selectionStatus: import("../generated/prisma").$Enums.SelectionStatus;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
                imagePath: string | null;
                foodCode: string;
                calories: number | null;
            };
        };
        createdByUser: {
            name: string;
            id: number;
        };
        createdForUser: {
            name: string;
            id: number;
        } | null;
    }[]>;
    getUsersWithoutSelections: (date: Date) => Promise<{
        name: string;
        id: number;
        email: string | null;
    }[]>;
    getWeeklySelections: (date: Date) => Promise<never[] | import("../schema/mealSelection").WeekMealSelectionResponse>;
    getWeeklySelectionsByUser: (date: Date, createdFor: number) => Promise<never[] | {
        createdBy: null;
        createdFor: null;
        selectionStatus: null;
        mealSelections: {};
        createdById?: undefined;
        createdForId?: undefined;
    } | {
        createdById: number | null;
        createdBy: string | null;
        createdForId: number | null;
        createdFor: string | null;
        selectionStatus: import("../generated/prisma").$Enums.SelectionStatus | null;
        mealSelections: Record<string, unknown>;
    }>;
    createSelection: (selectionData: CreateMealSelectionRequest, requesterId: number) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDay: {
            id: number;
            day: import("../generated/prisma").$Enums.Days;
        };
        guestCount: number;
        weekMenuScheduleId: number;
        selectionStatus: import("../generated/prisma").$Enums.SelectionStatus;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
                imagePath: string | null;
                foodCode: string;
                calories: number | null;
            };
        };
        createdByUser: {
            name: string;
            id: number;
        };
        createdForUser: {
            name: string;
            id: number;
        } | null;
    }>;
    submitSelections: (selectionRequests: CreateMealSelectionRequest[], requesterId: number) => Promise<{
        created: number;
        updated: number;
    }>;
    updateSelectionsBatch: (selectionsData: {
        id: number;
        data: CreateMealSelectionRequest;
    }[]) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDay: {
            id: number;
            day: import("../generated/prisma").$Enums.Days;
        };
        guestCount: number;
        weekMenuScheduleId: number;
        selectionStatus: import("../generated/prisma").$Enums.SelectionStatus;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
                imagePath: string | null;
                foodCode: string;
                calories: number | null;
            };
        };
        createdByUser: {
            name: string;
            id: number;
        };
        createdForUser: {
            name: string;
            id: number;
        } | null;
    }[]>;
    changeSelectionsStatus: (selectionIds: number[], status: SelectionStatus) => Promise<import("../generated/prisma").Prisma.BatchPayload>;
    changeWeeklySelectionsStatus: (weekNumber: number, year: number, status: SelectionStatus) => Promise<import("../generated/prisma").Prisma.BatchPayload | undefined>;
    replaceWeeklyMeal: (request: ReplaceWeeklyMealRequest) => Promise<{
        affectedSelections: number;
        affectedHeadcount: number;
    }>;
    replaceWeeklyMeals: (request: ReplaceWeeklyMealsBatchRequest) => Promise<{
        affectedSelections: number;
        affectedHeadcount: number;
    }>;
    adminOverrideSelections: (selections: UpdateMealSelectionRequest[], requesterId: number) => Promise<{
        updated: number;
    }>;
};
//# sourceMappingURL=mealSelectionService.d.ts.map