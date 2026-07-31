const express = require("express");
const path = require("path");

const app = express();

const logger = require("./middleware/logger");
const validateContentType = require("./middleware/validateContentType");
const taskRoutes = require("./routes/taskRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

// Parse JSON
app.use(express.json());

// Logging Middleware
app.use(logger);

// Content-Type Middleware
app.use(validateContentType);

// Serve Static Files (Frontend)
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/", taskRoutes);

// 404 Middleware
app.use(notFound);

// Global Error Handler (Must Be Last)
app.use(errorHandler);

// Server
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});