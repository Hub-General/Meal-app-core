import { Router } from "express";
import { holidayController } from "../controllers/holidayController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { Roles } from "../enums/ERoles";

const router = Router();

// Read routes
router.get("/", authenticate, holidayController.getAllHolidaysController);
router.get("/week", authenticate, holidayController.getWeekHolidaysController);
router.get("/overrides", authenticate, holidayController.getOverridesController);

// Admin-only management routes
router.post("/", authenticate, authorize([Roles.admin, Roles.hr]), holidayController.createHolidayController);
router.put("/:id", authenticate, authorize([Roles.admin, Roles.hr]), holidayController.updateHolidayController);
router.delete("/:id", authenticate, authorize([Roles.admin, Roles.hr]), holidayController.deleteHolidayController);

// Admin-only holiday overrides
router.post("/override", authenticate, authorize([Roles.admin, Roles.hr]), holidayController.createOrUpdateOverrideController);
router.delete("/override/:id", authenticate, authorize([Roles.admin, Roles.hr]), holidayController.deleteOverrideController);

export default router;
