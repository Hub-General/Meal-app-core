import { Request, Response } from "express";
import { mealService } from "../services/mealService";

export const mealController = {
    createMealController: async(req: Request, res: Response)=>{
        try{
            const meal = await mealService.createMeal(req.body);
            res.status(201).json({message: "Meal created successfully", meal});
        } catch(error) {
            res.status(500).json({
                message: "Failed to create meal",
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
            const meal = await mealService.updateMeal(Number(req.params.id), req.body);
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