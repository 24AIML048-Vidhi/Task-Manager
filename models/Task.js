const mongoose = require("mongoose");

// Define Task Schema
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    completed: {
      type: Boolean,
      default: false,
    },

    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high"],
        message: "Priority must be low, medium, or high",
      },
      default: "medium",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

// Pre-save hook
// Automatically trims whitespace from the title
taskSchema.pre("save", function (next) {
  if (this.title) {
    this.title = this.title.trim();
  }

  next();
});

// Create and export Task model
const Task = mongoose.model("Task", taskSchema);

module.exports = Task;