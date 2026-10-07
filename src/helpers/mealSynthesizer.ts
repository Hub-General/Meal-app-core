import prisma from "../prisma/client";
import { FoodGroup } from "../generated/prisma";
import { parseDimension } from "./foodCodeParser";

export const synthesizeMeals = async (foodCode: string) => {
    if (!foodCode || typeof foodCode !== "string") {
        return { ingredients: [] };
    }

    const parts = foodCode.split("-");
    const conditions: Array<{ foodCode: string; foodGroup: FoodGroup }> = [];

    if (parts.length === 7) {
        const dimensionGroups: FoodGroup[] = [
            FoodGroup.SUPERGROUP,
            FoodGroup.BASE,
            FoodGroup.VARIATION,
            FoodGroup.PROTEIN,
            FoodGroup.ACCOMPANIMENT,
            FoodGroup.MODIFIER,
            FoodGroup.PREP,
        ];

        parts.forEach((part, index) => {
            const group = dimensionGroups[index];
            if (!group) return;
            parseDimension(part).forEach((code) => {
                conditions.push({ foodCode: code, foodGroup: group });
            });
        });
    } else if (parts.length === 4) {
        // Backwards compatibility for legacy 4-block food codes
        const legacyGroups: FoodGroup[] = [
            FoodGroup.SUPERGROUP,
            FoodGroup.BASE,
            FoodGroup.PROTEIN,
            FoodGroup.PREP,
        ];

        parts.forEach((part, index) => {
            const group = legacyGroups[index];
            if (!group) return;
            parseDimension(part).forEach((code) => {
                conditions.push({ foodCode: code, foodGroup: group });
            });
        });
    }

    let ingredients: { name: string; foodGroup: string }[] = [];
    if (conditions.length > 0) {
        ingredients = await prisma.foodLibrary.findMany({
            where: { OR: conditions },
            select: { name: true, foodGroup: true },
        });
    }

    return { ingredients };
};