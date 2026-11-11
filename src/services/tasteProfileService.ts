import { prisma } from "../db/prisma";
import { FoodGroup, Prisma, SelectionStatus } from "../generated/prisma";
import { tasteProfileHelper } from "../helpers/tasteProfileMetrics";
import { buildTasteProfileRecap } from "../helpers/tasteProfileRecap";

const tasteProfileSelectionShape = {
    dayMeal: {
        select: {
            meal: {
                select: {
                    id: true,
                    name: true,
                    foodCode: true,
                    imagePath: true,
                }
            }
        }
    },
} as const;

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
let cachedProteinNameMap: Map<string, string> | null = null;
let cachedProteinMapExpiresAt = 0;

async function getProteinNameMap(): Promise<Map<string, string>> {
    const now = Date.now();
    if (cachedProteinNameMap && now < cachedProteinMapExpiresAt) {
        return cachedProteinNameMap;
    }
    const items = await prisma.foodLibrary.findMany({
        where: { foodGroup: FoodGroup.PROTEIN },
        select: { foodCode: true, name: true },
    });
    cachedProteinNameMap = new Map(
        items.map((item) => [item.foodCode.trim().toUpperCase(), item.name])
    );
    cachedProteinMapExpiresAt = now + ONE_WEEK_MS;
    return cachedProteinNameMap;
}

type TasteProfileSelection = Parameters<typeof tasteProfileHelper.generateProfile>[0][number];

function createTasteProfileUpsert(userId: number, calendarYear: number, selections: TasteProfileSelection[]) {
    const profile = tasteProfileHelper.generateProfile(selections);
    const profileMetrics = profile.metrics as unknown as Prisma.InputJsonValue;

    return prisma.tasteProfile.upsert({
        where: {
            userId_calendarYear: {
                userId,
                calendarYear,
            }
        },
        update: {
            totalMealsSelected: profile.totalMealsSelected,
            metrics: profileMetrics,
            favoriteProtein: profile.favorites.favoriteProtein,
            personalityType: profile.personalityType,
        },
        create: {
            userId,
            calendarYear,
            totalMealsSelected: profile.totalMealsSelected,
            metrics: profileMetrics,
            favoriteProtein: profile.favorites.favoriteProtein,
            personalityType: profile.personalityType,
        }
    });
}

export const tasteProfileService = {

    //Simple Taste Profile Operations
    getTasteProfileByUserId: async (userId: number, calendarYear: number = new Date().getFullYear()) => {
        let profiles = await prisma.tasteProfile.findMany({
            where: { userId },
            orderBy: { calendarYear: "desc" }
        });

        if (profiles.length === 0) {
            const emptyProfile = await tasteProfileService.updateUserTasteProfile(userId, calendarYear);
            profiles = [emptyProfile];
        }

        return profiles;
    },

    getTasteProfiles: async (year?: number)=>{
        return await prisma.tasteProfile.findMany({
            where: {calendarYear: year},
            orderBy: {calendarYear: "desc"}
        });
    },

    /**
     * Generates a Spotify-Wrapped-style Meal Recap for a user in a single DB trip
     * from the `taste_profiles` table for the target calendar year.
     */
    getUserTasteProfileRecap: async (userId: number, requestedYear?: number) => {
        const targetYear = requestedYear ?? new Date().getFullYear();

        const yearProfiles = await prisma.tasteProfile.findMany({
            where: { calendarYear: targetYear },
            select: {
                userId: true,
                calendarYear: true,
                totalMealsSelected: true,
                metrics: true,
                personalityType: true,
                favoriteProtein: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        const targetProfile = yearProfiles.find((p) => p.userId === userId);
        const missingImageMealIds = new Set<number>();
        if (targetProfile?.metrics && typeof targetProfile.metrics === "object") {
            const m = targetProfile.metrics as { topMeals?: Array<{ id?: number; imageUrl?: string | null }> };
            if (Array.isArray(m.topMeals)) {
                for (const tm of m.topMeals) {
                    if (tm.id && !tm.imageUrl) {
                        missingImageMealIds.add(tm.id);
                    }
                }
            }
        }

        const [meals, proteinNameMap] = await Promise.all([
            missingImageMealIds.size > 0
                ? prisma.meals.findMany({
                      where: { id: { in: Array.from(missingImageMealIds) } },
                      select: { id: true, imagePath: true },
                  })
                : Promise.resolve([]),
            getProteinNameMap(),
        ]);

        const mealImageMap = new Map<number, string | null>(
            meals.map((m) => [m.id, m.imagePath])
        );

        return buildTasteProfileRecap(
            userId,
            targetYear,
            yearProfiles,
            null,
            mealImageMap,
            proteinNameMap
        );
    },

    //Advanced Taste Profile Operations
    getYearlySubmittedSelectionsByUser: async (userId: number, calendarYear: number) => {
        const selections = await prisma.selections.findMany({
            where: {
                createdFor: userId,
                weekMenuSchedule: {
                    year: calendarYear
                }
            },
            select: {
                ...tasteProfileSelectionShape,
                selectionStatus: true,
            }
        });

        const submittedSelections = selections.filter(
            (selection) => selection.selectionStatus === SelectionStatus.SUBMITTED
        );
        return submittedSelections.length > 0 ? submittedSelections : selections;
    },

    updateUserTasteProfile: async (userId: number, calendarYear: number = new Date().getFullYear()) => {
        const selections = await tasteProfileService.getYearlySubmittedSelectionsByUser(userId, calendarYear);
        return createTasteProfileUpsert(userId, calendarYear, selections);
    },

    updateUsersTasteProfiles: async (userIds: number[], calendarYear: number = new Date().getFullYear()) => {
        const uniqueUserIds = [...new Set(userIds)];
        if (uniqueUserIds.length === 0) return [];

        const selections = await prisma.selections.findMany({
            where: {
                createdFor: { in: uniqueUserIds },
                weekMenuSchedule: { year: calendarYear },
            },
            select: {
                ...tasteProfileSelectionShape,
                createdFor: true,
                selectionStatus: true,
            },
        });

        const selectionsByUser = new Map<number, typeof selections>();
        for (const selection of selections) {
            if (selection.createdFor === null) continue;
            const userSelections = selectionsByUser.get(selection.createdFor) ?? [];
            userSelections.push(selection);
            selectionsByUser.set(selection.createdFor, userSelections);
        }

        const results = [];
        for (const userId of uniqueUserIds) {
            const userSelections = selectionsByUser.get(userId) ?? [];
            const submittedSelections = userSelections.filter(
                (selection) => selection.selectionStatus === SelectionStatus.SUBMITTED
            );
            const res = await createTasteProfileUpsert(
                userId,
                calendarYear,
                submittedSelections.length > 0 ? submittedSelections : userSelections
            );
            results.push(res);
        }

        return results;
    },

    updateWeeklySubmittersTasteProfiles: async (weekNumber: number, calendarYear: number = new Date().getFullYear()) => {
        const submittedUsers = await prisma.selections.findMany({
            where: {
                createdFor: { not: null },
                selectionStatus: SelectionStatus.SUBMITTED,
                weekMenuSchedule: {
                    week: weekNumber,
                    year: calendarYear,
                }
            },
            select: {
                createdFor: true,
            },
            distinct: ["createdFor"]
        });

        return await tasteProfileService.updateUsersTasteProfiles(
            submittedUsers
                .map(selection => selection.createdFor)
                .filter((userId): userId is number => userId !== null),
            calendarYear
        );
    },

    updateActiveUsersTasteProfiles: async (calendarYear: number = new Date().getFullYear()) => {
        const users = await prisma.users.findMany({
            select: { id: true }
        });

        const selectionUsers = await prisma.selections.findMany({
            where: { createdFor: { not: null } },
            select: { createdFor: true },
            distinct: ["createdFor"]
        });

        const allUserIds = Array.from(
            new Set([
                ...users.map(u => u.id),
                ...selectionUsers.map(s => s.createdFor).filter((id): id is number => id !== null)
            ])
        );

        return await tasteProfileService.updateUsersTasteProfiles(allUserIds, calendarYear);
    },
}
