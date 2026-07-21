import { Days } from "../generated/prisma";
import { prisma } from "../prisma/client";
import { Meal } from "../schema/meal";
import { DayMealSelections, MealSelection, WeekMealSelectionResponse } from "../schema/mealSelection";
import { weekMenuScheduleService } from "../services/weekMenuScheduleService";
import { getISOWeekInfo } from "./dateFunctions";

    // HELPER METHODS FOR VALIDATION
export const selectionHelper = {

    isWeekSubmitted: async(weekMenuScheduleId: number, userId: number): Promise<boolean> => {
        const count = await prisma.selections.count({
            where: {
                weekMenuScheduleId,
                createdFor: userId,
                selectionStatus: "SUBMITTED"
            }
        });
        return count > 0;
    },


    isSelectionExist: async(weekMenuScheduleId: number, menuDayId: number, userId: number): Promise<boolean> => {
        const count = await prisma.selections.count({
            where: {
                weekMenuScheduleId,
                menuDayId,
                createdFor: userId
            }
        });
        return (count > 0);
    },

    isCurrentWeek: async(weekMenuScheduleId: number): Promise<boolean>=>{
        const today = new Date();
        const weekInfo = await weekMenuScheduleService.getWeekMenuScheduleById(weekMenuScheduleId);
        if(!weekInfo) return false;

        return(
            getISOWeekInfo(today).week === weekInfo.week &&
            getISOWeekInfo(today).year === weekInfo.year
        );
    },

    formatSelectionResponse: (selections:MealSelection[])=>{
        const response: WeekMealSelectionResponse = {};
        const mealMaps = new Map<string, Map<number, DayMealSelections>>();

        for (const selection of selections) {
            const day = selection.menuDay.day;

            if (!response[day]) {
                response[day] = {
                    total: 0,
                    response: []
                };

                mealMaps.set(day, new Map());
            }

            const meals = mealMaps.get(day)!;

            let meal = meals.get(selection.dayMeal.id);

            if (!meal) {
                meal = {
                    id: selection.dayMeal.meal.id,
                    foodCode: selection.dayMeal.meal.foodCode,
                    name: selection.dayMeal.meal.name,
                    imageUrl: selection.dayMeal.meal.image ?? "",
                    calories: selection.dayMeal.meal.id,
                    count: 0,
                    users: []
                };

                meals.set(selection.dayMeal.id, meal);
                response[day].response.push(meal);
            }

            meal.count++;

            meal.users.push({
                id: selection.createdForUser?.id ?? null,
                name: selection.createdForUser?.name ?? "Guest"
            });

            response[day].total++;
        }

        return response;
    },

    formatDaySelectionResponse:(selections:MealSelection[]): DayMealSelections[] =>{
        
        const foodMaps = new Map<number,DayMealSelections>()  
         
         for (const selection of selections){
            const mealId = selection.dayMeal.id;

            let meal = foodMaps.get(mealId)

            if(!meal){
                meal = {
                    id: selection.dayMeal.meal.id,
                    name: selection.dayMeal.meal.name,
                    calories: selection.dayMeal.meal.calories,
                    imageUrl: selection.dayMeal.meal.image ?? "",
                    foodCode: selection.dayMeal.meal.foodCode,
                    count: 0,
                    users: []
                }

                foodMaps.set(mealId,meal)
            }

            meal.count++;

            meal.users.push({
                id: selection.createdForUser?.id ?? null,
                name: selection.createdForUser?.name ?? "Guest"
            })
         }

         return Array.from(foodMaps.values());
        
    }
}