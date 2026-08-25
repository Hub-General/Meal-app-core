import prisma from "../prisma/client";
import { FoodGroup } from "../generated/prisma";

export const synthesizeMeals = async (foodCode: string) => {

    const parts = foodCode.split("-");
    const supergroupCode = parts[0];
    const baseCode = parts[1];
    const proteinCode = parts[2];
    const prepCode = parts[3];

    const conditions = [];
    if (supergroupCode) conditions.push({ foodCode: supergroupCode, foodGroup: FoodGroup.SUPERGROUP });
    if (baseCode) conditions.push({ foodCode: baseCode, foodGroup: FoodGroup.BASE });
    if (proteinCode) conditions.push({ foodCode: proteinCode, foodGroup: FoodGroup.PROTEIN });
    if (prepCode) conditions.push({ foodCode: prepCode, foodGroup: FoodGroup.PREP });

    let ingredients: { id: number; name: string; foodCode: string; foodGroup: string }[] = [];
    if (conditions.length > 0) {
        ingredients = await prisma.foodLibrary.findMany({
            where: { OR: conditions },
            select: { id: true, name: true, foodCode: true, foodGroup: true },
        });
    }

    return {
        ingredients: ingredients.map(i => i.name),
        ingredientDetails: ingredients,
    };
};