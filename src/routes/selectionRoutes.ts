import { Router } from "express";
import { mealSelectionController } from "../controllers/mealSelectionController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { Roles } from "../enums/ERoles";

const router = Router();

//GET selections routes
router.get("/", mealSelectionController.getAllSelectionsController);
router.get("/date-range",mealSelectionController.getSelectionsByDateRangeController);
router.get("/:id",mealSelectionController.getSelectionByIdController);
router.get("/by-user/:id", mealSelectionController.getSelectionsByUserIdController);
router.get("/by-meal/:id", mealSelectionController.getSelectionsByMealIdController);

//GET weekly selections routes
router.get("/weekly", authenticate, mealSelectionController.getWeeklySelectionsController);
router.get("/weekly/by-user/:id", authenticate, mealSelectionController.getWeeklySelectionsByUserController);

//CREATE selections routes
router.put("/batch", authenticate, mealSelectionController.submitSelectionsController);

//SUBMIT selections routes
router.patch("/submit",authenticate, mealSelectionController.submitSelectionsController);


//ADMIN Routes
router.get("/weekly/no-selections", mealSelectionController.getUsersWithoutSelectionsController);
router.patch("/submit-weekly",authenticate, authorize([Roles.admin, Roles.hr]), mealSelectionController.updateWeeklySelectionsStatusController);
router.put("/override", authenticate,
    authorize([Roles.admin,Roles.hr]),
     mealSelectionController.adminOverrideSelectionsController);

export default router;
