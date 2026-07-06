import { Request, Response } from "express";
import { mealService } from "../services/mealService";
import { CreateMealRequestSchema, UpdateMealRequestSchema } from "../schema/meal";

export const mealController = {
    createMealController: async(req: Request, res: Response)=>{
        try{
            const request = CreateMealRequestSchema.safeParse(req.body)
            if(!request.success){
                return res.status(400).json({
                    message:"Invalid request body", 
                    error: request.error.flatten()
                })
            }
            const meal = await mealService.createMeal(request.data);
            res.status(201).json({message: "Meal created successfully", meal});
        } catch(error) {
            res.status(500).json({
                message: "Failed to create meal",
                error,
            })
        }
    },
    createMealBatchController: async(req: Request, res: Response)=>{
        try{
            if(!Array.isArray(req.body) || !(req.body.length > 0)){
                return res.status(400).json({error:'Request body must be an array of objects'})
            }
            const meal = await mealService.createMealBatch(req.body);
            res.status(201).json({message: "Meals created successfully", meal});
        } catch(error:any ) {
            console.log(error.message)
            res.status(500).json({
                message: "Failed to create meals",
                error,
            })
        }
    },
    getAllMealsController: async(req: Request, res: Response)=>{
        try{
            const meals = await mealService.getAllMeals();
            res.status(200).json({message: "Meals retrieved successfully", meals});
        } catch(error) {
            res.status(500).json({
                message: "Failed to retrieve meals",
                error,
            })
        }
    },
    getMealByIdController: async(req: Request, res: Response)=>{
        try{
            const meal = await mealService.getMealById(Number(req.params.id));
            res.status(200).json({message: "Meal retrieved successfully", meal});
        } catch(error) {
            res.status(500).json({
                message: "Failed to retrieve meal",
                error,
            })
        }
    },
    updateMealController: async(req: Request, res: Response)=>{
        try{
            const request = UpdateMealRequestSchema.safeParse(req.body);
            if(!request.success){
                return res.status(400).json({
                    message:"Invalid request body",
                    error: request.error.flatten()
                })
            }
            const meal = await mealService.updateMeal(Number(req.params.id), request.data);
            res.status(200).json({message: "Meal updated successfully", meal});
        } catch(error) {
            res.status(500).json({
                message: "Failed to update meal",
                error,
            })
        }
    },
    deleteMealController: async(req: Request, res: Response)=>{
        try{
            const meal = await mealService.deleteMeal(Number(req.params.id));
            res.status(200).json({message: "Meal deleted successfully", meal});
        } catch(error) {
            res.status(500).json({
                message: "Failed to delete meal",
                error,
            })
        }
    }
}