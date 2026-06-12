import { CreateMealRequest } from "../interfaces/meal";
export declare const mealService: {
    createMeal: (mealData: CreateMealRequest) => Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        image: string | null;
        isActive: boolean;
        foodCode: string;
        calories: number | null;
    }>;
    getAllMeals: () => Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        image: string | null;
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
        image: string | null;
        isActive: boolean;
        foodCode: string;
        calories: number | null;
    } | null>;
    updateMeal: (mealId: number, mealData: CreateMealRequest) => Promise<{
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        image: string | null;
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
        image: string | null;
        isActive: boolean;
        foodCode: string;
        calories: number | null;
    }>;
};
//# sourceMappingURL=mealService.d.ts.map