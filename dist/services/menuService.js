"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuServices = void 0;
const client_1 = __importDefault(require("../prisma/client"));
exports.menuServices = {
    //Simple Menu DTO operations
    createMenu: async (menuData) => {
        return await client_1.default.menus.create({ data: menuData });
    },
    getAllMenus: async () => {
        return await client_1.default.menus.findMany();
    },
    getMenuById: async (menuId) => {
        return await client_1.default.menus.findUnique({ where: { id: menuId } });
    },
    updateMenu: async (menuId, menuData) => {
        return await client_1.default.menus.update({ where: { id: menuId }, data: menuData });
    },
    deleteMenu: async (menuId) => {
        return await client_1.default.menus.update({ where: { id: menuId }, data: { isActive: false } });
    },
    //Menu Meals Assignment
    getMenuMeals: async (menuId) => {
        return await client_1.default.menuDayMeals.findMany({ where: { menuDay: { menuId } } });
    },
    updateMenuMeals: async (menuId, mealsData) => {
    }
};
//# sourceMappingURL=menuService.js.map