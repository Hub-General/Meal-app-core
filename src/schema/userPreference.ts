import { z } from "zod";
import { Theme } from "../generated/prisma";

export const userDislikesSchema = z.object({
  meals: z.array(z.number().int().positive()).optional().default([]),
  foodItems: z.array(z.string()).optional().default([]),
});

export type UserDislikes = {
  meals: number[];
  foodItems: string[];
};

export interface ExcludedMealIds {
  Ids: number[];
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