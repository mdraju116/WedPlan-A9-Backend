import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import userRoutes from "./modules/user/user.routes.js";
import serviceRoutes from "./modules/service/service.routes.js";
import bookingRoutes from "./modules/booking/booking.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
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
//http://localhost:5000/api/users
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
