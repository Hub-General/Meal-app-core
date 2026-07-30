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
    proteins: Record<string, number>; 
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

    dislikes?: {
        proteins?: string[];
        preparations?: string[];
        supergroups?: string[];
        flavours?: string[];
        meals?: number[];
    };
}

export type TasteProfile = z.infer<typeof tasteProfileSchema>;
