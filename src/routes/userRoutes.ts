import { Router} from "express";
import { userController } from "../controllers/userController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

//Preferences Routes
router.get("/preferences", authenticate, userController.getUserPreferencesController);
router.put("/preferences", authenticate, userController.updateUserPreferencesController);

//User Routes
router.get("/", authenticate, userController.getAllUsersController);
router.get("/:id", authenticate, userController.getUserByIdController);
router.put("/:id", authenticate, userController.updateUserDetailsController);

export default router;
