const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors'); // Import CORS

const app = express();
const PORT = 3000;
const TASKS_FILE = path.join(__dirname, 'tasks.json');

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies

// ============================================
// HELPER FUNCTIONS
// ============================================

async function readTasks() {
    try {
        const data = await fs.readFile(TASKS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeTasks([]); // Create the file if it doesn't exist
            return [];
        }
        throw error;
    }
}

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
    const { title, description, assignee, priority, deadline, category } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required.' });
    }

    try {
        const tasks = await readTasks();
        const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

        const newTask = {
            id: newId,
            title: title.trim(),
            description: description ? description.trim() : '',
            assignee: assignee ? assignee.trim() : '',
            priority: priority || 'medium',
            deadline: deadline || null,
            category: category ? category.trim() : '',
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
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
    const { title, description, assignee, priority, deadline, category, completed } = req.body;

    if (isNaN(taskId)) {
        return res.status(400).json({ error: 'Invalid task ID.' });
    }

    try {
        let tasks = await readTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);

        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found', id: taskId });
        }

        const originalTask = tasks[taskIndex];
        const updatedTask = {
            ...originalTask,
            title: title !== undefined ? title.trim() : originalTask.title,
            description: description !== undefined ? description.trim() : originalTask.description,
            assignee: assignee !== undefined ? assignee.trim() : originalTask.assignee,
            priority: priority !== undefined ? priority : originalTask.priority,
            deadline: deadline !== undefined ? deadline : originalTask.deadline,
            category: category !== undefined ? category.trim() : originalTask.category,
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

// 5. DELETE /tasks/:id
app.delete('/tasks/:id', async (req, res) => {
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
        return res.status(400).json({ error: 'Invalid task ID.' });
    }

    try {
        let tasks = await readTasks();
        const initialLength = tasks.length;
        tasks = tasks.filter(t => t.id !== taskId);

        if (tasks.length === initialLength) {
            return res.status(404).json({ error: 'Task not found', id: taskId });
        }

        await writeTasks(tasks);
        res.status(204).send(); // No Content
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete the task.' });
    }
});


// ============================================
// SERVER START
// ============================================

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
