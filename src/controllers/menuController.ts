import { Request, Response } from "express";
import { createMenuDayMealsRequestSchema, createMenuRequestSchema, updateMenuDayMealRequestSchema, updateMenuRequestSchema } from "../schema/menu";
import { menuServices } from "../services/menuService";

export const menuController = {

    //Simple Menu DTO Controllers

    createMenuController : async (req: Request, res: Response) => {
        try {
            const parsed = createMenuRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid menu payload", errors: parsed.error.flatten() });
            }
            const newMenu = await menuServices.createMenu(parsed.data);
            res.status(201).json(newMenu);
        } catch (error) {
            res.status(500).json({ error: `Failed to create menu. Error:${error}` });
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
            const parsed = updateMenuRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid menu payload", errors: parsed.error.flatten() });
            }
            const updatedMenu = await menuServices.updateMenu(menuId, parsed.data);
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
    getMenuDaysByMenuIdController : async (req: Request, res: Response) => {
        try {
            const menuId = Number(req.params.id)
            if(isNaN(menuId)|| !menuId){
                return res.status(400).json({error: 'Menu Id is invalid'})
            }
            const menuDays = await menuServices.getMenuDaysbyMenuId(menuId);
            res.status(200).json(menuDays);
        } catch (error) {
            res.status(500).json({ error: "Failed to retrieve menus" });
        }
    },
    createMenuMealsController : async (req: Request, res: Response) => {
        try {
            const parsed = createMenuDayMealsRequestSchema.array().safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid menu day meals payload", errors: parsed.error.flatten() });
            }
            const result = await menuServices.createMenuDayMeals(parsed.data);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: "Failed to create menu meals" });
        }
    },
    updateMenuMealsController: async(req:Request, res: Response)=>{
        try{
            const id = Number(req.params.id)
            const parsed = updateMenuDayMealRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid menu meal payload", errors: parsed.error.flatten() });
            }
            await menuServices.updateMenuMeals(id, parsed.data.isActive);
            res.status(200).json({message : "Successfully updated meal status"})
        
        }catch (error){
            res.status(500).json({error:"Failed to update menu meal"})
        }
    }
    
}