import type { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import {
    createBooking,
    getMyBookings,
    getVendorBookingRequests,
    updateBookingStatus,
    cancelBooking,
    getAllBookings,
} from "./booking.service.js";

// Create Booking
export async function createBookingController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { serviceId, eventDate, message } = req.body;

        if (!serviceId || !eventDate) {
            return res.status(400).json({
                success: false,
                message: "Service ID and event date are required",
            });
        }

        if (!ObjectId.isValid(serviceId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid service ID",
            });
        }

        const booking = await createBooking({
            serviceId: new ObjectId(serviceId),
            customerId: req.user!.id.toString(),
            customerName: req.user!.name,
            eventDate,
            message,
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Service not found or unavailable",
            });
        }

        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking,
        });
    } catch (error) {
        next(error);
    }
}

// Get My Bookings
export async function getMyBookingsController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const bookings = await getMyBookings(
            req.user!.id.toString()
        );

        res.status(200).json({
            success: true,
            message: "My bookings retrieved successfully",
            data: bookings,
        });
    } catch (error) {
        next(error);
    }
}

// Get Vendor Booking Requests
export async function getVendorBookingRequestsController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const bookings = await getVendorBookingRequests(
            req.user!.id.toString()
        );

        res.status(200).json({
            success: true,
            message: "Booking requests retrieved successfully",
            data: bookings,
        });
    } catch (error) {
        next(error);
    }
}

// Update Booking Status
export async function updateBookingStatusController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const id = req.params.id;
        const { status } = req.body;

        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID",
            });
        }

        if (status !== "Confirmed" && status !== "Rejected") {
            return res.status(400).json({
                success: false,
                message: "Status must be Confirmed or Rejected",
            });
        }

        const result = await updateBookingStatus(
            new ObjectId(id),
            req.user!.id.toString(),
            status
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found, not owned by you, or no longer pending",
            });
        }

        res.status(200).json({
            success: true,
            message: `Booking ${status.toLowerCase()} successfully`,
        });
    } catch (error) {
        next(error);
    }
}

// Cancel Booking
export async function cancelBookingController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const id = req.params.id;

        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID",
            });
        }

        const result = await cancelBooking(
            new ObjectId(id),
            req.user!.id.toString()
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found, not owned by you, or no longer pending",
            });
        }

        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
        });
    } catch (error) {
        next(error);
    }
}

// Get All Bookings (Admin)
export async function getAllBookingsController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const bookings = await getAllBookings();

        res.status(200).json({
            success: true,
            message: "All bookings retrieved successfully",
            data: bookings,
        });
    } catch (error) {
        next(error);
    }
}