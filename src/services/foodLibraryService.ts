import { prisma } from "../db/prisma";
import { FoodGroup } from "../generated/prisma";

export interface CreateFoodItemRequest{
    name : string
    foodCode: string
    foodGroup: FoodGroup
}
export const foodLibraryService = {
    getAllFoodItems: async()=>{
        return await prisma.foodLibrary.findMany()
    },
    getFoodByGroup: async(foodGroup: FoodGroup)=>{
        return await prisma.foodLibrary.findMany({where:{foodGroup}})
    },
    getFoodByFoodCode: async(foodCode: string)=>{
        return await prisma.foodLibrary.findMany({where:{foodCode}})
    },
    createFoodItem: async(data : CreateFoodItemRequest)=>{
        return await prisma.foodLibrary.create({data: data})
    },
    createFoodItemBatch: async(data: CreateFoodItemRequest[])=>{
        return await prisma.foodLibrary.createMany({data: data, skipDuplicates: true})
    }
}