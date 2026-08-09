import { CreateMenuDayMealsRequest, CreateMenuRequest, UpdateMenuRequest } from "../schema/menu";
export declare const menuServices: {
    createMenu: (menuData: CreateMenuRequest) => Promise<{
        description: string | null;
        id: number;
        isActive: boolean;
        title: string;
        order: number | null;
    }>;
    getAllMenus: () => Promise<{
        description: string | null;
        id: number;
        isActive: boolean;
        title: string;
        order: number | null;
    }[]>;
    getMenuById: (menuId: number) => Promise<{
        description: string | null;
        id: number;
        isActive: boolean;
        title: string;
        order: number | null;
    } | null>;
    updateMenu: (menuId: number, menuData: UpdateMenuRequest) => Promise<{
        description: string | null;
        createdAt: Date;
        id: number;
        isActive: boolean;
        title: string;
        order: number | null;
    }>;
    deleteMenu: (menuId: number) => Promise<{
        description: string | null;
        createdAt: Date;
        id: number;
        isActive: boolean;
        title: string;
        order: number | null;
    }>;
    getMenuMeals: (menuId: number, userId?: number) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        isActive: boolean;
        menuDayId: number;
        meal: {
            name: string;
            description: string | null;
            id: number;
            imagePath: string | null;
            foodCode: string;
            calories: number | null;
        };
    }[]>;
    getMenuDaysbyMenuId: (menuId: number) => Promise<{
        id: number;
        day: import("../generated/prisma").$Enums.Days;
    }[]>;
    createMenuDayMeals: (data: CreateMenuDayMealsRequest[]) => Promise<import("../generated/prisma").Prisma.BatchPayload>;
    updateMenuMeals: (id: number, isActive: boolean) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        isActive: boolean;
        menuDayId: number;
        mealId: number;
    }>;
};
//# sourceMappingURL=menuService.d.ts.map