require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const connectToMongo = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const errorHandler = require("./middleware/errorHandler");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 3000;

// Prevent stale 304 responses on API calls during lab testing.
app.set("etag", false);

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/health", (req, res) => {
  res.status(200).json({
    message: "Experiment 5B API is running",
    endpoints: {
      createUser: "POST /api/users",
      getUsers: "GET /api/users",
      getUserById: "GET /api/users/:id",
      updateUserById: "PUT /api/users/:id",
      deleteUserById: "DELETE /api/users/:id"
    }
  });
});

app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use("/api", userRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

async function startServer() {
  try {
    await connectToMongo();

    // Ensures all declared indexes are created in MongoDB.
    await User.createIndexes();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
