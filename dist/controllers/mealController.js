"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealController = void 0;
const mealService_1 = require("../services/mealService");
exports.mealController = {
    createMealController: async (req, res) => {
        try {
            const meal = await mealService_1.mealService.createMeal(req.body);
            res.status(201).json({ message: "Meal created successfully", meal });
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to create meal",
                error,
            });
        }
    },
    getAllMealsController: async (req, res) => {
        try {
            const meals = await mealService_1.mealService.getAllMeals();
            res.status(200).json({ message: "Meals retrieved successfully", meals });
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to retrieve meals",
                error,
            });
        }
    },
    getMealByIdController: async (req, res) => {
        try {
            const meal = await mealService_1.mealService.getMealById(Number(req.params.id));
            res.status(200).json({ message: "Meal retrieved successfully", meal });
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to retrieve meal",
                error,
            });
        }
    },
    updateMealController: async (req, res) => {
        try {
            const meal = await mealService_1.mealService.updateMeal(Number(req.params.id), req.body);
            res.status(200).json({ message: "Meal updated successfully", meal });
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to update meal",
                error,
            });
        }
    },
    deleteMealController: async (req, res) => {
        try {
            const meal = await mealService_1.mealService.deleteMeal(Number(req.params.id));
            res.status(200).json({ message: "Meal deleted successfully", meal });
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to delete meal",
                error,
            });
        }
    }
};
//# sourceMappingURL=mealController.js.map