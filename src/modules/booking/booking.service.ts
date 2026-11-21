import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

export async function createBooking(bookingData: {
    serviceId: ObjectId;
    customerId: string;
    customerName: string;
    eventDate: string;
    message?: string;
}) {
    const db = getDB();

    // Find the active service
    const service = await db.collection("services").findOne({
        _id: bookingData.serviceId,
        status: "Active",
    });

    if (!service) {
        return null;
    }

    // Prevent vendors from booking their own services
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