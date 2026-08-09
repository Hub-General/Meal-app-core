"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mealController_1 = require("../controllers/mealController");
const multerUpload_1 = require("../middleware/multerUpload");
const router = (0, express_1.Router)();
router.get("/", mealController_1.mealController.getAllMealsController);
router.get("/:id", mealController_1.mealController.getMealByIdController);
router.post("/", multerUpload_1.upload.single("image"), mealController_1.mealController.createMealController);
router.post("/batch", mealController_1.mealController.createMealBatchController);
router.put("/:id", multerUpload_1.upload.single("image"), mealController_1.mealController.updateMealController);
router.delete("/:id", mealController_1.mealController.deleteMealController);
exports.default = router;
//# sourceMappingURL=mealRoutes.js.map