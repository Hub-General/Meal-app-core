import { z } from "zod";

export type UserDislikes = {
    meals: number[];
    foodItems: string[];
};

export interface ExcludedMealIds {
    Ids: number[]
}

export interface UserPreference {
    userId: number
    dislikes: UserDislikes
    excludedMealIds: ExcludedMealIds
}


export const createUserPreferencesSchema = z.object({
    dislikes: z.object({
        meals: z.array(z.number().int().positive()),
        foodItems: z.array(z.string())
    }).optional(),
});


export type createUserPreferencesRequest = z.infer<typeof createUserPreferencesSchema>;