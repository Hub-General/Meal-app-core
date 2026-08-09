"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasteProfileService = void 0;
const prisma_1 = require("../db/prisma");
const prisma_2 = require("../generated/prisma");
const tasteProfileMetrics_1 = require("../helpers/tasteProfileMetrics");
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
};
exports.tasteProfileService = {
    //Simple Taste Profile Operations
    getTasteProfileByUserId: async (userId) => {
        return await prisma_1.prisma.tasteProfile.findMany({
            where: { userId },
            orderBy: { calendarYear: "desc" }
        });
    },
    getTasteProfiles: async (year) => {
        return await prisma_1.prisma.tasteProfile.findMany({
            where: { calendarYear: year },
            orderBy: { calendarYear: "desc" }
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
    getYearlySubmittedSelectionsByUser: async (userId, calendarYear) => {
        return await prisma_1.prisma.selections.findMany({
            where: {
                createdFor: userId,
                selectionStatus: prisma_2.SelectionStatus.SUBMITTED,
                weekMenuSchedule: {
                    year: calendarYear
                }
            },
            select: tasteProfileSelectionShape
        });
    },
    updateUserTasteProfile: async (userId, calendarYear = new Date().getFullYear()) => {
        const selections = await exports.tasteProfileService.getYearlySubmittedSelectionsByUser(userId, calendarYear);
        const profile = tasteProfileMetrics_1.tasteProfileHelper.generateProfile(selections);
        const profileMetrics = profile.metrics;
        return await prisma_1.prisma.tasteProfile.upsert({
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
    updateUsersTasteProfiles: async (userIds, calendarYear = new Date().getFullYear()) => {
        return await Promise.all(userIds.map(userId => exports.tasteProfileService.updateUserTasteProfile(userId, calendarYear)));
    },
    updateWeeklySubmittersTasteProfiles: async (weekNumber, calendarYear = new Date().getFullYear()) => {
        const submittedUsers = await prisma_1.prisma.selections.findMany({
            where: {
                createdFor: { not: null },
                selectionStatus: prisma_2.SelectionStatus.SUBMITTED,
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
        return await exports.tasteProfileService.updateUsersTasteProfiles(submittedUsers
            .map(selection => selection.createdFor)
            .filter((userId) => userId !== null), calendarYear);
    },
    updateActiveUsersTasteProfiles: async (calendarYear = new Date().getFullYear()) => {
        const users = await prisma_1.prisma.users.findMany({
            where: { status: prisma_2.Status.ACTIVE },
            select: { id: true }
        });
        return await exports.tasteProfileService.updateUsersTasteProfiles(users.map(user => user.id), calendarYear);
    },
};
//# sourceMappingURL=tasteProfileService.js.map