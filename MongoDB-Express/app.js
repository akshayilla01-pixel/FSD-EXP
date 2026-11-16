import express from "express";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const port = process.env.PORT || 7000;

// MongoDB connection settings from environment or fallback
const mongoUrl = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://admin:admin123@localhost:27017";
const databaseName = process.env.DB_NAME || "library_db";

let client;
let db;
let isConnecting = false;

async function getDB() {
  if (db) return db;
  if (!client) {
    client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 5000 });
  }
  if (!isConnecting) {
    isConnecting = true;
    try {
      await client.connect();
      db = client.db(databaseName);
      console.log("Connected to MongoDB");
    } catch (err) {
      console.error("Failed to connect to MongoDB:", err.message);
    } finally {
      isConnecting = false;
    }
  }
  return db;
}

// Initial connection attempt
getDB().catch(() => {});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Reusable connection middleware for serverless
app.use(async (req, res, next) => {
  if (!db) {
    await getDB();
  }
  next();
});

// Root / health route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "MongoDB-Express Library API is running...",
    status: "healthy",
    database: db ? "connected" : "disconnected",
    endpoints: {
      books: [
        "GET /api/v1/books",
        "POST /api/v1/books",
        "GET /api/v1/books/:id",
        "PUT /api/v1/books/:id",
        "DELETE /api/v1/books/:id"
      ]
    }
  });
});

// Helper to ensure db is available before query
function checkDB(res) {
  if (!db) {
    res.status(503).json({
      message: "Database connection not available. Please ensure MONGODB_URI is configured in Vercel environment variables.",
      error: "DATABASE_UNAVAILABLE"
    });
    return false;
  }
  return true;
}

// CRUD API endpoints
// Create a new book - POST /api/v1/books
app.post("/api/v1/books", (req, res, next) => {
  if (!checkDB(res)) return;
  const { title, author, category, price } = req.body;
  if (!title || !author || !category || !price) {
    const err = new Error("All book fields are required");
    err.status = 400;
    return next(err);
  }
  db.collection("books")
    .insertOne({ title, author, category, price })
    .then((result) => {
      const newBook = {
        _id: result.insertedId,
        title,
        author,
        category,
        price,
      };
      res
        .status(201)
        .json({ message: "Book created successfully", data: newBook });
    })
    .catch((err) => next(err));
});

// Get books by category - GET /api/v1/books?category=categoryName
// Get all books - GET /api/v1/books
app.get("/api/v1/books", (req, res, next) => {
  if (!checkDB(res)) return;
  const category = req.query.category;
  const query = category ? { category } : {};
  db.collection("books")
    .find(query)
    .toArray()
    .then((books) => {
      res
        .status(200)
        .json({ message: "Books fetched successfully", data: books });
    })
    .catch((err) => next(err));
});

// Get a single book by ID - GET /api/v1/books/:id
app.get("/api/v1/books/:id", (req, res, next) => {
  if (!checkDB(res)) return;
  const bookId = req.params.id;
  try {
    const objId = ObjectId.isValid(bookId) ? new ObjectId(bookId) : bookId;
    db.collection("books")
      .findOne({ _id: objId })
      .then((book) => {
        if (!book) {
          return res.status(404).json({ message: "Book not found" });
        }
        res
          .status(200)
          .json({ message: "Book fetched successfully", data: book });
      })
      .catch((err) => next(err));
  } catch (err) {
    return res.status(400).json({ message: "Invalid book ID" });
  }
});

// Update a book by ID - PUT /api/v1/books/:id
app.put("/api/v1/books/:id", (req, res, next) => {
  if (!checkDB(res)) return;
  const bookId = req.params.id;
  const { title, author, category, price } = req.body;
  if (!title || !author || !category || !price) {
    return res.status(400).json({ message: "All book fields are required" });
  }
  try {
    const objId = ObjectId.isValid(bookId) ? new ObjectId(bookId) : bookId;
    const book = { title, author, category, price };
    db.collection("books")
      .updateOne({ _id: objId }, { $set: book })
      .then((result) => {
        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Book not found" });
        }
        res.status(200).json({
          message: "Book updated successfully",
          data: { _id: objId, ...book },
        });
      })
      .catch((err) => next(err));
  } catch (err) {
    return res.status(400).json({ message: "Invalid book ID" });
  }
});

// Delete a book by ID - DELETE /api/v1/books/:id
app.delete("/api/v1/books/:id", (req, res, next) => {
  if (!checkDB(res)) return;
  const bookId = req.params.id;
  try {
    const objId = ObjectId.isValid(bookId) ? new ObjectId(bookId) : bookId;
    db.collection("books")
      .deleteOne({ _id: objId })
      .then((result) => {
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Book not found" });
        }
        res.status(200).json({ message: "Book deleted successfully" });
      })
      .catch((err) => next(err));
  } catch (err) {
    return res.status(400).json({ message: "Invalid book ID" });
  }
});

// 404 Not Found middleware
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack || err.message);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
});

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app;
