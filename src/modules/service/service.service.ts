import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

// Create Service
export async function createService(serviceData: {
    title: string;
    category: string;
    price: number;
    description: string;
    image: string;
    vendorId: string;
    vendorName: string;
}) {
    const db = getDB();

    // Check Vendor Subscription
    const vendor = await db.collection("user").findOne({
        _id: new ObjectId(serviceData.vendorId),
    });

    if (!vendor) {
        throw new Error("Vendor not found");
    }

    // Check Active Premium Subscription
    const isPremium =
        vendor.subscriptionPlan === "Premium" &&
        vendor.subscriptionExpiresAt &&
        new Date(vendor.subscriptionExpiresAt) > new Date();

    // Enforce Free Service Limit
    if (!isPremium) {
        const totalServices = await db.collection("services").countDocuments({
            vendorId: serviceData.vendorId,
        });

        if (totalServices >= 3) {
            throw new Error(
                "You have reached the free service limit. Please upgrade to Premium to add more services."
            );
        }
    }

    const service = {
        ...serviceData,
        bookings: 0,
        status: "Active",
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await db.collection("services").insertOne(service);

    return { _id: result.insertedId, ...service };
}

// Get All Active Services (Public)
export async function getAllServices() {
    const db = getDB();

    return await db.collection("services")
        .find({ status: "Active" })
        .sort({ createdAt: -1 })
        .toArray();
}

// Get All Services (Admin)
export async function getAllServicesForAdmin() {
    const db = getDB();

    return await db.collection("services")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
}

// Get Own Services (Vendor)
export async function getMyServicesForVendor(vendorId: string) {
    const db = getDB();

    return await db.collection("services")
        .find({ vendorId })
        .sort({ createdAt: -1 })
        .toArray();
}

// Get Single Active Service
export async function getSingleService(serviceId: ObjectId) {
    const db = getDB();

    return await db.collection("services").findOne({
        _id: serviceId,
        status: "Active",
    });
}

// Update Own Service
export async function updateService(
    serviceId: ObjectId,
    vendorId: string,
    updateData: {
        title?: string;
        category?: string;
        price?: number;
        description?: string;
        image?: string;
    }
) {
    const db = getDB();

    return await db.collection("services").updateOne(
        { _id: serviceId, vendorId },
        { $set: { ...updateData, updatedAt: new Date() } }
    );
}

// Delete Own Service
export async function deleteService(
    serviceId: ObjectId,
    vendorId: string
) {
    const db = getDB();

    return await db.collection("services").deleteOne({
        _id: serviceId,
        vendorId,
    });
}

// Admin Update Service Status
export async function updateServiceStatus(
    serviceId: ObjectId,
    status: "Active" | "Inactive"
) {
    const db = getDB();

    return await db.collection("services").updateOne(
        { _id: serviceId },
        { $set: { status, updatedAt: new Date() } }
    );
}