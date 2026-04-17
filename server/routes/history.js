import express from 'express';
import { protect } from '../middleware/auth.js';
import Activity from '../models/Activity.js';

const router = express.Router();

// @route GET /api/history/summary
router.get('/summary', protect, async (req, res) => {
    try {
        const { topic } = req.query;
        const userId = req.user._id;

        let match = { userId };
        if (topic) {
            match.$or = [
                { topic: { $regex: topic, $options: 'i' } },
                { type: { $regex: topic, $options: 'i' } }
            ];
        }

        const aggregations = await Activity.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$type",
                    totalMinutes: { $sum: "$minutes" }
                }
            }
        ]);

        const summary = { Study: 0, Coding: 0, Watching: 0 };
        aggregations.forEach(item => {
            if (summary.hasOwnProperty(item._id)) {
                summary[item._id] = +(item.totalMinutes / 60).toFixed(2);
            }
        });

        res.json({
            studyHours: summary.Study,
            codingHours: summary.Coding,
            watchingHours: summary.Watching
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route GET /api/history/monthly
// Grouped by month, returning study, coding, watching hours
router.get('/monthly', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const aggregations = await Activity.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: {
                        month: { $month: "$date" },
                        year: { $year: "$date" },
                        type: "$type"
                    },
                    totalMinutes: { $sum: "$minutes" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Transform into a format easy for Recharts
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const resultMap = {};

        aggregations.forEach(item => {
            const key = `${months[item._id.month - 1]} ${item._id.year}`;
            if (!resultMap[key]) {
                resultMap[key] = { month: key, study: 0, coding: 0, watching: 0 };
            }
            if (item._id.type === 'Study') resultMap[key].study = +(item.totalMinutes / 60).toFixed(2);
            if (item._id.type === 'Coding') resultMap[key].coding = +(item.totalMinutes / 60).toFixed(2);
            if (item._id.type === 'Watching') resultMap[key].watching = +(item.totalMinutes / 60).toFixed(2);
        });

        res.json(Object.values(resultMap));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route GET /api/history/yearly
// Total aggregate hours per month for current year
router.get('/yearly', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const currentYear = new Date().getUTCFullYear();
        const startOfYear = new Date(Date.UTC(currentYear, 0, 1));
        const endOfYear = new Date(Date.UTC(currentYear + 1, 0, 1));

        const aggregations = await Activity.aggregate([
            {
                $match: {
                    userId,
                    date: { $gte: startOfYear, $lt: endOfYear }
                }
            },
            {
                $group: {
                    _id: { $month: "$date" },
                    totalMinutes: { $sum: "$minutes" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const result = months.map((month, index) => {
            const data = aggregations.find(a => a._id === (index + 1));
            return {
                month,
                hours: data ? +(data.totalMinutes / 60).toFixed(2) : 0
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
