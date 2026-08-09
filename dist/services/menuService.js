"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuServices = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const userPreferenceService_1 = require("./userPreferenceService");
const menuSelectionShape = {
    id: true,
    title: true,
    description: true,
    isActive: true,
    order: true
};
exports.menuServices = {
    //Simple Menu DTO operations
    createMenu: async (menuData) => {
        const menu = await client_1.default.menus.create({
            data: {
                ...menuData,
                menuDays: {
                    create: [
                        { day: "MONDAY" },
                        { day: "TUESDAY" },
                        { day: "WEDNESDAY" },
                        { day: "THURSDAY" },
                        { day: "FRIDAY" },
                    ],
                },
            },
            select: menuSelectionShape
        });
        return await client_1.default.menus.update({
            where: { id: menu.id },
            data: { order: menu.id },
            select: menuSelectionShape
        });
    },
    getAllMenus: async () => {
        return await client_1.default.menus.findMany({
            select: menuSelectionShape
        });
    },
    getMenuById: async (menuId) => {
        return await client_1.default.menus.findUnique({ where: { id: menuId }, select: menuSelectionShape });
    },
    updateMenu: async (menuId, menuData) => {
        return await client_1.default.menus.update({ where: { id: menuId }, data: menuData });
    },
    deleteMenu: async (menuId) => {
        return await client_1.default.menus.update({ where: { id: menuId }, data: { isActive: false } });
    },
    //Menu Meals Assignment
    getMenuMeals: async (menuId, userId) => {
        const excludedMealIds = userId
            ? await userPreferenceService_1.userPreferenceService.getUserExcludedMeals(userId)
            : [];
        return await client_1.default.menuDayMeals.findMany({
            where: {
                menuDay: { menuId },
                meal: { id: { notIn: excludedMealIds }
                }
            }, select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                isActive: true,
                menuDayId: true,
                meal: {
                    select: {
                        id: true,
                        imagePath: true,
                        name: true,
                        description: true,
                        foodCode: true,
                        calories: true
                    }
                }
            }
        });
    },
    getMenuDaysbyMenuId: async (menuId) => {
        return await client_1.default.menuDays.findMany({ where: { menuId }, select: { id: true, day: true } });
    },
    createMenuDayMeals: async (data) => {
        const menuDayIds = data.map(d => d.menuDayId);
        const validMenuDays = await client_1.default.menuDays.findMany({
            where: { id: { in: menuDayIds } },
            select: { id: true },
        });
        const validSet = new Set(validMenuDays.map(d => d.id));
        const rows = data.flatMap(({ menuDayId, meals }) => validSet.has(menuDayId)
            ? meals.map(mealId => ({ menuDayId, mealId }))
            : []);
        return client_1.default.menuDayMeals.createMany({
            data: rows,
            skipDuplicates: true,
        });
    },
    updateMenuMeals: async (id, isActive) => {
        return await client_1.default.menuDayMeals.update({ where: { id }, data: { isActive } });
    }
};
//# sourceMappingURL=menuService.js.map