const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const TASKS_FILE = path.join(__dirname, 'tasks.json');

// Middleware to parse JSON bodies
app.use(express.json());

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Reads tasks from the tasks.json file.
 * If the file doesn't exist, it returns an empty array.
 * @returns {Promise<Array>} A promise that resolves to an array of tasks.
 */
async function readTasks() {
    try {
        const data = await fs.readFile(TASKS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If the file doesn't exist or is empty, return an empty array
        if (error.code === 'ENOENT') {
            return [];
        }
        // For other errors, re-throw the exception
        throw error;
    }
}

/**
 * Writes an array of tasks to the tasks.json file.
 * @param {Array} tasks - The array of tasks to write.
 * @returns {Promise<void>}
 */
async function writeTasks(tasks) {
    await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

// ============================================
// API ENDPOINTS
// ============================================

// 1. GET /health
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
    });
});

// 2. GET /tasks
app.get('/tasks', async (req, res) => {
    try {
        const tasks = await readTasks();
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read tasks file.' });
    }
});

// 3. POST /tasks
app.post('/tasks', async (req, res) => {
    const { title, description } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required.' });
    }

    try {
        const tasks = await readTasks();

        // Generate a new ID (find the max ID and add 1)
        const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

        const newTask = {
            id: newId,
            title,
            description: description || '',
            completed: false,
            createdAt: new Date().toISOString(),
        };

        tasks.push(newTask);
        await writeTasks(tasks);

        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save the new task.' });
    }
});

// 4. PUT /tasks/:id
app.put('/tasks/:id', async (req, res) => {
    const taskId = parseInt(req.params.id, 10);
    const { title, description, completed } = req.body;

    if (isNaN(taskId)) {
        return res.status(400).json({ error: 'Invalid task ID.' });
    }

    try {
        const tasks = await readTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);

        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found', id: taskId });
        }

        // Update the task with new data, keeping original values if not provided
        const originalTask = tasks[taskIndex];
        const updatedTask = {
            ...originalTask,
            title: title !== undefined ? title : originalTask.title,
            description: description !== undefined ? description : originalTask.description,
            completed: completed !== undefined ? completed : originalTask.completed,
            updatedAt: new Date().toISOString(),
        };

        tasks[taskIndex] = updatedTask;
        await writeTasks(tasks);

        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update the task.' });
    }
});

// ============================================
// SERVER START
// ============================================

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log(`- GET http://localhost:${PORT}/health`);
    console.log(`- GET http://localhost:${PORT}/tasks`);
    console.log(`- POST http://localhost:${PORT}/tasks`);
    console.log(`- PUT http://localhost:${PORT}/tasks/:id`);
});
