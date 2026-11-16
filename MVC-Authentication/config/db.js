import mongoose from "mongoose";

let isConnecting = false;

const connectDB = async (mongoUri, dbName) => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  const uri = mongoUri || process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.warn("MongoDB URI not provided. Skipping database connection.");
    return;
  }
  if (isConnecting) return;
  isConnecting = true;
  try {
    await mongoose.connect(uri, {
      dbName: dbName || "todoDB",
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
  } finally {
    isConnecting = false;
  }
};

export default connectDB;
