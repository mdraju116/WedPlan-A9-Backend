import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
const app = express();
// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL_LOCAL,
}));
// Root route
app.get("/", (req, res) => {
    res.send("Welcome to WedPlan Server!");
});
import { verifyToken } from "./middlewares/authenticate.js";
import { authorize } from "./middlewares/authorize.js";
app.get("/api/test", verifyToken, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Authentication successful!",
        user: req.user,
    });
});
app.get("/api/admin-test", verifyToken, authorize("Admin"), (req, res) => {
    res.status(200).json({
        success: true,
        message: "Admin authorization successful!",
    });
});
app.use(notFound);
app.use(errorHandler);
export default app;
