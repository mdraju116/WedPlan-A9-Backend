import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
const PORT = process.env.PORT || 5000;
async function startServer() {
    try {
        // Connect to MongoDB first
        await connectDB();
        // Start Express server
        app.listen(PORT, () => {
            console.log(`WedPlan server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}
startServer();
