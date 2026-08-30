const express = require("express");

const router = express.Router();

const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  downloadTasksPDF,
} = require("../controllers/taskController");

const authMiddleware = require("../middleware/authMiddleware");

// Protect all task routes with JWT authentication
router.use(authMiddleware);


// ==================================================
// GET /tasks
// Get all tasks
// ==================================================

router.get("/", getAllTasks);


// ==================================================
// GET /tasks/download/:status
// Download tasks of selected status as PDF
// IMPORTANT: This must be BEFORE /:id
// ==================================================

router.get(
  "/download/:status",
  downloadTasksPDF
);


// ==================================================
// GET /tasks/:id
// Get single task
// ==================================================

router.get(
  "/:id",
  getTaskById
);


// ==================================================
// POST /tasks
// Create task
// ==================================================

router.post(
  "/",
  createTask
);


// ==================================================
// PUT /tasks/:id
// Update task
// ==================================================

router.put(
  "/:id",
  updateTask
);


// ==================================================
// DELETE /tasks/:id
// Delete task
// ==================================================

router.delete(
  "/:id",
  deleteTask
);


module.exports = router;