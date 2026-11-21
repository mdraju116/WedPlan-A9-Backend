import { Router } from "express";
import { verifyToken } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import {
    createBookingController,
    getMyBookingsController,
    getVendorBookingRequestsController,
} from "./booking.controller.js";

const router = Router();

// Customer: Create Booking
router.post(
    "/",
    verifyToken,
    authorize("Customer"),
    createBookingController
);

// Customer: Get My Bookings
router.get(
    "/my-bookings",
    verifyToken,
    authorize("Customer"),
    getMyBookingsController
);

// Vendor: Get Booking Requests
router.get(
    "/vendor-requests",
    verifyToken,
    authorize("Vendor"),
    getVendorBookingRequestsController
);

export default router;