import { z } from "zod";
import { Theme } from "../generated/prisma";

export const userDislikesSchema = z.object({
  meals: z.array(z.number().int().positive()).optional().default([]),
  foodItems: z.array(z.string()).optional().default([]),
  supergroups: z.array(z.string()).optional().default([]),
  bases: z.array(z.string()).optional().default([]),
  variations: z.array(z.string()).optional().default([]),
  proteins: z.array(z.string()).optional().default([]),
  accompaniments: z.array(z.string()).optional().default([]),
  modifiers: z.array(z.string()).optional().default([]),
  preparations: z.array(z.string()).optional().default([]),
});

export type UserDislikes = z.infer<typeof userDislikesSchema>;

export interface ExcludedMealIds {
  Ids: number[];
}

export interface ExcludedMealItem {
  id: number;
  name: string;
  foodCode: string;
  imagePath?: string | null;
  calories?: number | null;
  reason: "BANNED_MEAL" | "DISLIKED_INGREDIENT";
  matchedDislikes: string[];
}

export interface UserExcludedMealsResponse {
  userId: number;
  excludedMealIds: number[];
  excludedMeals: ExcludedMealItem[];
  totalExcluded: number;
}

export const updateUserPreferencesSchema = z.object({
  dislikes: userDislikesSchema.optional(),
  theme: z.enum(Theme).optional(),
  autoSubmitPreset: z.boolean().optional(),
  announcementVersion: z.number().int().nonnegative().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
});

export type UpdateUserPreferencesRequest = z.infer<
  typeof updateUserPreferencesSchema
>;
export type updateUserPreferencesRequest = UpdateUserPreferencesRequest;

export interface UserPreference {
  userId: number;
  dislikes: UserDislikes;
  excludedMealIds: number[] | ExcludedMealIds;
  theme: Theme;
  autoSubmitPreset: boolean;
  announcementVersion: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  updatedAt?: Date;
}
