import { CreateMealRequest, UpdateMealRequest } from "../schema/meal";
import prisma from "../prisma/client";
import { userPreferenceService } from "./userPreferenceService";

export const mealService = {

    createMeal: async(mealData: CreateMealRequest)=>{
        return await prisma.meals.create({data: mealData});
    },
    createMealBatch: async(mealData: CreateMealRequest[])=>{
        return await prisma.meals.createMany({data: mealData, skipDuplicates: true})
    },
    getAllMeals: async(userId?:number)=>{
        const excludedMealIds = userId
        ? await userPreferenceService.getUserExcludedMeals(userId)
        : [];

        return await prisma.meals.findMany({where:{id:{notIn:excludedMealIds}}});
    },
    getMealById: async(mealId: number)=>{
        return await prisma.meals.findUnique({where: {id: mealId}});
    },
    getMealByFoodCode: async(foodCode: string)=>{
        return await prisma.meals.findUnique({where:{foodCode:foodCode}})
    },
    updateMeal : async(mealId: number, mealData: UpdateMealRequest)=>{
        return await prisma.meals.update({where: {id: mealId}, data: mealData});
    },
    deleteMeal: async(mealId: number)=>{
        return await prisma.meals.update({where: {id: mealId}, data: {isActive: false}});
    },
}