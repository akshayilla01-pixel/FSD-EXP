import mongoose from "mongoose";
import Todo from "../models/todoModel.js";

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

const createTodo = async (req, res) => {
  try {
    if (!checkDB(res)) return;
    const savedTodo = await Todo.create({ todo: req.body.todo, userId: req.userId });
    res
      .status(201)
      .json({ message: "Todo created successfully", todo: savedTodo });
  } catch (err) {
    res.status(500).json({ message: "Failed to create todo", error: err.message });
  }
};

const readTodos = async (req, res) => {
  const { completed } = req.query;
  try {
    if (!checkDB(res)) return;
    const filter = { userId: req.userId };
    if (completed !== undefined) {
      filter.completed = completed === "true";
    }
    const todos = await Todo.find(filter);
    res
      .status(200)
      .json({ message: "Todos retrieved successfully", todos: todos });
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve todos", error: err.message });
  }
};

const readTodo = async (req, res) => {
  const { id } = req.params;
  try {
    if (!checkDB(res)) return;
    const todo = await Todo.findOne({ _id: id, userId: req.userId });
    if (todo) {
      res
        .status(200)
        .json({ message: "Todo retrieved successfully", todo: todo });
    } else {
      res.status(404).json({ message: "Todo not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve todo", error: err.message });
  }
};

const updateTodo = async (req, res) => {
  const { id } = req.params;
  const updateTodo = req.body;
  try {
    if (!checkDB(res)) return;
    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updateTodo,
      { new: true }
    );
    if (updatedTodo) {
      res
        .status(200)
        .json({ message: "Todo updated successfully", todo: updatedTodo });
    } else {
      res.status(404).json({ message: "Todo not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to update todo", error: err.message });
  }
};

const deleteTodo = async (req, res) => {
  const { id } = req.params;
  try {
    if (!checkDB(res)) return;
    const deletedTodo = await Todo.findOneAndDelete({ _id: id, userId: req.userId });
    if (deletedTodo) {
      res
        .status(200)
        .json({ message: "Todo deleted successfully", todo: deletedTodo });
    } else {
      res.status(404).json({ message: "Todo not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to delete todo", error: err.message });
  }
};

export { createTodo, readTodos, readTodo, updateTodo, deleteTodo };
