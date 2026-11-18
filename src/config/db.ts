
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

const client = new MongoClient(MONGODB_URI);

export async function connectDB() {
  try {
    await client.connect();

    console.log("Successfully connected to MongoDB!");

    return client.db("wedplan-db1");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}
