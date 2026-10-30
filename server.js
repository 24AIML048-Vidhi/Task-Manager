
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const app = express();

// Middleware
const logger = require("./middleware/logger");
const validateContentType = require("./middleware/validateContentType");

// Routes
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const aiRoutes = require("./routes/aiRoutes");

// Error handling
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

// Configuration
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongodb:27017/taskdb";

app.use(express.json());
app.use(logger);
app.use(validateContentType);

// Frontend
const clientDistPath = path.join(__dirname, "client", "dist");
const publicPath = path.join(__dirname, "public");

// Existing public files
app.use(express.static(publicPath));

// React application
if (fs.existsSync(clientDistPath)) {
    app.use("/app", express.static(clientDistPath));

    // React Router fallback
    app.get(/^\/app(?:\/.*)?$/, (req, res) => {
        res.sendFile(path.join(clientDistPath, "index.html"));
    });
}

// API routes
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);
app.use("/api/ai", aiRoutes);

// Root route
app.get("/", (req, res) => {
    if (fs.existsSync(clientDistPath)) {
        return res.redirect("/app/");
    }

    res.sendFile(path.join(publicPath, "login.html"));
});

// 404 and error handlers
app.use(notFound);
app.use(errorHandler);

// MongoDB connection and server startup
if (require.main === module) {
    mongoose
        .connect(MONGO_URI)
        .then(() => {
            console.log("MongoDB connected successfully");

            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
                console.log(`Frontend: /app/`);
                console.log(`API: /tasks`);
                console.log(`AI API: /api/ai/generate-description`);
            });
        })
        .catch((error) => {
            console.error("MongoDB connection failed:", error.message);
            process.exit(1);
        });
}

module.exports = app;
