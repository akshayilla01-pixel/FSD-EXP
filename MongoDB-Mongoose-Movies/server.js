import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());

// MongoDB connection
const mongoUrl = process.env.MONGO_FULL_URI || process.env.MONGODB_URI || process.env.MONGO_URI;

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  if (!mongoUrl) {
    console.warn("MONGO_FULL_URI / MONGODB_URI not provided. Skipping database connection.");
    return;
  }
  if (isConnecting) return;
  isConnecting = true;
  try {
    await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
  } finally {
    isConnecting = false;
  }
};

// Initial connection attempt
connectDB().catch(() => {});

// Reusable connection middleware for serverless
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState < 1 && mongoUrl) {
    await connectDB();
  }
  next();
});

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  director: String,
  genre: { type: String, required: true },
  year: { type: Number, required: true },
});

const Movie = mongoose.models.Movie || mongoose.model("Movie", movieSchema);

// Test / root route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Movies server running...",
    status: "healthy",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
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

// Helper to check DB
function checkDB(res) {
  if (mongoose.connection.readyState < 1) {
    res.status(503).json({
      message: "Database connection not available. Please configure MONGO_FULL_URI or MONGODB_URI in Vercel environment variables.",
      error: "DATABASE_UNAVAILABLE"
    });
    return false;
  }
  return true;
}

// CRUD API endpoints

// Create a new movie - POST /api/v1/movies
app.post("/api/v1/movies", async (req, res, next) => {
  try {
    if (!checkDB(res)) return;
    const { title, director, genre, year } = req.body;
    if (!title || !genre || !year) {
      return res
        .status(400)
        .json({ message: "Title, genre, and year are required" });
    }
    const newMovie = new Movie({ title, director, genre, year });
    const savedMovie = await newMovie.save();
    res
      .status(201)
      .json({ message: "Movie created successfully", data: savedMovie });
  } catch (err) {
    next(err);
  }
});

// Get all movies - GET /api/v1/movies
// Get movies by genre - GET /api/v1/movies?genre=genreName
app.get("/api/v1/movies", async (req, res, next) => {
  try {
    if (!checkDB(res)) return;
    const genre = req.query.genre;
    const query = genre ? { genre } : {};
    const movies = await Movie.find(query);
    res
      .status(200)
      .json({ message: "Movies fetched successfully", data: movies });
  } catch (err) {
    next(err);
  }
});

// Get a movie by ID - GET /api/v1/movies/:id
app.get("/api/v1/movies/:id", async (req, res, next) => {
  try {
    if (!checkDB(res)) return;
    const movieId = req.params.id;
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    res
      .status(200)
      .json({ message: "Movie fetched successfully", data: movie });
  } catch (err) {
    next(err);
  }
});

// Update a movie by ID - PUT /api/v1/movies/:id
app.put("/api/v1/movies/:id", async (req, res, next) => {
  try {
    if (!checkDB(res)) return;
    const movieId = req.params.id;
    const { title, director, genre, year } = req.body;
    const updatedMovie = await Movie.findByIdAndUpdate(
      movieId,
      { title, director, genre, year },
      { new: true, runValidators: true },
    );
    if (!updatedMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    res
      .status(200)
      .json({ message: "Movie updated successfully", data: updatedMovie });
  } catch (err) {
    next(err);
  }
});

// Delete a movie by ID - DELETE /api/v1/movies/:id
app.delete("/api/v1/movies/:id", async (req, res, next) => {
  try {
    if (!checkDB(res)) return;
    const movieId = req.params.id;
    const deletedMovie = await Movie.findByIdAndDelete(movieId);
    if (!deletedMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    res
      .status(200)
      .json({ message: "Movie deleted successfully", data: deletedMovie });
  } catch (err) {
    next(err);
  }
});

// 404 Not Found middleware
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack || err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
