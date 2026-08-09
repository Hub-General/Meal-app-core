"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealController = void 0;
const mealService_1 = require("../services/mealService");
const imageUploadService_1 = require("../services/imageUploadService");
const meal_1 = require("../schema/meal");
// Multipart form-data delivers every field as a string. Coerce the numeric and
// boolean meal fields so the zod schemas validate the same way they do for JSON.
const normalizeMealBody = (body) => {
    const normalized = { ...body };
    if (typeof normalized.calories === "string") {
        normalized.calories = normalized.calories.trim() === "" ? undefined : Number(normalized.calories);
    }
    if (typeof normalized.isActive === "string") {
        normalized.isActive = normalized.isActive === "true";
    }
    return normalized;
};
exports.mealController = {
    createMealController: async (req, res) => {
        try {
            const request = meal_1.CreateMealRequestSchema.safeParse(normalizeMealBody(req.body));
            if (!request.success) {
                return res.status(400).json({
                    message: "Invalid request body",
                    error: request.error.flatten()
                });
            }
            const data = { ...request.data };
            if (req.file) {
                const { url } = await imageUploadService_1.imageUploadService.uploadImage(req.file, "meals");
                data.imagePath = url;
            }
            const meal = await mealService_1.mealService.createMeal(data);
            res.status(201).json({ message: "Meal created successfully", meal });
        }
        catch (error) {
            res.status(500).json({
                message: "Failed to create meal",
                error,
            });
        }
    },
    createMealBatchController: async (req, res) => {
        try {
            const parsed = meal_1.CreateMealRequestSchema.array().safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: 'Request body must be an array of objects', details: parsed.error.flatten() });
            }
            const meal = await mealService_1.mealService.createMealBatch(parsed.data);
            res.status(201).json({ message: "Meals created successfully", meal });
        }
        catch (error) {
            console.log(error.message);
            res.status(500).json({
                message: "Failed to create meals",
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
            const request = meal_1.UpdateMealRequestSchema.safeParse(normalizeMealBody(req.body));
            if (!request.success) {
                return res.status(400).json({
                    message: "Invalid request body",
                    error: request.error.flatten()
                });
            }
            const data = { ...request.data };
            if (req.file) {
                const { url } = await imageUploadService_1.imageUploadService.uploadImage(req.file, "meals");
                data.imagePath = url;
            }
            const meal = await mealService_1.mealService.updateMeal(Number(req.params.id), data);
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