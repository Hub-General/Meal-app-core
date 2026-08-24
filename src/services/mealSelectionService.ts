import { prisma } from "../db/prisma";
import { SelectionStatus } from "../generated/prisma";
import { getISOWeekInfo, getISOWeekRange } from "../helpers/dateFunctions";
import { selectionHelper } from "../helpers/mealSelectionHelpers";
import { SelectionValidationError, validateSelectionUpdates } from "../helpers/validateSelectionUpdate";
import {
    CreateMealSelectionRequest,
    MealSelection,
    MealSelectionFilter,
    ReplaceWeeklyMealRequest,
    ReplaceWeeklyMealsBatchRequest,
    UpdateMealSelectionRequest,
    UserWeeklyHistoryResponse,
    WeeklyHistoryFilter,
    WeeklyHistoryReportResponse
} from "../schema/mealSelection";
import { weekMenuScheduleService } from "./weekMenuScheduleService";
import { mailService } from "./emailService";
import { holidayService } from "./holidayService";

export class SelectionConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SelectionConflictError";
    }
}

const selectionSelectShape = {
    id: true,
    guestCount: true,
    weekMenuScheduleId: true,
    selectionStatus: true,
    selectionType: true,
    createdByUser:{
        select: {
            id: true,
            name: true,
        }},
    createdForUser:{
        select: {
            id: true,
            name: true,
        }},
    menuDay:{
        select: {
            id: true,
            day: true,
        }},
    dayMeal:{
        select: {
            id: true,
            meal:{
                select: {
                    id: true,
                    imagePath:true,
                    name: true,
                    calories: true,
                    foodCode: true,
                }
            }
        }
    },
    createdAt: true,
    updatedAt: true,
}

export const mealSelectionService = {

    //GET Selections

    getAllSelections: async(filter?: MealSelectionFilter)=>{
        return await prisma.selections.findMany({
            where: filter,
            select: selectionSelectShape
        });
    },
    getSelectionsByIds: async(ids: number[])=>{
        return await prisma.selections.findMany({
            where: {id: {in: ids}},
            select: selectionSelectShape
        });
    },

    //Will remove this and add it to the filters
    getSelectionsByDateRange: async(startDate: Date, endDate: Date)=>{
        return await prisma.selections.findMany({
            where: {createdAt: {gte: startDate, lte: endDate}},
            select: selectionSelectShape
        });
    },

    getSelectionsByMealId: async(mealId: number)=>{
        return await prisma.selections.findMany({
            where: {dayMeal: {mealId}},
            select: selectionSelectShape
        });
    },
    getSelectionsByMenuId: async(menuId: number)=>{
        return await prisma.selections.findMany({
            where: {menuDay: {menuId}},
            select: selectionSelectShape
        });
    },
    getSelectionById: async(selectionId: number)=>{
        return await prisma.selections.findUnique({where: {id: selectionId}, select: selectionSelectShape});
    },
    getSelectionsByUserId: async(userId: number)=>{
        return await prisma.selections.findMany({where: {createdFor: userId}, select: selectionSelectShape});
    },
    getSelectionsByCreatorId: async(creatorId: number)=>{
        return await prisma.selections.findMany({where: {createdBy: creatorId}, select: selectionSelectShape})
    },

    //GET Weekly Selections

    getUsersWithoutSelections: async(date: Date, maxCount: number = 5)=>{
        const weekInfo = getISOWeekInfo(date);
        const weekMenuSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({week: weekInfo.week, year: weekInfo.year});
        
        if(!weekMenuSchedule) return [];

        const { weekStart, weekEnd } = getISOWeekRange(date);
        const weekHolidays = await holidayService.getHolidaysForWeek(weekInfo.week, weekInfo.year);
        const holidayCount = weekHolidays.length;
        const effectiveRequiredCount = Math.max(0, maxCount - holidayCount);

        const activeUsers = await prisma.users.findMany({
            where: { status: "ACTIVE" },
            select: {
                id: true,
                name: true,
                email: true,
                _count: {
                    select: {
                        createdForSelections: {
                            where: { weekMenuScheduleId: weekMenuSchedule.id }
                        }
                    }
                }
            }
        });

        if (!activeUsers.length) return [];

        const userIds = activeUsers.map(user => user.id);

        const availabilityRecords = await prisma.userAvailability.findMany({
            where: {
                userId: { in: userIds },
                startDate: { lte: weekEnd },
                endDate: { gte: weekStart }
            }
        });

        const availabilityMap = new Map<number, number>();
        for (const record of availabilityRecords) {
            const start = record.startDate < weekStart ? weekStart : record.startDate;
            const end = record.endDate > weekEnd ? weekEnd : record.endDate;
            const diffTime = Math.max(0, end.getTime() - start.getTime());
            const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            availabilityMap.set(record.userId, (availabilityMap.get(record.userId) || 0) + days);
        }

        return activeUsers
            .filter(user => {
                const selectionCount = user._count.createdForSelections;
                const availabilityCount = availabilityMap.get(user.id) || 0;
                return (selectionCount + availabilityCount) < effectiveRequiredCount;
            })
            .map(({ _count, ...user }) => user);
    },

    getWeeklySelections: async(date: Date)=>{
        const weekInfo = getISOWeekInfo(date);
        const weekMenuSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({week: weekInfo.week, year: weekInfo.year});
        if(!weekMenuSchedule) return [];
        const response =  await prisma.selections.findMany({
            where: {
                weekMenuScheduleId: weekMenuSchedule.id
            },
            select: selectionSelectShape
        });
        return selectionHelper.formatSelectionResponse(response)
    },

    getWeeklySelectionsByUser: async(date: Date, createdFor: number)=>{
        const weekInfo = getISOWeekInfo(date);
        const weekMenuSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({week: weekInfo.week, year: weekInfo.year});
        if(!weekMenuSchedule) return [];
        const response =  await prisma.selections.findMany({
            where: {
                weekMenuScheduleId: weekMenuSchedule.id,
                createdFor
            },
            select: selectionSelectShape
        });
        return selectionHelper.formatUserSelectionsResponse(response)
    },


    //CREATE Selections

    createSelection: async (
            selectionData: CreateMealSelectionRequest,
            requesterId: number
        ) => {
            const { id, selectionType, ...data } = selectionData;

            return await prisma.selections.create({
                data: {
                    ...data,
                    dayMealId: data.dayMealId ?? null,
                    selectionType: selectionType ?? "MEAL",
                    createdBy: requesterId,
                    selectionStatus: "PENDING",
                },
                select: selectionSelectShape,
            });
        },


    submitSelections: async (
        selectionRequests: CreateMealSelectionRequest[],
        requesterId: number
    ) => {

        if (!selectionRequests?.length) {
            throw new Error("At least one selection is required");
        }

        const result = await prisma.$transaction(async (tx) => {

            const newSelections: CreateMealSelectionRequest[] = [];
            const updateSelections: CreateMealSelectionRequest[] = [];

            // Separate creates from updates in one pass.
            for (const selection of selectionRequests) {
                if (selection.id === undefined) {
                    newSelections.push(selection);
                } else {
                    updateSelections.push(selection);
                }
            }

            const updateIds = updateSelections.map(
                selection => selection.id!
            );

            const existingSelections = updateIds.length
                ? await tx.selections.findMany({
                    where: {
                        id: {
                            in: updateIds
                        }
                    },
                    select: {
                        id: true,
                        createdFor: true,
                        createdBy: true,
                        selectionStatus: true,
                        createdByUser: {
                            select: { name: true, email: true, referenceEmail: true }
                        }
                    }
                })
                : [];


            const existingMap = new Map(
                existingSelections.map(selection => [
                    selection.id,
                    selection
                ])
            );


            const errors = validateSelectionUpdates(
                updateSelections,
                requesterId,
                existingMap
            );

            if (errors.length > 0) {
                throw new SelectionValidationError(errors);
            }


            if (newSelections.length > 0) {

                const recipientIds = newSelections
                    .map(selection => selection.createdFor)
                    .filter((createdFor): createdFor is number => createdFor !== null);

                const recipients = recipientIds.length
                    ? await tx.users.findMany({
                        where: {
                            id: { in: recipientIds },
                            status: "ACTIVE"
                        },
                        select: { id: true }
                    })
                    : [];

                if (recipients.length !== new Set(recipientIds).size) {
                    throw new SelectionConflictError("One or more recipients are inactive or unavailable");
                }

                for (const selection of newSelections) {
                    const existingSelection = await tx.selections.findFirst({
                        where: {
                            createdFor: selection.createdFor,
                            weekMenuScheduleId: selection.weekMenuScheduleId,
                            menuDayId: selection.menuDayId
                        },
                        select: { id: true }
                    });

                    if (existingSelection) {
                        throw new SelectionConflictError("The recipient already has a selection for this day");
                    }

                    await tx.selections.create({
                        data: {
                            dayMealId: selection.dayMealId ?? null,
                            selectionType: selection.selectionType ?? "MEAL",
                            createdBy: requesterId,
                            createdFor: selection.createdFor,
                            guestCount: selection.guestCount ?? 1,
                            weekMenuScheduleId: selection.weekMenuScheduleId,
                            menuDayId: selection.menuDayId,
                            selectionStatus: "PENDING"
                        }
                    });
                }
            }


            for (const request of updateSelections) {

                const existing = existingMap.get(request.id!);

                if (!existing) {
                    throw new SelectionValidationError([
                        {
                            id: request.id!,
                            reason: "NOT_FOUND"
                        }
                    ]);
                }

                const isCreatedForOwner =
                    existing.createdFor === requesterId;

                /*
                * If the requester is the person the selection
                * belongs to, they are now the person submitting it.
                *
                * If requester is only createdBy, createdFor remains
                * untouched.
                */
                const updateData = {
                    dayMealId: request.dayMealId ?? null,
                    selectionType: request.selectionType ?? "MEAL",
                    weekMenuScheduleId:
                        request.weekMenuScheduleId,
                    menuDayId: request.menuDayId,

                    ...(isCreatedForOwner
                        ? {
                            createdBy: requesterId
                        }
                        : {})
                };

                /*
                * Re-check the important authorization conditions
                * inside the UPDATE itself.
                *
                * This protects against the row changing between
                * findMany() and update().
                */
                const updateResult = await tx.selections.updateMany({
                    where: {
                        id: request.id!,
                        selectionStatus: "PENDING",

                        createdFor: requesterId
                    },
                    data: updateData
                });

                if (updateResult.count !== 1) {
                    throw new SelectionValidationError([
                        {
                            id: request.id!,
                            reason: "NOT_AUTHORIZED"
                        }
                    ]);
                }
            }

            const notifications = existingSelections
                .filter(selection => selection.createdFor === requesterId && selection.createdBy !== requesterId)
                .map(selection => ({
                    to: selection.createdByUser.email ?? selection.createdByUser.referenceEmail,
                    name: selection.createdByUser.name
                }));

            const recipientNotifications = newSelections
                .filter(selection => selection.createdFor !== null && selection.createdFor !== requesterId)
                .map(selection => selection.createdFor!);

            const recipientsToNotify = recipientNotifications.length
                ? await tx.users.findMany({
                    where: { id: { in: [...new Set(recipientNotifications)] } },
                    select: { name: true, email: true, referenceEmail: true }
                })
                : [];

            return {
                created: newSelections.length,
                updated: updateSelections.length,
                notifications,
                recipientsToNotify
            };
        });

        for (const recipient of result.recipientsToNotify) {
            void mailService.sendSelectionNotification(
                recipient.email ?? recipient.referenceEmail,
                recipient.name,
                "A meal was selected for you",
                "Someone selected a meal for you. You can review or replace it while it is pending."
            );
        }

        for (const creator of result.notifications) {
            void mailService.sendSelectionNotification(
                creator.to,
                creator.name,
                "Your meal selection was replaced",
                "The recipient replaced the pending meal selection you made for them."
            );
        }

        return { created: result.created, updated: result.updated };
    },



    // UPDATE Selections
    
    updateSelectionsBatch: async(selectionsData: {id: number, data: CreateMealSelectionRequest}[])=>{
        const updateSelections = selectionsData.map(selection => {
            const { id, selectionType, ...data } = selection.data;
            return prisma.selections.update({
                where: { id: selection.id },
                data: {
                    ...data,
                    dayMealId: data.dayMealId ?? null,
                    selectionType: selectionType ?? "MEAL"
                },
                select: selectionSelectShape
            });
        });
        return await Promise.all(updateSelections);
    },

    // SUBMIT selections

    changeSelectionsStatus: async (selectionIds: number[], status: SelectionStatus )=>{
        return await prisma.selections.updateMany({
            where: {id: {in: selectionIds}},
            data: {selectionStatus: status}
        });
    },

    changeWeeklySelectionsStatus: async (weekNumber: number, year: number , status: SelectionStatus)=>{
        const weekMenuSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({week: weekNumber, year: year});
        if(!weekMenuSchedule) return;
        return await prisma.selections.updateMany({where:{weekMenuScheduleId: weekMenuSchedule.id}, data: {selectionStatus: status}})
    },

    replaceWeeklyMeal: async (request: ReplaceWeeklyMealRequest) => {
        const schedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({
            week: request.weekNumber,
            year: request.year
        });

        if (!schedule) {
            throw new SelectionConflictError("No menu is scheduled for the requested week");
        }

        return prisma.$transaction(async tx => {
            const dayMeals = await tx.menuDayMeals.findMany({
                where: {
                    id: { in: [request.unavailableDayMealId, request.replacementDayMealId] },
                    isActive: true,
                    menuDay: { menuId: schedule.menu.id }
                },
                select: { id: true, menuDayId: true }
            });

            const [unavailableDayMeal, replacementDayMeal] = dayMeals;
            if (
                !unavailableDayMeal ||
                !replacementDayMeal ||
                unavailableDayMeal.menuDayId !== replacementDayMeal.menuDayId
            ) {
                throw new SelectionConflictError("Replacement meals must be active options for the same scheduled menu day");
            }

            const affected = await tx.selections.findMany({
                where: {
                    weekMenuScheduleId: schedule.id,
                    dayMealId: request.unavailableDayMealId
                },
                select: { guestCount: true }
            });

            await tx.selections.updateMany({
                where: {
                    weekMenuScheduleId: schedule.id,
                    dayMealId: request.unavailableDayMealId
                },
                data: { dayMealId: request.replacementDayMealId }
            });

            return {
                affectedSelections: affected.length,
                affectedHeadcount: affected.reduce((total, selection) => total + selection.guestCount, 0)
            };
        });
    },

    replaceWeeklyMeals: async (request: ReplaceWeeklyMealsBatchRequest) => {
        const schedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({
            week: request.weekNumber,
            year: request.year
        });

        if (!schedule) {
            throw new SelectionConflictError("No menu is scheduled for the requested week");
        }

        return prisma.$transaction(async tx => {
            const affectedSelectionIds = new Set<number>();
            let affectedHeadcount = 0;

            for (const replacement of request.replacements) {
                const dayMeals = await tx.menuDayMeals.findMany({
                    where: {
                        id: { in: [replacement.unavailableDayMealId, replacement.replacementDayMealId] },
                        isActive: true,
                        menuDay: { menuId: schedule.menu.id }
                    },
                    select: { id: true, menuDayId: true }
                });

                const [unavailableDayMeal, replacementDayMeal] = dayMeals;
                if (
                    !unavailableDayMeal ||
                    !replacementDayMeal ||
                    unavailableDayMeal.menuDayId !== replacementDayMeal.menuDayId
                ) {
                    throw new SelectionConflictError("Each replacement must use active meals from the same scheduled menu day");
                }

                const affected = await tx.selections.findMany({
                    where: {
                        weekMenuScheduleId: schedule.id,
                        dayMealId: replacement.unavailableDayMealId
                    },
                    select: { id: true, guestCount: true }
                });

                await tx.selections.updateMany({
                    where: {
                        weekMenuScheduleId: schedule.id,
                        dayMealId: replacement.unavailableDayMealId
                    },
                    data: { dayMealId: replacement.replacementDayMealId }
                });

                for (const selection of affected) {
                    if (!affectedSelectionIds.has(selection.id)) {
                        affectedSelectionIds.add(selection.id);
                        affectedHeadcount += selection.guestCount;
                    }
                }
            }

            return {
                affectedSelections: affectedSelectionIds.size,
                affectedHeadcount
            };
        });
    },

    //ADMIN Services
    adminOverrideSelections: async(selections: CreateMealSelectionRequest[], requesterId: number)=>{
        const result = await prisma.$transaction(async (tx) => {
            const updatedUsersToNotify = new Set<number>();
            let updatedCount = 0;

            for (const selection of selections) {
                const dayMealId = selection.dayMealId ?? null;
                const selectionType = selection.selectionType ?? (dayMealId ? "MEAL" : "UNAVAILABLE");
                const guestCount = selection.guestCount ?? 1;

                if (selection.id) {
                    const updated = await tx.selections.update({
                        where: { id: selection.id },
                        data: {
                            dayMealId,
                            selectionType,
                            menuDayId: selection.menuDayId,
                            weekMenuScheduleId: selection.weekMenuScheduleId,
                            createdBy: requesterId,
                            guestCount,
                        },
                        select: { createdFor: true }
                    });
                    if (updated.createdFor && updated.createdFor !== requesterId) {
                        updatedUsersToNotify.add(updated.createdFor);
                    }
                    updatedCount++;
                } else if (selection.createdFor) {
                    const existing = await tx.selections.findFirst({
                        where: {
                            createdFor: selection.createdFor,
                            weekMenuScheduleId: selection.weekMenuScheduleId,
                            menuDayId: selection.menuDayId,
                        },
                        select: { id: true }
                    });

                    if (existing) {
                        await tx.selections.update({
                            where: { id: existing.id },
                            data: {
                                dayMealId,
                                selectionType,
                                createdBy: requesterId,
                                guestCount,
                            }
                        });
                    } else {
                        await tx.selections.create({
                            data: {
                                dayMealId,
                                selectionType,
                                createdBy: requesterId,
                                createdFor: selection.createdFor,
                                guestCount,
                                weekMenuScheduleId: selection.weekMenuScheduleId,
                                menuDayId: selection.menuDayId,
                                selectionStatus: "SUBMITTED"
                            }
                        });
                    }
                    if (selection.createdFor !== requesterId) {
                        updatedUsersToNotify.add(selection.createdFor);
                    }
                    updatedCount++;
                } else {
                    // Guest selection (createdFor is null)
                    await tx.selections.create({
                        data: {
                            dayMealId,
                            selectionType,
                            createdBy: requesterId,
                            createdFor: null,
                            guestCount,
                            weekMenuScheduleId: selection.weekMenuScheduleId,
                            menuDayId: selection.menuDayId,
                            selectionStatus: "SUBMITTED"
                        }
                    });
                    updatedCount++;
                }
            }

            const recipients = updatedUsersToNotify.size > 0
                ? await tx.users.findMany({
                    where: { id: { in: Array.from(updatedUsersToNotify) } },
                    select: { name: true, email: true, referenceEmail: true }
                })
                : [];

            return { updated: updatedCount, recipients };
        });

        for (const recipient of result.recipients) {
            void mailService.sendSelectionNotification(
                recipient.email ?? recipient.referenceEmail,
                recipient.name,
                "Your meal selection was updated",
                "An administrator updated a meal selection for you."
            );
        }

        return { updated: result.updated };
    },

    // HISTORY Services

    getWeeklySelectionsHistory: async (filter: WeeklyHistoryFilter = { page: 1, limit: 20, order: "desc" }): Promise<WeeklyHistoryReportResponse> => {
        const page = filter.page || 1;
        const limit = filter.limit || 20;
        const order = filter.order || "desc";
        const where = buildWeekMenuScheduleFilter(filter);

        const totalWeeks = await prisma.weekMenuSchedule.count({ where });
        const totalPages = Math.ceil(totalWeeks / limit) || 1;

        const schedules = await prisma.weekMenuSchedule.findMany({
            where,
            orderBy: [
                { year: order },
                { week: order }
            ],
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                week: true,
                year: true,
                status: true,
                menu: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        if (!schedules.length) {
            return {
                pagination: {
                    page,
                    limit,
                    totalWeeks,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                data: []
            };
        }

        const scheduleIds = schedules.map(s => s.id);
        const allSelections = await prisma.selections.findMany({
            where: {
                weekMenuScheduleId: { in: scheduleIds }
            },
            select: selectionSelectShape
        });

        const selectionsByScheduleId = new Map<number, MealSelection[]>();
        for (const selection of allSelections) {
            const list = selectionsByScheduleId.get(selection.weekMenuScheduleId) ?? [];
            list.push(selection);
            selectionsByScheduleId.set(selection.weekMenuScheduleId, list);
        }

        const data = schedules.map(schedule => {
            const weekSelections = selectionsByScheduleId.get(schedule.id) ?? [];
            const formatted = selectionHelper.formatSelectionResponse(weekSelections);
            const totalResponses = weekSelections.reduce((sum, sel) => sum + (sel.guestCount || 1), 0);
            return {
                weekMenuScheduleId: schedule.id,
                week: schedule.week,
                year: schedule.year,
                menu: schedule.menu,
                status: schedule.status,
                totalResponses,
                selections: formatted
            };
        });

        return {
            pagination: {
                page,
                limit,
                totalWeeks,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            data
        };
    },

    getUserWeeklySelectionsHistory: async (userId: number, filter: WeeklyHistoryFilter = { page: 1, limit: 20, order: "desc" }): Promise<UserWeeklyHistoryResponse> => {
        const page = filter.page || 1;
        const limit = filter.limit || 20;
        const order = filter.order || "desc";
        const baseWhere = buildWeekMenuScheduleFilter(filter);
        const where = {
            ...baseWhere,
            selections: {
                some: {
                    createdFor: userId
                }
            }
        };

        const totalWeeks = await prisma.weekMenuSchedule.count({ where });
        const totalPages = Math.ceil(totalWeeks / limit) || 1;

        const schedules = await prisma.weekMenuSchedule.findMany({
            where,
            orderBy: [
                { year: order },
                { week: order }
            ],
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                week: true,
                year: true,
                status: true,
                menu: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        if (!schedules.length) {
            return {
                pagination: {
                    page,
                    limit,
                    totalWeeks,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                data: []
            };
        }

        const scheduleIds = schedules.map(s => s.id);
        const allSelections = await prisma.selections.findMany({
            where: {
                weekMenuScheduleId: { in: scheduleIds },
                createdFor: userId
            },
            select: selectionSelectShape
        });

        const selectionsByScheduleId = new Map<number, MealSelection[]>();
        for (const selection of allSelections) {
            const list = selectionsByScheduleId.get(selection.weekMenuScheduleId) ?? [];
            list.push(selection);
            selectionsByScheduleId.set(selection.weekMenuScheduleId, list);
        }

        const data = schedules.map(schedule => {
            const weekSelections = selectionsByScheduleId.get(schedule.id) ?? [];
            const formatted = selectionHelper.formatUserSelectionsResponse(weekSelections);
            return {
                weekMenuScheduleId: schedule.id,
                week: schedule.week,
                year: schedule.year,
                menu: schedule.menu,
                status: schedule.status,
                selection: formatted
            };
        });

        return {
            pagination: {
                page,
                limit,
                totalWeeks,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            data
        };
    }
}

function buildWeekMenuScheduleFilter(filter: WeeklyHistoryFilter) {
    const startWeek = filter.startWeek ?? filter.fromWeek;
    const startYear = filter.startYear ?? filter.fromYear ?? (filter.year && startWeek !== undefined ? filter.year : undefined);
    const endWeek = filter.endWeek ?? filter.toWeek;
    const endYear = filter.endYear ?? filter.toYear ?? (filter.year && endWeek !== undefined ? filter.year : undefined);
    const singleYear = filter.year && !filter.startYear && !filter.fromYear && !filter.endYear && !filter.toYear ? filter.year : undefined;

    // Single year only, no week range specified
    if (singleYear && startWeek === undefined && endWeek === undefined) {
        return { year: singleYear };
    }

    // If both start and end boundaries are provided
    if (startYear !== undefined && endYear !== undefined) {
        const sWeek = startWeek ?? 1;
        const eWeek = endWeek ?? 53;

        if (startYear === endYear) {
            return {
                year: startYear,
                week: { gte: sWeek, lte: eWeek }
            };
        }

        if (startYear < endYear) {
            return {
                OR: [
                    { year: startYear, week: { gte: sWeek } },
                    { year: { gt: startYear, lt: endYear } },
                    { year: endYear, week: { lte: eWeek } }
                ]
            };
        }
    }

    // Only start boundary provided
    if (startYear !== undefined) {
        const sWeek = startWeek ?? 1;
        return {
            OR: [
                { year: startYear, week: { gte: sWeek } },
                { year: { gt: startYear } }
            ]
        };
    }

    // Only end boundary provided
    if (endYear !== undefined) {
        const eWeek = endWeek ?? 53;
        return {
            OR: [
                { year: endYear, week: { lte: eWeek } },
                { year: { lt: endYear } }
            ]
        };
    }

    // If only weeks are provided with a single year
    if (singleYear !== undefined) {
        const weekFilter: { gte?: number; lte?: number } = {};
        if (startWeek !== undefined) weekFilter.gte = startWeek;
        if (endWeek !== undefined) weekFilter.lte = endWeek;
        return {
            year: singleYear,
            ...(Object.keys(weekFilter).length > 0 ? { week: weekFilter } : {})
        };
    }

    return {};
}
