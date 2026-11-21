import type { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import {
    createBooking,
    getMyBookings,
    getVendorBookingRequests,
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