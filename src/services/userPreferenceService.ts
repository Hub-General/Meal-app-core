import { prisma } from "../db/prisma";
import { getExcludedMeals } from "../helpers/mealPreferencesHelpers";
import { createUserPreferencesRequest, UserDislikes, UserPreference } from "../schema/userPreference";

export const userPreferenceService = {
    getUserPreference: async (userId: number)=>{
        const preference = await prisma.userPreferences.findUnique({
            where:{userId:userId}
        })
        return preference ?? {
            userId: null,
            dislikes: null,
            excludedMealIds: null
        }
    },
    
    getUserExcludedMeals: async(userId: number)=>{
        const meals =  await prisma.userPreferences.findUnique({
            where:{userId: userId}, 
            select:{
                excludedMealIds: true
            }
        })
        return (meals?.excludedMealIds as number[]) ?? [];
    },
    updateUserPreference: async(userId: number, preferences: createUserPreferencesRequest)=>{
        if(!!preferences.dislikes){
        const meals = await prisma.meals.findMany({
        select:{
            id: true,
            foodCode: true
            }
        })
        const excludedMeals = getExcludedMeals(meals, preferences.dislikes)   
            
        return await prisma.userPreferences.upsert({
            where:{userId:userId},
            create:{
                userId: userId,
                dislikes: preferences.dislikes,
                excludedMealIds: excludedMeals
            },
            update:{
                dislikes: preferences.dislikes,
                excludedMealIds: excludedMeals
            }
        })
    }
    },
    
    //ADMIN Service
    syncUserTastePreferences: async()=>{

    }
}