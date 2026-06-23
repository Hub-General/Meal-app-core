import { Router } from "express";
import { authController } from "../controllers/authController";
import { digiHRService } from "../services/digiHRService";

const router = Router();

router.post("/login", authController.loginController);
router.post("/register", authController.signUpController);
router.post("/logout", authController.logOutController);
router.post("/refresh", authController.refreshController);
router.post("/sync", authController.syncUserController);
export default router;