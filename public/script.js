// public/script.js

// API endpoint
const API = "/tasks";

// --------------------------------------------------
// Load All Tasks
// --------------------------------------------------

async function loadTasks() {
    try {
        const response = await fetch(API);
        const result = await response.json();

        console.log("GET /tasks response:", result);

        if (!response.ok) {
            throw new Error(result.message || "Failed to load tasks");
        }

        const tasks = result.data || [];

        const table = document.getElementById("taskTable");

        table.innerHTML = "";

        // No tasks
        if (tasks.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="4">No Tasks Available</td>
                </tr>
            `;
            return;
        }

        // Display tasks
        tasks.forEach((task, index) => {
            table.innerHTML += `
                <tr>

                    <!-- Display serial number instead of MongoDB ID -->
                    <td>${index + 1}</td>

                    <!-- Task title -->
                    <td>${task.title}</td>

                    <!-- Task status -->
                    <td>
                        <span class="${task.completed ? "completed" : "pending"}">
                            ${task.completed ? "Completed" : "Pending"}
                        </span>
                    </td>

                    <!-- Actions -->
                    <td>

                        <button
                            class="update-btn"
                            onclick="editTask('${task._id}')"
                        >
                            <i class="fa-solid fa-pen"></i>
                            Update
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteTask('${task._id}')"
                        >
                            <i class="fa-solid fa-trash"></i>
                            Delete
                        </button>

                    </td>

                </tr>
            `;
        });

    } catch (error) {
        console.error("Load tasks error:", error);
        alert("Unable to load tasks.");
    }
}

// --------------------------------------------------
// Add Task
// --------------------------------------------------

async function addTask() {

    const titleInput = document.getElementById("title");
    const completedInput = document.getElementById("completed");

    const title = titleInput.value.trim();
    const completed = completedInput.checked;

    // Validate title
    if (title === "") {
        alert("Please enter a task title.");
        return;
    }

    try {

        const response = await fetch(API, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                title: title,
                completed: completed
            })
        });

        const result = await response.json();

        console.log("POST /tasks response:", result);

        // Handle error
        if (!response.ok) {

            if (result.errors) {

                const messages = Object.values(result.errors).join("\n");

                alert(`${result.message}\n${messages}`);

            } else {

                alert(result.message || "Failed to add task.");
            }

            return;
        }

        // Success
        alert(result.message || "Task created successfully.");

        // Clear input
        titleInput.value = "";
        completedInput.checked = false;

        // Reload tasks
        await loadTasks();

    } catch (error) {

        console.error("Add task error:", error);

        alert("Failed to add task.");
    }
}

// --------------------------------------------------
// Update Task
// --------------------------------------------------

async function editTask(id) {

    const title = prompt("Enter Updated Task Title:");

    // User cancelled
    if (title === null) {
        return;
    }

    // Validate title
    if (title.trim() === "") {
        alert("Task title cannot be empty.");
        return;
    }

    const completed = confirm("Mark this task as Completed?");

    try {

        const response = await fetch(`${API}/${id}`, {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                title: title.trim(),
                completed: completed
            })
        });

        const result = await response.json();

        console.log("PUT /tasks response:", result);

        // Handle error
        if (!response.ok) {

            if (result.errors) {

                const messages = Object.values(result.errors).join("\n");

                alert(`${result.message}\n${messages}`);

            } else {

                alert(result.message || "Failed to update task.");
            }

            return;
        }

        // Success
        alert(result.message || "Task updated successfully.");

        // Reload tasks
        await loadTasks();

    } catch (error) {

        console.error("Update task error:", error);

        alert("Failed to update task.");
    }
}

// --------------------------------------------------
// Delete Task
// --------------------------------------------------

async function deleteTask(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(`${API}/${id}`, {

            method: "DELETE"
        });

        const result = await response.json();

        console.log("DELETE /tasks response:", result);

        // Handle error
        if (!response.ok) {

            alert(result.message || "Failed to delete task.");

            return;
        }

        // Success
        alert(result.message || "Task deleted successfully.");

        // Reload tasks
        await loadTasks();

    } catch (error) {

        console.error("Delete task error:", error);

        alert("Failed to delete task.");
    }
}

// --------------------------------------------------
// Refresh Button
// --------------------------------------------------

function refreshTasks() {
    loadTasks();
}

// --------------------------------------------------
// Load Tasks When Page Opens
// --------------------------------------------------

window.addEventListener("DOMContentLoaded", () => {
    loadTasks();
});