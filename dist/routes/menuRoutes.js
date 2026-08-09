"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menuController_1 = require("../controllers/menuController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const ERoles_1 = require("../enums/ERoles");
const router = (0, express_1.Router)();
router.get("/", menuController_1.menuController.getAllMenusController);
router.post("/", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([ERoles_1.Roles.admin, ERoles_1.Roles.hr]), menuController_1.menuController.createMenuController);
router.get("/:id", menuController_1.menuController.getMenuByIdController);
router.get("/:id/meals", authMiddleware_1.authenticate, menuController_1.menuController.getMenuMealsController);
router.put("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([ERoles_1.Roles.admin, ERoles_1.Roles.hr]), menuController_1.menuController.updateMenuController);
router.delete("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([ERoles_1.Roles.admin, ERoles_1.Roles.hr]), menuController_1.menuController.deleteMenuController);
//Menu Meals Routes
router.get("/days/:id", menuController_1.menuController.getMenuDaysByMenuIdController);
router.post("/meals", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([ERoles_1.Roles.admin, ERoles_1.Roles.hr]), menuController_1.menuController.createMenuMealsController);
router.patch("/meals/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([ERoles_1.Roles.admin, ERoles_1.Roles.hr]), menuController_1.menuController.updateMenuMealsController);
exports.default = router;
//# sourceMappingURL=menuRoutes.js.map