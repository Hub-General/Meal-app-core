import { Request, Response } from "express";
import { mealService } from "../services/mealService";
import { imageUploadService } from "../services/imageUploadService";
import { CreateMealRequestSchema, UpdateMealRequestSchema } from "../schema/meal";

// Multipart form-data delivers every field as a string. Coerce the numeric and
// boolean meal fields so the zod schemas validate the same way they do for JSON.
const normalizeMealBody = (body: Record<string, unknown>) => {
    const normalized: Record<string, unknown> = { ...body };
    if (typeof normalized.calories === "string") {
        normalized.calories = normalized.calories.trim() === "" ? undefined : Number(normalized.calories);
    }
    if (typeof normalized.isActive === "string") {
        normalized.isActive = normalized.isActive === "true";
    }
    return normalized;
};

export const mealController = {
    createMealController: async(req: Request, res: Response)=>{
        try{
            const request = CreateMealRequestSchema.safeParse(normalizeMealBody(req.body || {}));
            if(!request.success){
                return res.status(400).json({
                    message:"Invalid request body", 
                    error: request.error.flatten()
                })
            }
            const data = { ...request.data };
            if (req.file) {
                const { url } = await imageUploadService.uploadImage(req.file, "meals");
                data.imagePath = url;
            }
            const meal = await mealService.createMeal(data);
            res.status(201).json({message: "Meal created successfully", meal});
        } catch(error: any) {
            console.error("Failed to create meal:", error);
            res.status(500).json({
                message: "Failed to create meal",
                error: error?.message || String(error),
            })
        }
    },
    createMealBatchController: async(req: Request, res: Response)=>{
        try{
            const parsed = CreateMealRequestSchema.array().safeParse(req.body);
            if(!parsed.success){
                return res.status(400).json({error:'Request body must be an array of objects', details: parsed.error.flatten()})
            }
            const meal = await mealService.createMealBatch(parsed.data);
            res.status(201).json({message: "Meals created successfully", meal});
        } catch(error: any ) {
            console.error("Failed to create meal batch:", error);
            res.status(500).json({
                message: "Failed to create meals",
                error: error?.message || String(error),
            })
        }
    },
    getAllMealsController: async(req: Request, res: Response)=>{
        try{
            const meals = await mealService.getAllMeals();
            res.status(200).json({message: "Meals retrieved successfully", meals});
        } catch(error: any) {
            console.error("Failed to retrieve meals:", error);
            res.status(500).json({
                message: "Failed to retrieve meals",
                error: error?.message || String(error),
            })
        }
    },
    getMealDetailsByIdController: async(req: Request, res: Response)=>{
        try{
            const foodCode = req.params.foodCode as string;
            const mealDetails = await mealService.getMealDetails(foodCode);
            res.status(200).json({message: "Meal details retrieved successfully", mealDetails});
        } catch(error: any) {
            console.error("Failed to retrieve meal details by ID:", error);
            res.status(500).json({
                message: "Failed to retrieve meal details",
                error: error?.message || String(error),
            })
        }
    },
    getMealByIdController: async(req: Request, res: Response)=>{
        try{
            const meal = await mealService.getMealById(Number(req.params.id));
            res.status(200).json({message: "Meal retrieved successfully", meal});
        } catch(error: any) {
            console.error("Failed to retrieve meal by ID:", error);
            res.status(500).json({
                message: "Failed to retrieve meal",
                error: error?.message || String(error),
            })
        }
    },
    updateMealController: async(req: Request, res: Response)=>{
        try{
            const request = UpdateMealRequestSchema.safeParse(normalizeMealBody(req.body || {}));
            if(!request.success){
                return res.status(400).json({
                    message:"Invalid request body",
                    error: request.error.flatten()
                })
            }
            const data = { ...request.data };
            if (req.file) {
                const { url } = await imageUploadService.uploadImage(req.file, "meals");
                data.imagePath = url;
            }
            const meal = await mealService.updateMeal(Number(req.params.id), data);
            res.status(200).json({message: "Meal updated successfully", meal});
        } catch(error: any) {
            console.error("Failed to update meal:", error);
            res.status(500).json({
                message: "Failed to update meal",
                error: error?.message || String(error),
            })
        }
    },
    deleteMealController: async(req: Request, res: Response)=>{
        try{
            const meal = await mealService.deleteMeal(Number(req.params.id));
            res.status(200).json({message: "Meal deleted successfully", meal});
        } catch(error: any) {
            console.error("Failed to delete meal:", error);
            res.status(500).json({
                message: "Failed to delete meal",
                error: error?.message || String(error),
            })
        }
    }
}