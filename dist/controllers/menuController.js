"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuController = void 0;
const menuService_1 = require("../services/menuService");
exports.menuController = {
    //Simple Menu DTO Controllers
    createMenuController: async (req, res) => {
        try {
            const menuData = req.body;
            const newMenu = await menuService_1.menuServices.createMenu(menuData);
            res.status(201).json(newMenu);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to create menu" });
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
            const menuData = req.body;
            const updatedMenu = await menuService_1.menuServices.updateMenu(menuId, menuData);
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
            const menuId = Number(req.params.id);
            const meals = await menuService_1.menuServices.getMenuMeals(menuId);
            res.status(200).json(meals);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to retrieve menu meals" });
        }
    },
};
//# sourceMappingURL=menuController.js.map