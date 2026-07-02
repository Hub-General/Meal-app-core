import { CreateMealRequest } from "../interfaces/meal";
import prisma from "../prisma/client";

export const mealService = {

    createMeal: async(mealData: CreateMealRequest)=>{
        return await prisma.meals.create({data: mealData});
    },
    createMealBatch: async(mealData: CreateMealRequest[])=>{
        return await prisma.meals.createMany({data: mealData, skipDuplicates: true})
    },
    getAllMeals: async()=>{
        return await prisma.meals.findMany();
    },
    getMealById: async(mealId: number)=>{
        return await prisma.meals.findUnique({where: {id: mealId}});
    },
    getMealByFoodCode: async(foodCode: string)=>{
        return await prisma.meals.findUnique({where:{foodCode:foodCode}})
    },
    updateMeal : async(mealId: number, mealData: CreateMealRequest)=>{
        return await prisma.meals.update({where: {id: mealId}, data: mealData});
    },
    deleteMeal: async(mealId: number)=>{
        return await prisma.meals.update({where: {id: mealId}, data: {isActive: false}});
    },
}