import { CreateMealRequest, UpdateMealBatchRequest, UpdateMealRequest } from "../schema/meal";
import prisma from "../prisma/client";
import { userPreferenceService } from "./userPreferenceService";
import { synthesizeMeals } from "../helpers/mealSynthesizer";

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
    getMealDetails: async(foodCode: string)=>{
            const response =  await prisma.meals.findUnique({
                where:{foodCode: foodCode},
                select:{name:true, description:true, imagePath:true, calories:true, }
            });
            if (!response) throw new Error("No meal exists with this Code");
            
            const ingredients = await synthesizeMeals(foodCode);

            return {
                ...response,
                ...ingredients,
            };
    },
    updateMeal : async(mealId: number, mealData: UpdateMealRequest)=>{
        return await prisma.meals.update({where: {id: mealId}, data: mealData});
    },
    
updateMealBatch: async (mealData: UpdateMealBatchRequest) => {
  return await prisma.$transaction(
    mealData.map(({ id, ...data }) =>
      prisma.meals.update({
        where: { id },
        data,
      })
    ),
    {
      timeout: 30000,
    }
  );
},
    deleteMeal: async(mealId: number)=>{
        return await prisma.meals.update({where: {id: mealId}, data: {isActive: false}});
    },
}