import express from "express";
import cors from "cors";
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
export default app;
