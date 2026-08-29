import prisma from "../prisma/client";
import { CreateMenuDayMealsRequest, CreateMenuRequest, UpdateMenuRequest } from "../schema/menu";
import { userPreferenceService } from "./userPreferenceService";

const menuSelectionShape = {
            id:true,
            title: true,
            description: true,
            isActive: true,
            order: true
}

export const menuServices = {

    getMenuByTitle: async (title: string) => {
        return await prisma.menus.findFirst({
            where: {
                title: { equals: title.trim(), mode: "insensitive" },
                isActive: true,
            },
            select: menuSelectionShape,
        });
    },
    createMenu: async (menuData: CreateMenuRequest) => {
        const title = menuData.title.trim();
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.menus.findFirst({
                where: {
                    title: { equals: title, mode: "insensitive" },
                    isActive: true,
                },
            });
            if (existing) {
                throw new Error(`A menu with the title "${title}" already exists`);
            }
            const menu = await tx.menus.create({
                data: {
                    ...menuData,
                    title,
                    menuDays: {
                        create: [
                            { day: "MONDAY" },
                            { day: "TUESDAY" },
                            { day: "WEDNESDAY" },
                            { day: "THURSDAY" },
                            { day: "FRIDAY" },
                        ],
                    },
                },
                select: menuSelectionShape,
            });
            return await tx.menus.update({
                where: { id: menu.id },
                data: { order: menu.id },
                select: menuSelectionShape,
            });
        });
    },
    getAllMenus: async () => {
        return await prisma.menus.findMany({
            select: menuSelectionShape,
            orderBy: [
                { order: 'asc' },
                { id: 'asc' },
            ],
        });
    },
    getMenuById: async (menuId: number) => {
        return await prisma.menus.findUnique({ where: { id: menuId }, select: menuSelectionShape });
    },
    updateMenu: async (menuId: number, menuData: UpdateMenuRequest) => {
        if (menuData.title) {
            const title = menuData.title.trim();
            const existing = await prisma.menus.findFirst({
                where: {
                    title: { equals: title, mode: "insensitive" },
                    isActive: true,
                    id: { not: menuId },
                },
            });
            if (existing) {
                throw new Error(`A menu with the title "${title}" already exists`);
            }
            menuData.title = title;
        }
        return await prisma.menus.update({ where: { id: menuId }, data: menuData, select: menuSelectionShape });
    },
    deleteMenu: async (menuId: number) => {
        return await prisma.menus.update({ where: { id: menuId }, data: { isActive: false } });
    },


    //Menu Meals Assignment
    
    getMenuMeals: async(menuId: number , userId?: number)=>{

        const excludedMealIds = userId
            ? await userPreferenceService.getUserExcludedMeals(userId)
        : [];
        return await prisma.menuDayMeals.findMany({
            where:{
                menuDay:{menuId},
                meal:{id:{notIn:excludedMealIds}}
            },
            orderBy: {
                meal: {
                    name: 'asc'
                }
            },
            select:{
            id:true,
            createdAt: true,
            updatedAt: true,
            isActive: true,
            menuDayId: true,
            meal:{
                select:{
                    id: true,
                    imagePath: true,
                    name: true,
                    description: true,
                    foodCode: true,
                    calories: true
                }
            }
        }})
    },

    getMenuDaysbyMenuId: async(menuId:number)=>{
        return await prisma.menuDays.findMany({where:{menuId}, select:{id: true, day:true}})
    },

    createMenuDayMeals: async (data: CreateMenuDayMealsRequest[]) => {
        const menuDayIds = data.map(d => d.menuDayId);

        const validMenuDays = await prisma.menuDays.findMany({
            where: { id: { in: menuDayIds } },
            select: { id: true },
        });

        const validSet = new Set(validMenuDays.map(d => d.id));

        const rows = data.flatMap(({ menuDayId, meals }) =>
            validSet.has(menuDayId)
            ? meals.map(mealId => ({ menuDayId, mealId }))
            : []
        );

        return prisma.menuDayMeals.createMany({
            data: rows,
            skipDuplicates: true,
        });
    },

    updateMenuMeals: async(id: number, isActive: boolean)=>{
        return await prisma.menuDayMeals.update({where:{id}, data:{isActive}})
    }
}
