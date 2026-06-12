"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealSelectionController = void 0;
const mealSelectionService_1 = require("../services/mealSelectionService");
exports.mealSelectionController = {
    getAllSelectionsController: async (req, res) => {
        try {
            const selections = await mealSelectionService_1.mealSelectionService.getAllSelections();
            res.json(selections);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch selections" });
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
    getSelectionsByFilterController: async (req, res) => {
        try {
            const { userId, mealId, day, menuId } = req.query;
            const filter = {};
            if (userId)
                filter.userId = Number(userId);
            if (mealId)
                filter.mealId = Number(mealId);
            if (day)
                filter.day = String(day);
            if (menuId)
                filter.menuId = Number(menuId);
            const selections = await mealSelectionService_1.mealSelectionService.getSelectionsByFilter(filter);
            res.json(selections);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch selections by filter" });
        }
    },
    getSelectionsByUserIdController: async (req, res) => {
        try {
            const userId = Number(req.query.userId);
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
            const mealId = Number(req.query.mealId);
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
    getSelectionsByDayController: async (req, res) => {
        try {
            const day = String(req.query.day);
            const selections = await mealSelectionService_1.mealSelectionService.getSelectionsByDay(day);
            res.json(selections);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch selections by day" });
        }
    },
    createSelectionController: async (req, res) => {
        try {
            const selectionResponse = await mealSelectionService_1.mealSelectionService.createSelection(req.body);
            res.status(201).json(selectionResponse);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to create a new selection" });
        }
    },
    createBatchSelectionControleer: async (req, res) => {
        try {
            const selectionsResponse = await mealSelectionService_1.mealSelectionService.createSelectionsBatch(req.body);
            res.status(201).json(selectionsResponse);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to create new selections batch" });
        }
    }
};
//# sourceMappingURL=mealSelectionController.js.map