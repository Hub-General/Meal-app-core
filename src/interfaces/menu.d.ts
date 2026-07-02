import { Days } from "../generated/prisma";

export interface Menu {
    id: number;
    title: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
}

export interface CreateMenuRequest {
    title: string;
    description?: string;
    isActive?: boolean;
}

export interface CreateMenuDayMealsRequest {
    menuDayId: number;
    meals: number[];
}