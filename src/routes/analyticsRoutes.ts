import { Router } from "express";
import { analyticsController } from "../controllers/analyticsController";
import { Roles } from "../enums/ERoles";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

router.get("/dashboard", authenticate, authorize([Roles.admin, Roles.manager, Roles.hr]), analyticsController.getDashboardAnalyticsController);

export default router;
