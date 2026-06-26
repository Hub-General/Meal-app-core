import { Request, Response } from "express";
import { mealSelectionService } from "../services/mealSelectionService";
import { MealSelectionFilter } from "../interfaces/mealSelection";
import { selectionHelper } from "../helpers/mealSelectionHelpers";

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
            const filter: MealSelectionFilter = {};
            if(userId) filter.createdFor = Number(userId);
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
            const userId = Number(req.params.id);
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
            const mealId = Number(req.params.id);
            if(isNaN(mealId)){
                return res.status(400).json({ error: "Invalid meal ID" });
            }
            const selections = await mealSelectionService.getSelectionsByMealId(mealId);
            res.json(selections);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch selections by meal ID" });
        }
    },

    // GET Weekly Selections
    getWeeklySelectionsController: async( req: Request, res: Response)=>{
        try{
            const { date: dateQuery } = req.query;
            if (!dateQuery) {
                return res.status(400).json({ error: "Date parameter is required" });
            }
            const date = new Date(String(dateQuery));
            const selections = await mealSelectionService.getWeeklySelections(date);
            res.json(selections);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch selections by date" });
        }
    },

    getWeeklySelectionsByDateController: async( req: Request, res: Response)=>{
        try{
            const { date: dateQuery } = req.query;
            if (!dateQuery) {
                return res.status(400).json({ error: "Date parameter is required" });
            }
            const date = new Date(String(dateQuery));
            const selections = await mealSelectionService.getWeeklySelectionsByDate(date);
            res.json(selections);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch selections by date" });
        }
    },
    getWeeklySelectionsByUserController: async( req: Request, res: Response)=>{
        try{
            const { date: dateQuery } = req.query;
            const userId = Number(req.params.id);
            if (!dateQuery) {
                return res.status(400).json({ error: "Date parameter is required" });
            }
            const date = new Date(String(dateQuery));
            if(!userId && isNaN(userId)){
                return res.status(400).json({ error: "User ID is required" });
            }
            const selections = await mealSelectionService.getWeeklySelectionsByUser(date, userId);
            res.json(selections);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch selections by date" });
        }
    },
    getUsersWithoutSelectionsController: async( req: Request, res: Response)=>{
        try{
            const { date: dateQuery } = req.query;
            if (!dateQuery) {
                return res.status(400).json({ error: "Date parameter is required" });
            }
            const date = new Date(String(dateQuery));
    
            const results = await mealSelectionService.getUsersWithoutSelections(date);
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch users without selections" });
        }
    },

    //CREATE Selections

    createSelectionController: async(req: Request, res: Response)=>{
        try{
            const { weekMenuScheduleId, createdFor, menuDayId } = req.body;

            // Check if the user has already submitted for the day
            const isSelectionExist = await selectionHelper.isSelectionExist(weekMenuScheduleId, menuDayId, createdFor);
            if(isSelectionExist) {
                return res.status(403).json({ 
                    error: "Selection cannot be created because a selection has already been made for this day." 
                });
            }
            
            const selectionResponse = await mealSelectionService.createSelection(req.body);
            res.status(201).json(selectionResponse);
        }catch(error){
            res.status(500).json({error:"Failed to create a new selection"});
        }
    },

    createBatchSelectionController: async( req: Request, res: Response) =>{
        try{
            const selectionsData: any[] = req.body;
            
            // Check if any of the weeks in the batch are already submitted
            for (const data of selectionsData) {
                const isExisting = await selectionHelper.isSelectionExist(data.weekMenuScheduleId, data.menuDayId, data.createdFor);
                if (isExisting) {
                    return res.status(403).json({
                        error: `Selection cannot be created because selection for this date already exists).`
                    });
                }
            }

            const selectionsResponse = await mealSelectionService.createSelectionsBatch(req.body);
            res.status(201).json(selectionsResponse);
        }catch(error){
            res.status(500).json({error:"Failed to create new selections batch"})
        }
    },

    //UPDATE Selections
    updateSelectionController: async(req: Request, res: Response)=>{
        try{
            const selectionId = Number(req.params.id);
            const selectionData = req.body;

            // Get the selection to check its week
            const selection = await mealSelectionService.getSelectionById(selectionId);
            if(!selection){
                return res.status(404).json({ error: "Selection not found" });
            }

            // Check if selection is already submitted
            if (selection.selectionStatus === "SUBMITTED") {
                return res.status(403).json({ 
                    error: "Cannot update a selection that has already been submitted." 
                });
            }

            const updatedSelection = await mealSelectionService.updateSelection(selectionId, selectionData);
            res.status(200).json(updatedSelection);
        }catch(error){
            res.status(500).json({error:"Failed to update selection"});
        }
    },
    updateSelectionsBatchController: async(req: Request, res: Response)=>{
        try{
            const ids = req.body.map((s: any) => s.id);
            const selections = await mealSelectionService.getSelectionsByIds(ids);

            const submitted = selections.find(s => s.selectionStatus === "SUBMITTED");
            if(submitted){
                return res.status(403).json({ 
                    error: `Selection with ID ${submitted.id} has already been submitted and cannot be updated.` 
                });
            }
            const selectionsResponse = await mealSelectionService.updateSelectionsBatch(req.body);
            res.status(200).json(selectionsResponse);
        }catch(error){
            res.status(500).json({error:"Failed to update selections batch"})
        }
    }
}