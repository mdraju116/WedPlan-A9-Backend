import type { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { createBooking } from "./booking.service.js";

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