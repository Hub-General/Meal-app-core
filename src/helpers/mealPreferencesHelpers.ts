import { ExcludedMealItem, UserDislikes } from "../schema/userPreference";
import { getFoodCodeValues } from "./foodCodeParser";

export interface SimpleMeal {
    id: number;
    foodCode: string;
    name?: string;
    imagePath?: string | null;
    calories?: number | null;
}

export function extractDislikedCodes(preference: Partial<UserDislikes>): Set<string> {
    const rawTokens: string[] = [
        ...(preference.foodItems ?? []),
        ...(preference.supergroups ?? []),
        ...(preference.bases ?? []),
        ...(preference.variations ?? []),
        ...(preference.proteins ?? []),
        ...(preference.accompaniments ?? []),
        ...(preference.modifiers ?? []),
        ...(preference.preparations ?? []),
    ];

    return new Set(
        rawTokens
            .flatMap((value) => getFoodCodeValues(value))
            .map((code) => code.trim().toUpperCase())
            .filter((code) => code !== "" && code !== "OO")
    );
}

export function getExcludedMeals(
    allMeals: SimpleMeal[],
    preference: Partial<UserDislikes>
): number[] {
    const bannedMealIds = new Set<number>(preference.meals ?? []);
    const excludedMealIds = new Set<number>(bannedMealIds);
    const dislikedCodes = extractDislikedCodes(preference);

    if (dislikedCodes.size === 0) {
        return Array.from(excludedMealIds);
    }

    for (const meal of allMeals) {
        if (bannedMealIds.has(meal.id)) continue;

        const mealCodes = getFoodCodeValues(meal.foodCode);
        if (mealCodes.some((code) => dislikedCodes.has(code))) {
            excludedMealIds.add(meal.id);
        }
    }

    return Array.from(excludedMealIds);
}

export function getExcludedMealDetails(
    allMeals: SimpleMeal[],
    preference: Partial<UserDislikes>
): ExcludedMealItem[] {
    const bannedMealIds = new Set<number>(preference.meals ?? []);
    const dislikedCodes = extractDislikedCodes(preference);
    const results: ExcludedMealItem[] = [];

    for (const meal of allMeals) {
        const isBanned = bannedMealIds.has(meal.id);
        const mealCodes = getFoodCodeValues(meal.foodCode);
        const matched = mealCodes.filter((code) => dislikedCodes.has(code));

        if (isBanned || matched.length > 0) {
            results.push({
                id: meal.id,
                name: meal.name ?? `Meal #${meal.id}`,
                foodCode: meal.foodCode,
                imagePath: meal.imagePath,
                calories: meal.calories,
                reason: isBanned ? "BANNED_MEAL" : "DISLIKED_INGREDIENT",
                matchedDislikes: isBanned ? [] : matched,
            });
        }
    }

    return results;
}