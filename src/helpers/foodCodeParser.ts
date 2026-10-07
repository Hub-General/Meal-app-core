import { FoodGroup } from "../generated/prisma";

export const FOOD_CODE_DIMENSIONS = [
    "supergroups",
    "bases",
    "variations",
    "proteins",
    "accompaniments",
    "modifiers",
    "preparations",
] as const;

export const FOOD_CODE_BLOCK_NAMES = [
    "SUPERGROUP",
    "BASE",
    "VARIATION",
    "PROTEIN",
    "ACCOMPANIMENT",
    "MODIFIER",
    "PREP",
] as const;

export const FOOD_CODE_GROUPS: readonly FoodGroup[] = [
    FoodGroup.SUPERGROUP,
    FoodGroup.BASE,
    FoodGroup.VARIATION,
    FoodGroup.PROTEIN,
    FoodGroup.ACCOMPANIMENT,
    FoodGroup.MODIFIER,
    FoodGroup.PREP,
] as const;

export const PLACEHOLDER_CODE = "OO";
export const DIMENSION_SEPARATOR = "-";
export const VALUE_SEPARATOR = "|";
export const FOOD_CODE_DIMENSIONS_COUNT = 7;

export interface ParsedFoodCode {
    supergroups: string[];
    bases: string[];
    variations: string[];
    proteins: string[];
    accompaniments: string[];
    modifiers: string[];
    preparations: string[];
}

export interface FoodCodeParts {
    supergroup?: string;
    base?: string;
    variation?: string;
    protein?: string;
    accompaniment?: string;
    modifier?: string;
    prep?: string;
}

export function parseDimension(value?: string | null): string[] {
    if (!value) return [];
    return [...new Set(
        value
            .split(VALUE_SEPARATOR)
            .map((code) => code.trim().toUpperCase())
            .filter((code) => code !== "" && code !== PLACEHOLDER_CODE)
    )];
}

export function parseFoodCode(foodCode: string): ParsedFoodCode | null {
    if (!foodCode || typeof foodCode !== "string") {
        return null;
    }

    const blocks = foodCode.split(DIMENSION_SEPARATOR);
    if (blocks.length !== FOOD_CODE_DIMENSIONS_COUNT) {
        return null;
    }

    const values = blocks.map(parseDimension);
    return {
        supergroups: values[0]!,
        bases: values[1]!,
        variations: values[2]!,
        proteins: values[3]!,
        accompaniments: values[4]!,
        modifiers: values[5]!,
        preparations: values[6]!,
    };
}

export function parseLegacyFoodCode(foodCode: string): ParsedFoodCode | null {
    if (!foodCode || typeof foodCode !== "string") {
        return null;
    }

    const blocks = foodCode.split(DIMENSION_SEPARATOR);
    if (blocks.length !== 4) {
        return null;
    }

    const values = blocks.map(parseDimension);
    return {
        supergroups: values[0]!,
        bases: values[1]!,
        variations: [],
        proteins: values[2]!,
        accompaniments: [],
        modifiers: [],
        preparations: values[3]!,
    };
}

export function parseAnyFoodCode(foodCode: string): ParsedFoodCode | null {
    return parseFoodCode(foodCode) ?? parseLegacyFoodCode(foodCode);
}

export function buildFoodCode(parts: FoodCodeParts): string {
    const sanitize = (val?: string) => {
        if (!val) return PLACEHOLDER_CODE;
        const trimmed = val.trim().toUpperCase();
        return trimmed === "" ? PLACEHOLDER_CODE : trimmed;
    };

    return [
        sanitize(parts.supergroup),
        sanitize(parts.base),
        sanitize(parts.variation),
        sanitize(parts.protein),
        sanitize(parts.accompaniment),
        sanitize(parts.modifier),
        sanitize(parts.prep),
    ].join(DIMENSION_SEPARATOR);
}

export function validateFoodCode(foodCode: string): boolean {
    if (!foodCode || typeof foodCode !== "string") {
        return false;
    }

    const blocks = foodCode.split(DIMENSION_SEPARATOR);
    if (blocks.length !== FOOD_CODE_DIMENSIONS_COUNT) {
        return false;
    }

    return blocks.every((block) => {
        const trimmed = block.trim();
        return trimmed.length > 0 && /^[A-Za-z0-9|]+$/.test(trimmed);
    });
}

export function getFoodCodeValues(foodCode: string): string[] {
    if (!foodCode || typeof foodCode !== "string") return [];
    return [...new Set(foodCode.split(DIMENSION_SEPARATOR).flatMap(parseDimension))];
}