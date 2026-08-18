import { Router, Request, Response, NextFunction } from "express";
import { cronController } from "../jobs/cronController";

const router = Router();

function verifyCronSecret(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
        console.error("[CRON] CRON_SECRET env variable is not set");
        return res.status(500).json({ message: "Cron secret not configured" });
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    next();
}

router.get("/periodic", verifyCronSecret, cronController.periodic);
router.get("/maintenance", verifyCronSecret, cronController.maintenance);

export default router;