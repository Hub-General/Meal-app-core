import { Router } from "express";
import { weekMenuScheduleController } from "../controllers/weekMenuScheduleController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { Roles } from "../enums/ERoles";

const router = Router();

router.get("/", authenticate, weekMenuScheduleController.getAllWeekMenuSchedulesController);
router.get("/by-week-year",authenticate, weekMenuScheduleController.getWeekMenuScheduleByWeekAndYearController);
router.get("/by-menu",authenticate, weekMenuScheduleController.getWeekMenuSchedulesByMenuController);
router.get("/:id",authenticate, weekMenuScheduleController.getWeekMenuScheduleByIdController);
router.post("/",authenticate, authorize([Roles.admin, Roles.hr]),weekMenuScheduleController.createWeekMenuScheduleController);
router.put("/:id",authenticate, authorize([Roles.admin, Roles.hr]),weekMenuScheduleController.updateWeekMenuScheduleController);

export default router;