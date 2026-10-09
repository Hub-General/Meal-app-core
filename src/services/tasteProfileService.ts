import { prisma } from "../db/prisma";
import { Prisma, SelectionStatus } from "../generated/prisma";
import { tasteProfileHelper } from "../helpers/tasteProfileMetrics";

const tasteProfileSelectionShape = {
    dayMeal: {
        select: {
            meal: {
                select: {
                    id: true,
                    name: true,
                    calories: true,
                    foodCode: true,
                }
            }
        }
    },
} as const;

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
    // addUserDislikes: async(userId:number, calendarYear: number, data: any)=>{
    //     return await prisma.tasteProfile.upsert({
    //         where:{
    //             userId: userId,
    //             calendarYear: calendarYear,
    //         },
    //     })
    // },

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
