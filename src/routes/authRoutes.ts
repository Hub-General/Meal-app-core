import { Router } from "express";
import { authController } from "../controllers/authController";

const router = Router();

router.post("/login", authController.loginController);
router.post("/register", authController.signUpController);
router.post("/logout", authController.logOutController);
router.post("/refresh", authController.refreshController)

export default router;