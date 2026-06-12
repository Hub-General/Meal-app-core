"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mealController_1 = require("../controllers/mealController");
const router = (0, express_1.Router)();
router.get("/", mealController_1.mealController.getAllMealsController);
router.get("/:id", mealController_1.mealController.getMealByIdController);
router.post("/", mealController_1.mealController.createMealController);
router.put("/:id", mealController_1.mealController.updateMealController);
router.delete("/:id", mealController_1.mealController.deleteMealController);
exports.default = router;
//# sourceMappingURL=mealRoutes.js.map