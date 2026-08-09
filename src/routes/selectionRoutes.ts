import { Router } from "express";
import { mealSelectionController } from "../controllers/mealSelectionController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { Roles } from "../enums/ERoles";

const router = Router();

//GET selections routes
router.get("/", mealSelectionController.getAllSelectionsController);
router.get("/date-range",mealSelectionController.getSelectionsByDateRangeController);
router.get("/by-user/:id", mealSelectionController.getSelectionsByUserIdController);
router.get("/by-meal/:id", mealSelectionController.getSelectionsByMealIdController);

//GET weekly selections routes
router.get("/weekly", authenticate, authorize([Roles.admin, Roles.hr]), mealSelectionController.getWeeklySelectionsController);
router.get("/weekly/by-user/:id", authenticate, mealSelectionController.getWeeklySelectionsByUserController);
router.get("/weekly/no-selections", authenticate, authorize([Roles.admin, Roles.hr]), mealSelectionController.getUsersWithoutSelectionsController);
router.get("/:id",mealSelectionController.getSelectionByIdController);

//CREATE selections routes
router.put("/batch", authenticate, mealSelectionController.submitSelectionsController);

//SUBMIT selections routes
router.patch("/submit",authenticate, mealSelectionController.submitSelectionsController);


//ADMIN Routes
router.patch("/submit-weekly",authenticate, authorize([Roles.admin, Roles.hr]), mealSelectionController.updateWeeklySelectionsStatusController);
router.put("/override", authenticate,
    authorize([Roles.admin,Roles.hr]),
     mealSelectionController.adminOverrideSelectionsController);
router.patch("/replace-weekly-meal", authenticate,
    authorize([Roles.admin, Roles.hr]),
    mealSelectionController.replaceWeeklyMealController);
router.patch("/replace-weekly-meals", authenticate,
    authorize([Roles.admin, Roles.hr]),
    mealSelectionController.replaceWeeklyMealsController);

export default router;
