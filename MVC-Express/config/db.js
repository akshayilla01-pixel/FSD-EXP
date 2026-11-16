import mongoose from "mongoose";

let isConnecting = false;

const connectDB = async (mongoUri) => {
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
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Problem while connecting mongoDB:", err.message);
  } finally {
    isConnecting = false;
  }
};

export default connectDB;
