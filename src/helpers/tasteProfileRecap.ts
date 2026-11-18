import { TastePersonality, tastePersonalities } from "../enums/EPersonalities";
import {
    RecapCardCategory,
    RecapMetricKey,
    RecapPersonalityCohortItem,
    RecapRankingStat,
    RecapSlideCard,
    TasteProfileRecapResponse,
} from "../schema/tasteProfile";
import {
    SPICE_MODIFIER,
    SWALLOW_SUPERGROUP,
    StoredTasteProfileMetrics,
    TopMealDetail,
    tasteProfileHelper,
} from "./tasteProfileMetrics";

export interface RawTasteProfileRow {
    userId: number;
    calendarYear: number;
    totalMealsSelected: number;
    metrics: unknown;
    personalityType: string | null;
    favoriteProtein: string | null;
    updatedAt: Date;
    user?: {
        id: number;
        name: string;
    } | null;
}

interface ParsedProfileRow extends RawTasteProfileRow {
    parsedMetrics: StoredTasteProfileMetrics;
    resolvedPersonality: TastePersonality;
    resolvedFavoriteProtein: string | null;
    mealFreq: Record<string, number>;
    mealNorm: number;
    proteinNorm: number;
    baseNorm: number;
}

interface CachedPeerCandidate {
    peer: ParsedProfileRow;
    score: number;
    sharedMealsCount: number;
    sharesFavProtein: boolean;
}

interface CachedPeerMatchPair {
    twin: CachedPeerCandidate | null;
    opposite: CachedPeerCandidate | null;
}

interface OfficeMealAggregate {
    id: number;
    name: string;
    foodCode: string;
    imageUrl: string | null;
    totalOrders: number;
    fanCounts: Map<number, number>;
}

interface OfficeAveragesInternal {
    totalParticipants: number;
    averageMealsSelected: number;
    averageUniqueMeals: number;
    averageConsistencyScore: number;
    averageDiversityScore: number;
    averageSwallowCount: number;
    averageSpiceCount: number;
    personalityBreakdown: Record<string, number>;
}

interface CachedOfficeYearData {
    signature: string;
    activePool: ParsedProfileRow[];
    profileByUserId: Map<number, ParsedProfileRow>;
    officeAverages: OfficeAveragesInternal;
    officeMealStats: Map<number, OfficeMealAggregate>;
    officeCrownMeal: OfficeMealAggregate | null;
    peerMatchesByUserId: Map<number, CachedPeerMatchPair>;
}

const officeRecapCache = new Map<number, CachedOfficeYearData>();

const TWIN_WEIGHT_MEALS = 0.40;
const TWIN_WEIGHT_PROTEINS = 0.30;
const TWIN_WEIGHT_BASES = 0.20;
const TWIN_WEIGHT_PERSONALITY = 0.10;
const TWIN_MIN_SIMILARITY_PERCENT = 30;
const OPPOSITE_MAX_SIMILARITY_PERCENT = 50;

const EMPTY_METRICS: StoredTasteProfileMetrics = {
    supergroups: {},
    bases: {},
    variations: {},
    meals: {},
    proteins: {},
    accompaniments: {},
    modifiers: {},
    preparations: {},
    combinations: {},
    uniqueMeals: 0,
    repeatedMeals: 0,
    diversityScore: 0,
    consistencyScore: 0,
    uniqueMealIds: [],
    topMeals: [],
    swallowCount: 0,
    swallowRatio: 0,
};

function resolvePersonality(rawType: string | null | undefined): TastePersonality {
    if (rawType && Object.prototype.hasOwnProperty.call(tastePersonalities, rawType)) {
        return rawType as TastePersonality;
    }
    return "BALANCED";
}

function resolveProteinName(code: string, proteinNameMap?: Map<string, string>): string {
    const normalized = code.trim().toUpperCase();
    return proteinNameMap?.get(normalized) ?? normalized;
}

function parseMetrics(raw: unknown): StoredTasteProfileMetrics {
    if (!raw || typeof raw !== "object") {
        return { ...EMPTY_METRICS };
    }
    const obj = raw as Partial<StoredTasteProfileMetrics>;
    const rawTopMeals = Array.isArray(obj.topMeals) ? obj.topMeals : [];
    const topMeals: TopMealDetail[] = rawTopMeals.map((tm: any) => ({
        id: Number(tm.id),
        name: String(tm.name ?? `Meal #${tm.id}`),
        foodCode: String(tm.foodCode ?? ""),
        count: Number(tm.count ?? 0),
        imageUrl: tm.imageUrl ?? null,
    }));

    return {
        supergroups: obj.supergroups ?? {},
        bases: obj.bases ?? {},
        variations: obj.variations ?? {},
        meals: obj.meals ?? {},
        proteins: obj.proteins ?? {},
        accompaniments: obj.accompaniments ?? {},
        modifiers: obj.modifiers ?? {},
        preparations: obj.preparations ?? {},
        combinations: obj.combinations ?? {},
        uniqueMeals: obj.uniqueMeals ?? 0,
        repeatedMeals: obj.repeatedMeals ?? 0,
        diversityScore: obj.diversityScore ?? 0,
        consistencyScore: obj.consistencyScore ?? 0,
        uniqueMealIds: Array.isArray(obj.uniqueMealIds) ? obj.uniqueMealIds : [],
        topMeals,
        swallowCount: obj.swallowCount ?? obj.supergroups?.[SWALLOW_SUPERGROUP] ?? 0,
        swallowRatio: obj.swallowRatio ?? 0,
    };
}

function hydrateTopMealsWithImages(
    topMeals: TopMealDetail[],
    mealImageMap?: Map<number, string | null>
): TopMealDetail[] {
    if (!mealImageMap || mealImageMap.size === 0) return topMeals;
    return topMeals.map((tm) => ({
        ...tm,
        imageUrl: tm.imageUrl ?? mealImageMap.get(tm.id) ?? null,
    }));
}

function getPeerMealFrequencyMap(metrics: StoredTasteProfileMetrics): Record<string, number> {
    const freq: Record<string, number> = {};
    for (const [key, count] of Object.entries(metrics.meals)) {
        if (/^\d+$/.test(key) && count > 0) {
            freq[key] = count;
        }
    }
    for (const tm of metrics.topMeals) {
        const key = String(tm.id);
        if (!freq[key] && tm.count > 0) {
            freq[key] = tm.count;
        }
    }
    return freq;
}

function getPeerMealOrderCount(metrics: StoredTasteProfileMetrics, mealId: number): number {
    const key = String(mealId);
    const fromMealsMap = metrics.meals[key];
    if (typeof fromMealsMap === "number" && fromMealsMap > 0) {
        return fromMealsMap;
    }
    const fromTopMeals = metrics.topMeals.find((m) => m.id === mealId)?.count;
    if (typeof fromTopMeals === "number" && fromTopMeals > 0) {
        return fromTopMeals;
    }
    if (metrics.uniqueMealIds.includes(mealId)) {
        return 1;
    }
    return 0;
}

function computeVectorNorm(vec: Record<string, number>): number {
    let sumSq = 0;
    for (const v of Object.values(vec)) {
        if (v > 0) sumSq += v * v;
    }
    return Math.sqrt(sumSq);
}

function computeFastCosineSimilarity(
    a: Record<string, number>,
    normA: number,
    b: Record<string, number>,
    normB: number
): number {
    if (normA === 0 || normB === 0) return 0;
    let dot = 0;
    for (const [k, va] of Object.entries(a)) {
        const vb = b[k];
        if (va && vb) {
            dot += va * vb;
        }
    }
    return dot / (normA * normB);
}

function isBetterTwinCandidate(
    candidate: CachedPeerCandidate,
    current: CachedPeerCandidate | null
): boolean {
    if (!current) return true;
    if (candidate.score > current.score + 1e-9) return true;
    if (Math.abs(candidate.score - current.score) > 1e-9) return false;
    if (candidate.sharedMealsCount !== current.sharedMealsCount) {
        return candidate.sharedMealsCount > current.sharedMealsCount;
    }
    if (candidate.sharesFavProtein !== current.sharesFavProtein) {
        return candidate.sharesFavProtein;
    }
    return candidate.peer.userId < current.peer.userId;
}

function isBetterOppositeCandidate(
    candidate: CachedPeerCandidate,
    current: CachedPeerCandidate | null
): boolean {
    if (!current) return true;
    if (candidate.score < current.score - 1e-9) return true;
    if (Math.abs(candidate.score - current.score) > 1e-9) return false;
    if (candidate.sharedMealsCount !== current.sharedMealsCount) {
        return candidate.sharedMealsCount < current.sharedMealsCount;
    }
    if (candidate.sharesFavProtein !== current.sharesFavProtein) {
        return !candidate.sharesFavProtein;
    }
    return candidate.peer.userId < current.peer.userId;
}

function buildCacheSignature(calendarYear: number, allProfiles: RawTasteProfileRow[]): string {
    let maxUpdated = 0;
    let sumMeals = 0;
    for (const row of allProfiles) {
        const ts = row.updatedAt ? new Date(row.updatedAt).getTime() : 0;
        if (ts > maxUpdated) maxUpdated = ts;
        sumMeals += row.totalMealsSelected;
    }
    return `${calendarYear}:${allProfiles.length}:${maxUpdated}:${sumMeals}`;
}

function getOrBuildOfficeYearData(
    calendarYear: number,
    allProfiles: RawTasteProfileRow[]
): CachedOfficeYearData {
    const signature = buildCacheSignature(calendarYear, allProfiles);
    const cached = officeRecapCache.get(calendarYear);
    if (cached && cached.signature === signature) {
        return cached;
    }

    const profileByUserId = new Map<number, ParsedProfileRow>();
    const activePool: ParsedProfileRow[] = [];

    for (const row of allProfiles) {
        const parsedMetrics = parseMetrics(row.metrics);
        const mealFreq = getPeerMealFrequencyMap(parsedMetrics);
        const parsed: ParsedProfileRow = {
            ...row,
            parsedMetrics,
            resolvedPersonality: resolvePersonality(row.personalityType),
            resolvedFavoriteProtein:
                row.favoriteProtein ??
                tasteProfileHelper.findFavorite(parsedMetrics.proteins) ??
                null,
            mealFreq,
            mealNorm: computeVectorNorm(mealFreq),
            proteinNorm: computeVectorNorm(parsedMetrics.proteins),
            baseNorm: computeVectorNorm(parsedMetrics.bases),
        };
        profileByUserId.set(row.userId, parsed);
        if (parsed.totalMealsSelected > 0) {
            activePool.push(parsed);
        }
    }

    const totalParticipants = activePool.length;
    const denominator = Math.max(1, totalParticipants);

    const personalityBreakdown: Record<string, number> = {};
    let sumMeals = 0;
    let sumUnique = 0;
    let sumConsistency = 0;
    let sumDiversity = 0;
    let sumSwallow = 0;
    let sumSpice = 0;

    const mealDetailsCatalog = new Map<number, { name: string; foodCode: string; imageUrl: string | null }>();
    for (const p of activePool) {
        personalityBreakdown[p.resolvedPersonality] =
            (personalityBreakdown[p.resolvedPersonality] ?? 0) + 1;
        sumMeals += p.totalMealsSelected;
        sumUnique += p.parsedMetrics.uniqueMeals;
        sumConsistency += p.parsedMetrics.consistencyScore;
        sumDiversity += p.parsedMetrics.diversityScore;
        sumSwallow += p.parsedMetrics.swallowCount ?? 0;
        sumSpice += p.parsedMetrics.modifiers?.[SPICE_MODIFIER] ?? 0;

        for (const tm of p.parsedMetrics.topMeals) {
            const existing = mealDetailsCatalog.get(tm.id);
            if (!existing) {
                mealDetailsCatalog.set(tm.id, {
                    name: tm.name,
                    foodCode: tm.foodCode,
                    imageUrl: tm.imageUrl ?? null,
                });
            } else if (!existing.imageUrl && tm.imageUrl) {
                existing.imageUrl = tm.imageUrl;
            }
        }
    }

    const officeMealStats = new Map<number, OfficeMealAggregate>();
    for (const [mealId, meta] of mealDetailsCatalog.entries()) {
        const fanCounts = new Map<number, number>();
        let totalOrders = 0;
        for (const peer of activePool) {
            const count = getPeerMealOrderCount(peer.parsedMetrics, mealId);
            if (count > 0) {
                fanCounts.set(peer.userId, count);
                totalOrders += count;
            }
        }
        if (totalOrders > 0) {
            officeMealStats.set(mealId, {
                id: mealId,
                name: meta.name,
                foodCode: meta.foodCode,
                imageUrl: meta.imageUrl,
                totalOrders,
                fanCounts,
            });
        }
    }

    let officeCrownMeal: OfficeMealAggregate | null = null;
    for (const stat of officeMealStats.values()) {
        if (
            !officeCrownMeal ||
            stat.totalOrders > officeCrownMeal.totalOrders ||
            (stat.totalOrders === officeCrownMeal.totalOrders &&
                stat.fanCounts.size > officeCrownMeal.fanCounts.size) ||
            (stat.totalOrders === officeCrownMeal.totalOrders &&
                stat.fanCounts.size === officeCrownMeal.fanCounts.size &&
                stat.id < officeCrownMeal.id)
        ) {
            officeCrownMeal = stat;
        }
    }

    const officeAverages: OfficeAveragesInternal = {
        totalParticipants,
        averageMealsSelected: totalParticipants > 0 ? Math.round(sumMeals / denominator) : 0,
        averageUniqueMeals: totalParticipants > 0 ? Math.round(sumUnique / denominator) : 0,
        averageConsistencyScore: totalParticipants > 0 ? Math.round(sumConsistency / denominator) : 0,
        averageDiversityScore: totalParticipants > 0 ? Math.round(sumDiversity / denominator) : 0,
        averageSwallowCount: totalParticipants > 0 ? Math.round(sumSwallow / denominator) : 0,
        averageSpiceCount: totalParticipants > 0 ? Math.round(sumSpice / denominator) : 0,
        personalityBreakdown,
    };

    const peerMatchesByUserId = new Map<number, CachedPeerMatchPair>();
    for (const p of activePool) {
        peerMatchesByUserId.set(p.userId, { twin: null, opposite: null });
    }

    for (let i = 0; i < activePool.length; i++) {
        const userA = activePool[i];
        if (!userA) continue;
        const matchesA = peerMatchesByUserId.get(userA.userId)!;

        for (let j = i + 1; j < activePool.length; j++) {
            const userB = activePool[j];
            if (!userB) continue;
            const matchesB = peerMatchesByUserId.get(userB.userId)!;

            let sharedMealsCount = 0;
            for (const mId of Object.keys(userA.mealFreq)) {
                if (userB.mealFreq[mId]) {
                    sharedMealsCount++;
                }
            }

            const mealSim = computeFastCosineSimilarity(
                userA.mealFreq,
                userA.mealNorm,
                userB.mealFreq,
                userB.mealNorm
            );
            const proteinSim = computeFastCosineSimilarity(
                userA.parsedMetrics.proteins,
                userA.proteinNorm,
                userB.parsedMetrics.proteins,
                userB.proteinNorm
            );
            const baseSim = computeFastCosineSimilarity(
                userA.parsedMetrics.bases,
                userA.baseNorm,
                userB.parsedMetrics.bases,
                userB.baseNorm
            );

            const hasPalateOverlap = mealSim > 0 || proteinSim > 0;
            const personalityBonus =
                hasPalateOverlap && userA.resolvedPersonality === userB.resolvedPersonality
                    ? 1
                    : 0;

            const weighted =
                TWIN_WEIGHT_MEALS * mealSim +
                TWIN_WEIGHT_PROTEINS * proteinSim +
                TWIN_WEIGHT_BASES * baseSim +
                TWIN_WEIGHT_PERSONALITY * personalityBonus;

            const sharesFavProtein = Boolean(
                userA.resolvedFavoriteProtein &&
                    userB.resolvedFavoriteProtein &&
                    userA.resolvedFavoriteProtein === userB.resolvedFavoriteProtein
            );

            const candidateForA: CachedPeerCandidate = {
                peer: userB,
                score: weighted,
                sharedMealsCount,
                sharesFavProtein,
            };
            if (isBetterTwinCandidate(candidateForA, matchesA.twin)) {
                matchesA.twin = candidateForA;
            }
            if (isBetterOppositeCandidate(candidateForA, matchesA.opposite)) {
                matchesA.opposite = candidateForA;
            }

            const candidateForB: CachedPeerCandidate = {
                peer: userA,
                score: weighted,
                sharedMealsCount,
                sharesFavProtein,
            };
            if (isBetterTwinCandidate(candidateForB, matchesB.twin)) {
                matchesB.twin = candidateForB;
            }
            if (isBetterOppositeCandidate(candidateForB, matchesB.opposite)) {
                matchesB.opposite = candidateForB;
            }
        }
    }

    const yearData: CachedOfficeYearData = {
        signature,
        activePool,
        profileByUserId,
        officeAverages,
        officeMealStats,
        officeCrownMeal,
        peerMatchesByUserId,
    };

    officeRecapCache.set(calendarYear, yearData);
    return yearData;
}

interface RankingDefinition {
    key: RecapMetricKey;
    label: string;
    unit: string;
    officeAverage: number;
    scoreExtractor: (p: ParsedProfileRow) => number;
    copyBuilder: (ctx: {
        rank: number;
        total: number;
        value: number;
        officeAverage: number;
    }) => { title: string; subtitle: string; description: string };
}

type UnorderedSlideCard<TMetadata = unknown> = Omit<
    RecapSlideCard<TMetadata>,
    "slideOrder"
>;

function rankingToCard<TMetadata = unknown>(
    stat: RecapRankingStat,
    id: string,
    category: RecapCardCategory,
    metadata?: TMetadata
): UnorderedSlideCard<TMetadata> {
    return {
        id,
        category,
        title: stat.title,
        subtitle: stat.subtitle,
        description: stat.description,
        value: stat.value,
        unit: stat.unit,
        rank: stat.rank,
        totalParticipants: stat.totalParticipants,
        percentile: stat.percentile,
        officeAverage: stat.officeAverage,
        ...(metadata !== undefined ? { metadata } : {}),
    };
}

export function buildTasteProfileRecap(
    targetUserId: number,
    calendarYear: number,
    allProfiles: RawTasteProfileRow[],
    fallbackUserName: string | null = null,
    mealImageMap?: Map<number, string | null>,
    proteinNameMap?: Map<string, string>
): TasteProfileRecapResponse {
    const {
        activePool,
        profileByUserId,
        officeAverages,
        officeMealStats,
        officeCrownMeal,
        peerMatchesByUserId,
    } = getOrBuildOfficeYearData(calendarYear, allProfiles);

    const existingUserProfile = profileByUserId.get(targetUserId);

    // ── Early Exit: User has 0 selected meals ────────────────────────────────
    if (!existingUserProfile || existingUserProfile.totalMealsSelected === 0) {
        return {
            message: "No meals selected",
            cards: [],
        };
    }

    const topMealsWithImages = hydrateTopMealsWithImages(
        existingUserProfile.parsedMetrics.topMeals,
        mealImageMap
    );
    const userMetrics: StoredTasteProfileMetrics = {
        ...existingUserProfile.parsedMetrics,
        topMeals: topMealsWithImages,
    };
    const userProfile: ParsedProfileRow = {
        ...existingUserProfile,
        parsedMetrics: userMetrics,
    };

    const totalParticipants = Math.max(1, activePool.length);
    const userPersonality = userProfile.resolvedPersonality;
    const personalityMeta = tastePersonalities[userPersonality] ?? tastePersonalities.BALANCED;
    const { personalityBreakdown } = officeAverages;

    // ── 1. Personality Cohort Summary ────────────────────────────────────────
    const cohortCount = personalityBreakdown[userPersonality] ?? 1;
    const cohortPercentage = Math.round((cohortCount / totalParticipants) * 100);
    const personalityTitle = `You are ${/^[aeiou]/i.test(personalityMeta.name) ? "an" : "a"} ${personalityMeta.name}`;
    const personalitySubtitle =
        cohortCount === 1
            ? `You are the only ${personalityMeta.name} in the office this year!`
            : `You are 1 of ${cohortCount} ${personalityMeta.pluralName} in the office (${cohortPercentage}% of the team)`;

    // ── 2. O(N) Competition Rankings ─────────────────────────────────────────
    function computeRanking(def: RankingDefinition): RecapRankingStat {
        const value = def.scoreExtractor(userProfile);
        let strictlyBetterCount = 0;
        for (const peer of activePool) {
            if (def.scoreExtractor(peer) > value) {
                strictlyBetterCount++;
            }
        }
        const rank = 1 + strictlyBetterCount;
        const topPercent = Math.max(1, Math.ceil((rank / totalParticipants) * 100));
        const beatsPercentage =
            totalParticipants > 1
                ? Math.round(((totalParticipants - rank) / (totalParticipants - 1)) * 100)
                : 100;

        const { title, subtitle, description } = def.copyBuilder({
            rank,
            total: totalParticipants,
            value,
            officeAverage: def.officeAverage,
        });

        return {
            key: def.key,
            label: def.label,
            title,
            subtitle,
            description,
            rank,
            totalParticipants,
            value,
            unit: def.unit,
            percentile: topPercent,
            topPercent,
            beatsPercentage,
            officeAverage: def.officeAverage,
        };
    }

    const loyaltyRank = computeRanking({
        key: "loyalty",
        label: "Loyalty Ranking",
        unit: "%",
        officeAverage: officeAverages.averageConsistencyScore,
        scoreExtractor: (p) => p.parsedMetrics.consistencyScore,
        copyBuilder: ({ rank, total, value, officeAverage }) => ({
            title:
                rank === 1 && value > 0
                    ? "You are the #1 most loyal eater in the office!"
                    : `Ranked #${rank} in Meal Loyalty`,
            subtitle: `Loyalty Rank #${rank} of ${total} (${value}% consistency)`,
            description: `${value}% of your selections (${userMetrics.repeatedMeals} plates) were repeat favourites vs. the office average of ${officeAverage}%.`,
        }),
    });

    const explorerRank = computeRanking({
        key: "explorer",
        label: "Explorer Ranking",
        unit: "unique meals",
        officeAverage: officeAverages.averageUniqueMeals,
        scoreExtractor: (p) => p.parsedMetrics.uniqueMeals,
        copyBuilder: ({ rank, total, value, officeAverage }) => ({
            title:
                rank === 1 && value > 0
                    ? `You are the #1 menu explorer with ${value} unique dishes tried!`
                    : `Ranked #${rank} on the Explorer Leaderboard`,
            subtitle: `Explorer Rank #${rank} of ${total} (${userMetrics.diversityScore}% diversity score)`,
            description: `You sampled ${value} distinct meals across the menu compared to the office average of ${officeAverage}.`,
        }),
    });

    const swallowRank = computeRanking({
        key: "swallow",
        label: "Swallow Heavyweight Ranking",
        unit: "meals",
        officeAverage: officeAverages.averageSwallowCount,
        scoreExtractor: (p) => p.parsedMetrics.swallowCount ?? 0,
        copyBuilder: ({ rank, total, value, officeAverage }) => ({
            title:
                rank === 1 && value > 0
                    ? `You are the #1 Swallow Heavyweight with ${value} swallow meals!`
                    : `Ranked #${rank} in Swallow Consumption`,
            subtitle: `Swallow Rank #${rank} of ${total} (${Math.round((userMetrics.swallowRatio ?? 0) * 100)}% of your meals)`,
            description: `You ordered ${value} swallow meals this year compared to the office average of ${officeAverage}.`,
        }),
    });

    const spiceRank = computeRanking({
        key: "spice",
        label: "Spice Chaser Ranking",
        unit: "spicy meals",
        officeAverage: officeAverages.averageSpiceCount,
        scoreExtractor: (p) => p.parsedMetrics.modifiers?.[SPICE_MODIFIER] ?? 0,
        copyBuilder: ({ rank, total, value, officeAverage }) => ({
            title:
                rank === 1 && value > 0
                    ? `You are the #1 Spice Chaser in the office with ${value} peppered meals!`
                    : `Ranked #${rank} on the Spice Meter`,
            subtitle: `Spice Rank #${rank} of ${total}`,
            description: `You selected ${value} peppered/spicy meals compared to the office average of ${officeAverage}.`,
        }),
    });

    const volumeRank = computeRanking({
        key: "volume",
        label: "Table Regular Ranking",
        unit: "meals",
        officeAverage: officeAverages.averageMealsSelected,
        scoreExtractor: (p) => p.totalMealsSelected,
        copyBuilder: ({ rank, total, value, officeAverage }) => ({
            title:
                rank === 1 && value > 0
                    ? `You never missed a plate — #1 in total meals ordered (${value})!`
                    : `${value} Plates Enjoyed in ${calendarYear}`,
            subtitle: `Ranked #${rank} of ${total} in total meals selected`,
            description: `You selected ${value} meals this year (${userMetrics.uniqueMeals} unique dishes, ${userMetrics.repeatedMeals} repeat favourites) compared to the office average of ${officeAverage}.`,
        }),
    });

    // ── 3. Top Meal Highlight ────────────────────────────────────────────────
    const favMeal: TopMealDetail | undefined = userMetrics.topMeals[0];
    let topMealCard: UnorderedSlideCard | null = null;

    if (favMeal && favMeal.count > 0) {
        const mealStat = officeMealStats.get(favMeal.id);
        let strictlyBetterFans = 0;
        let totalOfficeFans = 1;

        if (mealStat) {
            totalOfficeFans = Math.max(1, mealStat.fanCounts.size);
            for (const count of mealStat.fanCounts.values()) {
                if (count > favMeal.count) {
                    strictlyBetterFans++;
                }
            }
        }

        const officeFanRank = 1 + strictlyBetterFans;
        const shareOfYearPercentage = Math.round(
            (favMeal.count / userProfile.totalMealsSelected) * 100
        );

        topMealCard = {
            id: "slide-top-meal",
            category: "TOP_MEAL",
            title: favMeal.name,
            subtitle:
                officeFanRank === 1 && totalOfficeFans > 1
                    ? `You ordered ${favMeal.name} ${favMeal.count} times — you're its #1 fan among ${totalOfficeFans} office lovers!`
                    : officeFanRank === 1
                    ? `You ordered ${favMeal.name} ${favMeal.count} times — you're its #1 fan in the office!`
                    : `You ordered ${favMeal.name} ${favMeal.count} times — #${officeFanRank} among ${totalOfficeFans} office fans!`,
            description: `It accounted for ${shareOfYearPercentage}% of all your meals in ${calendarYear}.`,
            value: favMeal.count,
            unit: "orders",
            rank: officeFanRank,
            totalParticipants: totalOfficeFans,
            percentile: null,
            officeAverage: null,
            metadata: userMetrics.topMeals.map(({ id, name, count, imageUrl }) => ({
                id,
                name,
                count,
                imageUrl: imageUrl ?? null,
            })),
        };
    }

    // ── 4. Office Crown (#1 Most Popular Dish in the Office) ─────────────────
    let officeCrownCard: UnorderedSlideCard | null = null;
    if (officeCrownMeal) {
        const userOrderCount = getPeerMealOrderCount(userMetrics, officeCrownMeal.id);
        const isUserTopMeal = favMeal?.id === officeCrownMeal.id;
        const totalOfficeFans = officeCrownMeal.fanCounts.size;
        const totalOfficeOrders = officeCrownMeal.totalOrders;
        const crownImageUrl =
            officeCrownMeal.imageUrl ?? mealImageMap?.get(officeCrownMeal.id) ?? null;

        if (totalOfficeFans >= 2 || userOrderCount > 0) {
            let strictlyBetterCrownFans = 0;
            if (userOrderCount > 0) {
                for (const count of officeCrownMeal.fanCounts.values()) {
                    if (count > userOrderCount) {
                        strictlyBetterCrownFans++;
                    }
                }
            }
            const userCrownRank = userOrderCount > 0 ? 1 + strictlyBetterCrownFans : null;

            let title: string;
            let subtitle: string;
            let description: string;

            if (isUserTopMeal) {
                title = `${officeCrownMeal.name} Took the Office Crown — And Yours!`;
                subtitle = `#1 dish in the office (${totalOfficeOrders} plates across ${totalOfficeFans} colleagues)`;
                description = `Your #1 favourite was also the office's undisputed champion — you ordered ${userOrderCount} of those plates!`;
            } else if (userOrderCount > 0) {
                title = `The Office Crown: ${officeCrownMeal.name}`;
                subtitle = `#1 most ordered dish in the office (${totalOfficeOrders} plates across ${totalOfficeFans} colleagues)`;
                description = `You joined the ${officeCrownMeal.name} wave ${userOrderCount} ${
                    userOrderCount === 1 ? "time" : "times"
                } this year, while ${favMeal?.name ?? "another dish"} stayed your personal #1.`;
            } else {
                title = `You Dodged the Office Obsession: ${officeCrownMeal.name}`;
                subtitle = `The office ordered it ${totalOfficeOrders} times (${totalOfficeFans} fans) — you ordered it 0 times!`;
                description = `While ${officeCrownMeal.name} ruled the office tables in ${calendarYear}, you charted your own path.`;
            }

            officeCrownCard = {
                id: "slide-office-crown",
                category: "OFFICE_CROWN",
                title,
                subtitle,
                description,
                value: totalOfficeOrders,
                unit: "office orders",
                rank: userCrownRank,
                totalParticipants: totalOfficeFans,
                percentile: null,
                officeAverage: null,
                metadata: {
                    mealId: officeCrownMeal.id,
                    mealName: officeCrownMeal.name,
                    imageUrl: crownImageUrl,
                    userOrderCount,
                    isUserTopMeal,
                },
            };
        }
    }

    // ── 5. Protein Champion (User's Top Protein + Office Rank) ───────────────
    const topProteinEntry = tasteProfileHelper.findFavoriteEntry(userMetrics.proteins);
    const favoriteProtein =
        userProfile.favoriteProtein ?? topProteinEntry?.[0] ?? null;

    let proteinChampionCard: UnorderedSlideCard | null = null;
    if (favoriteProtein) {
        const userProteinCount =
            userMetrics.proteins[favoriteProtein] ?? topProteinEntry?.[1] ?? 0;
        const shareOfPlatesPercentage = Math.round(
            (userProteinCount / userProfile.totalMealsSelected) * 100
        );

        if (userProteinCount >= 2 && shareOfPlatesPercentage >= 20) {
            const proteinName = resolveProteinName(favoriteProtein, proteinNameMap);
            let betterProteinPeers = 0;
            let sumProteinAcrossOffice = 0;

            for (const peer of activePool) {
                const peerCount = peer.parsedMetrics.proteins[favoriteProtein] ?? 0;
                sumProteinAcrossOffice += peerCount;
                if (peerCount > userProteinCount) {
                    betterProteinPeers++;
                }
            }

            const proteinRank = 1 + betterProteinPeers;
            const officeAverageCount = Math.round(
                sumProteinAcrossOffice / totalParticipants
            );

            proteinChampionCard = {
                id: "slide-protein-champion",
                category: "PROTEIN_CHAMPION",
                title:
                    proteinRank === 1
                        ? `You are the #1 ${proteinName} Champion in the Office!`
                        : `${proteinName} Powered ${shareOfPlatesPercentage}% of Your Plates`,
                subtitle: `#${proteinRank} ${proteinName} lover in the office (${userProteinCount} plates)`,
                description: `You chose ${proteinName}-based meals ${userProteinCount} times this year compared to the office average of ${officeAverageCount}.`,
                value: proteinName,
                unit: `${shareOfPlatesPercentage}% of plates`,
                rank: proteinRank,
                totalParticipants,
                percentile: Math.max(1, Math.ceil((proteinRank / totalParticipants) * 100)),
                officeAverage: officeAverageCount,
                metadata: {
                    proteinCode: favoriteProtein,
                    userCount: userProteinCount,
                    shareOfPlatesPercentage,
                },
            };
        }
    }

    // ── 6. Contrarian / Hidden Gem Highlight ─────────────────────────────────
    let contrarianCard: UnorderedSlideCard | null = null;
    if (totalParticipants >= 3 && userMetrics.topMeals.length > 0) {
        const maxContrarianFans = Math.max(2, Math.floor(totalParticipants * 0.25));
        const candidates = userMetrics.topMeals
            .filter((meal) => meal.count >= 2)
            .map((meal) => {
                const stat = officeMealStats.get(meal.id);
                const totalOfficeFans = stat ? stat.fanCounts.size : 1;
                const totalOfficeOrders = stat ? stat.totalOrders : meal.count;
                return {
                    meal,
                    totalOfficeFans,
                    totalOfficeOrders,
                };
            })
            .filter(
                (c) =>
                    c.totalOfficeFans <= maxContrarianFans &&
                    c.meal.id !== officeCrownMeal?.id &&
                    (c.meal.id !== favMeal?.id || c.totalOfficeFans <= 2)
            )
            .sort(
                (a, b) =>
                    a.totalOfficeFans - b.totalOfficeFans ||
                    b.meal.count - a.meal.count ||
                    a.meal.id - b.meal.id
            );

        const winner = candidates[0];
        if (winner) {
            const { meal, totalOfficeFans, totalOfficeOrders } = winner;
            const otherFansCount = Math.max(0, totalOfficeFans - 1);

            contrarianCard = {
                id: "slide-contrarian",
                category: "CONTRARIAN",
                title:
                    totalOfficeFans === 1
                        ? `Your Secret Menu Pick: ${meal.name}`
                        : `Hidden Gem: ${meal.name}`,
                subtitle:
                    totalOfficeFans === 1
                        ? `You were the ONLY person in the office to order ${meal.name} (${meal.count} times)!`
                        : `Only ${totalOfficeFans} people in the office appreciated ${meal.name} (${otherFansCount} other ${
                              otherFansCount === 1 ? "colleague" : "colleagues"
                          })`,
                description: `You ordered ${meal.name} ${meal.count} times while ${
                    totalParticipants - totalOfficeFans
                } of your colleagues slept on it.`,
                value: meal.count,
                unit: "orders",
                rank: 1,
                totalParticipants: totalOfficeFans,
                percentile: null,
                officeAverage: null,
                metadata: {
                    mealId: meal.id,
                    mealName: meal.name,
                    imageUrl: meal.imageUrl ?? null,
                    totalOfficeOrders,
                },
            };
        }
    }

    // ── 7. Office Taste Twin & Taste Opposite (O(1) Cached Map Lookup) ───────
    let tasteTwinCard: UnorderedSlideCard | null = null;
    let tasteOppositeCard: UnorderedSlideCard | null = null;
    const cachedMatches = peerMatchesByUserId.get(targetUserId);

    if (cachedMatches) {
        let twinUserId: number | null = null;
        const bestCandidate = cachedMatches.twin;

        if (bestCandidate) {
            const bestPeer = bestCandidate.peer;
            const rawTwinScore = Math.min(99, Math.round(bestCandidate.score * 100));
            if (rawTwinScore >= TWIN_MIN_SIMILARITY_PERCENT) {
                twinUserId = bestPeer.userId;
                const peerName = bestPeer.user?.name ?? `User #${bestPeer.userId}`;
                const sharedFavoriteProtein =
                    bestCandidate.sharesFavProtein && favoriteProtein
                        ? resolveProteinName(favoriteProtein, proteinNameMap)
                        : null;
                const sharedMeal = userMetrics.topMeals.find(
                    (um) => getPeerMealOrderCount(bestPeer.parsedMetrics, um.id) > 0
                );
                const bestSharedMealName = sharedMeal?.name ?? null;

                tasteTwinCard = {
                    id: "slide-taste-twin",
                    category: "TASTE_TWIN",
                    title: `Your Office Taste Twin is ${peerName}`,
                    subtitle: `${rawTwinScore}% palate similarity${
                        bestSharedMealName ? ` · You both love ${bestSharedMealName}` : ""
                    }`,
                    description: `Matched across your top meals, protein picks, and lunch habits.`,
                    value: rawTwinScore,
                    unit: "%",
                    rank: 1,
                    totalParticipants,
                    percentile: rawTwinScore,
                    officeAverage: null,
                    metadata: {
                        userId: bestPeer.userId,
                        name: peerName,
                        personalityType: bestPeer.resolvedPersonality,
                        sharedTopMeal: bestSharedMealName,
                        sharedFavoriteProtein,
                    },
                };
            }
        }

        const lowestCandidate = cachedMatches.opposite;
        if (lowestCandidate && lowestCandidate.peer.userId !== twinUserId) {
            const lowestPeer = lowestCandidate.peer;
            const rawOppositeScore = Math.max(0, Math.round(lowestCandidate.score * 100));
            if (rawOppositeScore <= OPPOSITE_MAX_SIMILARITY_PERCENT) {
                const peerName = lowestPeer.user?.name ?? `User #${lowestPeer.userId}`;
                const peerTopMeal = lowestPeer.parsedMetrics.topMeals[0]?.name ?? null;
                const peerFavoriteProtein = lowestPeer.resolvedFavoriteProtein
                    ? resolveProteinName(lowestPeer.resolvedFavoriteProtein, proteinNameMap)
                    : null;
                const peerPersonalityMeta =
                    tastePersonalities[lowestPeer.resolvedPersonality] ??
                    tastePersonalities.BALANCED;

                tasteOppositeCard = {
                    id: "slide-taste-opposite",
                    category: "TASTE_OPPOSITE",
                    title: `Your Palate Opposite is ${peerName}`,
                    subtitle:
                        rawOppositeScore === 0
                            ? `0% palate overlap${
                                  peerTopMeal ? ` · Their #1 was ${peerTopMeal}` : ""
                              }`
                            : `Only ${rawOppositeScore}% palate overlap${
                                  peerTopMeal ? ` · They swear by ${peerTopMeal}` : ""
                              }`,
                    description:
                        rawOppositeScore === 0
                            ? `You and ${peerName} barely shared a single meal or protein pattern all year!`
                            : `While you ate like ${
                                  /^[aeiou]/i.test(personalityMeta.name) ? "an" : "a"
                              } ${personalityMeta.name}, ${peerName} went full ${
                                  peerPersonalityMeta.name
                              }.`,
                    value: rawOppositeScore,
                    unit: "% overlap",
                    rank: null,
                    totalParticipants,
                    percentile: rawOppositeScore,
                    officeAverage: null,
                    metadata: {
                        userId: lowestPeer.userId,
                        name: peerName,
                        personalityType: lowestPeer.resolvedPersonality,
                        peerTopMeal,
                        peerFavoriteProtein,
                    },
                };
            }
        }
    }

    // ── 8. Personality Map Cohort Distribution (Sorted Descending) ───────────
    const officeProfiles: RecapPersonalityCohortItem[] = Object.entries(
        personalityBreakdown
    )
        .filter(([, count]) => count > 0)
        .map(([rawType, count]) => {
            const type = resolvePersonality(rawType);
            const meta = tastePersonalities[type];
            return {
                type,
                name: meta.name,
                count,
                percentage: Math.round((count / totalParticipants) * 100),
                isUser: type === userPersonality,
            };
        })
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const dominantCohort = officeProfiles[0] ?? {
        type: userPersonality,
        name: personalityMeta.name,
        count: cohortCount,
        percentage: cohortPercentage,
        isUser: true,
    };
    const dominantMeta = tastePersonalities[dominantCohort.type];
    const userCohortRank =
        1 + officeProfiles.filter((item) => item.count > cohortCount).length;

    // ── 9. Conditional Story Slides (filtered & dynamically ordered) ─────────
    const spiceCount = userMetrics.modifiers?.[SPICE_MODIFIER] ?? 0;
    const spiceRatio =
        userProfile.totalMealsSelected > 0
            ? Number((spiceCount / userProfile.totalMealsSelected).toFixed(2))
            : 0;
    const swallowCount = userMetrics.swallowCount ?? 0;

    const candidateCards: Array<UnorderedSlideCard | null> = [
        // 1. Overview
        rankingToCard(volumeRank, "slide-overview", "OVERVIEW", {
            uniqueMeals: userMetrics.uniqueMeals,
            repeatedMeals: userMetrics.repeatedMeals,
        }),

        // 2. Personality (User's own personality)
        {
            id: "slide-personality",
            category: "PERSONALITY",
            title: personalityTitle,
            subtitle: personalitySubtitle,
            description: personalityMeta.description,
            value: personalityMeta.name,
            unit: "personality",
            rank: null,
            totalParticipants,
            percentile: cohortPercentage,
            officeAverage: null,
        },

        // 3. Office Personalities Map (Descending array of office profiles with isUser flag)
        {
            id: "slide-personality-map",
            category: "PERSONALITY_MAP",
            title:
                dominantCohort.type === userPersonality
                    ? `${dominantMeta.pluralName} Rule the Office (${dominantCohort.percentage}%)`
                    : `The Office Palate: ${dominantMeta.pluralName} Lead at ${dominantCohort.percentage}%`,
            subtitle:
                dominantCohort.type === userPersonality
                    ? `Your ${personalityMeta.name} tribe is the #1 largest personality group in the office (${dominantCohort.count} of ${totalParticipants} colleagues)`
                    : `${dominantCohort.count} colleagues are ${dominantMeta.pluralName}, while your ${personalityMeta.name} group has ${cohortCount} (${cohortPercentage}%)`,
            description: `Across ${totalParticipants} active diners, the office split into ${officeProfiles.length} distinct taste personalities this year.`,
            value: cohortPercentage,
            unit: "% in your tribe",
            rank: userCohortRank,
            totalParticipants,
            percentile: cohortPercentage,
            officeAverage: null,
            metadata: officeProfiles,
        },

        // 4. Top Meal
        topMealCard,

        // 5. Office Crown
        officeCrownCard,

        // 6. Protein Champion
        proteinChampionCard,

        // 7. Contrarian / Hidden Gem
        contrarianCard,

        // 8. Loyalty (only when user repeated meals)
        userMetrics.repeatedMeals > 0
            ? rankingToCard(loyaltyRank, "slide-loyalty", "LOYALTY", {
                  repeatedMeals: userMetrics.repeatedMeals,
              })
            : null,

        // 9. Explorer (only when user tried >= 2 unique meals)
        userMetrics.uniqueMeals >= 2
            ? rankingToCard(explorerRank, "slide-explorer", "EXPLORER", {
                  diversityScore: userMetrics.diversityScore,
              })
            : null,

        // 10. Swallow (only when user ordered at least 1 swallow meal)
        swallowCount > 0
            ? rankingToCard(swallowRank, "slide-swallow", "SWALLOW", {
                  swallowRatio: userMetrics.swallowRatio ?? 0,
              })
            : null,

        // 11. Spice (only when user ordered at least 1 peppered/spicy meal)
        spiceCount > 0
            ? rankingToCard(spiceRank, "slide-spice", "SPICE", {
                  spiceRatio,
              })
            : null,

        // 12. Taste Twin
        tasteTwinCard,

        // 13. Taste Opposite
        tasteOppositeCard,
    ];

    const cards: RecapSlideCard[] = candidateCards
        .filter((card): card is UnorderedSlideCard => card !== null)
        .map((card, index) => ({
            ...card,
            slideOrder: index + 1,
        }));

    return {
        cards,
    };
}
