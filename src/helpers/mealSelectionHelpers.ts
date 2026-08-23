import { prisma } from "../prisma/client";
import { DayMealSelections, MealSelection, WeekMealSelectionResponse } from "../schema/mealSelection";
import { Preset, PresetItem } from "../schema/preset";
import { weekMenuScheduleService } from "../services/weekMenuScheduleService";
import { getISOWeekInfo } from "./dateFunctions";

// HELPER METHODS FOR VALIDATION
export const selectionHelper = {

    isWeekSubmitted: async (weekMenuScheduleId: number, userId: number): Promise<boolean> => {
        const count = await prisma.selections.count({
            where: {
                weekMenuScheduleId,
                createdFor: userId,
                selectionStatus: "SUBMITTED"
            }
        });
        return count > 0;
    },


    isSelectionExist: async (weekMenuScheduleId: number, menuDayId: number, userId: number): Promise<boolean> => {
        const count = await prisma.selections.count({
            where: {
                weekMenuScheduleId,
                menuDayId,
                createdFor: userId
            }
        });
        return (count > 0);
    },

    isCurrentWeek: async (weekMenuScheduleId: number): Promise<boolean> => {
        const today = new Date();
        const weekInfo = await weekMenuScheduleService.getWeekMenuScheduleById(weekMenuScheduleId);
        if (!weekInfo) return false;

        return (
            getISOWeekInfo(today).week === weekInfo.week &&
            getISOWeekInfo(today).year === weekInfo.year
        );
    },

    formatSelectionResponse: (selections: MealSelection[]) => {
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

            if (!selection.dayMeal) {
                const dummyId = selection.selectionType === "UNAVAILABLE" ? -1 : -2;
                const typeName = selection.selectionType === "UNAVAILABLE" ? "Unavailable" : "Holiday";
                let nonMeal = meals.get(dummyId);
                if (!nonMeal) {
                    nonMeal = {
                        id: dummyId,
                        foodCode: selection.selectionType ?? "HOLIDAY",
                        name: typeName,
                        imagePath: "",
                        calories: 0,
                        count: 0,
                        users: []
                    };
                    meals.set(dummyId, nonMeal);
                    response[day].response.push(nonMeal);
                }
                nonMeal.count += selection.guestCount;
                const nonMealUserName = selection.createdForUser?.name 
                    ?? (selection.createdByUser?.name ? `${selection.createdByUser.name} (Guest)` : "Guest");
                nonMeal.users.push({
                    id: selection.createdForUser?.id ?? selection.createdByUser?.id ?? null,
                    name: nonMealUserName,
                    quantity: selection.guestCount
                });
                response[day].total += selection.guestCount;
                continue;
            }

            let meal = meals.get(selection.dayMeal.id);

            if (!meal) {
                meal = {
                    id: selection.dayMeal.meal.id,
                    foodCode: selection.dayMeal.meal.foodCode,
                    name: selection.dayMeal.meal.name,
                    imagePath: selection.dayMeal.meal.imagePath ?? "",
                    calories: selection.dayMeal.meal.calories ?? 0,
                    count: 0,
                    users: []
                };

                meals.set(selection.dayMeal.id, meal);
                response[day].response.push(meal);
            }

            meal.count += selection.guestCount;

            const userName = selection.createdForUser?.name 
                ?? (selection.createdByUser?.name ? `${selection.createdByUser.name} (Guest)` : "Guest");
            meal.users.push({
                id: selection.createdForUser?.id ?? selection.createdByUser?.id ?? null,
                name: userName,
                quantity: selection.guestCount
            });

            response[day].total += selection.guestCount;
        }

        return response;
    },

    formatUserSelectionsResponse:(selections: MealSelection[])=>{
        if(!selections?.length){
            return {
                createdById: null,
                createdBy: null,
                createdForId: null,
                createdFor: null,
                selectionStatus: null,
                mealSelections: {}
            }
        }

        const mealSelections: Record<string, unknown> = {};

        for(const selection of selections){
            const selectionDay = selection.menuDay.day;

            if(!mealSelections[selectionDay]){
                const isMeal = selection.selectionType === "MEAL" && selection.dayMeal;
                mealSelections[selectionDay] = {
                    id: selection.id,
                    selectionType: selection.selectionType ?? "MEAL",
                    mealName: isMeal
                        ? selection.dayMeal!.meal.name
                        : (selection.selectionType === "UNAVAILABLE" ? "Unavailable" : "Holiday"),
                    mealID: isMeal ? selection.dayMeal!.meal.id : null,
                    mealImagePath: isMeal ? selection.dayMeal!.meal.imagePath : null,
                    foodCode: isMeal ? selection.dayMeal!.meal.foodCode : selection.selectionType,
                    calories: isMeal ? selection.dayMeal!.meal.calories : null
                };
            }
        }

        return {
            createdById: selections[0]?.createdByUser?.id ?? null,
            createdBy: selections[0]?.createdByUser.name ?? null,
            createdForId: selections[0]?.createdForUser?.id ?? null,
            createdFor: selections[0]?.createdForUser?.name ?? null,
            selectionStatus: selections[0]?.selectionStatus ?? null,
            mealSelections
        }
    },
    formatDaySelectionResponse: (selections: MealSelection[]): DayMealSelections[] => {

        const foodMaps = new Map<number, DayMealSelections>()

        for (const selection of selections) {
            if (!selection.dayMeal) {
                const dummyId = selection.selectionType === "UNAVAILABLE" ? -1 : -2;
                const typeName = selection.selectionType === "UNAVAILABLE" ? "Unavailable" : "Holiday";
                let nonMeal = foodMaps.get(dummyId);
                if (!nonMeal) {
                    nonMeal = {
                        id: dummyId,
                        foodCode: selection.selectionType ?? "HOLIDAY",
                        name: typeName,
                        imagePath: "",
                        calories: 0,
                        count: 0,
                        users: []
                    };
                    foodMaps.set(dummyId, nonMeal);
                }
                nonMeal.count += selection.guestCount;
                const nonMealUserName = selection.createdForUser?.name 
                    ?? (selection.createdByUser?.name ? `${selection.createdByUser.name} (Guest)` : "Guest");
                nonMeal.users.push({
                    id: selection.createdForUser?.id ?? selection.createdByUser?.id ?? null,
                    name: nonMealUserName,
                    quantity: selection.guestCount
                });
                continue;
            }

            const mealId = selection.dayMeal.id;

            let meal = foodMaps.get(mealId)

            if (!meal) {
                meal = {
                    id: selection.dayMeal.meal.id,
                    name: selection.dayMeal.meal.name,
                    calories: selection.dayMeal.meal.calories,
                    imagePath: selection.dayMeal.meal.imagePath ?? "",
                    foodCode: selection.dayMeal.meal.foodCode,
                    count: 0,
                    users: []
                }

                foodMaps.set(mealId, meal)
            }

            meal.count += selection.guestCount;

            const userName = selection.createdForUser?.name 
                ?? (selection.createdByUser?.name ? `${selection.createdByUser.name} (Guest)` : "Guest");
            meal.users.push({
                id: selection.createdForUser?.id ?? selection.createdByUser?.id ?? null,
                name: userName,
                quantity: selection.guestCount
            })
        }

        return Array.from(foodMaps.values());

    },

    formatPresetResponse:(presetItems: PresetItem[], preset: any)=>{
        if(!presetItems.length){
            return{
                ...preset,
                items: []
            }
        }

        const items: Record<string, unknown> ={}

        for (const item of presetItems){
            const itemDay = item.menuDay.day

            if(!items[itemDay]){
                items[itemDay] = {
                    dayMealId: item.dayMealId,
                    meal: item.menuDayMeals.meal.name,
                    isActive: item.menuDayMeals.meal.isActive,
                }
            }
        }
        return {
            ...preset,
            items
        }
    }
}