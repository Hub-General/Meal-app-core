import { Router } from "express";
import { authController } from "../controllers/authController";

const router = Router();

console.log("Auth Routes rendered")
router.post("/login", authController.loginController);
router.post("/register", authController.signUpController);
router.post("/onboarding", authController.onBoardingController)
router.post("/logout", authController.logOutController);
router.post("/refresh", authController.refreshController);
router.post("/sync", authController.syncUserController);

export default router;