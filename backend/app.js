const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const TASKS_FILE = path.join(__dirname, 'tasks.json');

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());

// ============================================
// HELPER & VALIDATION FUNCTIONS
// ============================================

async function readTasks() {
    try {
        const data = await fs.readFile(TASKS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeTasks([]);
            return [];
        }
        throw error;
    }
}

async function writeTasks(tasks) {
    await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

/**
 * Validates the payload for creating or updating a task.
 * @param {object} body - The request body.
 * @returns {string[]} An array of error messages. Returns an empty array if valid.
 */
function validateTaskPayload(body) {
    const errors = [];
    const { title, description, priority, completed } = body;

    // Title validation
    if (title !== undefined) {
        if (typeof title !== 'string' || title.trim() === '') {
            errors.push('Title must be a non-empty string.');
        } else if (title.length > 100) {
            errors.push('Title cannot exceed 100 characters.');
        }
    }

    // Description validation
    if (description !== undefined && typeof description !== 'string') {
        errors.push('Description must be a string.');
    } else if (description && description.length > 500) {
        errors.push('Description cannot exceed 500 characters.');
    }

    // Priority validation
    if (priority !== undefined && !['low', 'medium', 'high'].includes(priority)) {
        errors.push('Priority must be one of: low, medium, high.');
    }

    // Completed validation
    if (completed !== undefined && typeof completed !== 'boolean') {
        errors.push('Completed status must be a boolean (true or false).');
    }

    return errors;
}


// ============================================
// API ENDPOINTS
// ============================================

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/tasks', async (req, res) => {
    try {
        const tasks = await readTasks();
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read tasks file.' });
    }
});

app.post('/tasks', async (req, res) => {
    // Title is mandatory for new tasks
    if (!req.body.title) {
        return res.status(400).json({ errors: ['Title is a required field.'] });
    }

    // Validate the entire payload
    const validationErrors = validateTaskPayload(req.body);
    if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
    }

    const { title, description, assignee, priority, deadline, category } = req.body;

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

app.put('/tasks/:id', async (req, res) => {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
        return res.status(400).json({ error: 'Invalid task ID format. ID must be a number.' });
    }

    // Validate the payload
    const validationErrors = validateTaskPayload(req.body);
    if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
    }

    try {
        let tasks = await readTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);

        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found', id: taskId });
        }

        const originalTask = tasks[taskIndex];
        const updatedTask = { ...originalTask, ...req.body, updatedAt: new Date().toISOString() };
        
        tasks[taskIndex] = updatedTask;
        await writeTasks(tasks);
        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update the task.' });
    }
});

app.delete('/tasks/:id', async (req, res) => {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
        return res.status(400).json({ error: 'Invalid task ID format. ID must be a number.' });
    }

    try {
        let tasks = await readTasks();
        const initialLength = tasks.length;
        tasks = tasks.filter(t => t.id !== taskId);

        if (tasks.length === initialLength) {
            return res.status(404).json({ error: 'Task not found', id: taskId });
        }

        await writeTasks(tasks);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete the task.' });
    }
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// Middleware for handling 404 Not Found errors.
// This must be the last piece of middleware.
app.use((req, res, next) => {
    res.status(404).json({ error: 'Endpoint not found' });
});


// ============================================
// SERVER START
// ============================================

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
