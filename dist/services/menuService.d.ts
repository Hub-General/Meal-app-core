import { CreateMenuRequest } from "../interfaces/menu";
export declare const menuServices: {
    createMenu: (menuData: CreateMenuRequest) => Promise<{
        description: string | null;
        createdAt: Date;
        id: number;
        isActive: boolean;
        title: string;
    }>;
    getAllMenus: () => Promise<{
        description: string | null;
        createdAt: Date;
        id: number;
        isActive: boolean;
        title: string;
    }[]>;
    getMenuById: (menuId: number) => Promise<{
        description: string | null;
        createdAt: Date;
        id: number;
        isActive: boolean;
        title: string;
    } | null>;
    updateMenu: (menuId: number, menuData: CreateMenuRequest) => Promise<{
        description: string | null;
        createdAt: Date;
        id: number;
        isActive: boolean;
        title: string;
    }>;
    deleteMenu: (menuId: number) => Promise<{
        description: string | null;
        createdAt: Date;
        id: number;
        isActive: boolean;
        title: string;
    }>;
    getMenuMeals: (menuId: number) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDayId: number;
        mealId: number;
    }[]>;
    updateMenuMeals: (menuId: number, mealsData: {
        day: string;
        mealId: number;
    }[]) => Promise<void>;
};
//# sourceMappingURL=menuService.d.ts.map