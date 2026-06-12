"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealSelectionService = void 0;
const prisma_1 = require("../db/prisma");
const selectionSelectShape = {
    id: true,
    user: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
        }
    },
    dayMeal: {
        select: {
            id: true,
            day: true,
            meal: {
                select: {
                    id: true,
                    name: true,
                }
            }
        }
    }
};
exports.mealSelectionService = {
    //GET Selections
    getAllSelections: async () => {
        return await prisma_1.prisma.selections.findMany({
            select: selectionSelectShape
        });
    },
    getSelectionsByFilter: async (filter) => {
        return await prisma_1.prisma.selections.findMany({
            where: filter,
            select: selectionSelectShape
        });
    },
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
    getSelectionsByDay: async (day) => {
        return await prisma_1.prisma.selections.findMany({
            where: { dayMeal: { day } },
            select: selectionSelectShape
        });
    },
    getSelectionsByMenuId: async (menuId) => {
        return await prisma_1.prisma.selections.findMany({
            where: { dayMeal: { menuId } },
            select: selectionSelectShape
        });
    },
    getSelectionById: async (selectionId) => {
        return await prisma_1.prisma.selections.findUnique({ where: { id: selectionId }, select: selectionSelectShape });
    },
    getSelectionsByUserId: async (userId) => {
        return await prisma_1.prisma.selections.findMany({ where: { userId }, select: selectionSelectShape });
    },
    //CREATE Selections
    createSelection: async (selectionData) => {
        return await prisma_1.prisma.selections.create({ data: selectionData, select: selectionSelectShape });
    },
    createSelectionsBatch: async (selectionDataArray) => {
        return await prisma_1.prisma.selections.createMany({ data: selectionDataArray });
    },
    // UPDATE Selections
    updateSelection: async (selectionId, selectionData) => {
        return await prisma_1.prisma.selections.update({ where: { id: selectionId }, data: selectionData, select: selectionSelectShape });
    },
    updateSelectionsBatch: async (selectionsData) => {
        const updateSelections = selectionsData.map(selection => prisma_1.prisma.selections.update({ where: { id: selection.id }, data: selection.data, select: selectionSelectShape }));
        return await Promise.all(updateSelections);
    },
};
//# sourceMappingURL=mealSelectionService.js.map