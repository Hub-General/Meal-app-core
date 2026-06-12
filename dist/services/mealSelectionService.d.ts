import { CreateMealSelectionRequest } from "../interfaces/mealSelection";
export declare const mealSelectionService: {
    getAllSelections: () => Promise<{
        id: number;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
            };
            day: never;
        };
        user: {
            id: number;
            firstName: never;
            lastName: never;
        };
    }[]>;
    getSelectionsByFilter: (filter: {
        userId?: number;
        mealId?: number;
        day?: string;
        menuId?: number;
    }) => Promise<{
        id: number;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
            };
            day: never;
        };
        user: {
            id: number;
            firstName: never;
            lastName: never;
        };
    }[]>;
    getSelectionsByDateRange: (startDate: Date, endDate: Date) => Promise<{
        id: number;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
            };
            day: never;
        };
        user: {
            id: number;
            firstName: never;
            lastName: never;
        };
    }[]>;
    getSelectionsByMealId: (mealId: number) => Promise<{
        id: number;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
            };
            day: never;
        };
        user: {
            id: number;
            firstName: never;
            lastName: never;
        };
    }[]>;
    getSelectionsByDay: (day: string) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDayId: number;
        dayMealId: number;
        weekMenuScheduleId: number;
        userId: number;
    }[]>;
    getSelectionsByMenuId: (menuId: number) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDayId: number;
        dayMealId: number;
        weekMenuScheduleId: number;
        userId: number;
    }[]>;
    getSelectionById: (selectionId: number) => Promise<{
        id: number;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
            };
            day: never;
        };
        user: {
            id: number;
            firstName: never;
            lastName: never;
        };
    } | null>;
    getSelectionsByUserId: (userId: number) => Promise<{
        id: number;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
            };
            day: never;
        };
        user: {
            id: number;
            firstName: never;
            lastName: never;
        };
    }[]>;
    createSelection: (selectionData: CreateMealSelectionRequest) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDayId: number;
        dayMealId: number;
        weekMenuScheduleId: number;
        userId: number;
    }>;
    createSelectionsBatch: (selectionDataArray: CreateMealSelectionRequest[]) => Promise<import("../generated/prisma").Prisma.BatchPayload>;
    updateSelection: (selectionId: number, selectionData: CreateMealSelectionRequest) => Promise<{
        id: number;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
            };
            day: never;
        };
        user: {
            id: number;
            firstName: never;
            lastName: never;
        };
    }>;
    updateSelectionsBatch: (selectionsData: {
        id: number;
        data: CreateMealSelectionRequest;
    }[]) => Promise<{
        id: number;
        dayMeal: {
            id: number;
            meal: {
                name: string;
                id: number;
            };
            day: never;
        };
        user: {
            id: number;
            firstName: never;
            lastName: never;
        };
    }[]>;
};
//# sourceMappingURL=mealSelectionService.d.ts.map