"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mealSelectionController_1 = require("../controllers/mealSelectionController");
const router = (0, express_1.Router)();
//GET selections routes
router.get("/", mealSelectionController_1.mealSelectionController.getAllSelectionsController);
router.get("/date-range", mealSelectionController_1.mealSelectionController.getSelectionsByDateRangeController);
router.get("/filter", mealSelectionController_1.mealSelectionController.getSelectionsByFilterController);
router.get("/:id", mealSelectionController_1.mealSelectionController.getSelectionByIdController);
router.get("/by-user/:id", mealSelectionController_1.mealSelectionController.getSelectionsByUserIdController);
router.get("/by-meal/:id", mealSelectionController_1.mealSelectionController.getSelectionsByMealIdController);
router.get("/by-day/:day", mealSelectionController_1.mealSelectionController.getSelectionsByDayController);
//CREATE selections routes
router.post("/", mealSelectionController_1.mealSelectionController.createSelectionController);
router.post("/batch", mealSelectionController_1.mealSelectionController.createBatchSelectionControleer);
exports.default = router;
//# sourceMappingURL=selectionRoutes.js.map