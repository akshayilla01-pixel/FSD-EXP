import mongoose from "mongoose";
import Movie from "../models/movieModel.js";

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

// CRUD
// Create
const createMovie = (req, res) => {
  if (!checkDB(res)) return;
  const newMovie = new Movie(req.body);
  newMovie
    .save()
    .then((result) => {
      res
        .status(201)
        .json({ message: "Movie created successfully", data: result });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ message: "Problem while creating movie", error: err.message });
    });
};

const readMovies = (req, res) => {
  if (!checkDB(res)) return;
  const { category } = req.query;
  const filter = category ? { category } : {};
  Movie.find(filter)
    .then((result) => {
      res
        .status(200)
        .json({ message: "Movies retrieved successfully", data: result });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Problem while retrieving movies",
        error: err.message,
      });
    });
};

const readMovieById = (req, res) => {
  if (!checkDB(res)) return;
  const { id } = req.params;
  Movie.findById(id)
    .then((result) => {
      if (!result) {
        const error = new Error("Movie not found");
        error.status = 404;
        throw error;
      }
      res
        .status(200)
        .json({ message: "Movie retrieved successfully", data: result });
    })
    .catch((err) => {
      res.status(err.status || 500).json({
        message: err.message || "Problem while retrieving movie",
        error: err.message,
      });
    });
};

const updateMovieById = (req, res) => {
  if (!checkDB(res)) return;
  const { id } = req.params;
  const updateData = req.body;
  Movie.findByIdAndUpdate(id, updateData, { new: true })
    .then((result) => {
      if (!result) {
        const error = new Error("Movie not found");
        error.status = 404;
        throw error;
      }
      res
        .status(200)
        .json({ message: "Movie updated successfully", data: result });
    })
    .catch((err) => {
      res
        .status(err.status || 500)
        .json({ message: err.message || "Problem while updating movie", error: err.message });
    });
};

const deleteMovieById = (req, res) => {
  if (!checkDB(res)) return;
  const { id } = req.params;
  Movie.findByIdAndDelete(id)
    .then((result) => {
      if (!result) {
        const error = new Error("Movie not found");
        error.status = 404;
        throw error;
      }
      res
        .status(200)
        .json({ message: "Movie deleted successfully", data: result });
    })
    .catch((err) => {
      res
        .status(err.status || 500)
        .json({ message: err.message || "Problem while deleting movie", error: err.message });
    });
};

export {
  createMovie,
  readMovieById,
  readMovies,
  updateMovieById,
  deleteMovieById,
};
