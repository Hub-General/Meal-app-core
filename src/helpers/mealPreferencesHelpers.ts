import { prisma } from "../prisma/client";
import { UserDislikes, UserPreference } from "../schema/userPreference";


interface SimpleMeal {
    id: number,
    foodCode: string
}
export function getExcludedMeals(
    allMeals: SimpleMeal[],
    preference: UserDislikes
): number[] {
    const bannedMealIds = new Set<number>(
        preference.meals ?? []
    );

    const excludedIdsSet = new Set<number>();
    const remainingMeals: SimpleMeal[] = [];

    for (const meal of allMeals) {
        if (bannedMealIds.has(meal.id)) {
            excludedIdsSet.add(meal.id);
        } else {
            remainingMeals.push(meal);
        }
    }

    const dislikedFoodItems = preference.foodItems ?? [];

    if (dislikedFoodItems.length === 0 || remainingMeals.length === 0) {
        return Array.from(excludedIdsSet);
    }

    const dislikedSet = new Set(dislikedFoodItems);

    for (const meal of remainingMeals) {
        if (!meal.foodCode) continue;

        const slots = meal.foodCode.split('-');

        for (const slotValue of slots) {
            if (!slotValue || slotValue === 'OO') continue;

            const subCodes = slotValue.split('|');

            if (subCodes.some(code => dislikedSet.has(code))) {
                excludedIdsSet.add(meal.id);
                break;
            }
        }
    }

    return Array.from(excludedIdsSet);
}