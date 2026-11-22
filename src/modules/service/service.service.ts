import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

type ServiceStatus = "Pending" | "Active" | "Inactive" | "Rejected";

export async function createService(serviceData: {
    title: string; category: string; price: number; description: string;
    image: string; images: string[]; location: string; vendorId: string; vendorName: string;
}) {
    const db = getDB();
    const vendor = await db.collection("user").findOne({ _id: new ObjectId(serviceData.vendorId) });
    if (!vendor) throw new Error("Vendor not found");

    const isPremium = vendor.subscriptionPlan === "Premium" && vendor.subscriptionExpiresAt && new Date(vendor.subscriptionExpiresAt) > new Date();
    if (!isPremium) {
        const activeServices = await db.collection("services").countDocuments({ vendorId: serviceData.vendorId, status: "Active" });
        if (activeServices >= 3) throw new Error("You have reached the free service limit. Please upgrade to Premium to publish more services.");
    }

    const images = serviceData.images.length ? serviceData.images : [serviceData.image];
    const service = { ...serviceData, images, image: images[0], bookings: 0, status: "Pending" as const, createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection("services").insertOne(service);
    return { _id: result.insertedId, ...service };
}

export async function getAllServices() {
    return await getDB().collection("services").find({ status: "Active" }).sort({ createdAt: -1 }).toArray();
}

export async function getAllServicesForAdmin() {
    return await getDB().collection("services").find({}).sort({ createdAt: -1 }).toArray();
}

export async function getMyServicesForVendor(vendorId: string) {
    return await getDB().collection("services").find({ vendorId }).sort({ createdAt: -1 }).toArray();
}

export async function getSingleService(serviceId: ObjectId) {
    return await getDB().collection("services").findOne({ _id: serviceId, status: "Active" });
}

export async function updateService(serviceId: ObjectId, vendorId: string, updateData: {
    title?: string; category?: string; price?: number; description?: string;
    image?: string; images?: string[]; location?: string;
}) {
    if (updateData.images?.length) updateData.image = updateData.images[0];
    return await getDB().collection("services").updateOne(
        { _id: serviceId, vendorId },
        { $set: { ...updateData, status: "Pending", updatedAt: new Date() } },
    );
}

export async function deleteService(serviceId: ObjectId, vendorId: string) {
    return await getDB().collection("services").deleteOne({ _id: serviceId, vendorId });
}

export async function deleteServiceByAdmin(serviceId: ObjectId) {
    return await getDB().collection("services").deleteOne({ _id: serviceId });
}

export async function updateServiceStatus(serviceId: ObjectId, status: ServiceStatus) {
    const db = getDB();
    const service = await db.collection("services").findOne({ _id: serviceId }, { projection: { vendorId: 1 } });
    if (!service) return { matchedCount: 0, modifiedCount: 0 };

    if (status === "Active") {
        const vendor = await db.collection("user").findOne({ _id: new ObjectId(service.vendorId) }, { projection: { subscriptionPlan: 1, subscriptionExpiresAt: 1 } });
        const isPremium = vendor?.subscriptionPlan === "Premium" && vendor.subscriptionExpiresAt && new Date(vendor.subscriptionExpiresAt) > new Date();
        if (!isPremium) {
            const activeCount = await db.collection("services").countDocuments({ vendorId: service.vendorId, status: "Active", _id: { $ne: serviceId } });
            if (activeCount >= 3) throw new Error("Vendor free service limit reached; service cannot be approved until a listing is deactivated or the vendor upgrades.");
        }
    }

    return await db.collection("services").updateOne({ _id: serviceId }, { $set: { status, updatedAt: new Date() } });
}
