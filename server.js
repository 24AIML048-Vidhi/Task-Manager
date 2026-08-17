// server.js

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
const logger = require("./middleware/logger");
const validateContentType = require("./middleware/validateContentType");

// Routes
const taskRoutes = require("./routes/taskRoutes");

// Error handling middleware
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Check MongoDB URI
if (!MONGO_URI) {
    console.error("MONGO_URI is not defined in .env");
    process.exit(1);
}

// --------------------------------------------------
// Built-in Middleware
// --------------------------------------------------

app.use(express.json());

// Logger
app.use(logger);

// Content-Type validation
app.use(validateContentType);

// --------------------------------------------------
// Frontend
// --------------------------------------------------

// Serve files from the public folder
app.use(express.static(path.join(__dirname, "public")));

// --------------------------------------------------
// API Routes
// --------------------------------------------------

// All task APIs are available under /tasks
app.use("/tasks", taskRoutes);

// --------------------------------------------------
// Root Route
// --------------------------------------------------

// Open frontend when visiting http://localhost:5000/
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --------------------------------------------------
// 404 Handler
// --------------------------------------------------

app.use(notFound);

// --------------------------------------------------
// Global Error Handler
// --------------------------------------------------

app.use(errorHandler);

// --------------------------------------------------
// MongoDB Connection
// --------------------------------------------------

mongoose
    .connect(MONGO_URI)
    .then(() => {

        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`Network access: http://YOUR-PC-IP:${PORT}`);
            console.log(`Server available on your network at port ${PORT}`);
            console.log(`Frontend: http://localhost:${PORT}`);
            console.log(`API: http://localhost:${PORT}/tasks`);
        });

    })
    .catch((error) => {

        console.error("MongoDB connection failed:", error.message);

        process.exit(1);
    });