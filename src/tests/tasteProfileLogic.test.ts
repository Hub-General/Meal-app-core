import assert from "node:assert/strict";
import { getExcludedMeals } from "../helpers/mealPreferencesHelpers";
import { parseFoodCode } from "../helpers/foodCodeParser";
import { tasteProfileHelper } from "../helpers/tasteProfileMetrics";

const profile = tasteProfileHelper.generateProfile([
    {
        dayMeal: {
            meal: {
                id: 1,
                name: "Fufu with Goat Light Soup",
                calories: 800,
                foodCode: "S-FU-OO-GT-LS-OO-OO",
            },
        },
    },
    {
        dayMeal: {
            meal: {
                id: 2,
                name: "Assorted Jollof with Chicken",
                calories: 850,
                foodCode: "R-JO-AS-EG|SS|BF|CH-OO-OO-OO",
            },
        },
    },
]);

assert.equal(profile.metrics.supergroups.S, 1);
assert.equal(profile.metrics.bases.FU, 1);
assert.equal(profile.metrics.variations.AS, 1);
assert.equal(profile.metrics.proteins.GT, 1);
assert.equal(profile.metrics.proteins.CH, 1);
assert.equal(profile.metrics.accompaniments.LS, 1);
assert.equal(profile.metrics.proteins.OO, undefined);
assert.notEqual(profile.favorites.favoriteProtein, "OO");
assert.deepEqual(parseFoodCode("R-JO-OO-CH-OO-OO-G")?.preparations, ["G"]);
assert.equal(parseFoodCode("R-JO-CH-F"), null);

const excludedMealIds = getExcludedMeals(
    [
        { id: 1, foodCode: "S-FU-OO-GT-LS-OO-OO" },
        { id: 2, foodCode: "R-JO-AS-EG|SS|BF|CH-OO-OO-OO" },
        { id: 3, foodCode: "R-PR-OO-OO-ST-OO-OO" },
        { id: 4, foodCode: "R-JO-CH-F" },
    ],
    { meals: [], foodItems: ["OO", "CH"] }
);

assert.deepEqual(excludedMealIds.sort((a, b) => a - b), [2, 4]);
assert.deepEqual(
    getExcludedMeals([{ id: 3, foodCode: "R-PR-OO-OO-ST-OO-OO" }], {
        meals: [3],
        foodItems: [],
    }),
    [3]
);

console.log("Taste profile FoodCode logic passed.");
