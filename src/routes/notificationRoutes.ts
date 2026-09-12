import { Router } from "express";
import { notificationController } from "../controllers/notificationController";
import { Roles } from "../enums/ERoles";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

// User subscription management
router.post("/subscribe", authenticate, notificationController.subscribeController);
router.post("/unsubscribe", authenticate, notificationController.unsubscribeController);

// Administrative triggers / broadcasts
router.post(
  "/food-arrived",
  authenticate,
  authorize([Roles.admin, Roles.manager, Roles.hr]),
  notificationController.broadcastFoodArrivedController
);

router.post(
  "/unselected-reminder",
  authenticate,
  authorize([Roles.admin, Roles.manager, Roles.hr]),
  notificationController.sendUnselectedReminderController
);

router.post(
  "/send",
  authenticate,
  authorize([Roles.admin, Roles.manager, Roles.hr]),
  notificationController.sendCustomNotificationController
);

export default router;
