import { ExcludedMealItem, UserDislikes } from "../schema/userPreference";
import { parseAnyFoodCode, getFoodCodeValues } from "./foodCodeParser";

export interface SimpleMeal {
  id: number;
  foodCode: string;
  name?: string;
  imagePath?: string | null;
  calories?: number | null;
}

interface NormalizedDislikes {
  bannedMealIds: Set<number>;
  catchAllFoodItems: Set<string>;
  supergroups: Set<string>;
  bases: Set<string>;
  variations: Set<string>;
  proteins: Set<string>;
  accompaniments: Set<string>;
  modifiers: Set<string>;
  preparations: Set<string>;
  hasAnyDislikes: boolean;
}

function normalizeTokens(tokens?: string[]): Set<string> {
  if (!tokens || tokens.length === 0) return new Set();
  return new Set(
    tokens
      .flatMap((v) => getFoodCodeValues(v))
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c !== "" && c !== "OO")
  );
}

function normalizeDislikes(preference: Partial<UserDislikes>): NormalizedDislikes {
  const bannedMealIds = new Set<number>(preference.meals ?? []);
  const catchAllFoodItems = normalizeTokens(preference.foodItems);
  const supergroups = normalizeTokens(preference.supergroups);
  const bases = normalizeTokens(preference.bases);
  const variations = normalizeTokens(preference.variations);
  const proteins = normalizeTokens(preference.proteins);
  const accompaniments = normalizeTokens(preference.accompaniments);
  const modifiers = normalizeTokens(preference.modifiers);
  const preparations = normalizeTokens(preference.preparations);

  const hasAnyDislikes =
    bannedMealIds.size > 0 ||
    catchAllFoodItems.size > 0 ||
    supergroups.size > 0 ||
    bases.size > 0 ||
    variations.size > 0 ||
    proteins.size > 0 ||
    accompaniments.size > 0 ||
    modifiers.size > 0 ||
    preparations.size > 0;

  return {
    bannedMealIds,
    catchAllFoodItems,
    supergroups,
    bases,
    variations,
    proteins,
    accompaniments,
    modifiers,
    preparations,
    hasAnyDislikes,
  };
}

/**
 * Checks whether a meal's parsed dimensions or tokens trigger any user dislikes.
 * Returns the list of matched disliked codes.
 */
function matchDislikedTokens(mealCode: string, dislikes: NormalizedDislikes): string[] {
  const matched = new Set<string>();
  const parsed = parseAnyFoodCode(mealCode);

  if (parsed) {
    // Dimension-specific checks (and catch-all foodItems check)
    for (const code of parsed.supergroups) {
      if (dislikes.supergroups.has(code) || dislikes.catchAllFoodItems.has(code)) matched.add(code);
    }
    for (const code of parsed.bases) {
      if (dislikes.bases.has(code) || dislikes.catchAllFoodItems.has(code)) matched.add(code);
    }
    for (const code of parsed.variations) {
      if (dislikes.variations.has(code) || dislikes.catchAllFoodItems.has(code)) matched.add(code);
    }
    for (const code of parsed.proteins) {
      if (dislikes.proteins.has(code) || dislikes.catchAllFoodItems.has(code)) matched.add(code);
    }
    for (const code of parsed.accompaniments) {
      if (dislikes.accompaniments.has(code) || dislikes.catchAllFoodItems.has(code)) matched.add(code);
    }
    for (const code of parsed.modifiers) {
      if (dislikes.modifiers.has(code) || dislikes.catchAllFoodItems.has(code)) matched.add(code);
    }
    for (const code of parsed.preparations) {
      if (dislikes.preparations.has(code) || dislikes.catchAllFoodItems.has(code)) matched.add(code);
    }
  } else {
    // Fallback if code could not be parsed into 7 or 4 blocks
    const allTokens = getFoodCodeValues(mealCode);
    for (const token of allTokens) {
      if (
        dislikes.catchAllFoodItems.has(token) ||
        dislikes.supergroups.has(token) ||
        dislikes.bases.has(token) ||
        dislikes.variations.has(token) ||
        dislikes.proteins.has(token) ||
        dislikes.accompaniments.has(token) ||
        dislikes.modifiers.has(token) ||
        dislikes.preparations.has(token)
      ) {
        matched.add(token);
      }
    }
  }

  return Array.from(matched);
}

export function extractDislikedCodes(preference: Partial<UserDislikes>): Set<string> {
  const norm = normalizeDislikes(preference);
  return new Set<string>([
    ...norm.catchAllFoodItems,
    ...norm.supergroups,
    ...norm.bases,
    ...norm.variations,
    ...norm.proteins,
    ...norm.accompaniments,
    ...norm.modifiers,
    ...norm.preparations,
  ]);
}

export function getExcludedMeals(
  allMeals: SimpleMeal[],
  preference: Partial<UserDislikes>
): number[] {
  const norm = normalizeDislikes(preference);
  if (!norm.hasAnyDislikes) {
    return [];
  }

  const excludedMealIds = new Set<number>(norm.bannedMealIds);

  for (const meal of allMeals) {
    if (excludedMealIds.has(meal.id)) continue;

    const matches = matchDislikedTokens(meal.foodCode, norm);
    if (matches.length > 0) {
      excludedMealIds.add(meal.id);
    }
  }

  return Array.from(excludedMealIds);
}

export function getExcludedMealDetails(
  allMeals: SimpleMeal[],
  preference: Partial<UserDislikes>
): ExcludedMealItem[] {
  const norm = normalizeDislikes(preference);
  const results: ExcludedMealItem[] = [];

  for (const meal of allMeals) {
    const isBanned = norm.bannedMealIds.has(meal.id);
    const matched = isBanned ? [] : matchDislikedTokens(meal.foodCode, norm);

    if (isBanned || matched.length > 0) {
      results.push({
        id: meal.id,
        name: meal.name ?? `Meal #${meal.id}`,
        foodCode: meal.foodCode,
        imagePath: meal.imagePath,
        calories: meal.calories,
        reason: isBanned ? "BANNED_MEAL" : "DISLIKED_INGREDIENT",
        matchedDislikes: matched,
      });
    }
  }

  return results;
}