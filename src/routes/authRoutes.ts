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

router.post("/generate-password-token", authController.getResetPasswordTokenController )
router.post("/reset-password", authController.resetPasswordController)
router.post("/verify-otp", authController.verifyPasswordResetOTPController)
router.post("/change-password", authenticate, authController.changePasswordController)

export default router;