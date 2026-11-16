import mongoose from "mongoose";

let isConnecting = false;

const connectDB = async (mongoURI, dbName) => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  const uri = mongoURI || process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.warn("MongoDB URI not provided. Skipping database connection.");
    return;
  }
  if (isConnecting) return;
  isConnecting = true;
  try {
    await mongoose.connect(uri, {
      dbName: dbName || "productsDB",
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB connected to database: ${dbName || "productsDB"}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  } finally {
    isConnecting = false;
  }
};

export default connectDB;
