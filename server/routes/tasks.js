import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all tasks for a user
// @route   GET /api/tasks/:userId
// @access  Private
router.get('/:userId', protect, async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, pdfUrl, fileName } = req.body;

        const task = new Task({
            userId: req.user._id,
            title,
            description,
            pdfUrl,
            fileName: fileName || '',
            status: 'pending'
        });

        const createdTask = await task.save();
        res.status(201).json(createdTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a task (Edit details or mark complete)
// @route   PUT /api/tasks/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized to update this task' });
        }

        task.title = req.body.title || task.title;

        if (req.body.description !== undefined) {
            task.description = req.body.description;
        }

        if (req.body.pdfUrl !== undefined) {
            task.pdfUrl = req.body.pdfUrl;
        }

        if (req.body.fileName !== undefined) {
            task.fileName = req.body.fileName;
        }

        if (req.body.status) {
            task.status = req.body.status;
            if (task.status === 'completed' && !task.completedAt) {
                task.completedAt = new Date();

                // STREAK LOGIC
                const user = await User.findById(req.user._id);
                if (user) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
                    if (lastActive) {
                        lastActive.setHours(0, 0, 0, 0);
                    }

                    // If not active today
                    if (!lastActive || lastActive.getTime() < today.getTime()) {
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);

                        // If last active was yesterday, increase streak. Else reset to 1.
                        if (lastActive && lastActive.getTime() === yesterday.getTime()) {
                            user.streak = (user.streak || 0) + 1;
                        } else {
                            user.streak = 1;
                        }

                        if (user.streak > (user.highestStreak || 0)) {
                            user.highestStreak = user.streak;
                        }

                        user.lastActiveDate = new Date();
                        await user.save();
                    }
                }
            } else if (task.status === 'pending') {
                task.completedAt = undefined;
            }
        }

        const updatedTask = await task.save();
        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized to delete this task' });
        }

        await task.deleteOne();
        res.json({ message: 'Task removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
