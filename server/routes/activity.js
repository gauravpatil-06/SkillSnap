import express from 'express';
import { protect } from '../middleware/auth.js';
import Activity from '../models/Activity.js';
import StudyLog from '../models/StudyLog.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * Parse a "YYYY-MM-DD" date string as UTC midnight.
 * This avoids timezone issues where new Date("2026-02-24") is treated as UTC
 * but setHours(0,0,0,0) applies local server timezone.
 */
const parseDateUTC = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
};

// @route POST /api/activity  — log a new activity
router.post('/', protect, async (req, res) => {
    try {
        const { date, minutes, type, topic } = req.body;
        if (!minutes || !type) return res.status(400).json({ message: 'minutes and type are required' });

        // Use UTC parsing to avoid timezone drift
        const actDate = date ? parseDateUTC(date) : (() => {
            const d = new Date();
            return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        })();

        const activity = await Activity.create({
            userId: req.user._id,
            date: actDate,
            minutes: Number(minutes),
            type,
            topic: topic || ''
        });

        // Also add hours to StudyLog for daily tracking
        const hours = +(Number(minutes) / 60).toFixed(4);
        const logUpdate = {};
        if (type === 'Study') logUpdate.studyHours = hours;
        else if (type === 'Coding') logUpdate.codingHours = hours;
        else if (type === 'Watching') logUpdate.watchingHours = hours;

        if (Object.keys(logUpdate).length > 0) {
            await StudyLog.findOneAndUpdate(
                { userId: req.user._id, date: actDate },
                { $inc: logUpdate },
                { upsert: true, new: true }
            );
        }

        // Update cumulative hours on User model
        const userUpdate = {};
        if (type === 'Study') userUpdate.studyHours = hours;
        else if (type === 'Coding') userUpdate.codingHours = hours;
        else if (type === 'Watching') userUpdate.watchingHours = hours;

        if (Object.keys(userUpdate).length > 0) {
            await User.findByIdAndUpdate(req.user._id, { $inc: userUpdate });
        }

        res.status(201).json(activity);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route GET /api/activity — get all activities for user (supports filtering)
router.get('/', protect, async (req, res) => {
    try {
        const { from, to, type, topic } = req.query;
        let query = { userId: req.user._id };

        // Date range filtering
        if (from || to) {
            query.date = {};
            if (from) {
                query.date.$gte = parseDateUTC(from);
            }
            if (to) {
                // Ensure 'to' date includes the entire day
                const toDate = parseDateUTC(to);
                query.date.$lt = new Date(toDate.getTime() + 24 * 60 * 60 * 1000);
            }
        }

        // Type filtering
        if (type && type !== 'All') {
            query.type = type;
        }

        // Topic or Type search (case-insensitive partial match)
        if (topic) {
            query.$or = [
                { topic: { $regex: topic, $options: 'i' } },
                { type: { $regex: topic, $options: 'i' } }
            ];
        }

        const activities = await Activity.find(query).sort({ date: -1, createdAt: -1 });
        res.json(activities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route GET /api/activity/today?localDate=YYYY-MM-DD
// Client sends its local date string to avoid server UTC vs client IST mismatch
router.get('/today', protect, async (req, res) => {
    try {
        let start, end;

        if (req.query.localDate) {
            // Use client-provided local date (YYYY-MM-DD) as UTC day boundaries
            start = parseDateUTC(req.query.localDate);
            end = new Date(start.getTime() + 24 * 60 * 60 * 1000); // +1 day
        } else {
            // Fallback: use server UTC day
            const now = new Date();
            start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        }

        const activities = await Activity.find({
            userId: req.user._id,
            date: { $gte: start, $lt: end }
        }).sort({ createdAt: -1 });

        res.json(activities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route GET /api/activity/monthly-summary?localDate=YYYY-MM-DD
router.get('/monthly-summary', protect, async (req, res) => {
    try {
        let startOfMonth, endOfMonth;

        if (req.query.localDate) {
            const [y, m] = req.query.localDate.split('-').map(Number);
            startOfMonth = new Date(Date.UTC(y, m - 1, 1));
            endOfMonth = new Date(Date.UTC(y, m, 1));
        } else {
            const now = new Date();
            startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
        }

        const activities = await Activity.find({
            userId: req.user._id,
            date: { $gte: startOfMonth, $lt: endOfMonth }
        });

        const summary = { Study: 0, Coding: 0, Watching: 0 };
        for (const a of activities) {
            summary[a.type] = (summary[a.type] || 0) + a.minutes;
        }

        // --- LIFETIME TOTAL AGGREGATION FROM Activity ---
        const totalActivities = await Activity.aggregate([
            { $match: { userId: req.user._id } },
            {
                $group: {
                    _id: "$type",
                    totalMinutes: { $sum: "$minutes" }
                }
            }
        ]);

        const totals = { Study: 0, Coding: 0, Watching: 0 };
        totalActivities.forEach(item => {
            if (totals.hasOwnProperty(item._id)) {
                totals[item._id] = item.totalMinutes;
            }
        });

        res.json({
            studyMins: summary.Study,
            codingMins: summary.Coding,
            watchingMins: summary.Watching,
            studyHrs: +(summary.Study / 60).toFixed(2),
            codingHrs: +(summary.Coding / 60).toFixed(2),
            watchingHrs: +(summary.Watching / 60).toFixed(2),
            // Lifetime from Activity Table
            totalStudyHrs: +(totals.Study / 60).toFixed(4),
            totalCodingHrs: +(totals.Coding / 60).toFixed(4),
            totalWatchingHrs: +(totals.Watching / 60).toFixed(4),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route DELETE /api/activity/:id  — delete a single activity
router.delete('/:id', protect, async (req, res) => {
    try {
        const activity = await Activity.findOne({ _id: req.params.id, userId: req.user._id });
        if (!activity) return res.status(404).json({ message: 'Activity not found' });

        // Subtract hours from StudyLog
        const hours = +(activity.minutes / 60).toFixed(4);
        const logUpdate = {};
        if (activity.type === 'Study') logUpdate.studyHours = -hours;
        else if (activity.type === 'Coding') logUpdate.codingHours = -hours;
        else if (activity.type === 'Watching') logUpdate.watchingHours = -hours;

        if (Object.keys(logUpdate).length > 0) {
            await StudyLog.findOneAndUpdate(
                { userId: req.user._id, date: activity.date },
                { $inc: logUpdate }
            );
        }

        await activity.deleteOne();

        // Decrement cumulative hours on User model
        const userUpdate = {};
        if (activity.type === 'Study') userUpdate.studyHours = -hours;
        else if (activity.type === 'Coding') userUpdate.codingHours = -hours;
        else if (activity.type === 'Watching') userUpdate.watchingHours = -hours;

        if (Object.keys(userUpdate).length > 0) {
            await User.findByIdAndUpdate(req.user._id, { $inc: userUpdate });
        }

        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
