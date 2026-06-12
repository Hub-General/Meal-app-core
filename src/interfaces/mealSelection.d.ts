export interface MealSelection {
    id: number;
    dayMeal: {
        id: number;
        day: string;
        meal: {
            id: number;
            name: string;
        }
    };
    user: {
        id: number;
        firstName: string;
        lastName: string;
    };

}

export interface CreateMealSelectionRequest {
    dayMealId: number;
    createdBy: number;
    createdFor?: number;
    weekMenuScheduleId: number;
    menuDayId: number;
}