import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import todoRoutes from "./routes/todoRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9000;
const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "todoDB";

app.use(express.json());

// Reusable connection middleware for serverless invocations
app.use(async (req, res, next) => {
  if (mongoURI) {
    try {
      await connectDB(mongoURI, dbName);
    } catch (err) {
      console.error("DB connection error in request:", err);
    }
  }
  next();
});

// Root / health route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "MVC-Authentication API is running...",
    status: "healthy",
    database: mongoose.connection?.readyState === 1 ? "connected" : "disconnected",
    endpoints: {
      auth: ["POST /api/v1/users/register", "POST /api/v1/users/login"],
      todos: [
        "GET /api/v1/todos",
        "POST /api/v1/todos",
        "GET /api/v1/todos/:id",
        "PUT /api/v1/todos/:id",
        "DELETE /api/v1/todos/:id"
      ]
    }
  });
});

// Routes for todo API
app.use("/api/v1/todos", todoRoutes);
// Routes for user API
app.use("/api/v1/users", userRoutes);

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
