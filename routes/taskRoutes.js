const express = require("express");

const router = express.Router();

const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

// GET /tasks
// Get all tasks
router.get("/", getAllTasks);

// GET /tasks/:id
// Get a single task by MongoDB ObjectId
router.get("/:id", getTaskById);

// POST /tasks
// Create a new task
router.post("/", createTask);

// PUT /tasks/:id
// Update an existing task
router.put("/:id", updateTask);

// DELETE /tasks/:id
// Delete a task
router.delete("/:id", deleteTask);

module.exports = router;