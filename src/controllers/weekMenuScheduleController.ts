import { Request, Response } from "express";
import { weekMenuScheduleCreateRequestSchema, weekMenuScheduleUpdateRequestSchema } from "../schema/weekMenuSchedule";
import { weekMenuScheduleService } from "../services/weekMenuScheduleService";

export const weekMenuScheduleController ={
    getAllWeekMenuSchedulesController: async(req: Request, res: Response) => {
        try{
            const weekMenuSchedules = await weekMenuScheduleService.getAllWeekMenuSchedules();
            res.json(weekMenuSchedules);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch week menu schedules" });
        }
    },
    getWeekMenuScheduleByIdController: async(req: Request, res: Response) => {
        try{
            const id = Number(req.params.id);
            if(isNaN(id)){
                return res.status(400).json({ error: "Invalid week menu schedule ID" });
            }
            const weekMenuSchedule = await weekMenuScheduleService.getWeekMenuScheduleById(id);
            if(!weekMenuSchedule){
                return res.status(404).json({ error: "Week menu schedule not found" });
            }
            res.json(weekMenuSchedule);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch week menu schedule" });
        }
    },
    getWeekMenuScheduleByWeekAndYearController: async(req: Request, res: Response) => {
        try{
            const week = Number(req.query.week);
            const year = Number(req.query.year);
            if(isNaN(week) || isNaN(year)){
                return res.status(400).json({ error: "Invalid week or year" });
            }
            const weekMenuSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({ week, year });
            if(!weekMenuSchedule){
                return res.status(404).json({ error: "Week menu schedule not found" });
            }
            res.json(weekMenuSchedule);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch week menu schedule" });
        }
    },
    getWeekMenuSchedulesByMenuController: async(req: Request, res: Response) => {
        try{
            const menuId = Number(req.query.menuId);
            if(isNaN(menuId)){
                return res.status(400).json({ error: "Invalid menu ID" });
            }
            const weekMenuSchedules = await weekMenuScheduleService.getWeekMenuSchedulesByMenu(menuId);
            res.json(weekMenuSchedules);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch week menu schedules" });
        }
    },
    createWeekMenuScheduleController: async(req: Request, res: Response) => {
        try{
            const parsed = weekMenuScheduleCreateRequestSchema.safeParse(req.body);
            if(!parsed.success){
                return res.status(400).json({ error: "Invalid week menu schedule payload", details: parsed.error.flatten() });
            }
            const { week, year, menuId } = parsed.data;

            //Check if existing schedule for the same week and year, return error if true
            const existingSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({ week, year });
            if(existingSchedule){
                return res.status(400).json({ error: "A week menu schedule for the specified week and year already exists" });
            }

            //All clear , proceed
            const newWeekMenuSchedule = await weekMenuScheduleService.createWeekMenuSchedule({week, year, menuId});
            res.status(201).json(newWeekMenuSchedule);
        } catch (error) {
            res.status(500).json({ error: "Failed to create week menu schedule" });
        }
    },
    updateWeekMenuScheduleController: async(req: Request, res: Response) => {
        try{
            const id = Number(req.params.id);
            if(isNaN(id)){
                return res.status(400).json({ error: "Invalid week menu schedule ID" });
            }
            const parsed = weekMenuScheduleUpdateRequestSchema.safeParse(req.body);
            if(!parsed.success){
                return res.status(400).json({ error: "Invalid week menu schedule update payload", details: parsed.error.flatten() });
            }
            const updatedWeekMenuSchedule = await weekMenuScheduleService.updateWeekMenuSchedule(id, parsed.data);
            if(!updatedWeekMenuSchedule){
                return res.status(404).json({ error: "Week menu schedule not found" });
            }
            res.json(updatedWeekMenuSchedule);
        } catch (error) {
            res.status(500).json({ error: "Failed to update week menu schedule" });
        }
    },
}