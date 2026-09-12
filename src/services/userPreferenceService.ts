import { prisma } from "../db/prisma";
import { getExcludedMeals } from "../helpers/mealPreferencesHelpers";
import {
  UpdateUserPreferencesRequest,
} from "../schema/userPreference";

export const userPreferenceService = {
  /**
   * Get preferences for a user. Returns null if none exist.
   */
  getUserPreference: async (userId: number) => {
    return prisma.userPreferences.findUnique({
      where: { userId },
    });
  },

  /**
   * Upsert preferences for a user. Accepts any optional partial fields.
   */
  updateUserPreference: async (
    userId: number,
    preferences: UpdateUserPreferencesRequest
  ) => {
    let excludedMeals: number[] | undefined;

    if (preferences.dislikes) {
      const meals = await prisma.meals.findMany({
        select: { id: true, foodCode: true },
      });
      excludedMeals = getExcludedMeals(meals, preferences.dislikes);
    }

    return prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        dislikes: preferences.dislikes ?? { meals: [], foodItems: [] },
        excludedMealIds: excludedMeals ?? [],
        ...preferences,
      },
      update: {
        ...preferences,
        ...(excludedMeals !== undefined ? { excludedMealIds: excludedMeals } : {}),
      },
    });
  },

  /**
   * Helper used by menu and meal services to filter dishes by dietary dislikes.
   */
  getUserExcludedMeals: async (userId: number) => {
    const pref = await prisma.userPreferences.findUnique({
      where: { userId },
      select: { excludedMealIds: true },
    });
    return (pref?.excludedMealIds as number[]) ?? [];
  },
};
