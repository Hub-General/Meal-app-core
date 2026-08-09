"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealSelectionController = void 0;
const mealSelectionService_1 = require("../services/mealSelectionService");
const mealSelection_1 = require("../schema/mealSelection");
const validateSelectionUpdate_1 = require("../helpers/validateSelectionUpdate");
exports.mealSelectionController = {
    getAllSelectionsController: async (req, res) => {
        try {
            const parsed = mealSelection_1.mealSelectionFilterSchema.safeParse(req.query);
            if (!parsed.success) {
                return res.status(400).json({
                    error: "Invalid filter parameters",
                    details: parsed.error.flatten()
                });
            }
            const selections = await mealSelectionService_1.mealSelectionService.getAllSelections(parsed.data);
            res.json(selections);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch selections", error });
        }
    },
    getSelectionsByDateRangeController: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({ error: "Start date and end date are required" });
            }
            const selections = await mealSelectionService_1.mealSelectionService.getSelectionsByDateRange(new Date(String(startDate)), new Date(String(endDate)));
            res.json(selections);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch selections by date range" });
        }
    },
    getSelectionByIdController: async (req, res) => {
        try {
            const selectionId = Number(req.params.id);
            if (isNaN(selectionId)) {
                return res.status(400).json({ error: "Invalid selection ID" });
            }
            const selection = await mealSelectionService_1.mealSelectionService.getSelectionById(selectionId);
            if (!selection) {
                return res.status(404).json({ error: "Selection not found" });
            }
            res.json(selection);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch selection by ID" });
        }
    },
    getSelectionsByUserIdController: async (req, res) => {
        try {
            const userId = Number(req.params.id);
            if (isNaN(userId)) {
                return res.status(400).json({ error: "Invalid user ID" });
            }
            const selections = await mealSelectionService_1.mealSelectionService.getSelectionsByUserId(userId);
            res.json(selections);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch selections by user ID" });
        }
    },
    getSelectionsByMealIdController: async (req, res) => {
        try {
            const mealId = Number(req.params.id);
            if (isNaN(mealId)) {
                return res.status(400).json({ error: "Invalid meal ID" });
            }
            const selections = await mealSelectionService_1.mealSelectionService.getSelectionsByMealId(mealId);
            res.json(selections);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch selections by meal ID" });
        }
    },
    // GET Weekly Selections
    getWeeklySelectionsController: async (req, res) => {
        try {
            const { date: dateQuery } = req.query;
            if (!dateQuery) {
                return res.status(400).json({ error: "Date parameter is required" });
            }
            const date = new Date(String(dateQuery));
            const selections = await mealSelectionService_1.mealSelectionService.getWeeklySelections(date);
            res.json(selections);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch selections by date" });
        }
    },
    getWeeklySelectionsByUserController: async (req, res) => {
        try {
            const { date: dateQuery } = req.query;
            const userId = Number(req.params.id);
            if (!dateQuery) {
                return res.status(400).json({ error: "Date parameter is required" });
            }
            const date = new Date(String(dateQuery));
            if (!userId && isNaN(userId)) {
                return res.status(400).json({ error: "User ID is required" });
            }
            const selections = await mealSelectionService_1.mealSelectionService.getWeeklySelectionsByUser(date, userId);
            res.json(selections);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch selections by date", error });
        }
    },
    //SUMBIT SELECTIONS
    submitSelectionsController: async (req, res) => {
        try {
            const parsed = mealSelection_1.createMealSelectionBatchRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid selection batch payload", details: parsed.error.flatten() });
            }
            const selectionsResponse = await mealSelectionService_1.mealSelectionService.submitSelections(parsed.data, req.user.id);
            res.status(201).json(selectionsResponse);
        }
        catch (error) {
            if (error instanceof validateSelectionUpdate_1.SelectionValidationError) {
                return res.status(403).json({
                    message: error.message,
                    errors: error.errors
                });
            }
            if (error instanceof mealSelectionService_1.SelectionConflictError) {
                return res.status(409).json({ message: error.message });
            }
            res.status(500).json({ message: `${error}` });
        }
    },
    //ADMIN CONTROLLERS
    getUsersWithoutSelectionsController: async (req, res) => {
        try {
            const { date: dateQuery } = req.query;
            if (!dateQuery) {
                return res.status(400).json({ error: "Date parameter is required" });
            }
            const date = new Date(String(dateQuery));
            const results = await mealSelectionService_1.mealSelectionService.getUsersWithoutSelections(date);
            res.status(200).json(results);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch users without selections", error });
        }
    },
    adminOverrideSelectionsController: async (req, res) => {
        try {
            const parsed = mealSelection_1.updateMealSelectionsBatchRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid selection batch update payload", details: parsed.error.flatten() });
            }
            const response = await mealSelectionService_1.mealSelectionService.adminOverrideSelections(parsed.data, req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            if (error instanceof mealSelectionService_1.SelectionConflictError) {
                return res.status(409).json({ message: error.message });
            }
            res.status(500).json({ message: "Failed to override Selections", error });
        }
    },
    replaceWeeklyMealController: async (req, res) => {
        try {
            const parsed = mealSelection_1.replaceWeeklyMealRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid meal replacement payload", details: parsed.error.flatten() });
            }
            const response = await mealSelectionService_1.mealSelectionService.replaceWeeklyMeal(parsed.data);
            return res.status(200).json(response);
        }
        catch (error) {
            if (error instanceof mealSelectionService_1.SelectionConflictError) {
                return res.status(409).json({ message: error.message });
            }
            return res.status(500).json({ message: "Failed to replace weekly meal", error });
        }
    },
    replaceWeeklyMealsController: async (req, res) => {
        try {
            const parsed = mealSelection_1.replaceWeeklyMealsBatchRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid meal replacement batch payload", details: parsed.error.flatten() });
            }
            const response = await mealSelectionService_1.mealSelectionService.replaceWeeklyMeals(parsed.data);
            return res.status(200).json(response);
        }
        catch (error) {
            if (error instanceof mealSelectionService_1.SelectionConflictError) {
                return res.status(409).json({ message: error.message });
            }
            return res.status(500).json({ message: "Failed to replace weekly meals", error });
        }
    },
    //UPDATE Selections Status
    updateWeeklySelectionsStatusController: async (req, res) => {
        try {
            const parsed = mealSelection_1.submitWeeklySelectionsRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid weekly submission payload", details: parsed.error.flatten() });
            }
            const { weekNumber, year, status } = parsed.data;
            await mealSelectionService_1.mealSelectionService.changeWeeklySelectionsStatus(weekNumber, year, status);
            res.status(200).json({ message: "Weekly selections submitted successfully" });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to submit weekly selections" });
        }
    },
};
//# sourceMappingURL=mealSelectionController.js.map