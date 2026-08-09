import { CreateMealRequest, UpdateMealRequest } from "../schema/meal";
export declare const mealService: {
    createMeal: (mealData: CreateMealRequest) => Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        imagePath: string | null;
        isActive: boolean;
        foodCode: string;
        calories: number | null;
    }>;
    createMealBatch: (mealData: CreateMealRequest[]) => Promise<import("../generated/prisma").Prisma.BatchPayload>;
    getAllMeals: (userId?: number) => Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        imagePath: string | null;
        isActive: boolean;
        foodCode: string;
        calories: number | null;
    }[]>;
    getMealById: (mealId: number) => Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        imagePath: string | null;
        isActive: boolean;
        foodCode: string;
        calories: number | null;
    } | null>;
    getMealByFoodCode: (foodCode: string) => Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        imagePath: string | null;
        isActive: boolean;
        foodCode: string;
        calories: number | null;
    } | null>;
    updateMeal: (mealId: number, mealData: UpdateMealRequest) => Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        imagePath: string | null;
        isActive: boolean;
        foodCode: string;
        calories: number | null;
    }>;
    deleteMeal: (mealId: number) => Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        imagePath: string | null;
        isActive: boolean;
        foodCode: string;
        calories: number | null;
    }>;
};
//# sourceMappingURL=mealService.d.ts.map