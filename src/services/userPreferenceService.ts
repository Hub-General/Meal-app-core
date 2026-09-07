import { prisma } from "../db/prisma";
import { getExcludedMeals } from "../helpers/mealPreferencesHelpers";
import { 
    UpdateUserDietaryPreferencesRequest, 
    UpdateUserAppPreferencesRequest, 
    createUserPreferencesRequest, 
    updateUserPreferencesRequest, 
    UserDislikes, 
    UserPreference 
} from "../schema/userPreference";

export const DEFAULT_USER_PREFERENCES = {
    dislikes: { meals: [] as number[], foodItems: [] as string[] },
    excludedMealIds: [] as number[],
    announcementVersion: 0,
    theme: "LIGHT" as const,
    autoSubmitPreset: false,
};

export const userPreferenceService = {
    // Dietary Preferences
    getUserDietaryPreferences: async (userId: number) => {
        const preference = await prisma.userPreferences.findUnique({
            where: { userId },
            select: {
                userId: true,
                dislikes: true,
                excludedMealIds: true,
            }
        });
        return preference ?? {
            userId,
            dislikes: { meals: [], foodItems: [] },
            excludedMealIds: []
        };
    },

    updateUserDietaryPreferences: async (userId: number, preferences: UpdateUserDietaryPreferencesRequest) => {
        let excludedMeals: number[] = [];
        if (preferences.dislikes) {
            const meals = await prisma.meals.findMany({
                select: {
                    id: true,
                    foodCode: true
                }
            });
            excludedMeals = getExcludedMeals(meals, preferences.dislikes);
        }

        return await prisma.userPreferences.upsert({
            where: { userId },
            create: {
                userId,
                dislikes: preferences.dislikes ?? { meals: [], foodItems: [] },
                excludedMealIds: excludedMeals
            },
            update: {
                dislikes: preferences.dislikes ?? { meals: [], foodItems: [] },
                excludedMealIds: excludedMeals
            }
        });
    },

    // App Preferences
    getUserAppPreferences: async (userId: number) => {
        const preference = await prisma.userPreferences.findUnique({
            where: { userId },
            select: {
                userId: true,
                theme: true,
                autoSubmitPreset: true,
                announcementVersion: true,
                updatedAt: true,
            }
        });
        return preference ?? {
            userId,
            theme: "LIGHT",
            autoSubmitPreset: false,
            announcementVersion: 0
        };
    },

    updateUserAppPreferences: async (userId: number, preferences: UpdateUserAppPreferencesRequest) => {
        return await prisma.userPreferences.upsert({
            where: { userId },
            create: {
                userId,
                dislikes: { meals: [], foodItems: [] },
                excludedMealIds: [],
                ...preferences
            },
            update: {
                ...preferences
            }
        });
    },

    patchUserAnnouncementVersion: async (userId: number, announcementVersion: number) => {
        return await prisma.userPreferences.upsert({
            where: { userId },
            create: {
                userId,
                dislikes: { meals: [], foodItems: [] },
                excludedMealIds: [],
                announcementVersion
            },
            update: {
                announcementVersion
            }
        });
    },

    // Combined / General Preferences
    getUserPreference: async (userId: number) => {
        const preference = await prisma.userPreferences.findUnique({
            where: { userId }
        });
        return preference ?? {
            userId: null,
            dislikes: null,
            excludedMealIds: null
        };
    },

    getUserExcludedMeals: async (userId: number) => {
        const meals = await prisma.userPreferences.findUnique({
            where: { userId },
            select: {
                excludedMealIds: true
            }
        });
        return (meals?.excludedMealIds as number[]) ?? [];
    },

    // Backfill empty preferences for users missing a record without overriding existing ones
    backfillMissingUserPreferences: async () => {
        const usersWithoutPreferences = await prisma.users.findMany({
            where: {
                preferences: null,
            },
            select: {
                id: true,
            },
        });

        if (usersWithoutPreferences.length === 0) {
            return { totalChecked: 0, backfilledCount: 0 };
        }

        const result = await prisma.userPreferences.createMany({
            data: usersWithoutPreferences.map((u) => ({
                userId: u.id,
                dislikes: DEFAULT_USER_PREFERENCES.dislikes,
                excludedMealIds: DEFAULT_USER_PREFERENCES.excludedMealIds,
                announcementVersion: DEFAULT_USER_PREFERENCES.announcementVersion,
                theme: DEFAULT_USER_PREFERENCES.theme,
                autoSubmitPreset: DEFAULT_USER_PREFERENCES.autoSubmitPreset,
            })),
            skipDuplicates: true,
        });

        return {
            totalChecked: usersWithoutPreferences.length,
            backfilledCount: result.count,
        };
    },

    // Compatibility aliases
    updateUserDietaryPreference: async (userId: number, preferences: createUserPreferencesRequest) => {
        return await userPreferenceService.updateUserDietaryPreferences(userId, preferences);
    },

    updateUserPreference: async (userId: number, preferences: updateUserPreferencesRequest) => {
        return await userPreferenceService.updateUserAppPreferences(userId, preferences);
    }
};
