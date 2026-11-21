import { getDB } from "../../config/db.js";

export async function getCustomerDashboard(customerId: string) {
    const db = getDB();

    const bookings = db.collection("bookings");

    const [
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        recentBookings,
    ] = await Promise.all([
        bookings.countDocuments({ customerId }),
        bookings.countDocuments({ customerId, status: "Pending" }),
        bookings.countDocuments({ customerId, status: "Confirmed" }),
        bookings.countDocuments({ customerId, status: "Completed" }),
        bookings.find({ customerId })
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray(),
    ]);

    return {
        stats: {
            totalBookings,
            pendingBookings,
            confirmedBookings,
            completedBookings,
        },
        recentBookings,
    };
}