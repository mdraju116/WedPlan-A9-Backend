import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

// Create Booking
export async function createBooking(bookingData: {
    serviceId: ObjectId;
    customerId: string;
    customerName: string;
    eventDate: string;
    eventLocation: string;
    message?: string;
}) {
    const db = getDB();

    // Check Customer Subscription
    const customer = await db.collection("user").findOne({
        _id: new ObjectId(bookingData.customerId),
    });

    if (!customer) {
        throw new Error("Customer not found");
    }

    // Check Active Premium Subscription
    const isPremium =
        customer.subscriptionPlan === "Premium" &&
        customer.subscriptionExpiresAt &&
        new Date(customer.subscriptionExpiresAt) > new Date();

    // Enforce Free Booking Limit
    if (!isPremium) {
        const totalBookings = await db.collection("bookings").countDocuments({
            customerId: bookingData.customerId,
        });

        if (totalBookings >= 3) {
            throw new Error(
                "You have reached the free booking limit. Please upgrade to Premium for unlimited bookings."
            );
        }
    }

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

    const duplicate = await db.collection("bookings").findOne({
        customerId: bookingData.customerId,
        serviceId: service._id,
        eventDate: bookingData.eventDate,
        status: { $in: ["Pending", "Accepted", "Confirmed"] },
    });
    if (duplicate) throw new Error("An active booking request already exists for this service and date");

    const booking = {
        serviceId: service._id,
        serviceTitle: service.title,
        serviceImage: service.image,
        serviceImages: service.images || (service.image ? [service.image] : []),
        vendorId: service.vendorId,
        vendorName: service.vendorName,
        customerId: bookingData.customerId,
        customerName: bookingData.customerName,
        eventDate: bookingData.eventDate,
        eventLocation: bookingData.eventLocation,
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

// Update Booking Status (Vendor)
export async function updateBookingStatus(
    bookingId: ObjectId,
    vendorId: string,
    status: "Accepted" | "Rejected"
) {
    const db = getDB();

    return await db.collection("bookings").updateOne(
        {
            _id: bookingId,
            vendorId,
            status: "Pending",
        },
        {
            $set: {
                status,
                updatedAt: new Date(),
            },
        }
    );
}

// Cancel Booking (Customer)
export async function cancelBooking(
    bookingId: ObjectId,
    customerId: string
) {
    const db = getDB();

    return await db.collection("bookings").updateOne(
        {
            _id: bookingId,
            customerId,
            status: "Pending",
        },
        {
            $set: {
                status: "Cancelled",
                updatedAt: new Date(),
            },
        }
    );
}

// Get All Bookings (Admin)
export async function getAllBookings() {
    const db = getDB();

    return await db.collection("bookings")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
}

// Admin Update Booking Status
export async function adminUpdateBookingStatus(
    bookingId: ObjectId,
    status: "Pending" | "Accepted" | "Rejected" | "Cancelled"
) {
    const db = getDB();

    return await db.collection("bookings").updateOne(
        { _id: bookingId },
        {
            $set: {
                status,
                updatedAt: new Date(),
            },
        }
    );
}