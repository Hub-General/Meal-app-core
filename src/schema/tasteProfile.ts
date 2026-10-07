import z from "zod";
import { Days } from "../generated/prisma";

export const tasteProfileSchema = z.object({
    userId: z.number().int().positive(),
    calendarYear: z.number().int().min(2000),
    totalMealsSelected: z.number().int().min(0),
    metrics: z.string(),
    personalityType: z.string().optional(),
    updatedAt: z.date(),
});

export interface TasteProfileMetrics {
    supergroups: Record<string, number>;
    bases: Record<string, number>;
    variations: Record<string, number>;
    proteins: Record<string, number>; 
    accompaniments: Record<string, number>;
    modifiers: Record<string, number>;
    preparations: Record<string, number>;
    meals: Record<string, number>;
    combinations: Record<string, number>;

    uniqueMeals: number;
    repeatedMeals: number;
    totalCalories: number;
    averageCalories: number;

    diversityScore: number;
    consistencyScore: number;

    favouriteMealId?: number;
    favouriteDay?: Days;
    favoriteBase?: string;
    favoriteSupergroup?: string;
    favoriteAccompaniment?: string;
    swallowCount?: number;
    swallowRatio?: number;

    dislikes?: {
        supergroups?: string[];
        bases?: string[];
        variations?: string[];
        proteins?: string[];
        accompaniments?: string[];
        modifiers?: string[];
        preparations?: string[];
        flavours?: string[];
        foodItems?: string[];
        meals?: number[];
    };
}

export type TasteProfile = z.infer<typeof tasteProfileSchema>;
