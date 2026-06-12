import { Request, Response } from "express";
import { mealSelectionService } from "../services/mealSelectionService";
import { Days } from "../generated/prisma";

export const mealSelectionController = {
    getAllSelectionsController: async(req: Request, res: Response)=>{
        try{
            const selections = await mealSelectionService.getAllSelections();
            res.json(selections);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch selections" });
        }
    },
    getSelectionsByDateRangeController: async(req: Request, res: Response)=>{
        try{
            const { startDate, endDate } = req.query;
            if(!startDate || !endDate){
                return res.status(400).json({ error: "Start date and end date are required" });
            }
            const selections = await mealSelectionService.getSelectionsByDateRange(new Date(String(startDate)), new Date(String(endDate)));
            res.json(selections);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch selections by date range" });
        }
    },
    getSelectionByIdController: async(req: Request, res: Response)=>{
        try{
            const selectionId = Number(req.params.id);
            if(isNaN(selectionId)){
                return res.status(400).json({ error: "Invalid selection ID" });
            }
            const selection = await mealSelectionService.getSelectionById(selectionId);
            if(!selection){
                return res.status(404).json({ error: "Selection not found" });
            }
            res.json(selection);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch selection by ID" });
        }
    },
    getSelectionsByFilterController: async(req: Request, res: Response)=>{
        try{
            const { userId, mealId, day, menuId } = req.query;
            const filter: {userId?: number, mealId?: number, day?: string, menuId?: number} = {};
            if(userId) filter.userId = Number(userId);
            if(mealId) filter.mealId = Number(mealId);
            if(day) filter.day = String(day);
            if(menuId) filter.menuId = Number(menuId);
            const selections = await mealSelectionService.getSelectionsByFilter(filter);
            res.json(selections);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch selections by filter" });
        }
    },
    getSelectionsByUserIdController: async(req: Request, res: Response)=>{
        try{
            const userId = Number(req.query.userId);
            if(isNaN(userId)){
                return res.status(400).json({ error: "Invalid user ID" });
            }
            const selections = await mealSelectionService.getSelectionsByUserId(userId);
            res.json(selections);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch selections by user ID" });
        }
    },
    getSelectionsByMealIdController: async(req: Request, res: Response)=>{
        try{
            const mealId = Number(req.query.mealId);
            if(isNaN(mealId)){
                return res.status(400).json({ error: "Invalid meal ID" });
            }
            const selections = await mealSelectionService.getSelectionsByMealId(mealId);
            res.json(selections);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch selections by meal ID" });
        }
    },
    getSelectionsByDayController: async( req: Request, res: Response)=>{
        try{
            const day = String(req.query.day) as Days;
            const selections = await mealSelectionService.getSelectionsByDay(day);
            res.json(selections);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch selections by day" });
        }
    },

    createSelectionController: async(req: Request, res: Response)=>{
        try{
            const selectionResponse = await mealSelectionService.createSelection(req.body);
            res.status(201).json(selectionResponse);
        }catch(error){
            res.status(500).json({error:"Failed to create a new selection"});
        }
    },

    createBatchSelectionControleer: async( req: Request, res: Response) =>{
        try{
            const selectionsResponse = await mealSelectionService.createSelectionsBatch(req.body);
            res.status(201).json(selectionsResponse);
        }catch(error){
            res.status(500).json({error:"Failed to create new selections batch"})
        }
    }
}