import { Router } from "express";
import { authController } from "../controllers/authController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.post("/login", authController.loginController);
router.post("/register", authController.signUpController);
router.post("/onboarding", authController.onBoardingController);
router.post("/onboarding-batch", authController.onBoardingBatchController);
router.post("/onboarding-broadcast", authController.onBoardingBroadcastController);
router.post("/logout", authController.logOutController);
router.post("/refresh", authController.refreshController);
router.post("/sync", authController.syncUserController);
router.post("/sync-availability", authController.syncAvailabilityController);

router.post("/generate-password-token", authenticate, authController.getResetPasswordTokenController )
router.post("/reset-password", authenticate, authController.resetPasswordController)
router.post("/verify-otp", authenticate, authController.verifyPasswordResetOTPController)

export default router;