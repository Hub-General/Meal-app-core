import { Prisma } from "../generated/prisma";
export declare const tasteProfileService: {
    getTasteProfileByUserId: (userId: number) => Promise<{
        updatedAt: Date;
        userId: number;
        metrics: Prisma.JsonValue;
        calendarYear: number;
        totalMealsSelected: number;
        personalityType: string | null;
        favoriteProtein: string | null;
    }[]>;
    getTasteProfiles: (year?: number) => Promise<{
        updatedAt: Date;
        userId: number;
        metrics: Prisma.JsonValue;
        calendarYear: number;
        totalMealsSelected: number;
        personalityType: string | null;
        favoriteProtein: string | null;
    }[]>;
    getYearlySubmittedSelectionsByUser: (userId: number, calendarYear: number) => Promise<{
        dayMeal: {
            meal: {
                id: number;
                foodCode: string;
                calories: number | null;
            };
        };
    }[]>;
    updateUserTasteProfile: (userId: number, calendarYear?: number) => Promise<{
        updatedAt: Date;
        userId: number;
        metrics: Prisma.JsonValue;
        calendarYear: number;
        totalMealsSelected: number;
        personalityType: string | null;
        favoriteProtein: string | null;
    }>;
    updateUsersTasteProfiles: (userIds: number[], calendarYear?: number) => Promise<{
        updatedAt: Date;
        userId: number;
        metrics: Prisma.JsonValue;
        calendarYear: number;
        totalMealsSelected: number;
        personalityType: string | null;
        favoriteProtein: string | null;
    }[]>;
    updateWeeklySubmittersTasteProfiles: (weekNumber: number, calendarYear?: number) => Promise<{
        updatedAt: Date;
        userId: number;
        metrics: Prisma.JsonValue;
        calendarYear: number;
        totalMealsSelected: number;
        personalityType: string | null;
        favoriteProtein: string | null;
    }[]>;
    updateActiveUsersTasteProfiles: (calendarYear?: number) => Promise<{
        updatedAt: Date;
        userId: number;
        metrics: Prisma.JsonValue;
        calendarYear: number;
        totalMealsSelected: number;
        personalityType: string | null;
        favoriteProtein: string | null;
    }[]>;
};
//# sourceMappingURL=tasteProfileService.d.ts.map