import { Router } from "express";
import { verifyToken } from "../../middlewares/authenticate.js";
import { getProfile, updateProfile, getUsers,updateUserStatus, } from "./user.controller.js";
import { authorize } from "../../middlewares/authorize.js";



const router = Router();

router.get("/profile", verifyToken, getProfile);
router.patch("/profile", verifyToken, updateProfile);

router.get("/", verifyToken, authorize("Admin"), getUsers);
router.patch("/:id/block", verifyToken, authorize("Admin"), updateUserStatus);

export default router;