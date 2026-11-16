import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import movieRoutes from "./routes/movieRoutes.js";

dotenv.config();
const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const app = express();
app.use(express.json());

// Reusable connection middleware for serverless invocations
app.use(async (req, res, next) => {
  if (MONGO_URI) {
    try {
      await connectDB(MONGO_URI);
    } catch (err) {
      console.error("DB connection error in request:", err);
    }
  }
  next();
});

// Root / health route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "MVC-Express Movie API is running...",
    status: "healthy",
    database: mongoose.connection?.readyState === 1 ? "connected" : "disconnected",
    endpoints: {
      movies: [
        "GET /api/v1/movies",
        "POST /api/v1/movies",
        "GET /api/v1/movies/:id",
        "PUT /api/v1/movies/:id",
        "DELETE /api/v1/movies/:id"
      ]
    }
  });
});

app.use("/api/v1/movies", movieRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route Not Found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
