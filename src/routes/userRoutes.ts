import { Router} from "express";
import { userController } from "../controllers/userController";

const router = Router();

router.get("/", userController.getAllUsersController);
router.get("/:id", userController.getUserByIdController);
router.put("/:id", userController.updateUserDetailsController);

export default router;
