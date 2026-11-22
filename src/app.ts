import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";

import userRoutes from "./modules/user/user.routes.js";
import serviceRoutes from "./modules/service/service.routes.js";
import bookingRoutes from "./modules/booking/booking.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";

const app = express();

// CORS
const allowedOrigins = [
    process.env.FRONTEND_URL_LOCAL,
    process.env.FRONTEND_URL_VERCEL,
].filter((origin): origin is string => Boolean(origin));

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

// Stripe webhook must come before express.json()
app.use("/api/payments", paymentRoutes);

// JSON Middleware
app.use(express.json());

// Root route
app.get("/", (req, res) => {
    res.send("Welcome to WedPlan Server!");
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;