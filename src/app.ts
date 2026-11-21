
import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";

import userRoutes from "./modules/user/user.routes.js";

const app = express();

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL_LOCAL,
  })
);

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to WedPlan Server!");
});

//http://localhost:5000/api/users/profile
app.use("/api/users", userRoutes);




app.use(notFound);
app.use(errorHandler);

export default app;
