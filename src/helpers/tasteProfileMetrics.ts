import { TastePersonality } from "../enums/EPersonalities";
import { parseAnyFoodCode } from "./foodCodeParser";

interface TasteProfileSelection {
    dayMeal: {
        meal: {
            id: number;
            name?: string;
            calories: number | null;
            foodCode: string;
        }
    } | null;
}

export interface TasteProfileMetrics {
    supergroups: Record<string, number>;
    bases: Record<string, number>;
    variations: Record<string, number>;
    meals: Record<string, number>;
    proteins: Record<string, number>;
    accompaniments: Record<string, number>;
    modifiers: Record<string, number>;
    preparations: Record<string, number>;
    combinations: Record<string, number>;
}

export interface TasteProfileFavorites {
    favoriteProtein?: string;
    favoriteMeal?: { id: number; name: string; count: number };
    favoriteBase?: string;
    favoriteSupergroup?: string;
    favoriteAccompaniment?: string;
}

interface TasteProfileCounts {
    totalSelections: number;
    uniqueMeals: number;
    repeatedMeals: number;
    totalCalories: number;
    averageCalories: number;
}

interface TasteProfileScores {
    diversityScore: number;
    consistencyScore: number;
}

export interface TopMealDetail {
    id: number;
    name: string;
    foodCode: string;
    count: number;
}

export type StoredTasteProfileMetrics = TasteProfileMetrics &
    Omit<TasteProfileCounts, "totalSelections"> &
    TasteProfileScores & {
        uniqueMealIds: number[];
        topMeals: TopMealDetail[];
        swallowCount?: number;
        swallowRatio?: number;
    };

export interface GeneratedTasteProfile {
    totalMealsSelected: number;
    metrics: StoredTasteProfileMetrics;
    favorites: TasteProfileFavorites;
    personalityType: TastePersonality;
}


interface PersonalityContext {
    diversity: number;
    consistency: number;
    avgCalories: number;
    proteinRatio: number;
    isSpicy: boolean;
    swallowRatio: number;
}

const PERSONALITY_RULES: Array<{ type: TastePersonality; test: (c: PersonalityContext) => boolean }> = [
    { type: "ADVENTUROUS", test: (c) => c.diversity >= 75 && c.isSpicy },
    { type: "SPICE_CHASER", test: (c) => c.isSpicy },
    { type: "HEAVY_EATER", test: (c) => c.swallowRatio >= 0.35 },
    { type: "HEALTH_CONSCIOUS", test: (c) => c.avgCalories > 0 && c.avgCalories <= 550 },
    { type: "PROTEIN_LOVER", test: (c) => c.proteinRatio >= 0.45 },
    { type: "EXPLORER", test: (c) => c.diversity >= 70 },
    { type: "TRADITIONALIST", test: (c) => c.consistency >= 60 },
    { type: "COMFORT_SEEKER", test: (c) => c.consistency >= 40 },
];

export const tasteProfileHelper = {
    findFavorite(metric: Record<string, number>): string | undefined {
        return this.findFavoriteEntry(metric)?.[0];
    },

    findFavoriteEntry(metric: Record<string, number>): [string, number] | undefined {
        return Object.entries(metric).reduce<[string, number] | undefined>(
            (best, current) => (!best || current[1] > best[1] ? current : best),
            undefined
        );
    },

    increment(metric: Map<string, number>, key?: string) {
        if (key) {
            metric.set(key, (metric.get(key) ?? 0) + 1);
        }
    },

    buildMetrics(selections: TasteProfileSelection[]) {
        const supergroups = new Map<string, number>();
        const bases = new Map<string, number>();
        const variations = new Map<string, number>();
        const meals = new Map<string, number>();
        const proteins = new Map<string, number>();
        const accompaniments = new Map<string, number>();
        const modifiers = new Map<string, number>();
        const preparations = new Map<string, number>();
        const combinations = new Map<string, number>();
        const uniqueMealIds = new Set<number>();
        const mealDetails = new Map<number, TopMealDetail>();
        let totalSelections = 0;
        let totalCalories = 0;

        for (const selection of selections) {
            if (!selection.dayMeal) continue;
            const mealObj = selection.dayMeal.meal;
            const parts = parseAnyFoodCode(mealObj.foodCode);
            uniqueMealIds.add(mealObj.id);
            totalCalories += mealObj.calories ?? 0;

            const existingMeal = mealDetails.get(mealObj.id);
            if (existingMeal) {
                existingMeal.count += 1;
            } else {
                mealDetails.set(mealObj.id, {
                    id: mealObj.id,
                    name: mealObj.name || parts?.bases[0] || `Meal #${mealObj.id}`,
                    foodCode: mealObj.foodCode,
                    count: 1,
                });
            }

            if (parts) {
                for (const value of parts.supergroups) this.increment(supergroups, value);
                for (const value of parts.bases) {
                    this.increment(bases, value);
                    this.increment(meals, value);
                }
                for (const value of parts.variations) this.increment(variations, value);
                for (const value of parts.proteins) this.increment(proteins, value);
                for (const value of parts.accompaniments) this.increment(accompaniments, value);
                for (const value of parts.modifiers) this.increment(modifiers, value);
                for (const value of parts.preparations) this.increment(preparations, value);

                for (const protein of parts.proteins) {
                    for (const preparation of parts.preparations) {
                        this.increment(combinations, `${protein}-${preparation}`);
                    }
                }
            }

            totalSelections++;
        }

        const topMeals = Array.from(mealDetails.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const metrics: TasteProfileMetrics = {
            supergroups: Object.fromEntries(supergroups),
            bases: Object.fromEntries(bases),
            variations: Object.fromEntries(variations),
            proteins: Object.fromEntries(proteins),
            meals: Object.fromEntries(meals),
            accompaniments: Object.fromEntries(accompaniments),
            modifiers: Object.fromEntries(modifiers),
            preparations: Object.fromEntries(preparations),
            combinations: Object.fromEntries(combinations),
        };
        const counts: TasteProfileCounts = {
            totalSelections,
            uniqueMeals: uniqueMealIds.size,
            repeatedMeals: totalSelections - uniqueMealIds.size,
            totalCalories,
            averageCalories: totalSelections > 0 ? Math.round(totalCalories / totalSelections) : 0,
        };
        return { counts, metrics, uniqueMealIds: Array.from(uniqueMealIds), topMeals };
    },

    getFavorites(metrics: TasteProfileMetrics): TasteProfileFavorites {
        return {
            favoriteProtein: this.findFavorite(metrics.proteins),
            favoriteBase: this.findFavorite(metrics.bases),
            favoriteSupergroup: this.findFavorite(metrics.supergroups),
            favoriteAccompaniment: this.findFavorite(metrics.accompaniments),
        };
    },

    calculateScores(counts: TasteProfileCounts): TasteProfileScores {
        if (counts.totalSelections === 0) {
            return {
                diversityScore: 0,
                consistencyScore: 0,
            };
        }

        const mealScores: TasteProfileScores = {
            diversityScore: Math.round((counts.uniqueMeals / counts.totalSelections) * 100),
            consistencyScore: Math.round((counts.repeatedMeals / counts.totalSelections) * 100),
        };

        return mealScores;
    },

    determinePersonality(
        counts: TasteProfileCounts,
        scores: TasteProfileScores,
        pepperedCount = 0,
        favoriteProteinCount = 0,
        swallowCount = 0
    ): TastePersonality {
        const pepperedRatio = counts.totalSelections > 0 ? pepperedCount / counts.totalSelections : 0;
        const swallowRatio = counts.totalSelections > 0 ? swallowCount / counts.totalSelections : 0;
        const ctx: PersonalityContext = {
            diversity: scores.diversityScore,
            consistency: scores.consistencyScore,
            avgCalories: counts.averageCalories,
            proteinRatio: counts.totalSelections > 0 ? favoriteProteinCount / counts.totalSelections : 0,
            isSpicy: pepperedRatio >= 0.3,
            swallowRatio,
        };

        return PERSONALITY_RULES.find((rule) => rule.test(ctx))?.type ?? "BALANCED";
    },

    generateProfile(selections: TasteProfileSelection[]): GeneratedTasteProfile {
        const { counts, metrics, uniqueMealIds, topMeals } = this.buildMetrics(selections);
        const scores = this.calculateScores(counts);
        const favoriteProtein = this.findFavoriteEntry(metrics.proteins);
        const swallowCount = metrics.supergroups.S ?? 0;
        const swallowRatio = counts.totalSelections > 0 ? Number((swallowCount / counts.totalSelections).toFixed(2)) : 0;

        const personalityType = this.determinePersonality(
            counts,
            scores,
            metrics.modifiers.PP ?? 0,
            favoriteProtein?.[1],
            swallowCount
        );

        const favorites = this.getFavorites(metrics);
        favorites.favoriteMeal = topMeals[0]
            ? { id: topMeals[0].id, name: topMeals[0].name, count: topMeals[0].count }
            : undefined;

        return {
            totalMealsSelected: counts.totalSelections,
            metrics: {
                ...metrics,
                uniqueMeals: counts.uniqueMeals,
                repeatedMeals: counts.repeatedMeals,
                totalCalories: counts.totalCalories,
                averageCalories: counts.averageCalories,
                uniqueMealIds,
                topMeals,
                swallowCount,
                swallowRatio,
                ...scores,
            },
            favorites,
            personalityType,
        };
    },
};
