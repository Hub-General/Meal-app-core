import { Router} from "express";
import { userController } from "../controllers/userController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticate, userController.getAllUsersController);
router.get("/:id", authenticate, userController.getUserByIdController);
router.put("/:id", authenticate, userController.updateUserDetailsController);

export default router;
