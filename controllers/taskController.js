const Task = require("../models/Task");


// ==================================================
// GET ALL TASKS
// GET /tasks
// ==================================================

const getAllTasks = async (
    req,
    res,
    next
) => {

    try {

        const tasks =
            await Task.find({
                user: req.user._id,
            })
            .sort({
                createdAt: -1,
            });


        res.status(200).json({

            success: true,

            count:
                tasks.length,

            data:
                tasks,

        });

    } catch (error) {

        next(error);

    }
};


// ==================================================
// GET SINGLE TASK
// GET /tasks/:id
// ==================================================

const getTaskById = async (
    req,
    res,
    next
) => {

    try {

        const task =
            await Task.findOne({

                _id:
                    req.params.id,

                user:
                    req.user._id,

            });


        if (!task) {

            return res.status(404).json({

                success: false,

                message:
                    "Task not found.",

            });

        }


        res.status(200).json({

            success: true,

            data:
                task,

        });

    } catch (error) {

        next(error);

    }
};


// ==================================================
// CREATE TASK
// POST /tasks
// ==================================================

const createTask = async (
    req,
    res,
    next
) => {

    try {

        const {
            title,
            description,
            priority,
            status,
        } = req.body;


        if (!title || !title.trim()) {

            return res.status(400).json({

                success: false,

                message:
                    "Task title is required.",

            });

        }


        const validStatuses = [
            "pending",
            "in-progress",
            "completed",
        ];


        const taskStatus =
            validStatuses.includes(status)
                ? status
                : "pending";


        const validPriorities = [
            "low",
            "medium",
            "high",
        ];


        const taskPriority =
            validPriorities.includes(priority)
                ? priority
                : "medium";


        const task =
            await Task.create({

                user:
                    req.user._id,

                title:
                    title.trim(),

                description:
                    description
                        ? description.trim()
                        : "",

                priority:
                    taskPriority,

                status:
                    taskStatus,

                completed:
                    taskStatus ===
                    "completed",

            });


        res.status(201).json({

            success: true,

            message:
                "Task created successfully.",

            data:
                task,

        });

    } catch (error) {

        next(error);

    }
};


// ==================================================
// UPDATE TASK
// PUT /tasks/:id
// ==================================================

const updateTask = async (
    req,
    res,
    next
) => {

    try {

        const {
            title,
            description,
            priority,
            status,
        } = req.body;


        const updateData = {};


        if (title !== undefined) {

            if (!title.trim()) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Task title cannot be empty.",

                });

            }

            updateData.title =
                title.trim();

        }


        if (description !== undefined) {

            updateData.description =
                description.trim();

        }


        if (priority !== undefined) {

            if (
                ![
                    "low",
                    "medium",
                    "high",
                ].includes(priority)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid priority.",

                });

            }

            updateData.priority =
                priority;

        }


        if (status !== undefined) {

            if (
                ![
                    "pending",
                    "in-progress",
                    "completed",
                ].includes(status)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid task status.",

                });

            }


            updateData.status =
                status;

            updateData.completed =
                status === "completed";

        }


        const task =
            await Task.findOneAndUpdate(

                {
                    _id:
                        req.params.id,

                    user:
                        req.user._id,
                },

                updateData,

                {
                    new: true,

                    runValidators: true,
                }

            );


        if (!task) {

            return res.status(404).json({

                success: false,

                message:
                    "Task not found.",

            });

        }


        res.status(200).json({

            success: true,

            message:
                "Task updated successfully.",

            data:
                task,

        });

    } catch (error) {

        next(error);

    }
};


// ==================================================
// DELETE TASK
// DELETE /tasks/:id
// ==================================================

const deleteTask = async (
    req,
    res,
    next
) => {

    try {

        const task =
            await Task.findOneAndDelete({

                _id:
                    req.params.id,

                user:
                    req.user._id,

            });


        if (!task) {

            return res.status(404).json({

                success: false,

                message:
                    "Task not found.",

            });

        }


        res.status(200).json({

            success: true,

            message:
                "Task deleted successfully.",

        });

    } catch (error) {

        next(error);

    }
};


const PDFDocument = require("pdfkit");

// ==================================================
// DOWNLOAD TASKS AS PDF
// GET /tasks/download/:status
// ==================================================

const downloadTasksPDF = async (req, res, next) => {
    try {
        const { status } = req.params;
        const validStatuses = ["pending", "in-progress", "completed"];

        const query = { user: req.user._id };
        if (validStatuses.includes(status)) {
            query.status = status;
        }

        const tasks = await Task.find(query).sort({ createdAt: -1 });

        const doc = new PDFDocument({ margin: 40, size: "A4" });

        const filename = `tasks-${status || "all"}-${Date.now()}.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );

        doc.pipe(res);

        // Header
        doc.fillColor("#4361ee")
            .fontSize(22)
            .text("Task Management System", { align: "center" });

        doc.moveDown(0.5);
        doc.fillColor("#333333")
            .fontSize(14)
            .text(`Task Report: ${status ? status.toUpperCase() : "ALL"} TASKS`, {
                align: "center",
            });

        doc.moveDown(0.3);
        doc.fontSize(10)
            .fillColor("#666666")
            .text(
                `Generated for: ${req.user.username} (${req.user.email}) | Date: ${new Date().toLocaleString()}`,
                { align: "center" }
            );

        doc.moveDown(0.5);
        doc.strokeColor("#cccccc").lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(1);

        if (tasks.length === 0) {
            doc.moveDown(2);
            doc.fontSize(12)
                .fillColor("#888888")
                .text(`No ${status || ""} tasks found.`, { align: "center" });
        } else {
            tasks.forEach((task, index) => {
                // Check page break
                if (doc.y > 700) {
                    doc.addPage();
                }

                doc.fontSize(12)
                    .fillColor("#222222")
                    .text(`${index + 1}. ${task.title}`, { underline: false });

                doc.fontSize(10)
                    .fillColor("#555555")
                    .text(`   Status: ${task.status} | Priority: ${task.priority} | Created: ${new Date(task.createdAt).toLocaleDateString()}`);

                if (task.description) {
                    doc.fontSize(9)
                        .fillColor("#777777")
                        .text(`   Description: ${task.description}`);
                }

                doc.moveDown(0.8);
            });
        }

        doc.end();
    } catch (error) {
        next(error);
    }
};


// ==================================================
// EXPORT
// ==================================================

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    downloadTasksPDF,
};