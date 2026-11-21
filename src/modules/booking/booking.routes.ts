import { Router } from "express";
import { verifyToken } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { createBookingController } from "./booking.controller.js";

const router = Router();

router.post(
    "/",
    verifyToken,
    authorize("Customer"),
    createBookingController
);

export default router;