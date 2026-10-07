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
        ...preferences,
        userId,
        dislikes: preferences.dislikes ?? { meals: [], foodItems: [] },
        excludedMealIds: excludedMeals ?? [],
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
  getUserExcludedMeals: async (userId: number): Promise<number[]> => {
    const pref = await prisma.userPreferences.findUnique({
      where: { userId },
      select: { excludedMealIds: true },
    });
    return (pref?.excludedMealIds as number[]) ?? [];
  },

  /**
   * Returns rich details about why meals are excluded for a user (banned vs disliked ingredients).
   */
  getUserExcludedMealDetails: async (userId: number) => {
    const pref = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    const meals = await prisma.meals.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        foodCode: true,
        imagePath: true,
        calories: true,
      },
      orderBy: { name: "asc" },
    });

    if (!pref || !pref.dislikes) {
      return {
        userId,
        excludedMealIds: [],
        excludedMeals: [],
        totalExcluded: 0,
      };
    }

    const { getExcludedMealDetails } = await import("../helpers/mealPreferencesHelpers");
    const excludedMeals = getExcludedMealDetails(meals, pref.dislikes as any);

    return {
      userId,
      excludedMealIds: excludedMeals.map((m) => m.id),
      excludedMeals,
      totalExcluded: excludedMeals.length,
    };
  },

  /**
   * Recalculates and updates excludedMealIds across all users based on current meal food codes.
   */
  recalculateAllUserPreferences: async () => {
    const [allMeals, allPreferences] = await Promise.all([
      prisma.meals.findMany({
        select: { id: true, foodCode: true },
      }),
      prisma.userPreferences.findMany({
        select: { userId: true, dislikes: true },
      }),
    ]);

    const chunkSize = 20;
    const results = [];
    for (let i = 0; i < allPreferences.length; i += chunkSize) {
      const chunk = allPreferences.slice(i, i + chunkSize);
      const updates = chunk.map((pref) => {
        const excludedMealIds = getExcludedMeals(allMeals, (pref.dislikes as any) ?? {});
        return prisma.userPreferences.update({
          where: { userId: pref.userId },
          data: { excludedMealIds },
        });
      });
      const chunkResults = await prisma.$transaction(updates, {
        timeout: 30000,
        maxWait: 10000,
      });
      results.push(...chunkResults);
    }

    return results;
  },
};
