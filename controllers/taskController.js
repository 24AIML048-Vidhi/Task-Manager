const Task = require("../models/Task");
const PDFDocument = require("pdfkit");
const { sendTaskCompletedEmail } = require("../services/emailService");

// Status workflow hierarchy ranks: forward only
const STATUS_RANKS = {
    pending: 1,
    "in-progress": 2,
    completed: 3,
};

// ==================================================
// GET ALL TASKS
// GET /tasks
// ==================================================

const getAllTasks = async (req, res, next) => {
    try {
        const query = {};

        // Role-based scope
        const isStaff = req.user.role === "admin" || req.user.role === "manager";
        if (!isStaff || req.query.self === "true") {
            query.user = req.user._id;
        } else if (req.query.userId) {
            query.user = req.query.userId;
        }

        // Status filter
        if (req.query.status && ["pending", "in-progress", "completed"].includes(req.query.status)) {
            query.status = req.query.status;
        }

        // Priority filter
        if (req.query.priority && ["low", "medium", "high"].includes(req.query.priority)) {
            query.priority = req.query.priority;
        }

        // Date range filter
        if (req.query.startDate || req.query.endDate) {
            query.createdAt = {};
            if (req.query.startDate) {
                query.createdAt.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const tasks = await Task.find(query)
            .populate("user", "username email role")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks,
        });
    } catch (error) {
        next(error);
    }
};

// ==================================================
// GET SINGLE TASK
// GET /tasks/:id
// ==================================================

const getTaskById = async (req, res, next) => {
    try {
        const query = { _id: req.params.id };
        const isStaff = req.user.role === "admin" || req.user.role === "manager";
        if (!isStaff) {
            query.user = req.user._id;
        }

        const task = await Task.findOne(query).populate("user", "username email role");

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found.",
            });
        }

        res.status(200).json({
            success: true,
            data: task,
        });
    } catch (error) {
        next(error);
    }
};

// ==================================================
// CREATE TASK
// POST /tasks
// ==================================================

const createTask = async (req, res, next) => {
    try {
        const { title, description, priority, status } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Task title is required.",
            });
        }

        const validStatuses = ["pending", "in-progress", "completed"];
        const taskStatus = validStatuses.includes(status) ? status : "pending";

        const validPriorities = ["low", "medium", "high"];
        const taskPriority = validPriorities.includes(priority) ? priority : "medium";

        const task = await Task.create({
            user: req.user._id,
            title: title.trim(),
            description: description ? description.trim() : "",
            priority: taskPriority,
            status: taskStatus,
            completed: taskStatus === "completed",
        });

        // If created directly as completed, send notification email
        if (task.status === "completed") {
            sendTaskCompletedEmail(req.user, task).catch((err) =>
                console.error("Task completion email notification error:", err)
            );
        }

        res.status(201).json({
            success: true,
            message: "Task created successfully.",
            data: task,
        });
    } catch (error) {
        next(error);
    }
};

// ==================================================
// UPDATE TASK (With Segregation & Reversal Prevention)
// PUT /tasks/:id
// ==================================================

const updateTask = async (req, res, next) => {
    try {
        const { title, description, priority, status } = req.body;

        // Find existing task first to check ownership and current status
        const query = { _id: req.params.id };
        const isStaff = req.user.role === "admin" || req.user.role === "manager";
        if (!isStaff) {
            query.user = req.user._id;
        }

        const existingTask = await Task.findOne(query);

        if (!existingTask) {
            return res.status(404).json({
                success: false,
                message: "Task not found.",
            });
        }

        const updateData = {};

        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Task title cannot be empty.",
                });
            }
            updateData.title = title.trim();
        }

        if (description !== undefined) {
            updateData.description = description.trim();
        }

        if (priority !== undefined) {
            if (!["low", "medium", "high"].includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid priority. Must be low, medium, or high.",
                });
            }
            updateData.priority = priority;
        }

        let isMarkedCompleted = false;

        if (status !== undefined) {
            if (!["pending", "in-progress", "completed"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid task status.",
                });
            }

            const currentRank = STATUS_RANKS[existingTask.status] || 1;
            const newRank = STATUS_RANKS[status] || 1;

            // Strict Forward-Only Workflow Check (No Reversals Allowed)
            if (newRank < currentRank) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status transition: Tasks cannot be moved backwards from '${existingTask.status}' to '${status}'. Workflow is forward-only (Pending -> In Progress -> Completed).`,
                });
            }

            updateData.status = status;
            updateData.completed = status === "completed";

            if (existingTask.status !== "completed" && status === "completed") {
                isMarkedCompleted = true;
            }
        }

        const updatedTask = await Task.findOneAndUpdate(
            query,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        ).populate("user", "username email");

        // Send task completion email when status transitions to completed
        if (isMarkedCompleted) {
            const recipientUser = updatedTask.user || req.user;
            sendTaskCompletedEmail(recipientUser, updatedTask).catch((err) =>
                console.error("Task completion email notification error:", err)
            );
        }

        res.status(200).json({
            success: true,
            message: "Task updated successfully.",
            data: updatedTask,
        });
    } catch (error) {
        next(error);
    }
};

// ==================================================
// DELETE TASK
// DELETE /tasks/:id
// ==================================================

const deleteTask = async (req, res, next) => {
    try {
        const query = { _id: req.params.id };
        const isStaff = req.user.role === "admin" || req.user.role === "manager";
        if (!isStaff) {
            query.user = req.user._id;
        }

        const task = await Task.findOneAndDelete(query);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Task deleted successfully.",
        });
    } catch (error) {
        next(error);
    }
};

// ==================================================
// GET TASK STATS (Date Range & RBAC)
// GET /tasks/report/stats
// ==================================================

const getTaskStats = async (req, res, next) => {
    try {
        const { startDate, endDate, userId, allUsers } = req.query;
        const query = {};

        const isStaff = req.user.role === "admin" || req.user.role === "manager";
        if (!isStaff || allUsers !== "true") {
            query.user = isStaff && userId ? userId : req.user._id;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const tasks = await Task.find(query);

        const total = tasks.length;
        const pending = tasks.filter((t) => t.status === "pending").length;
        const inProgress = tasks.filter((t) => t.status === "in-progress").length;
        const completed = tasks.filter((t) => t.status === "completed").length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        res.status(200).json({
            success: true,
            stats: {
                total,
                pending,
                inProgress,
                completed,
                completionRate,
                dateRange: {
                    startDate: startDate || null,
                    endDate: endDate || null,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ==================================================
// GENERATE & DOWNLOAD TASKS REPORT (PDF WITH DATE FILTER & RBAC)
// GET /tasks/download/:status or GET /tasks/report/pdf
// ==================================================

const downloadTasksPDF = async (req, res, next) => {
    try {
        const { status } = req.params;
        const { startDate, endDate, priority, userId, allUsers } = req.query;

        // Strict Role Check: ONLY Admin can generate date-range reports
        if (startDate || endDate) {
            if (req.user.role !== "admin") {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Only Administrators are permitted to generate date-range reports.",
                });
            }
        }

        const query = {};

        // RBAC access control
        const isStaff = req.user.role === "admin" || req.user.role === "manager";
        if (!isStaff || allUsers !== "true") {
            query.user = isStaff && userId ? userId : req.user._id;
        }

        const validStatuses = ["pending", "in-progress", "completed"];
        const selectedStatus = status || req.query.status;

        if (validStatuses.includes(selectedStatus)) {
            query.status = selectedStatus;
        }

        if (priority && ["low", "medium", "high"].includes(priority)) {
            query.priority = priority;
        }

        // Date range filtering
        let dateRangeLabel = "All Time";
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }

            if (startDate && endDate) {
                dateRangeLabel = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
            } else if (startDate) {
                dateRangeLabel = `From ${new Date(startDate).toLocaleDateString()}`;
            } else if (endDate) {
                dateRangeLabel = `Until ${new Date(endDate).toLocaleDateString()}`;
            }
        }

        const tasks = await Task.find(query)
            .populate("user", "username email role")
            .sort({ createdAt: -1 });

        // Calculate metrics
        const totalCount = tasks.length;
        const pendingCount = tasks.filter((t) => t.status === "pending").length;
        const inProgressCount = tasks.filter((t) => t.status === "in-progress").length;
        const completedCount = tasks.filter((t) => t.status === "completed").length;
        const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        // Initialize PDF Document
        const doc = new PDFDocument({ margin: 40, size: "A4" });

        const filename = `task-report-${selectedStatus || "all"}-${Date.now()}.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );

        doc.pipe(res);

        // Header Background Banner
        doc.rect(0, 0, 595.28, 90).fill("#4f46e5");

        // Header Titles
        doc.fillColor("#ffffff")
            .fontSize(22)
            .font("Helvetica-Bold")
            .text("TASK MANAGEMENT SYSTEM", 40, 25);

        doc.fontSize(11)
            .font("Helvetica")
            .fillColor("#e0e7ff")
            .text("Comprehensive Project & Task Progress Report", 40, 52);

        doc.moveDown(3.5);

        // Metadata section
        const userRoleText = (req.user.role || "User").toUpperCase();
        doc.fillColor("#1e293b")
            .fontSize(10)
            .font("Helvetica-Bold")
            .text(`Generated By: `, 40, 105, { continued: true })
            .font("Helvetica")
            .text(`${req.user.username} (${req.user.email}) [${userRoleText}]`);

        doc.font("Helvetica-Bold")
            .text(`Date Filter: `, 40, 122, { continued: true })
            .font("Helvetica")
            .text(dateRangeLabel);

        doc.font("Helvetica-Bold")
            .text(`Generated On: `, 40, 139, { continued: true })
            .font("Helvetica")
            .text(new Date().toLocaleString());

        // Horizontal line
        doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(40, 160).lineTo(555, 160).stroke();

        // Summary Statistics Box
        doc.rect(40, 172, 515, 60).fillAndStroke("#f8fafc", "#cbd5e1");

        doc.fillColor("#475569").fontSize(9).font("Helvetica-Bold");
        doc.text("TOTAL TASKS", 60, 185);
        doc.text("PENDING", 165, 185);
        doc.text("IN PROGRESS", 265, 185);
        doc.text("COMPLETED", 380, 185);
        doc.text("COMPLETION", 475, 185);

        doc.fontSize(16).font("Helvetica-Bold");
        doc.fillColor("#1e293b").text(`${totalCount}`, 60, 202);
        doc.fillColor("#eab308").text(`${pendingCount}`, 165, 202);
        doc.fillColor("#3b82f6").text(`${inProgressCount}`, 265, 202);
        doc.fillColor("#10b981").text(`${completedCount}`, 380, 202);
        doc.fillColor("#6366f1").text(`${rate}%`, 475, 202);

        doc.y = 250;

        // Section Title
        doc.fillColor("#1e293b")
            .fontSize(14)
            .font("Helvetica-Bold")
            .text(`Tasks Details (${selectedStatus ? selectedStatus.toUpperCase() : "ALL STATUSES"})`, 40, 255);

        doc.moveDown(1);

        if (tasks.length === 0) {
            doc.moveDown(2);
            doc.fontSize(12)
                .font("Helvetica")
                .fillColor("#64748b")
                .text("No tasks found matching the selected filters and date range.", 40, 290, {
                    align: "center",
                });
        } else {
            let currentY = 285;

            tasks.forEach((task, index) => {
                // Page break check
                if (currentY > 720) {
                    doc.addPage();
                    currentY = 50;
                }

                // Task Card Background
                doc.rect(40, currentY, 515, 65).fillAndStroke("#ffffff", "#e2e8f0");

                // Priority color indicator
                let priorityColor = "#64748b";
                if (task.priority === "high") priorityColor = "#ef4444";
                if (task.priority === "medium") priorityColor = "#f59e0b";
                if (task.priority === "low") priorityColor = "#10b981";

                doc.rect(40, currentY, 4, 65).fill(priorityColor);

                // Task Title
                doc.fillColor("#0f172a")
                    .fontSize(11)
                    .font("Helvetica-Bold")
                    .text(`${index + 1}. ${task.title}`, 52, currentY + 10, {
                        width: 320,
                        ellipsis: true,
                    });

                // Status & Priority Badges
                doc.fontSize(9).font("Helvetica");
                doc.fillColor("#475569")
                    .text(`Status: ${task.status.toUpperCase()} | Priority: ${(task.priority || "medium").toUpperCase()} | Created: ${new Date(task.createdAt).toLocaleDateString()}`, 52, currentY + 28);

                // Task Description
                if (task.description) {
                    doc.fontSize(8.5)
                        .font("Helvetica-Oblique")
                        .fillColor("#64748b")
                        .text(task.description, 52, currentY + 44, {
                            width: 480,
                            height: 14,
                            ellipsis: true,
                        });
                } else {
                    doc.fontSize(8.5)
                        .font("Helvetica-Oblique")
                        .fillColor("#94a3b8")
                        .text("No description provided.", 52, currentY + 44);
                }

                currentY += 75;
            });
        }

        // Footer on all pages
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(8)
                .fillColor("#94a3b8")
                .text(
                    `Page ${i + 1} of ${range.count} | Task Management System Confidential Report`,
                    40,
                    800,
                    { align: "center", width: 515 }
                );
        }

        doc.end();
    } catch (error) {
        next(error);
    }
};

// ==================================================
// EXPORTS
// ==================================================

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    getTaskStats,
    downloadTasksPDF,
};