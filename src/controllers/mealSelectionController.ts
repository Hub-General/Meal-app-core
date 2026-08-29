import { Request, Response } from "express";
import { mealSelectionService, SelectionConflictError } from "../services/mealSelectionService";
import { bulkDeleteGuestSelectionsRequestSchema, createMealSelectionBatchRequestSchema, getUsersWithoutSelectionsRequestSchema, getUsersWithSelectionsRequestSchema, mealSelectionFilterSchema, replaceWeeklyMealRequestSchema, replaceWeeklyMealsBatchRequestSchema, submitWeeklySelectionsRequestSchema, weeklyHistoryFilterSchema } from "../schema/mealSelection";
import { SelectionValidationError } from "../helpers/validateSelectionUpdate";
import { Roles } from "../enums/ERoles";

export const mealSelectionController = {
    getAllSelectionsController: async(req: Request, res: Response)=>{
        try{
            const parsed = mealSelectionFilterSchema.safeParse(req.query);

            if (!parsed.success) {
                return res.status(400).json({
                    error: "Invalid filter parameters",
                    details: parsed.error.flatten()
                });
            }
            const selections = await mealSelectionService.getAllSelections(parsed.data);
            res.json(selections);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch selections", error });
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
            res.status(500).json({ message: "Failed to fetch selections by date range" , error});
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
            res.status(500).json({ message: "Failed to fetch selection by ID" , error});
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
            res.status(500).json({ message: "Failed to fetch selections by date" , error});
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
            res.status(500).json({ message: "Failed to fetch selections by date",error });
        }
    },

    getWeeklyGuestSelectionsController: async( req: Request, res: Response)=>{
        try{
            const { date: dateQuery } = req.query;
            if (!dateQuery) {
                return res.status(400).json({ error: "Date parameter is required" });
            }
            const date = new Date(String(dateQuery));
            const selections = await mealSelectionService.getWeeklyGuestSelections(date);
            res.json(selections);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch guest selections", error });
        }
    },

    deleteGuestSelectionController: async( req: Request, res: Response)=>{
        try{
            const selectionId = Number(req.params.id);
            if (!selectionId || isNaN(selectionId)) {
                return res.status(400).json({ error: "Valid selection ID is required" });
            }
            const count = req.query.count ? Number(req.query.count) : (req.body?.count ? Number(req.body.count) : undefined);
            const result = await mealSelectionService.deleteGuestSelection(selectionId, count);
            res.json(result);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete guest selection";
            res.status(400).json({ message });
        }
    },

    bulkDeleteGuestSelectionsController: async (req: Request, res: Response) => {
        try {
            const parsed = bulkDeleteGuestSelectionsRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    error: "Invalid bulk delete payload",
                    details: parsed.error.flatten()
                });
            }
            const result = await mealSelectionService.bulkDeleteGuestSelections(parsed.data.ids);
            res.json(result);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to bulk delete guest selections";
            res.status(400).json({ message });
        }
    },

    //SUMBIT SELECTIONS
    submitSelectionsController: async( req: Request, res: Response) =>{
        try{
            const parsed = createMealSelectionBatchRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid selection batch payload", details: parsed.error.flatten() });
            }

            const selectionsResponse = await mealSelectionService.submitSelections(parsed.data, 
            req.user!.id);
            res.status(201).json(selectionsResponse);
        }catch(error){

            if (error instanceof SelectionValidationError) {
            return res.status(403).json({
                message: error.message,
                errors: error.errors
            });
            }

            if (error instanceof SelectionConflictError) {
                return res.status(409).json({ message: error.message });
            }

            res.status(500).json({message:`${error}`})
        }
    },

    //ADMIN CONTROLLERS

    getUsersWithoutSelectionsController: async( req: Request, res: Response)=>{
        try{
            const parsed = getUsersWithoutSelectionsRequestSchema.safeParse(req.query);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid query parameters", details: parsed.error.flatten() });
            }
            const results = await mealSelectionService.getUsersWithoutSelections(parsed.data.date, parsed.data.maxSelections);
            res.status(200).json(results);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch users without selections", error });
        }
    },

    getUsersWithSelectionsController: async( req: Request, res: Response)=>{
        try{
            const parsed = getUsersWithSelectionsRequestSchema.safeParse(req.query);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid query parameters", details: parsed.error.flatten() });
            }
            const results = await mealSelectionService.getUsersWithSelections(parsed.data.date);
            res.status(200).json(results);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch users with selections", error });
        }
    },

    adminOverrideSelectionsController: async ( req: Request, res: Response)=>{
        try{
            const parsed = createMealSelectionBatchRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid selection batch payload", details: parsed.error.flatten() });
            }
            const response = await mealSelectionService.adminOverrideSelections(parsed.data, req.user!.id)
            res.status(200).json(response)
        }catch(error){
            if (error instanceof SelectionConflictError) {
                return res.status(409).json({ message: error.message });
            }
            res.status(500).json({message:"Failed to override Selections", error})
        }
    },

    replaceWeeklyMealController: async (req: Request, res: Response) => {
        try {
            const parsed = replaceWeeklyMealRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid meal replacement payload", details: parsed.error.flatten() });
            }

            const response = await mealSelectionService.replaceWeeklyMeal(parsed.data);
            return res.status(200).json(response);
        } catch (error) {
            if (error instanceof SelectionConflictError) {
                return res.status(409).json({ message: error.message });
            }
            return res.status(500).json({ message: "Failed to replace weekly meal", error });
        }
    },

    replaceWeeklyMealsController: async (req: Request, res: Response) => {
        try {
            const parsed = replaceWeeklyMealsBatchRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid meal replacement batch payload", details: parsed.error.flatten() });
            }

            const response = await mealSelectionService.replaceWeeklyMeals(parsed.data);
            return res.status(200).json(response);
        } catch (error) {
            if (error instanceof SelectionConflictError) {
                return res.status(409).json({ message: error.message });
            }
            return res.status(500).json({ message: "Failed to replace weekly meals", error });
        }
    },
        
    //UPDATE Selections Status
    updateWeeklySelectionsStatusController: async(req: Request, res: Response)=>{
        try{
            const parsed = submitWeeklySelectionsRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid weekly submission payload", details: parsed.error.flatten() });
            }
            const { weekNumber, year , status} = parsed.data;
            await mealSelectionService.changeWeeklySelectionsStatus(weekNumber, year, status);
            res.status(200).json({ message: "Weekly selections submitted successfully" });
        }catch(error){
            res.status(500).json({message:"Failed to submit weekly selections", error})
        }
    },

    // HISTORY CONTROLLERS

    getWeeklySelectionsHistoryController: async (req: Request, res: Response) => {
        try {
            const parsed = weeklyHistoryFilterSchema.safeParse(req.query);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid history query parameters", details: parsed.error.flatten() });
            }

            const history = await mealSelectionService.getWeeklySelectionsHistory(parsed.data);
            res.status(200).json(history);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch weekly selections history", error });
        }
    },

    getUserWeeklySelectionsHistoryController: async (req: Request, res: Response) => {
        try {
            const parsed = weeklyHistoryFilterSchema.safeParse(req.query);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid history query parameters", details: parsed.error.flatten() });
            }

            const paramUserId = req.params.id ? Number(req.params.id) : undefined;
            const queryUserId = parsed.data.userId;
            const authenticatedUserId = req.user?.id;

            const targetUserId = paramUserId || queryUserId || authenticatedUserId;

            if (!targetUserId || isNaN(targetUserId)) {
                return res.status(400).json({ error: "User ID is required" });
            }

            const isAdminOrHr = req.user?.roleId === Roles.admin || req.user?.roleId === Roles.hr;

            if (authenticatedUserId && targetUserId !== authenticatedUserId && !isAdminOrHr) {
                return res.status(403).json({ error: "Unauthorized to view other users' selection history" });
            }

            const history = await mealSelectionService.getUserWeeklySelectionsHistory(targetUserId, parsed.data);
            res.status(200).json(history);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch user weekly selections history", error });
        }
    }
}