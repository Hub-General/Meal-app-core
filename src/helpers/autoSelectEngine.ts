import { TastePersonality } from "../enums/EPersonalities";
import { StoredTasteProfileMetrics } from "./tasteProfileMetrics";
import { parseFoodCode } from "./foodCodeParser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single day's candidate meals as fetched from menuDayMeals. */
export interface CandidateMeal {
    /** dayMeal (menuDayMeals) id — goes into CreateMealSelectionRequest.dayMealId */
    dayMealId: number;
    /** menuDay id — goes into CreateMealSelectionRequest.menuDayId */
    menuDayId: number;
    meal: {
        id: number;
        name: string;
        foodCode: string;
        calories: number | null;
    };
}

/** One picked day in the output. */
export interface AutoSelectedDay {
    dayMealId: number;
    menuDayId: number;
    mealId: number;
    mealName: string;
    foodCode: string;
    calories: number | null;
}

/** Result of running the engine across all days. */
export type AutoSelectEngineResult = Map<string, AutoSelectedDay>;

// ---------------------------------------------------------------------------
// Personality → randomizer base (0–100)
// ---------------------------------------------------------------------------

const PERSONALITY_RANDOMIZER: Record<TastePersonality, number> = {
    EXPLORER:         80,
    ADVENTUROUS:      65,
    SPICE_CHASER:     30,
    BALANCED:         40,
    COMFORT_SEEKER:   25,
    PROTEIN_LOVER:    20,
    HEALTH_CONSCIOUS: 20,
    HEAVY_EATER:      20,
    LOYALIST:         10,
};

export function deriveRandomizer(personality: TastePersonality): number {
    if ((personality as string) === "TRADITIONALIST") return 10;
    return PERSONALITY_RANDOMIZER[personality] ?? 40;
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

/** Parse 7-block foodCode segments */
function parseFoodCodeSegments(foodCode: string) {
    const parts = parseFoodCode(foodCode);
    return {
        supergroup: parts?.supergroups[0] ?? "",
        meal: parts?.bases[0] ?? "",
        protein: parts?.proteins[0] ?? "",
        preparation: parts?.preparations[0] ?? "",
    };
}

/** Normalise a raw frequency map to [0, 1] scores. */
function normalise(freq: Record<string, number>): Record<string, number> {
    const total = Object.values(freq).reduce((s, v) => s + v, 0);
    if (total === 0) return {};
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(freq)) {
        result[k] = v / total;
    }
    return result;
}

interface ScoringContext {
    /** Normalised frequency maps */
    normMeals: Record<string, number>;
    normProteins: Record<string, number>;
    normPreps: Record<string, number>;
    normSupergroups: Record<string, number>;
    averageCalories: number;
    personality: TastePersonality;
    /** 0–100 entropy level */
    randomizer: number;
    /** max base score seen so far (updated each day, used to scale noise) */
    maxBaseScore: number;
}

/**
 * Score a single candidate meal (pure, no DB calls).
 *
 * Weights:
 *   3.0 × meal-code historical frequency  (strongest: user literally ordered this before)
 *   1.5 × protein-code historical frequency
 *   1.2 × prep-code historical frequency
 *   1.0 × supergroup historical frequency
 *   2.0 × calorie-fit bonus (HEALTH_CONSCIOUS only)
 *
 * Plus random noise scaled by the personality randomizer.
 */
export function scoreCandidate(
    candidate: CandidateMeal,
    ctx: ScoringContext,
    weekUsed: { proteins: Set<string>; supergroups: Set<string> }
): number {
    const { supergroup, meal, protein, preparation } = parseFoodCodeSegments(candidate.meal.foodCode);

    const baseScore =
        3.0 * (ctx.normMeals[meal]            ?? 0) +
        1.5 * (ctx.normProteins[protein]       ?? 0) +
        1.2 * (ctx.normPreps[preparation]      ?? 0) +
        1.0 * (ctx.normSupergroups[supergroup] ?? 0) +
        (ctx.personality === "HEALTH_CONSCIOUS" && candidate.meal.calories && ctx.averageCalories > 0
            ? 2.0 * Math.max(0, 1 - Math.abs(candidate.meal.calories - ctx.averageCalories) / ctx.averageCalories)
            : 0);

    // Anti-repeat penalty (inversely scaled by randomizer — explorers care less)
    const penaltyFactor = 1 - (ctx.randomizer / 100) * 0.5; // ranges [0.5, 1.0]
    const proteinPenalty = weekUsed.proteins.has(protein)       ? 0.8 * penaltyFactor : 0;
    const sgPenalty      = weekUsed.supergroups.has(supergroup) ? 0.5 * penaltyFactor : 0;

    // Random noise: at r=80 noise can equal up to 80% of the max base score
    const noise = (ctx.randomizer / 100) * ctx.maxBaseScore * Math.random();

    return Math.max(0, baseScore - proteinPenalty - sgPenalty + noise);
}

// ---------------------------------------------------------------------------
// Main engine
// ---------------------------------------------------------------------------

/**
 * Select one meal per day from the available candidate pools.
 *
 * @param dayMap      Day-name → candidate meals (e.g. "MONDAY" → [...])
 * @param metrics     Parsed StoredTasteProfileMetrics (null for new users)
 * @param personality The user's taste personality
 * @param excludedIds Meal IDs hard-blacklisted by user preferences
 */
export function autoSelectWeek(
    dayMap: Map<string, CandidateMeal[]>,
    metrics: StoredTasteProfileMetrics | null,
    personality: TastePersonality,
    excludedIds: Set<number>
): AutoSelectEngineResult {
    const randomizer = deriveRandomizer(personality);

    // Build normalised frequency maps once — O(unique codes), reused for all days
    const normMeals       = normalise(metrics?.meals        ?? {});
    const normProteins    = normalise(metrics?.proteins     ?? {});
    const normPreps       = normalise(metrics?.preparations ?? {});
    const normSupergroups = normalise(metrics?.supergroups  ?? {});

    const ctx: ScoringContext = {
        normMeals,
        normProteins,
        normPreps,
        normSupergroups,
        averageCalories: metrics?.averageCalories ?? 0,
        personality,
        randomizer,
        maxBaseScore: 1, // floor at 1 to avoid zero-noise when profile is empty
    };

    const weekUsed = {
        proteins:    new Set<string>(),
        supergroups: new Set<string>(),
    };

    const result: AutoSelectEngineResult = new Map();

    const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

    for (const day of DAY_ORDER) {
        const candidates = dayMap.get(day);
        if (!candidates || candidates.length === 0) continue;

        // Filter hard-blacklisted meals
        const pool = candidates.filter(c => !excludedIds.has(c.meal.id));
        if (pool.length === 0) continue;

        // Compute base scores first to calibrate noise scale for this day
        const baseScores = pool.map(c => {
            const { supergroup, meal, protein, preparation } = parseFoodCode(c.meal.foodCode);
            return (
                3.0 * (normMeals[meal]            ?? 0) +
                1.5 * (normProteins[protein]       ?? 0) +
                1.2 * (normPreps[preparation]      ?? 0) +
                1.0 * (normSupergroups[supergroup] ?? 0)
            );
        });
        ctx.maxBaseScore = Math.max(1, ...baseScores);

        // Pick the highest-scoring candidate
        let best: CandidateMeal | null = null;
        let bestScore = -Infinity;

        for (const candidate of pool) {
            const score = scoreCandidate(candidate, ctx, weekUsed);
            if (score > bestScore) {
                bestScore = score;
                best = candidate;
            }
        }

        if (!best) continue;

        // Register this pick's protein and supergroup for anti-repeat logic on later days
        const { protein, supergroup } = parseFoodCode(best.meal.foodCode);
        if (protein)    weekUsed.proteins.add(protein);
        if (supergroup) weekUsed.supergroups.add(supergroup);

        result.set(day, {
            dayMealId: best.dayMealId,
            menuDayId: best.menuDayId,
            mealId:    best.meal.id,
            mealName:  best.meal.name,
            foodCode:  best.meal.foodCode,
            calories:  best.meal.calories,
        });
    }

    return result;
}
