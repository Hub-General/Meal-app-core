import { Router } from "express";
import { authController } from "../controllers/authController";

const router = Router();

router.post("/login", authController.loginController);
router.post("/register", authController.signUpController);
router.post("/onboarding", authController.onBoardingController)
router.post("/logout", authController.logOutController);
router.post("/refresh", authController.refreshController);
router.post("/sync", authController.syncUserController);

router.post("/generate-password-token",authController.getResetPasswordTokenController )
router.post("/reset-password", authController.resetPasswordController)
router.post("/verify-otp", authController.verifyPasswordResetOTPController)

export default router;