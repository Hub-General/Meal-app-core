"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menuController_1 = require("../controllers/menuController");
const router = (0, express_1.Router)();
router.get("/", menuController_1.menuController.getAllMenusController);
router.get("/:id", menuController_1.menuController.getMenuByIdController);
router.get("/:id/meals", menuController_1.menuController.getMenuMealsController);
router.post("/", menuController_1.menuController.createMenuController);
router.put("/:id", menuController_1.menuController.updateMenuController);
router.delete("/:id", menuController_1.menuController.deleteMenuController);
exports.default = router;
//# sourceMappingURL=menuRoutes.js.map