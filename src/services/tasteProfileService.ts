import { prisma } from "../db/prisma";
import { Prisma, SelectionStatus, Status } from "../generated/prisma";
import { tasteProfileHelper } from "../helpers/tasteProfileMetrics";

const tasteProfileSelectionShape = {
    dayMeal: {
        select: {
            meal: {
                select: {
                    id: true,
                    calories: true,
                    foodCode: true,
                }
            }
        }
    },
} as const;

export const tasteProfileService = {

    //Simple Taste Profile Operations
    getTasteProfileByUserId: async (userId: number) => {
        return await prisma.tasteProfile.findMany({
            where: {userId},
            orderBy: {calendarYear: "desc"}
        });
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
    getYearlySubmittedSelectionsByUser: async(userId: number, calendarYear: number) => {
        return await prisma.selections.findMany({
            where: {
                createdFor: userId,
                selectionStatus: SelectionStatus.SUBMITTED,
                weekMenuSchedule: {
                    year: calendarYear
                }
            },
            select: tasteProfileSelectionShape
        });
    },

    updateUserTasteProfile: async(userId: number, calendarYear: number = new Date().getFullYear())=>{
        const selections = await tasteProfileService.getYearlySubmittedSelectionsByUser(userId, calendarYear);
        const profile = tasteProfileHelper.generateProfile(selections);
        const profileMetrics = profile.metrics as unknown as Prisma.InputJsonValue;

        return await prisma.tasteProfile.upsert({
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
    },

    updateUsersTasteProfiles: async(userIds: number[], calendarYear: number = new Date().getFullYear())=>{
        return await Promise.all(
            userIds.map(userId => tasteProfileService.updateUserTasteProfile(userId, calendarYear))
        );
    },

    updateWeeklySubmittersTasteProfiles: async(weekNumber: number, calendarYear: number = new Date().getFullYear())=>{
        const submittedUsers = await prisma.selections.findMany({
            where: {
                createdFor: {not: null},
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

    updateActiveUsersTasteProfiles: async(calendarYear: number = new Date().getFullYear())=>{
        const users = await prisma.users.findMany({
            where: {status: Status.ACTIVE},
            select: {id: true}
        });

        return await tasteProfileService.updateUsersTasteProfiles(
            users.map(user => user.id),
            calendarYear
        );
    },
    
}
