import { Router } from "express";
import { weekMenuScheduleController } from "../controllers/weekMenuScheduleController";

const router = Router();

router.get("/", weekMenuScheduleController.getAllWeekMenuSchedulesController);
router.get("/by-week-year", weekMenuScheduleController.getWeekMenuScheduleByWeekAndYearController);
router.get("/by-menu", weekMenuScheduleController.getWeekMenuSchedulesByMenuController);
router.post("/", weekMenuScheduleController.createWeekMenuScheduleController);
router.get("/:id", weekMenuScheduleController.getWeekMenuScheduleByIdController);
router.put("/:id", weekMenuScheduleController.updateWeekMenuScheduleController);

export default router;