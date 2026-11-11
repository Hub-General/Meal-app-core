import z from "zod";
import { Days } from "../generated/prisma";
import { TastePersonality } from "../enums/EPersonalities";
import { StoredTasteProfileMetrics, TopMealDetail } from "../helpers/tasteProfileMetrics";

export const tasteProfileSchema = z.object({
    userId: z.number().int().positive(),
    calendarYear: z.number().int().min(2000),
    totalMealsSelected: z.number().int().min(0),
    metrics: z.string(),
    personalityType: z.string().optional(),
    updatedAt: z.date(),
});

export interface TasteProfileMetrics {
    supergroups: Record<string, number>;
    bases: Record<string, number>;
    variations: Record<string, number>;
    proteins: Record<string, number>; 
    accompaniments: Record<string, number>;
    modifiers: Record<string, number>;
    preparations: Record<string, number>;
    meals: Record<string, number>;
    combinations: Record<string, number>;

    uniqueMeals: number;
    repeatedMeals: number;

    diversityScore: number;
    consistencyScore: number;

    favouriteMealId?: number;
    favouriteDay?: Days;
    favoriteBase?: string;
    favoriteSupergroup?: string;
    favoriteAccompaniment?: string;
    swallowCount?: number;
    swallowRatio?: number;

    dislikes?: {
        supergroups?: string[];
        bases?: string[];
        variations?: string[];
        proteins?: string[];
        accompaniments?: string[];
        modifiers?: string[];
        preparations?: string[];
        flavours?: string[];
        foodItems?: string[];
        meals?: number[];
    };
}

export type TasteProfile = z.infer<typeof tasteProfileSchema>;

// ---------------------------------------------------------------------------
// Recap / Wrapped Standardized Sub-Interfaces
// ---------------------------------------------------------------------------

export type RecapMetricKey =
    | "loyalty"
    | "explorer"
    | "swallow"
    | "spice"
    | "volume";

export type RecapCardCategory =
    | "OVERVIEW"
    | "PERSONALITY"
    | "PERSONALITY_MAP"
    | "TOP_MEAL"
    | "OFFICE_CROWN"
    | "PROTEIN_CHAMPION"
    | "CONTRARIAN"
    | "LOYALTY"
    | "EXPLORER"
    | "SWALLOW"
    | "SPICE"
    | "TASTE_TWIN"
    | "TASTE_OPPOSITE";

/**
 * Shared base contract across all Recap sections, rankings, and story slides.
 * `rank` is a 1-based number (or null if non-ranked) — no redundant boolean flags.
 */
export interface RecapStatBase {
    title: string;                // Main comparative headline, e.g. "You are the #1 most loyal eater in the office!"
    subtitle: string;             // Supporting context, e.g. "You are 1 of 6 Explorers in the office"
    description: string;          // Narrative / comparison detail
    rank: number | null;          // 1-based rank (frontend derives #1, top 3, etc. from this)
    totalParticipants: number;    // Total users compared
}

/**
 * Standardized comparative ranking metric (used in `rankings` and `rankingList`).
 */
export interface RecapRankingStat extends RecapStatBase {
    key: RecapMetricKey;
    label: string;                // e.g. "Loyalty Ranking", "Explorer Ranking"
    rank: number;                 // 1-based competition rank in the office (1 = highest)
    value: number;                // User's numeric score/count for this metric
    unit: string;                 // "%", "unique meals", "meals", "spicy meals"
    percentile: number;           // Top percentage (1–100, e.g. ceil(rank / total * 100); rank 1 of 50 => 2)
    topPercent: number;           // Top percentage (1–100, e.g. ceil(rank / total * 100))
    beatsPercentage: number;      // Percentage of peers beaten or tied (0–100)
    officeAverage: number;        // Office-wide average for this metric
}

/**
 * Standardized Personality sub-recap ("You are 1 of 6 Explorers").
 */
export interface RecapPersonalitySummary extends RecapStatBase {
    type: TastePersonality;
    name: string;
    cohortCount: number;          // Total users sharing this personality in the same year
    cohortPercentage: number;     // % of office with this personality
}

export interface RecapPersonalityCohortItem {
    type: TastePersonality;
    name: string;
    count: number;
    percentage: number;
    isUser: boolean;
}

/**
 * Standardized Spotify-Wrapped story slide card (extends `RecapStatBase`).
 */
export interface RecapSlideCard<TMetadata = unknown> extends RecapStatBase {
    id: string;
    category: RecapCardCategory;
    slideOrder: number;
    value: string | number;       // Hero display value, e.g. 31, "Explorer", "Chicken"
    unit: string;                 // Label/unit for hero value, e.g. "unique meals", "%"
    percentile: number | null;
    officeAverage: number | null;
    metadata?: TMetadata;
}

export interface TasteProfileRecapResponse {
    message?: string;
    cards: RecapSlideCard[];
}
