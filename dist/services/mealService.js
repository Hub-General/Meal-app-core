"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealService = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const userPreferenceService_1 = require("./userPreferenceService");
exports.mealService = {
    createMeal: async (mealData) => {
        return await client_1.default.meals.create({ data: mealData });
    },
    createMealBatch: async (mealData) => {
        return await client_1.default.meals.createMany({ data: mealData, skipDuplicates: true });
    },
    getAllMeals: async (userId) => {
        const excludedMealIds = userId
            ? await userPreferenceService_1.userPreferenceService.getUserExcludedMeals(userId)
            : [];
        return await client_1.default.meals.findMany({ where: { id: { notIn: excludedMealIds } } });
    },
    getMealById: async (mealId) => {
        return await client_1.default.meals.findUnique({ where: { id: mealId } });
    },
    getMealByFoodCode: async (foodCode) => {
        return await client_1.default.meals.findUnique({ where: { foodCode: foodCode } });
    },
    updateMeal: async (mealId, mealData) => {
        return await client_1.default.meals.update({ where: { id: mealId }, data: mealData });
    },
    deleteMeal: async (mealId) => {
        return await client_1.default.meals.update({ where: { id: mealId }, data: { isActive: false } });
    },
};
//# sourceMappingURL=mealService.js.map