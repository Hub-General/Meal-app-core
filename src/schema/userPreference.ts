import { z } from "zod";
import { Theme } from "../generated/prisma";

// ==========================================
// Dietary Preferences
// ==========================================

export const userDislikesSchema = z.object({
    meals: z.array(z.number().int().positive()),
    foodItems: z.array(z.string())
});

export const updateUserDietaryPreferencesSchema = z.object({
    dislikes: userDislikesSchema.optional(),
});

export type UserDislikes = {
    meals: number[];
    foodItems: string[];
};

export interface ExcludedMealIds {
    Ids: number[];
}

export interface UserDietaryPreference {
    userId: number;
    dislikes: UserDislikes;
    excludedMealIds: number[];
}

export type UpdateUserDietaryPreferencesRequest = z.infer<typeof updateUserDietaryPreferencesSchema>;
// Backward-compatibility alias
export const createUserPreferencesSchema = updateUserDietaryPreferencesSchema;
export type createUserPreferencesRequest = UpdateUserDietaryPreferencesRequest;


// ==========================================
// App Preferences
// ==========================================

export const updateUserAppPreferencesSchema = z.object({
    theme: z.enum(Theme).optional(),
    autoSubmitPreset: z.boolean().optional(),
    announcementVersion: z.number().int().nonnegative().optional(),
});

export const updateUserAnnouncementVersionSchema = z.object({
    announcementVersion: z.number().int().nonnegative(),
});

export interface UserAppPreference {
    userId: number;
    theme: Theme;
    autoSubmitPreset: boolean;
    announcementVersion: number;
    updatedAt?: Date;
}

export type UpdateUserAppPreferencesRequest = z.infer<typeof updateUserAppPreferencesSchema>;
export type UpdateUserAnnouncementVersionRequest = z.infer<typeof updateUserAnnouncementVersionSchema>;

// Backward-compatibility alias
export const updateUserPreferencesSchema = updateUserAppPreferencesSchema;
export type updateUserPreferencesRequest = UpdateUserAppPreferencesRequest;
export type updateUserAnnouncementVersionRequest = UpdateUserAnnouncementVersionRequest;


// ==========================================
// Combined User Preferences
// ==========================================

export interface UserPreference {
    userId: number;
    dislikes: UserDislikes;
    excludedMealIds: number[] | ExcludedMealIds;
    theme?: Theme;
    autoSubmitPreset?: boolean;
    announcementVersion?: number;
    updatedAt?: Date;
}