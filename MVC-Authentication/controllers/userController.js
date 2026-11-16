import mongoose from "mongoose";
import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

function checkDB(res) {
  if (mongoose.connection.readyState < 1) {
    res.status(503).json({
      message: "Database connection not available. Please ensure MONGO_URI is configured in Vercel environment variables.",
      error: "DATABASE_UNAVAILABLE"
    });
    return false;
  }
  return true;
}

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!checkDB(res)) return;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });
    res
      .status(201)
      .json({ message: "User registered successfully", data: newUser });
  } catch (err) {
    res.status(500).json({ message: "Failed to register user", error: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!checkDB(res)) return;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "default_jwt_secret", {
      expiresIn: "1h",
    });
    res
      .status(200)
      .json({ message: "User logged in successfully", data: token });
  } catch (err) {
    res.status(500).json({ message: "Failed to login user", error: err.message });
  }
};

export { registerUser, loginUser };
