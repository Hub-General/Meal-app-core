import { Days } from "../generated/prisma";
import { MealSelection } from "../schema/mealSelection";

type FormatterSelection = {
    menuDay: {
        day: Days;
    };
    dayMeal: {
        meal: {
            id: number;
            name: string;
            image?: string | null;
        };
    };
    createdByUser?: {
        name: string;
    } | null;
    createdForUser?: {
        name: string;
    } | null;
};

type MealSelectionSummary = {
    foodId: number;
    food: string;
    imageUrl: string | null;
    count: number;
    userInfo: {
        userName: string;
    }[];
};

type DaySelectionSummary = {
    total: number;
    response: MealSelectionSummary[];
};

type GroupedSelectionResponse = Record<string, DaySelectionSummary>;

export function selectionResponseFormatter(selections: MealSelection[]): GroupedSelectionResponse {
    const groupedSelections: GroupedSelectionResponse = {};

    for (const selection of selections) {
        const day = selection.dayMeal.day;
        const meal = selection.dayMeal.meal;
        const userName = selection.createdForUser?.name ?? "HR Selection";

        // Create the day object the first time we encounter a selection for that day.
        if (!groupedSelections[day]) {
            groupedSelections[day] = {
                total: 0,
                response: [],
            };
        }

        const dayGroup = groupedSelections[day];

        // Find the existing meal group so repeated selections increase its count instead of creating duplicates.
        let mealGroup = dayGroup.response.find((item) => item.foodId === meal.id);

        if (!mealGroup) {
            mealGroup = {
                food: meal.name,
                foodId: meal.id,
                imageUrl: meal.image ?? null,
                count: 0,
                userInfo: [],
            };
            dayGroup.response.push(mealGroup);
        }

        // Add this selection to both the day total and the selected meal's total.
        dayGroup.total += 1;
        mealGroup.count += 1;
        mealGroup.userInfo.push({ userName });
    }

    return groupedSelections;
}