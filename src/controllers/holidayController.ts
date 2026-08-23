import { Request, Response } from "express";
import { holidayService } from "../services/holidayService";
import {
    createHolidaySchema,
    holidayOverrideSchema,
    holidayQuerySchema,
    updateHolidaySchema,
    weekHolidayQuerySchema,
} from "../schema/holiday";

export const holidayController = {
    getAllHolidaysController: async (req: Request, res: Response) => {
        try {
            const parsed = holidayQuerySchema.safeParse(req.query);
            const year = parsed.success && parsed.data.year ? parsed.data.year : undefined;
            const holidays = await holidayService.getAllHolidays(year);
            res.json(holidays);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch holidays", message: `${error}` });
        }
    },

    getWeekHolidaysController: async (req: Request, res: Response) => {
        try {
            const parsed = weekHolidayQuerySchema.safeParse(req.query);
            if (!parsed.success) {
                return res.status(400).json({ error: "Week and year are required", details: parsed.error.flatten() });
            }
            const { week, year } = parsed.data;
            const holidays = await holidayService.getHolidaysForWeek(week, year);
            res.json(holidays);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch week holidays", message: `${error}` });
        }
    },

    createHolidayController: async (req: Request, res: Response) => {
        try {
            const parsed = createHolidaySchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid holiday payload", details: parsed.error.flatten() });
            }
            const created = await holidayService.createCompanyHoliday(parsed.data);
            res.status(201).json(created);
        } catch (error) {
            res.status(500).json({ error: "Failed to create holiday", message: `${error}` });
        }
    },

    updateHolidayController: async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: "Invalid holiday ID" });
            }
            const parsed = updateHolidaySchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid update payload", details: parsed.error.flatten() });
            }
            const updated = await holidayService.updateCompanyHoliday(id, parsed.data);
            res.json(updated);
        } catch (error) {
            res.status(500).json({ error: "Failed to update holiday", message: `${error}` });
        }
    },

    deleteHolidayController: async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: "Invalid holiday ID" });
            }
            await holidayService.deleteCompanyHoliday(id);
            res.json({ message: "Holiday deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: "Failed to delete holiday", message: `${error}` });
        }
    },

    // Holiday Overrides
    getOverridesController: async (req: Request, res: Response) => {
        try {
            const parsed = holidayQuerySchema.safeParse(req.query);
            const year = parsed.success && parsed.data.year ? parsed.data.year : undefined;
            const overrides = await holidayService.getOverrides(year);
            res.json(overrides);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch holiday overrides", message: `${error}` });
        }
    },

    createOrUpdateOverrideController: async (req: Request, res: Response) => {
        try {
            const parsed = holidayOverrideSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: "Invalid override payload", details: parsed.error.flatten() });
            }
            const override = await holidayService.createOrUpdateOverride(parsed.data);
            res.json(override);
        } catch (error) {
            res.status(500).json({ error: "Failed to save holiday override", message: `${error}` });
        }
    },

    deleteOverrideController: async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: "Invalid override ID" });
            }
            const result = await holidayService.deleteOverride(id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: "Failed to delete holiday override", message: `${error}` });
        }
    },
};
