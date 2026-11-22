import { getDB } from "../../config/db.js";

export async function getCustomerDashboard(customerId: string) {
    const db = getDB();

    const bookings = db.collection("bookings");

    const [
        totalBookings,
        pendingBookings,
        acceptedBookings,
        completedBookings,
        recentBookings,
    ] = await Promise.all([
        bookings.countDocuments({ customerId }),
        bookings.countDocuments({ customerId, status: "Pending" }),
        bookings.countDocuments({ customerId, status: { $in: ["Accepted", "Confirmed"] } }),
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
            acceptedBookings,
            completedBookings,
        },
        recentBookings,
    };
}

// Vendor Dashboard Overview
export async function getVendorDashboard(vendorId: string) {
    const db = getDB();

    const services = db.collection("services");
    const bookings = db.collection("bookings");

    const [
        totalServices,
        totalBookings,
        pendingRequests,
        totalEarnings,
        recentBookings,
    ] = await Promise.all([
        services.countDocuments({ vendorId }),
        bookings.countDocuments({ vendorId }),
        bookings.countDocuments({ vendorId, status: "Pending" }),
        bookings.aggregate([
            {
                $match: {
                    vendorId,
                    status: { $in: ["Accepted", "Confirmed", "Completed"] },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                },
            },
        ]).toArray(),
        bookings.find({ vendorId })
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray(),
    ]);

    return {
        stats: {
            totalServices,
            totalBookings,
            pendingRequests,
            totalEarnings: totalEarnings[0]?.total || 0,
        },
        recentBookings,
    };
}


// Admin Dashboard Overview
export async function getAdminDashboard() {
    const db = getDB();

    const users = db.collection("user");
    const services = db.collection("services");
    const bookings = db.collection("bookings");
    const transactions = db.collection("transactions");

    const [
        totalUsers,
        totalCustomers,
        totalVendors,
        totalServices,
        totalBookings,
        totalTransactions,
        recentBookings,
    ] = await Promise.all([
        users.countDocuments({}),
        users.countDocuments({ role: "Customer" }),
        users.countDocuments({ role: "Vendor" }),
        services.countDocuments({}),
        bookings.countDocuments({}),
        transactions.countDocuments({}),
        bookings.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray(),
    ]);

    return {
        stats: {
            totalUsers,
            totalCustomers,
            totalVendors,
            totalServices,
            totalBookings,
            totalTransactions,
        },
        recentBookings,
    };
}