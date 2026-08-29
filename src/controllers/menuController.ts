import { Request, Response } from "express";
import { createMenuDayMealsRequestSchema, createMenuRequestSchema, getMenuMealsRequestSchema, updateMenuDayMealRequestSchema, updateMenuRequestSchema } from "../schema/menu";
import { menuServices } from "../services/menuService";

export const menuController = {

    //Simple Menu DTO Controllers

    createMenuController : async (req: Request, res: Response) => {
        try {
            const parsed = createMenuRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid menu payload", errors: parsed.error.flatten() });
            }
            const trimmedTitle = parsed.data.title.trim();
            const existing = await menuServices.getMenuByTitle(trimmedTitle);
            if (existing) {
                return res.status(409).json({ message: `A menu with the title "${trimmedTitle}" already exists` });
            }
            const newMenu = await menuServices.createMenu({ ...parsed.data, title: trimmedTitle });
            res.status(201).json(newMenu);
        } catch (error: any) {
            if (error?.message?.includes("already exists")) {
                return res.status(409).json({ message: error.message });
            }
            res.status(500).json({ message: `Failed to create menu.`, error });
        }
    },
    getAllMenusController : async (req: Request, res: Response) => {
        try {
            const menus = await menuServices.getAllMenus();
            res.status(200).json(menus);
        } catch (error) {
            res.status(500).json({ message: "Failed to retrieve menus", error });
        }
    },
    getMenuByIdController : async (req: Request, res: Response) => {
        try {
            const menuId = Number(req.params.id);
            const menu = await menuServices.getMenuById(menuId);
            if (menu) {
                res.status(200).json(menu);
            } else {
                res.status(404).json({ message: "Menu not found", });
            }
        } catch (error) {
            res.status(500).json({ message: "Failed to retrieve menu", error });
        }
    },
    updateMenuController : async (req: Request, res: Response) => {
        try {
            const menuId = Number(req.params.id);
            if (isNaN(menuId)) {
                return res.status(400).json({ message: "Invalid menu ID" });
            }
            const parsed = updateMenuRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid menu payload", errors: parsed.error.flatten() });
            }
            if (parsed.data.title) {
                const trimmedTitle = parsed.data.title.trim();
                const existing = await menuServices.getMenuByTitle(trimmedTitle);
                if (existing && existing.id !== menuId) {
                    return res.status(409).json({ message: `A menu with the title "${trimmedTitle}" already exists` });
                }
                parsed.data.title = trimmedTitle;
            }
            const updatedMenu = await menuServices.updateMenu(menuId, parsed.data);
            res.status(200).json(updatedMenu);
        } catch (error: any) {
            if (error?.message?.includes("already exists")) {
                return res.status(409).json({ message: error.message });
            }
            res.status(500).json({ message: "Failed to update menu", error });
        }
    },
    deleteMenuController : async (req: Request, res: Response) => {
        try {
            const menuId = Number(req.params.id);
            const deletedMenu = await menuServices.deleteMenu(menuId);
            res.status(200).json(deletedMenu);
        } catch (error) {
            res.status(500).json({ message: "Failed to delete menu", error });
        }
    },

    //  Menu Meals Controllers

    getMenuMealsController : async (req: Request, res: Response) => {
        try {
            const parsed = getMenuMealsRequestSchema.safeParse({
                id: req.params.id,
                ...req.query
            });

            if (!parsed.success) {
                return res.status(400).json({
                    message: "Invalid request",
                    details: parsed.error.flatten()
                });
            }

            const { id: menuId, userId } = parsed.data;
            const meals = await menuServices.getMenuMeals(
            menuId,
            userId
            );
            res.status(200).json(meals);
        } catch (error) {
            res.status(500).json({ message: "Failed to retrieve menu meals", error });
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
            res.status(500).json({ message: "Failed to retrieve menus", error });
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
            res.status(500).json({ message: "Failed to create menu meals", error });
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
            res.status(500).json({message:"Failed to update menu meal", error})
        }
    }
    
}