import { getDB } from "../../config/db.js";
import { ObjectId } from "mongodb";


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

    const service = {
        ...serviceData,
        bookings: 0,
        status: "Active",
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await db.collection("services").insertOne(service);

    return {
        _id: result.insertedId,
        ...service,
    };
}


export async function getAllServices() {
    const db = getDB();

    const services = await db.collection("services")
        .find({ status: "Active" })
        .sort({ createdAt: -1 })
        .toArray();

    return services;
}

export async function getSingleService(serviceId: ObjectId) {
    const db = getDB();

    const service = await db.collection("services").findOne({
        _id: serviceId,
        status: "Active",
    });

    return service;
}

