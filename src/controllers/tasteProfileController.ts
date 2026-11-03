import { Request, Response } from "express";
import { tasteProfileService } from "../services/tasteProfileService";

export const tasteProfileController = {
    getTasteProfileByUserIdController: async (req: Request, res: Response) => {
        try {
            const rawId = req.params.id ?? (typeof req.query.userId === "string" ? req.query.userId : undefined);
            const targetUserId = rawId ? Number(rawId) : req.user?.id;
            if (!targetUserId || isNaN(targetUserId)) {
                return res.status(400).json({
                    message: "Invalid User ID",
                });
            }
            const year = req.query.year ? Number(req.query.year) : undefined;
            const tasteProfile = await tasteProfileService.getTasteProfileByUserId(targetUserId, year);
            res.status(200).json(tasteProfile);
        } catch (error) {
            res.status(500).json({
                message: "Failed to Fetch Taste Profile by User ID",
            });
        }
    },

    getTasteProfilesController: async (req: Request, res: Response) => {
        try {
            const year = req.query.year ? Number(req.query.year) : undefined;
            const tasteProfiles = await tasteProfileService.getTasteProfiles(year);
            res.status(200).json(tasteProfiles);
        } catch (error) {
            res.status(500).json({
                message: "Failed to Fetch Taste Profiles",
            });
        }
    },

    getUserTasteProfileRecapController: async (req: Request, res: Response) => {
        try {
            const rawId = req.params.id ?? (typeof req.query.userId === "string" ? req.query.userId : undefined);
            const targetUserId = rawId ? Number(rawId) : req.user?.id;

            if (!targetUserId || isNaN(targetUserId)) {
                return res.status(400).json({
                    message: "Invalid User ID",
                });
            }

            const year = req.query.year ? Number(req.query.year) : undefined;
            if (year !== undefined && isNaN(year)) {
                return res.status(400).json({
                    message: "Invalid year parameter",
                });
            }

            const recap = await tasteProfileService.getUserTasteProfileRecap(targetUserId, year);
            return res.status(200).json(recap);
        } catch (error) {
            return res.status(500).json({
                message: "Failed to generate Taste Profile Recap",
                error,
            });
        }
    },

    updateUserTasteProfileController: async (req: Request, res: Response) => {
        try {
            const rawId = req.params.id ?? (typeof req.query.userId === "string" ? req.query.userId : undefined);
            const targetUserId = rawId ? Number(rawId) : req.user?.id;
            if (!targetUserId || isNaN(targetUserId)) {
                return res.status(400).json({
                    message: "Invalid User ID",
                });
            }
            const year = req.query.year ? Number(req.query.year) : undefined;
            const tasteProfile = await tasteProfileService.updateUserTasteProfile(targetUserId, year);
            res.status(200).json(tasteProfile);
        } catch (error) {
            res.status(500).json({
                message: "Failed to Update User Taste Profile",
            });
        }
    },

    forceSyncTasteProfilesController: async (req: Request, res: Response) => {
        try {
            const userIdParam =
                req.params.userId ??
                (typeof req.query.userId === "string" ? req.query.userId : undefined);
            const calendarYear = req.query.year
                ? Number(req.query.year)
                : new Date().getFullYear();

            if (userIdParam) {
                const userId = Number(userIdParam);
                if (isNaN(userId)) {
                    return res.status(400).json({ message: "Invalid User ID for sync" });
                }
                const profile = await tasteProfileService.updateUserTasteProfile(userId, calendarYear);
                return res.status(200).json({
                    message: `Successfully force synced taste profile for user ${userId}`,
                    profile,
                });
            }

            const profiles = await tasteProfileService.updateActiveUsersTasteProfiles(calendarYear);
            return res.status(200).json({
                message: `Successfully force synced taste profiles for ${profiles.length} active users`,
                count: profiles.length,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to force sync taste profiles";
            return res.status(500).json({
                message,
                error,
            });
        }
    },
};