import { Request, Response } from "express";
import z from "zod";
import { autoSelectService } from "../services/autoSelectService";

const autoSelectQuerySchema = z.object({
    menuId: z.coerce.number().int().positive(),
    userId: z.coerce.number().int().positive().optional(),
    weekMenuScheduleId: z.coerce.number().int().positive().optional(),
});

export const autoSelectController = {
    /**
     * GET /selections/auto-select?menuId=&userId=
     *
     * Returns a CreateMealSelectionRequest[] ready to POST to /selections/batch.
     *
     * userId defaults to the authenticated user; admins may pass a different userId
     * to generate suggestions on someone else's behalf.
     */
    autoSelectController: async (req: Request, res: Response) => {
        const parsed = autoSelectQuerySchema.safeParse(req.query);

        if (!parsed.success) {
            return res.status(400).json({
                error: "Invalid query parameters",
                details: parsed.error.flatten(),
            });
        }

        const { menuId, weekMenuScheduleId } = parsed.data;
        const userId = parsed.data.userId ?? (req.user as { id: number } | undefined)?.id;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        try {
            const selections = await autoSelectService.autoSelect(menuId, userId, weekMenuScheduleId);
            return res.status(200).json(selections);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to generate auto-selection";
            return res.status(500).json({ error: message });
        }
    },
};
