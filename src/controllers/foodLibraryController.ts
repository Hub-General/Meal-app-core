import { Request, Response } from "express";
import { FoodGroup } from "../generated/prisma";
import { foodLibraryService } from "../services/foodLibraryService";

export const foodLibraryController = {
    getAllFoodItemsController: async(req: Request, res: Response)=>{
        try {
            const foodItems = await foodLibraryService.getAllFoodItems();
            res.status(200).json(foodItems);
        } 
        catch (error){
            res.status(500).json({
            message: "Failed to fetch food items",
            error,
            });
        }
    },
    getFoodItemsByFoodGroupsController: async(req: Request, res:Response)=>{
        try{
            if(!req.params.foodGroup || !(req.params.foodGroup.length > 0) ){
                return res.status(400).json({message:'Food Group Invalid'})
            }
            const foodGroup = req.params.foodGroup as FoodGroup
            const items = await foodLibraryService.getFoodByGroup(foodGroup)
            res.status(200).json(items)
        }catch (error){
            res.status(500).json({error: 'Failed to fetch food groups'})
        }
    },
    getFoodItemByCode: async(req: Request, res: Response)=>{
        try{
            const foodCode =req.query.foodCode as string
            const items = await foodLibraryService.getFoodByFoodCode(foodCode)
            res.status(200).json(items)
        }catch(error){
            res.status(500).json({error:'Failed to get food items by Code'})
        }
    },
    createFoodItemsBatch: async(req:Request, res: Response)=>{
        try{
            if (!Array.isArray(req.body)) {
                return res.status(400).json({
                    error: 'Request body must be an array'
                })
            } 
            const items = await foodLibraryService.createFoodItemBatch(req.body)
            res.status(200).json(items)
        }catch (error){
            res.status(500).json({error: 'Failed to create food items'})
        }
    },
    createFoodItem: async(req: Request, res: Response)=>{
        try{
            if(!req.body){
                return res.status(400).json({
                    error:'Invalid request body'
                })
            }
            const foodItem = await foodLibraryService.createFoodItem(req.body)
            res.status(200).json("Successfully created food item")
        }catch(error){
            res.status(500).json({error:'Failed to create food item'})
        }
    },
}