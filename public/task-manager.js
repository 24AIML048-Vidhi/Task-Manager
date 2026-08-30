// ==================================================
// TASK-MANAGER.JS
// Authenticated Task Management Client
// ==================================================

const API = "/tasks";
let currentStatus = "pending";
let allTasks = [];

// ==================================================
// Authentication & Session Validation
// ==================================================

function getToken() {
    return localStorage.getItem("token");
}

function getUser() {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch (e) {
        return null;
    }
}

async function validateSession() {
    const token = getToken();
    if (!token) {
        window.location.replace("/login.html");
        return false;
    }

    try {
        const response = await fetch("/auth/me", {
            headers: {
                Authorization: "Bearer " + token,
            },
        });

        if (!response.ok) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.replace("/login.html");
            return false;
        }

        const result = await response.json();
        if (result.user) {
            localStorage.setItem("user", JSON.stringify(result.user));
            renderUserInfo(result.user);
        }

        return true;
    } catch (err) {
        console.error("Session validation error:", err);
        return false;
    }
}

function renderUserInfo(user) {
    if (!user) user = getUser();
    if (!user) return;

    const usernameDisplay = document.getElementById("usernameDisplay");
    const emailDisplay = document.getElementById("emailDisplay");

    if (usernameDisplay) usernameDisplay.textContent = user.username || "User";
    if (emailDisplay) emailDisplay.textContent = user.email || "";
}

function logoutUser() {
    const token = getToken();
    if (token) {
        fetch("/auth/logout", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
            },
        }).catch(() => {});
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login.html";
}

// ==================================================
// Status Helpers
// ==================================================

function getStatusName(status) {
    if (status === "pending") return "Pending";
    if (status === "in-progress") return "In Progress";
    if (status === "completed") return "Completed";
    return "Pending";
}

function getTaskStatus(task) {
    if (task.status) return task.status;
    if (task.completed === true) return "completed";
    return "pending";
}

// ==================================================
// Load Tasks
// ==================================================

async function loadTasks() {
    const token = getToken();
    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetch(API, {
            headers: {
                Authorization: "Bearer " + token,
            },
        });

        if (response.status === 401) {
            logoutUser();
            return;
        }

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Failed to load tasks");
        }

        allTasks = result.data || [];
        updateCounts();
        displayTasks();
    } catch (error) {
        console.error("Load tasks error:", error);
    }
}

// ==================================================
// Update Status Counts
// ==================================================

function updateCounts() {
    const pending = allTasks.filter((t) => getTaskStatus(t) === "pending").length;
    const inProgress = allTasks.filter((t) => getTaskStatus(t) === "in-progress").length;
    const completed = allTasks.filter((t) => getTaskStatus(t) === "completed").length;

    const pBadge = document.getElementById("pendingCount");
    const iBadge = document.getElementById("inProgressCount");
    const cBadge = document.getElementById("completedCount");

    if (pBadge) pBadge.textContent = pending;
    if (iBadge) iBadge.textContent = inProgress;
    if (cBadge) cBadge.textContent = completed;
}

// ==================================================
// Switch Tab / Filter
// ==================================================

function showStatusTasks(status) {
    currentStatus = status;

    // Update active class on tabs
    document.querySelectorAll(".status-tab").forEach((tab) => {
        if (tab.getAttribute("data-status") === status) {
            tab.classList.add("active");
        } else {
            tab.classList.remove("active");
        }
    });

    // Update title and description
    const titleEl = document.getElementById("currentStatusTitle");
    const descEl = document.getElementById("taskListDescription");

    if (status === "pending") {
        if (titleEl) titleEl.innerHTML = '<i class="fa-regular fa-clock"></i> Pending Tasks';
        if (descEl) descEl.textContent = "Tasks that are waiting to be started";
    } else if (status === "in-progress") {
        if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-spinner"></i> In Progress Tasks';
        if (descEl) descEl.textContent = "Tasks currently being worked on";
    } else if (status === "completed") {
        if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Completed Tasks';
        if (descEl) descEl.textContent = "Tasks that have been finished";
    }

    displayTasks();
}

// ==================================================
// Display Tasks in Table
// ==================================================

function displayTasks() {
    const table = document.getElementById("taskTable");
    if (!table) return;

    table.innerHTML = "";

    const filteredTasks = allTasks.filter(
        (task) => getTaskStatus(task) === currentStatus
    );

    if (filteredTasks.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 2rem; color: #888;">
                    <i class="fa-regular fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; display:block;"></i>
                    No ${getStatusName(currentStatus)} Tasks Available
                </td>
            </tr>
        `;
        return;
    }

    filteredTasks.forEach((task, index) => {
        const status = getTaskStatus(task);
        const priority = task.priority || "medium";
        const createdDate = task.createdAt
            ? new Date(task.createdAt).toLocaleDateString()
            : "N/A";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(task.title)}</strong></td>
            <td>${escapeHtml(task.description || "-")}</td>
            <td>
                <span class="badge priority-${priority}">
                    ${capitalize(priority)}
                </span>
            </td>
            <td>
                <span class="status ${status}">
                    ${getStatusName(status)}
                </span>
            </td>
            <td>${createdDate}</td>
            <td>
                <button class="update-btn" onclick="editTask('${task._id}')" title="Edit Task">
                    <i class="fa-solid fa-pen"></i> Edit
                </button>
                <button class="delete-btn" onclick="deleteTask('${task._id}')" title="Delete Task">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </td>
        `;
        table.appendChild(tr);
    });
}

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==================================================
// Add Task
// ==================================================

async function addTask(event) {
    if (event) event.preventDefault();

    const token = getToken();
    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    const titleInput = document.getElementById("title");
    const descInput = document.getElementById("description");
    const priorityInput = document.getElementById("priority");
    const statusRadio = document.querySelector('input[name="status"]:checked');

    const title = titleInput.value.trim();
    const description = descInput ? descInput.value.trim() : "";
    const priority = priorityInput ? priorityInput.value : "medium";
    const status = statusRadio ? statusRadio.value : "pending";

    if (!title) {
        alert("Please enter a task title.");
        titleInput.focus();
        return;
    }

    const addButton = document.getElementById("addTaskButton");
    if (addButton) addButton.disabled = true;

    try {
        const response = await fetch(API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify({
                title,
                description,
                priority,
                status,
            }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Failed to add task.");
        }

        // Reset form
        titleInput.value = "";
        if (descInput) descInput.value = "";
        if (priorityInput) priorityInput.value = "medium";
        const defaultRadio = document.querySelector('input[name="status"][value="pending"]');
        if (defaultRadio) defaultRadio.checked = true;

        await loadTasks();
        showStatusTasks(status);
    } catch (error) {
        console.error("Add task error:", error);
        alert(error.message || "Failed to add task.");
    } finally {
        if (addButton) addButton.disabled = false;
    }
}

// ==================================================
// Edit Task
// ==================================================

async function editTask(id) {
    const token = getToken();
    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    const task = allTasks.find((item) => item._id === id);
    if (!task) {
        alert("Task not found.");
        return;
    }

    const newTitle = prompt("Update Task Title:", task.title);
    if (newTitle === null) return;
    if (!newTitle.trim()) {
        alert("Task title cannot be empty.");
        return;
    }

    const newDesc = prompt("Update Task Description (optional):", task.description || "");
    if (newDesc === null) return;

    const currentStatusVal = getTaskStatus(task);
    const choice = prompt(
        "Select Status:\n1. Pending\n2. In Progress\n3. Completed\n\nEnter 1, 2 or 3:",
        currentStatusVal === "completed" ? "3" : currentStatusVal === "in-progress" ? "2" : "1"
    );

    if (choice === null) return;

    let newStatus = "pending";
    if (choice === "2") newStatus = "in-progress";
    else if (choice === "3") newStatus = "completed";
    else if (choice !== "1") {
        alert("Invalid choice. Status not changed.");
        newStatus = currentStatusVal;
    }

    try {
        const response = await fetch(API + "/" + id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify({
                title: newTitle.trim(),
                description: newDesc.trim(),
                status: newStatus,
            }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Failed to update task.");
        }

        await loadTasks();
        showStatusTasks(newStatus);
    } catch (error) {
        console.error("Update task error:", error);
        alert(error.message || "Failed to update task.");
    }
}

// ==================================================
// Delete Task
// ==================================================

async function deleteTask(id) {
    const token = getToken();
    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    try {
        const response = await fetch(API + "/" + id, {
            method: "DELETE",
            headers: {
                Authorization: "Bearer " + token,
            },
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Failed to delete task.");
        }

        await loadTasks();
    } catch (error) {
        console.error("Delete task error:", error);
        alert(error.message || "Failed to delete task.");
    }
}

// ==================================================
// Download PDF
// ==================================================

async function downloadCurrentStatusPDF() {
    const token = getToken();
    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetch(API + "/download/" + currentStatus, {
            headers: {
                Authorization: "Bearer " + token,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            alert(error.message || "Failed to download PDF.");
            return;
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = "tasks-" + currentStatus + "-" + Date.now() + ".pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
        console.error("PDF download error:", err);
        window.location.href = API + "/download/" + currentStatus + "?token=" + encodeURIComponent(token);
    }
}

// ==================================================
// Initial Execution
// ==================================================

window.addEventListener("DOMContentLoaded", async () => {
    renderUserInfo();
    const isValid = await validateSession();
    if (isValid) {
        loadTasks();
    }
});
