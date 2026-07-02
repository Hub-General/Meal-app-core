export interface MealSelection {
    id: number;
    dayMeal: {
        id: number;
        day: string;
        meal: {
            id: number;
            name: string;
            image?: string;
        }
    };
    createdByUser: {
        id: number;
        name: string;
    };
    createdForUser: {
        id: number;
        name:string;
    }

}

export interface CreateMealSelectionRequest {
    dayMealId: number;
    createdBy: number;
    createdFor?: number;
    weekMenuScheduleId: number;
    menuDayId: number;
}

export interface MealSelectionFilter{
    createdBy?: number;
    createdFor?: number;
    week?: number;
    mealId?: number;
    day?: string;
    menuId?: number;
}