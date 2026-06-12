import { Request, Response } from "express";
import { menuServices } from "../services/menuService";

export const menuController = {

    //Simple Menu DTO Controllers

    createMenuController : async (req: Request, res: Response) => {
        try {
            const menuData = req.body;
            const newMenu = await menuServices.createMenu(menuData);
            res.status(201).json(newMenu);
        } catch (error) {
            res.status(500).json({ error: "Failed to create menu" });
        }
    },
    getAllMenusController : async (req: Request, res: Response) => {
        try {
            const menus = await menuServices.getAllMenus();
            res.status(200).json(menus);
        } catch (error) {
            res.status(500).json({ error: "Failed to retrieve menus" });
        }
    },
    getMenuByIdController : async (req: Request, res: Response) => {
        try {
            const menuId = Number(req.params.id);
            const menu = await menuServices.getMenuById(menuId);
            if (menu) {
                res.status(200).json(menu);
            } else {
                res.status(404).json({ error: "Menu not found" });
            }
        } catch (error) {
            res.status(500).json({ error: "Failed to retrieve menu" });
        }
    },
    updateMenuController : async (req: Request, res: Response) => {
        try {
            const menuId = Number(req.params.id);
            const menuData = req.body;
            const updatedMenu = await menuServices.updateMenu(menuId, menuData);
            res.status(200).json(updatedMenu);
        } catch (error) {
            res.status(500).json({ error: "Failed to update menu" });
        }
    },
    deleteMenuController : async (req: Request, res: Response) => {
        try {
            const menuId = Number(req.params.id);
            const deletedMenu = await menuServices.deleteMenu(menuId);
            res.status(200).json(deletedMenu);
        } catch (error) {
            res.status(500).json({ error: "Failed to delete menu" });
        }
    },

    //  Menu Meals Controllers

    getMenuMealsController : async (req: Request, res: Response) => {
        try {
            const menuId = Number(req.params.id);
            const meals = await menuServices.getMenuMeals(menuId);
            res.status(200).json(meals);
        } catch (error) {
            res.status(500).json({ error: "Failed to retrieve menu meals" });
        }
    },
    
}