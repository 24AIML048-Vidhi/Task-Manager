const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/tasks.json");

// Read tasks from JSON file
const readTasks = () => {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
};

// Write tasks to JSON file
const writeTasks = (tasks) => {
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2));
};

// GET ALL TASKS
exports.getAllTasks = (req, res) => {
    const tasks = readTasks();
    res.status(200).json(tasks);
};

// CREATE TASK
exports.createTask = (req, res) => {

    const tasks = readTasks();

    const { title, completed } = req.body;

    if (!title) {
        return res.status(400).json({
            message: "Title is required"
        });
    }

    const newTask = {
        id: tasks.length > 0 ? tasks[tasks.length - 1].id + 1 : 1,
        title,
        completed: completed || false
    };

    tasks.push(newTask);

    writeTasks(tasks);

    res.status(201).json({
        message: "Task Created Successfully",
        task: newTask
    });

};

// UPDATE TASK
exports.updateTask = (req, res) => {

    const tasks = readTasks();

    const id = Number(req.params.id);

    const task = tasks.find(t => t.id === id);

    if (!task) {
        return res.status(404).json({
            message: "Task Not Found"
        });
    }

    task.title = req.body.title || task.title;

    if (req.body.completed !== undefined)
        task.completed = req.body.completed;

    writeTasks(tasks);

    res.status(200).json({
        message: "Task Updated Successfully",
        task
    });

};

// DELETE TASK
exports.deleteTask = (req, res) => {

    let tasks = readTasks();

    const id = Number(req.params.id);

    const task = tasks.find(t => t.id === id);

    if (!task) {
        return res.status(404).json({
            message: "Task Not Found"
        });
    }

    tasks = tasks.filter(t => t.id !== id);

    writeTasks(tasks);

    res.status(200).json({
        message: "Task Deleted Successfully"
    });

};