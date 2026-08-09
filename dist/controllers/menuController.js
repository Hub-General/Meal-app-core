"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuController = void 0;
const menu_1 = require("../schema/menu");
const menuService_1 = require("../services/menuService");
exports.menuController = {
    //Simple Menu DTO Controllers
    createMenuController: async (req, res) => {
        try {
            const parsed = menu_1.createMenuRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid menu payload", errors: parsed.error.flatten() });
            }
            const newMenu = await menuService_1.menuServices.createMenu(parsed.data);
            res.status(201).json(newMenu);
        }
        catch (error) {
            res.status(500).json({ error: `Failed to create menu. Error:${error}` });
        }
    },
    getAllMenusController: async (req, res) => {
        try {
            const menus = await menuService_1.menuServices.getAllMenus();
            res.status(200).json(menus);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to retrieve menus" });
        }
    },
    getMenuByIdController: async (req, res) => {
        try {
            const menuId = Number(req.params.id);
            const menu = await menuService_1.menuServices.getMenuById(menuId);
            if (menu) {
                res.status(200).json(menu);
            }
            else {
                res.status(404).json({ error: "Menu not found" });
            }
        }
        catch (error) {
            res.status(500).json({ error: "Failed to retrieve menu" });
        }
    },
    updateMenuController: async (req, res) => {
        try {
            const menuId = Number(req.params.id);
            const parsed = menu_1.updateMenuRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid menu payload", errors: parsed.error.flatten() });
            }
            const updatedMenu = await menuService_1.menuServices.updateMenu(menuId, parsed.data);
            res.status(200).json(updatedMenu);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to update menu" });
        }
    },
    deleteMenuController: async (req, res) => {
        try {
            const menuId = Number(req.params.id);
            const deletedMenu = await menuService_1.menuServices.deleteMenu(menuId);
            res.status(200).json(deletedMenu);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to delete menu" });
        }
    },
    //  Menu Meals Controllers
    getMenuMealsController: async (req, res) => {
        try {
            const parsed = menu_1.getMenuMealsRequestSchema.safeParse({
                id: req.params.id,
                ...req.query
            });
            if (!parsed.success) {
                return res.status(400).json({
                    message: "Invalid request",
                    details: parsed.error.flatten()
                });
            }
            const { id: menuId, personalized } = parsed.data;
            const meals = await menuService_1.menuServices.getMenuMeals(menuId, personalized ? req.user.id : undefined);
            res.status(200).json(meals);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to retrieve menu meals" });
        }
    },
    getMenuDaysByMenuIdController: async (req, res) => {
        try {
            const menuId = Number(req.params.id);
            if (isNaN(menuId) || !menuId) {
                return res.status(400).json({ error: 'Menu Id is invalid' });
            }
            const menuDays = await menuService_1.menuServices.getMenuDaysbyMenuId(menuId);
            res.status(200).json(menuDays);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to retrieve menus" });
        }
    },
    createMenuMealsController: async (req, res) => {
        try {
            const parsed = menu_1.createMenuDayMealsRequestSchema.array().safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid menu day meals payload", errors: parsed.error.flatten() });
            }
            const result = await menuService_1.menuServices.createMenuDayMeals(parsed.data);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to create menu meals" });
        }
    },
    updateMenuMealsController: async (req, res) => {
        try {
            const id = Number(req.params.id);
            const parsed = menu_1.updateMenuDayMealRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid menu meal payload", errors: parsed.error.flatten() });
            }
            await menuService_1.menuServices.updateMenuMeals(id, parsed.data.isActive);
            res.status(200).json({ message: "Successfully updated meal status" });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to update menu meal" });
        }
    }
};
//# sourceMappingURL=menuController.js.map