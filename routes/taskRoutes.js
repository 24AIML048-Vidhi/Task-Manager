const express = require("express");

const router = express.Router();

const validateTaskId = require("../middleware/validateTaskId");

const {
    getAllTasks,
    createTask,
    updateTask,
    deleteTask
} = require("../controllers/taskController");

// GET
router.get("/tasks", getAllTasks);

// POST
router.post("/tasks", createTask);

// PUT
router.put("/tasks/:id", validateTaskId, updateTask);

// DELETE
router.delete("/tasks/:id", validateTaskId, deleteTask);

module.exports = router;