
import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
}

const client = new MongoClient(MONGODB_URI);

let db: Db;

export async function connectDB() {
    try {
        await client.connect();
        db = client.db("wedplan-db1");

        console.log("Successfully connected to MongoDB!");

        return db;
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
    }
}

export function getDB(): Db {
    if (!db) {
        throw new Error("Database is not connected yet");
    }

    return db;
}
