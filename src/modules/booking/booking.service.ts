import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

// Create Booking
export async function createBooking(bookingData: {
    serviceId: ObjectId;
    customerId: string;
    customerName: string;
    eventDate: string;
    message?: string;
}) {
    const db = getDB();

    const service = await db.collection("services").findOne({
        _id: bookingData.serviceId,
        status: "Active",
    });

    if (!service) {
        return null;
    }

    if (service.vendorId === bookingData.customerId) {
        throw new Error("You cannot book your own service");
    }

    const booking = {
        serviceId: service._id,
        serviceTitle: service.title,
        serviceImage: service.image,
        vendorId: service.vendorId,
        vendorName: service.vendorName,
        customerId: bookingData.customerId,
        customerName: bookingData.customerName,
        eventDate: bookingData.eventDate,
        message: bookingData.message || "",
        amount: service.price,
        status: "Pending",
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await db.collection("bookings").insertOne(booking);

    return {
        _id: result.insertedId,
        ...booking,
    };
}

// Get My Bookings (Customer)
export async function getMyBookings(customerId: string) {
    const db = getDB();

    return await db.collection("bookings")
        .find({ customerId })
        .sort({ createdAt: -1 })
        .toArray();
}

// Get Vendor Booking Requests
export async function getVendorBookingRequests(vendorId: string) {
    const db = getDB();

    return await db.collection("bookings")
        .find({ vendorId })
        .sort({ createdAt: -1 })
        .toArray();
}