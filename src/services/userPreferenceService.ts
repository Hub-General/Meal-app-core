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
    emailNotifications: true,
    pushNotifications: true,
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
                excludedMealIds: excludedMeals,
                theme: DEFAULT_USER_PREFERENCES.theme,
                autoSubmitPreset: DEFAULT_USER_PREFERENCES.autoSubmitPreset,
                announcementVersion: DEFAULT_USER_PREFERENCES.announcementVersion,
                emailNotifications: DEFAULT_USER_PREFERENCES.emailNotifications,
                pushNotifications: DEFAULT_USER_PREFERENCES.pushNotifications,
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
                emailNotifications: true,
                pushNotifications: true,
                updatedAt: true,
            }
        });
        return preference ?? {
            userId,
            theme: "LIGHT",
            autoSubmitPreset: false,
            announcementVersion: 0,
            emailNotifications: true,
            pushNotifications: true,
        };
    },

    updateUserAppPreferences: async (userId: number, preferences: UpdateUserAppPreferencesRequest) => {
        return await prisma.userPreferences.upsert({
            where: { userId },
            create: {
                userId,
                dislikes: { meals: [], foodItems: [] },
                excludedMealIds: [],
                emailNotifications: DEFAULT_USER_PREFERENCES.emailNotifications,
                pushNotifications: DEFAULT_USER_PREFERENCES.pushNotifications,
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
                announcementVersion,
                emailNotifications: DEFAULT_USER_PREFERENCES.emailNotifications,
                pushNotifications: DEFAULT_USER_PREFERENCES.pushNotifications,
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
            userId,
            dislikes: { meals: [], foodItems: [] },
            excludedMealIds: [],
            theme: "LIGHT",
            autoSubmitPreset: false,
            announcementVersion: 0,
            emailNotifications: true,
            pushNotifications: true,
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

    updateUserPreference: async (userId: number, preferences: updateUserPreferencesRequest) => {
        let excludedMeals: number[] | undefined;

        if (preferences.dislikes) {
            const meals = await prisma.meals.findMany({
                select: {
                    id: true,
                    foodCode: true
                }
            });
            excludedMeals = getExcludedMeals(meals, preferences.dislikes);
        }

        const updateData: Record<string, any> = {};
        if (preferences.dislikes) {
            updateData.dislikes = preferences.dislikes;
            updateData.excludedMealIds = excludedMeals;
        }
        if (preferences.theme !== undefined) {
            updateData.theme = preferences.theme;
        }
        if (preferences.autoSubmitPreset !== undefined) {
            updateData.autoSubmitPreset = preferences.autoSubmitPreset;
        }
        if (preferences.announcementVersion !== undefined) {
            updateData.announcementVersion = preferences.announcementVersion;
        }
        if (preferences.emailNotifications !== undefined) {
            updateData.emailNotifications = preferences.emailNotifications;
        }
        if (preferences.pushNotifications !== undefined) {
            updateData.pushNotifications = preferences.pushNotifications;
        }

        return await prisma.userPreferences.upsert({
            where: { userId },
            create: {
                userId,
                dislikes: preferences.dislikes ?? { meals: [], foodItems: [] },
                excludedMealIds: excludedMeals ?? [],
                theme: preferences.theme ?? "LIGHT",
                autoSubmitPreset: preferences.autoSubmitPreset ?? false,
                announcementVersion: preferences.announcementVersion ?? 0,
                emailNotifications: preferences.emailNotifications ?? true,
                pushNotifications: preferences.pushNotifications ?? true,
            },
            update: updateData
        });
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
                emailNotifications: DEFAULT_USER_PREFERENCES.emailNotifications,
                pushNotifications: DEFAULT_USER_PREFERENCES.pushNotifications,
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
    }
};
