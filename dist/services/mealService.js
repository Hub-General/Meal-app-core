"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealService = void 0;
const client_1 = __importDefault(require("../prisma/client"));
exports.mealService = {
    createMeal: async (mealData) => {
        return await client_1.default.meals.create({ data: mealData });
    },
    getAllMeals: async () => {
        return await client_1.default.meals.findMany();
    },
    getMealById: async (mealId) => {
        return await client_1.default.meals.findUnique({ where: { id: mealId } });
    },
    updateMeal: async (mealId, mealData) => {
        return await client_1.default.meals.update({ where: { id: mealId }, data: mealData });
    },
    deleteMeal: async (mealId) => {
        return await client_1.default.meals.update({ where: { id: mealId }, data: { isActive: false } });
    },
};
//# sourceMappingURL=mealService.js.map