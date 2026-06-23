import prisma from "../prisma/client";
import { CreateMenuRequest } from "../interfaces/menu";


export const menuServices = {

    //Simple Menu DTO operations
    
    createMenu: async (menuData: CreateMenuRequest)=>{
        return await prisma.menus.create({data: menuData});
    },
    getAllMenus: async ()=>{
        return await prisma.menus.findMany();
    },
    getMenuById: async (menuId: number)=>{
        return await prisma.menus.findUnique({where: {id: menuId}});
    },
    updateMenu: async (menuId: number, menuData: CreateMenuRequest)=>{
        return await prisma.menus.update({where: {id: menuId}, data: menuData});
    },
    deleteMenu: async (menuId: number)=>{
        return await prisma.menus.update({where: {id: menuId}, data: {isActive: false}});
    },


    //Menu Meals Assignment

    getMenuMeals: async(menuId: number)=>{
        return await prisma.menuDayMeals.findMany({where:{menuDay:{menuId}}})
    },
    updateMenuMeals : async(menuId: number, mealsData: {day: string, mealId: number}[])=>{

    }
}
