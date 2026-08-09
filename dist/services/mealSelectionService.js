"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealSelectionService = exports.SelectionConflictError = void 0;
const prisma_1 = require("../db/prisma");
const dateFunctions_1 = require("../helpers/dateFunctions");
const mealSelectionHelpers_1 = require("../helpers/mealSelectionHelpers");
const validateSelectionUpdate_1 = require("../helpers/validateSelectionUpdate");
const weekMenuScheduleService_1 = require("./weekMenuScheduleService");
const emailService_1 = require("./emailService");
class SelectionConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = "SelectionConflictError";
    }
}
exports.SelectionConflictError = SelectionConflictError;
const selectionSelectShape = {
    id: true,
    guestCount: true,
    weekMenuScheduleId: true,
    selectionStatus: true,
    createdByUser: {
        select: {
            id: true,
            name: true,
        }
    },
    createdForUser: {
        select: {
            id: true,
            name: true,
        }
    },
    menuDay: {
        select: {
            id: true,
            day: true,
        }
    },
    dayMeal: {
        select: {
            id: true,
            meal: {
                select: {
                    id: true,
                    imagePath: true,
                    name: true,
                    calories: true,
                    foodCode: true,
                }
            }
        }
    },
    createdAt: true,
    updatedAt: true,
};
exports.mealSelectionService = {
    //GET Selections
    getAllSelections: async (filter) => {
        return await prisma_1.prisma.selections.findMany({
            where: filter,
            select: selectionSelectShape
        });
    },
    getSelectionsByIds: async (ids) => {
        return await prisma_1.prisma.selections.findMany({
            where: { id: { in: ids } },
            select: selectionSelectShape
        });
    },
    //Will remove this and add it to the filters
    getSelectionsByDateRange: async (startDate, endDate) => {
        return await prisma_1.prisma.selections.findMany({
            where: { createdAt: { gte: startDate, lte: endDate } },
            select: selectionSelectShape
        });
    },
    getSelectionsByMealId: async (mealId) => {
        return await prisma_1.prisma.selections.findMany({
            where: { dayMeal: { mealId } },
            select: selectionSelectShape
        });
    },
    getSelectionsByMenuId: async (menuId) => {
        return await prisma_1.prisma.selections.findMany({
            where: { menuDay: { menuId } },
            select: selectionSelectShape
        });
    },
    getSelectionById: async (selectionId) => {
        return await prisma_1.prisma.selections.findUnique({ where: { id: selectionId }, select: selectionSelectShape });
    },
    getSelectionsByUserId: async (userId) => {
        return await prisma_1.prisma.selections.findMany({ where: { createdFor: userId }, select: selectionSelectShape });
    },
    getSelectionsByCreatorId: async (creatorId) => {
        return await prisma_1.prisma.selections.findMany({ where: { createdBy: creatorId }, select: selectionSelectShape });
    },
    //GET Weekly Selections
    getUsersWithoutSelections: async (date) => {
        const weekInfo = (0, dateFunctions_1.getISOWeekInfo)(date);
        const weekMenuSchedule = await weekMenuScheduleService_1.weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({ week: weekInfo.week, year: weekInfo.year });
        if (!weekMenuSchedule)
            return [];
        const requiredSelectionCount = await prisma_1.prisma.menuDays.count({
            where: { menuId: weekMenuSchedule.menu.id }
        });
        if (requiredSelectionCount === 0)
            return [];
        const activeUsers = await prisma_1.prisma.users.findMany({
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
        return activeUsers
            .filter(user => user._count.createdForSelections < requiredSelectionCount)
            .map(({ _count, ...user }) => user);
    },
    getWeeklySelections: async (date) => {
        const weekInfo = (0, dateFunctions_1.getISOWeekInfo)(date);
        const weekMenuSchedule = await weekMenuScheduleService_1.weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({ week: weekInfo.week, year: weekInfo.year });
        if (!weekMenuSchedule)
            return [];
        const response = await prisma_1.prisma.selections.findMany({
            where: {
                weekMenuScheduleId: weekMenuSchedule.id
            },
            select: selectionSelectShape
        });
        return mealSelectionHelpers_1.selectionHelper.formatSelectionResponse(response);
    },
    getWeeklySelectionsByUser: async (date, createdFor) => {
        const weekInfo = (0, dateFunctions_1.getISOWeekInfo)(date);
        const weekMenuSchedule = await weekMenuScheduleService_1.weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({ week: weekInfo.week, year: weekInfo.year });
        if (!weekMenuSchedule)
            return [];
        const response = await prisma_1.prisma.selections.findMany({
            where: {
                weekMenuScheduleId: weekMenuSchedule.id,
                createdFor
            },
            select: selectionSelectShape
        });
        return mealSelectionHelpers_1.selectionHelper.formatUserSelectionsResponse(response);
    },
    //CREATE Selections
    createSelection: async (selectionData, requesterId) => {
        const { id, ...data } = selectionData;
        return await prisma_1.prisma.selections.create({
            data: {
                ...data,
                createdBy: requesterId,
                selectionStatus: "PENDING",
            },
            select: selectionSelectShape,
        });
    },
    submitSelections: async (selectionRequests, requesterId) => {
        if (!selectionRequests?.length) {
            throw new Error("At least one selection is required");
        }
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const newSelections = [];
            const updateSelections = [];
            // Separate creates from updates in one pass.
            for (const selection of selectionRequests) {
                if (selection.id === undefined) {
                    newSelections.push(selection);
                }
                else {
                    updateSelections.push(selection);
                }
            }
            const updateIds = updateSelections.map(selection => selection.id);
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
            const existingMap = new Map(existingSelections.map(selection => [
                selection.id,
                selection
            ]));
            const errors = (0, validateSelectionUpdate_1.validateSelectionUpdates)(updateSelections, requesterId, existingMap);
            if (errors.length > 0) {
                throw new validateSelectionUpdate_1.SelectionValidationError(errors);
            }
            if (newSelections.length > 0) {
                const recipientIds = newSelections
                    .map(selection => selection.createdFor)
                    .filter((createdFor) => createdFor !== null);
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
                            dayMealId: selection.dayMealId,
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
                const existing = existingMap.get(request.id);
                if (!existing) {
                    throw new validateSelectionUpdate_1.SelectionValidationError([
                        {
                            id: request.id,
                            reason: "NOT_FOUND"
                        }
                    ]);
                }
                const isCreatedForOwner = existing.createdFor === requesterId;
                /*
                * If the requester is the person the selection
                * belongs to, they are now the person submitting it.
                *
                * If requester is only createdBy, createdFor remains
                * untouched.
                */
                const updateData = {
                    dayMealId: request.dayMealId,
                    weekMenuScheduleId: request.weekMenuScheduleId,
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
                        id: request.id,
                        selectionStatus: "PENDING",
                        createdFor: requesterId
                    },
                    data: updateData
                });
                if (updateResult.count !== 1) {
                    throw new validateSelectionUpdate_1.SelectionValidationError([
                        {
                            id: request.id,
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
                .map(selection => selection.createdFor);
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
            void emailService_1.mailService.sendSelectionNotification(recipient.email ?? recipient.referenceEmail, recipient.name, "A meal was selected for you", "Someone selected a meal for you. You can review or replace it while it is pending.");
        }
        for (const creator of result.notifications) {
            void emailService_1.mailService.sendSelectionNotification(creator.to, creator.name, "Your meal selection was replaced", "The recipient replaced the pending meal selection you made for them.");
        }
        return { created: result.created, updated: result.updated };
    },
    // UPDATE Selections
    updateSelectionsBatch: async (selectionsData) => {
        const updateSelections = selectionsData.map(selection => prisma_1.prisma.selections.update({ where: { id: selection.id }, data: selection.data, select: selectionSelectShape }));
        return await Promise.all(updateSelections);
    },
    // SUBMIT selections
    changeSelectionsStatus: async (selectionIds, status) => {
        return await prisma_1.prisma.selections.updateMany({
            where: { id: { in: selectionIds } },
            data: { selectionStatus: status }
        });
    },
    changeWeeklySelectionsStatus: async (weekNumber, year, status) => {
        const weekMenuSchedule = await weekMenuScheduleService_1.weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({ week: weekNumber, year: year });
        if (!weekMenuSchedule)
            return;
        return await prisma_1.prisma.selections.updateMany({ where: { weekMenuScheduleId: weekMenuSchedule.id }, data: { selectionStatus: status } });
    },
    replaceWeeklyMeal: async (request) => {
        const schedule = await weekMenuScheduleService_1.weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({
            week: request.weekNumber,
            year: request.year
        });
        if (!schedule) {
            throw new SelectionConflictError("No menu is scheduled for the requested week");
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            const dayMeals = await tx.menuDayMeals.findMany({
                where: {
                    id: { in: [request.unavailableDayMealId, request.replacementDayMealId] },
                    isActive: true,
                    menuDay: { menuId: schedule.menu.id }
                },
                select: { id: true, menuDayId: true }
            });
            const [unavailableDayMeal, replacementDayMeal] = dayMeals;
            if (!unavailableDayMeal ||
                !replacementDayMeal ||
                unavailableDayMeal.menuDayId !== replacementDayMeal.menuDayId) {
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
    replaceWeeklyMeals: async (request) => {
        const schedule = await weekMenuScheduleService_1.weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({
            week: request.weekNumber,
            year: request.year
        });
        if (!schedule) {
            throw new SelectionConflictError("No menu is scheduled for the requested week");
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            const affectedSelectionIds = new Set();
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
                if (!unavailableDayMeal ||
                    !replacementDayMeal ||
                    unavailableDayMeal.menuDayId !== replacementDayMeal.menuDayId) {
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
    adminOverrideSelections: async (selections, requesterId) => {
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const existingSelections = await tx.selections.findMany({
                where: { id: { in: selections.map(selection => selection.id) } },
                select: {
                    id: true,
                    createdForUser: { select: { name: true, email: true, referenceEmail: true } }
                }
            });
            if (existingSelections.length !== selections.length) {
                throw new SelectionConflictError("One or more selections no longer exist");
            }
            for (const selection of selections) {
                await tx.selections.update({
                    where: { id: selection.id },
                    data: {
                        dayMealId: selection.dayMealId,
                        menuDayId: selection.menuDayId,
                        weekMenuScheduleId: selection.weekMenuScheduleId,
                        createdBy: requesterId
                    }
                });
            }
            return { updated: selections.length, existingSelections };
        });
        for (const selection of result.existingSelections) {
            const recipient = selection.createdForUser;
            if (!recipient)
                continue;
            void emailService_1.mailService.sendSelectionNotification(recipient.email ?? recipient.referenceEmail, recipient.name, "Your meal selection was updated", "An administrator updated a meal selection for you.");
        }
        return { updated: result.updated };
    }
};
//# sourceMappingURL=mealSelectionService.js.map