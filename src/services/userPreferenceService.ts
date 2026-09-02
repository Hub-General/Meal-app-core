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

    // Compatibility aliases
    updateUserDietaryPreference: async (userId: number, preferences: createUserPreferencesRequest) => {
        return await userPreferenceService.updateUserDietaryPreferences(userId, preferences);
    },

    updateUserPreference: async (userId: number, preferences: updateUserPreferencesRequest) => {
        return await userPreferenceService.updateUserAppPreferences(userId, preferences);
    }
};