"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mealSelectionController_1 = require("../controllers/mealSelectionController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const ERoles_1 = require("../enums/ERoles");
const router = (0, express_1.Router)();
//GET selections routes
router.get("/", mealSelectionController_1.mealSelectionController.getAllSelectionsController);
router.get("/date-range", mealSelectionController_1.mealSelectionController.getSelectionsByDateRangeController);
router.get("/by-user/:id", mealSelectionController_1.mealSelectionController.getSelectionsByUserIdController);
router.get("/by-meal/:id", mealSelectionController_1.mealSelectionController.getSelectionsByMealIdController);
//GET weekly selections routes
router.get("/weekly", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([ERoles_1.Roles.admin, ERoles_1.Roles.hr]), mealSelectionController_1.mealSelectionController.getWeeklySelectionsController);
router.get("/weekly/by-user/:id", authMiddleware_1.authenticate, mealSelectionController_1.mealSelectionController.getWeeklySelectionsByUserController);
router.get("/weekly/no-selections", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([ERoles_1.Roles.admin, ERoles_1.Roles.hr]), mealSelectionController_1.mealSelectionController.getUsersWithoutSelectionsController);
router.get("/:id", mealSelectionController_1.mealSelectionController.getSelectionByIdController);
//CREATE selections routes
router.put("/batch", authMiddleware_1.authenticate, mealSelectionController_1.mealSelectionController.submitSelectionsController);
//SUBMIT selections routes
router.patch("/submit", authMiddleware_1.authenticate, mealSelectionController_1.mealSelectionController.submitSelectionsController);
//ADMIN Routes
router.patch("/submit-weekly", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([ERoles_1.Roles.admin, ERoles_1.Roles.hr]), mealSelectionController_1.mealSelectionController.updateWeeklySelectionsStatusController);
router.put("/override", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([ERoles_1.Roles.admin, ERoles_1.Roles.hr]), mealSelectionController_1.mealSelectionController.adminOverrideSelectionsController);
router.patch("/replace-weekly-meal", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([ERoles_1.Roles.admin, ERoles_1.Roles.hr]), mealSelectionController_1.mealSelectionController.replaceWeeklyMealController);
router.patch("/replace-weekly-meals", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([ERoles_1.Roles.admin, ERoles_1.Roles.hr]), mealSelectionController_1.mealSelectionController.replaceWeeklyMealsController);
exports.default = router;
//# sourceMappingURL=selectionRoutes.js.map