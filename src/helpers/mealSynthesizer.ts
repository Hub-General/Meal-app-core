import prisma from "../prisma/client";
import { FoodGroup } from "../generated/prisma";

export const synthesizeMeals = async (foodCode: string) => {

    const parts = foodCode.split("-");
    const supergroupCode = parts[0];
    const baseCode = parts[1];
    const proteinCode = parts[2];
    const prepCode = parts[3];

    const conditions: any[] = [];
    
    if (supergroupCode) {
        supergroupCode.split("|").forEach(code => conditions.push({ foodCode: code, foodGroup: FoodGroup.SUPERGROUP }));
    }
    if (baseCode) {
        baseCode.split("|").forEach(code => conditions.push({ foodCode: code, foodGroup: FoodGroup.BASE }));
    }
    if (proteinCode) {
        proteinCode.split("|").forEach(code => conditions.push({ foodCode: code, foodGroup: FoodGroup.PROTEIN }));
    }
    if (prepCode) {
        prepCode.split("|").forEach(code => conditions.push({ foodCode: code, foodGroup: FoodGroup.PREP }));
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