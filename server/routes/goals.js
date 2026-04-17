import express from 'express';
import { protect } from '../middleware/auth.js';
import Goal from '../models/Goal.js';

const router = express.Router();

// @route GET /api/goals  — get user's goals
router.get('/', protect, async (req, res) => {
    try {
        let goal = await Goal.findOne({ userId: req.user._id });
        if (!goal) {
            goal = await Goal.create({ userId: req.user._id });
        }
        res.json(goal);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route PUT /api/goals  — update user's goals
router.put('/', protect, async (req, res) => {
    try {
        const { codingGoalHrs, watchingGoalHrs, studyGoalHrs } = req.body;
        const goal = await Goal.findOneAndUpdate(
            { userId: req.user._id },
            { codingGoalHrs, watchingGoalHrs, studyGoalHrs },
            { upsert: true, new: true }
        );
        res.json(goal);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
