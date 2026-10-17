import assert from "node:assert/strict";
import {
    buildFoodCode,
    validateFoodCode,
    parseFoodCode,
    parseLegacyFoodCode,
    parseAnyFoodCode,
    getFoodCodeValues,
    FOOD_CODE_DIMENSIONS_COUNT,
} from "../helpers/foodCodeParser";
import { getExcludedMeals, getExcludedMealDetails } from "../helpers/mealPreferencesHelpers";
import { tasteProfileHelper } from "../helpers/tasteProfileMetrics";

console.log("🧪 Running FoodCode Taxonomy & Helper Tests...\n");

// 1. Invariant: Exactly 7 dimensions
assert.equal(FOOD_CODE_DIMENSIONS_COUNT, 7);

// 2. parseFoodCode: 7-block parsing
const parsed7 = parseFoodCode("R-JO-AS-EG|SS|BF|CH-ST-PP-G");
assert.notEqual(parsed7, null);
assert.deepEqual(parsed7?.supergroups, ["R"]);
assert.deepEqual(parsed7?.bases, ["JO"]);
assert.deepEqual(parsed7?.variations, ["AS"]);
assert.deepEqual(parsed7?.proteins, ["EG", "SS", "BF", "CH"]);
assert.deepEqual(parsed7?.accompaniments, ["ST"]);
assert.deepEqual(parsed7?.modifiers, ["PP"]);
assert.deepEqual(parsed7?.preparations, ["G"]);

// 3. parseFoodCode: OO placeholder handling
const parsedWithOO = parseFoodCode("S-FU-OO-GT-LS-OO-OO");
assert.notEqual(parsedWithOO, null);
assert.deepEqual(parsedWithOO?.supergroups, ["S"]);
assert.deepEqual(parsedWithOO?.bases, ["FU"]);
assert.deepEqual(parsedWithOO?.variations, []);
assert.deepEqual(parsedWithOO?.proteins, ["GT"]);
assert.deepEqual(parsedWithOO?.accompaniments, ["LS"]);
assert.deepEqual(parsedWithOO?.modifiers, []);
assert.deepEqual(parsedWithOO?.preparations, []);

// 4. parseFoodCode: Rejection of non-7-block codes
assert.equal(parseFoodCode("R-JO-CH-F"), null);
assert.equal(parseFoodCode("R-JO-AS-CH-ST-F"), null);
assert.equal(parseFoodCode("R-JO-AS-CH-ST-PP-F-EXTRA"), null);
assert.equal(parseFoodCode(""), null);

// 5. Legacy 4-block backwards compatibility
const legacy = parseLegacyFoodCode("R-JO-CH-F");
assert.notEqual(legacy, null);
assert.deepEqual(legacy?.supergroups, ["R"]);
assert.deepEqual(legacy?.bases, ["JO"]);
assert.deepEqual(legacy?.proteins, ["CH"]);
assert.deepEqual(legacy?.preparations, ["F"]);
assert.deepEqual(legacy?.variations, []);
assert.deepEqual(legacy?.accompaniments, []);
assert.deepEqual(legacy?.modifiers, []);

// 6. parseAnyFoodCode: handles both 7-block and 4-block gracefully
const any7 = parseAnyFoodCode("R-JO-CK-CH-OO-OO-F");
assert.notEqual(any7, null);
assert.deepEqual(any7?.variations, ["CK"]);

const any4 = parseAnyFoodCode("R-JO-CH-F");
assert.notEqual(any4, null);
assert.deepEqual(any4?.bases, ["JO"]);

// 7. buildFoodCode: deterministic ordering and default OO
const built1 = buildFoodCode({
    supergroup: "R",
    base: "JO",
    variation: "CK",
    protein: "CH",
    prep: "F",
});
assert.equal(built1, "R-JO-CK-CH-OO-OO-F");

const built2 = buildFoodCode({
    supergroup: "S",
    base: "FU",
    protein: "GT",
    accompaniment: "LS",
});
assert.equal(built2, "S-FU-OO-GT-LS-OO-OO");

const builtAllEmpty = buildFoodCode({});
assert.equal(builtAllEmpty, "OO-OO-OO-OO-OO-OO-OO");

// 8. validateFoodCode: check valid and invalid shapes
assert.equal(validateFoodCode("R-JO-CK-CH-OO-OO-F"), true);
assert.equal(validateFoodCode("X-CB|FRI-OO-CW-OO-OO-OO"), true);
assert.equal(validateFoodCode("R-JO-AS-EG|SS|BF|CH-OO-OO-G"), true);
assert.equal(validateFoodCode("R-JO-CH-F"), false);
assert.equal(validateFoodCode("invalid-code"), false);
assert.equal(validateFoodCode(""), false);

// 9. getFoodCodeValues: extract all individual tokens
const values = getFoodCodeValues("R-JO-AS-EG|SS|BF|CH-ST-PP-G");
assert.deepEqual(values, ["R", "JO", "AS", "EG", "SS", "BF", "CH", "ST", "PP", "G"]);

const valuesWithOO = getFoodCodeValues("S-FU-OO-GT-LS-OO-OO");
assert.deepEqual(valuesWithOO, ["S", "FU", "GT", "LS"]);

// 10. Preference exclusion with 7-block food codes
const mealsToFilter = [
    { id: 1, foodCode: "S-FU-OO-GT-LS-OO-OO" },
    { id: 2, foodCode: "R-JO-AS-EG|SS|BF|CH-OO-OO-OO" },
    { id: 3, foodCode: "R-PR-OO-OO-ST-OO-OO" },
    { id: 4, foodCode: "T-YM-OO-OO-GES-OO-OO" },
];
// User dislikes Chicken ("CH")
const excludedCH = getExcludedMeals(mealsToFilter, { meals: [], foodItems: ["CH"] });
assert.deepEqual(excludedCH, [2]);

// User dislikes Garden Egg Stew ("GES")
const excludedGES = getExcludedMeals(mealsToFilter, { meals: [], foodItems: ["GES"] });
assert.deepEqual(excludedGES, [4]);

// 11. Taste profile generation with 7-block codes
const profile = tasteProfileHelper.generateProfile([
    {
        dayMeal: {
            meal: {
                id: 101,
                name: "Fufu with Goat Light Soup",
                calories: 800,
                foodCode: "S-FU-OO-GT-LS-OO-OO",
            },
        },
    },
    {
        dayMeal: {
            meal: {
                id: 102,
                name: "Peppered Gizzard Jollof Check-Check",
                calories: 900,
                foodCode: "R-JO-CK-GZ-OO-PP-F",
            },
        },
    },
]);

assert.equal(profile.metrics.supergroups.S, 1);
assert.equal(profile.metrics.supergroups.R, 1);
assert.equal(profile.metrics.bases.FU, 1);
assert.equal(profile.metrics.bases.JO, 1);
assert.equal(profile.metrics.variations.CK, 1);
assert.equal(profile.metrics.proteins.GT, 1);
assert.equal(profile.metrics.proteins.GZ, 1);
assert.equal(profile.metrics.accompaniments.LS, 1);
assert.equal(profile.metrics.modifiers.PP, 1);
assert.equal(profile.metrics.preparations.F, 1);
assert.equal(profile.totalMealsSelected, 2);
assert.equal(profile.favorites.favoriteBase, "FU");
assert.equal(profile.favorites.favoriteSupergroup, "S");
assert.equal(profile.favorites.favoriteAccompaniment, "LS");

// 12. HEAVY_EATER personality determination (frequent swallow consumer >= 35%)
const heavyEaterProfile = tasteProfileHelper.generateProfile([
    {
        dayMeal: {
            meal: {
                id: 201,
                name: "Banku with Tilapia",
                calories: 750,
                foodCode: "S-BK-OO-TI-OO-OO-G",
            },
        },
    },
    {
        dayMeal: {
            meal: {
                id: 202,
                name: "Fufu with Goat Light Soup",
                calories: 800,
                foodCode: "S-FU-OO-GT-LS-OO-OO",
            },
        },
    },
    {
        dayMeal: {
            meal: {
                id: 203,
                name: "Fried Rice with Chicken",
                calories: 700,
                foodCode: "R-FR-OO-CH-OO-OO-F",
            },
        },
    },
]);

// 2 out of 3 meals are swallows (66.7% >= 35%) -> HEAVY_EATER
assert.equal(heavyEaterProfile.personalityType, "HEAVY_EATER");
assert.equal(heavyEaterProfile.metrics.swallowCount, 2);
assert.equal(heavyEaterProfile.metrics.swallowRatio, 0.67);

// 13. Detailed Excluded Meals with Dimension Dislikes
const detailedExcluded = getExcludedMealDetails(
    [
        { id: 1, name: "Fufu with Light Soup", foodCode: "S-FU-OO-GT-LS-OO-OO" },
        { id: 2, name: "Jollof with Chicken", foodCode: "R-JO-OO-CH-OO-OO-F" },
        { id: 3, name: "Yam with Garden Egg Stew", foodCode: "T-YM-OO-OO-GES-OO-OO" },
    ],
    {
        meals: [],
        supergroups: ["S"], // Dislikes all Swallows
        accompaniments: ["GES"], // Dislikes Garden Egg Stew
    }
);

assert.equal(detailedExcluded.length, 2);
assert.equal(detailedExcluded[0]?.id, 1);
assert.deepEqual(detailedExcluded[0]?.matchedDislikes, ["S"]);
assert.equal(detailedExcluded[1]?.id, 3);
assert.deepEqual(detailedExcluded[1]?.matchedDislikes, ["GES"]);

console.log("✅ All FoodCode Taxonomy, HEAVY_EATER & Preference Tests passed successfully!\n");

