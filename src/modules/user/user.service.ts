import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

export async function getUserProfile(userId: ObjectId) {
    const db = getDB();

    const user = await db.collection("user").findOne(
        { _id: userId },
        {
            projection: {
                _id: 1,
                name: 1,
                email: 1,
                image: 1,
                role: 1,
                businessName: 1,
                subscriptionPlan: 1,
                subscriptionExpiresAt: 1,
                createdAt: 1,
            },
        }
    );

    return user;
}


export async function updateUserProfile(
    userId: ObjectId,
    updateData: {
        name?: string;
        image?: string;
        businessName?: string;
    }
) {
    const db = getDB();

    const result = await db.collection("user").updateOne(
        { _id: userId },
        {
            $set: {
                ...updateData,
                updatedAt: new Date(),
            },
        }
    );

    return result;
}


export async function getAllUsers() {
    const db = getDB();

    const users = await db.collection("user")
        .find(
            {},
            {
                projection: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    image: 1,
                    role: 1,
                    isBlocked: 1,
                    subscriptionPlan: 1,
                    createdAt: 1,
                },
            }
        )
        .sort({ createdAt: -1 })
        .toArray();

    return users;
}

export async function updateUserBlockStatus(
    userId: ObjectId,
    isBlocked: boolean
) {
    const db = getDB();

    const result = await db.collection("user").updateOne(
        { _id: userId },
        {
            $set: {
                isBlocked,
                updatedAt: new Date(),
            },
        }
    );

    return result;
}