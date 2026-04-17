import express from 'express';
import { protect } from '../middleware/auth.js';
import Task from '../models/Task.js';
import StudyLog from '../models/StudyLog.js';
import Material from '../models/Material.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';

const router = express.Router();

/** UTC-safe helpers */
const utcDayStart = (dateObj) => {
    const d = dateObj || new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const utcDayStartFromLocal = () => {
    // Use server's local calendar date to build a UTC midnight
    // Better: client should send localDate param for IST accuracy
    return utcDayStart(new Date());
};

// Helper: get date filter based on 'days' param ('7d','30d','all')
const getDateFilter = (daysParam) => {
    if (!daysParam || daysParam === 'all') return null;
    const d = new Date();
    d.setDate(d.getDate() - (daysParam === '30d' ? 30 : 7));
    return utcDayStart(d);
};

// @route GET /api/analytics/summary?days=7d|30d|all&localDate=YYYY-MM-DD
router.get('/summary', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const since = getDateFilter(req.query.days);
        const dateQuery = since ? { $gte: since } : undefined;

        const [tasks, logs, user, materials, activityLogs] = await Promise.all([
            Task.find({ userId, ...(dateQuery ? { createdAt: dateQuery } : {}) }),
            StudyLog.find({ userId, ...(dateQuery ? { date: dateQuery } : {}) }),
            User.findById(userId).select('-password'),
            Material.find({ userId, ...(dateQuery ? { createdAt: dateQuery } : {}) }),
            Activity.find({ userId, ...(dateQuery ? { date: dateQuery } : {}) }),
        ]);

        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Total study hours from StudyLog (single source of truth — Activity POST also $inc's into StudyLog)
        const totalStudyHours = logs.reduce((sum, l) => sum + ((l.studyHours || 0) + (l.codingHours || 0) + (l.watchingHours || 0)), 0);

        // Today's boundaries — use client's localDate (IST aware) if provided
        let todayStart;
        if (req.query.localDate) {
            const [y, m, d] = req.query.localDate.split('-').map(Number);
            todayStart = new Date(Date.UTC(y, m - 1, d));
        } else {
            todayStart = utcDayStartFromLocal();
        }
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

        // StudyLog for today — already includes Activity hours (Activity route does $inc on StudyLog)
        const todayStudyHours = logs
            .filter(l => {
                const ld = new Date(l.date);
                return ld >= todayStart && ld < todayEnd;
            })
            .reduce((sum, l) => sum + ((l.studyHours || 0) + (l.codingHours || 0) + (l.watchingHours || 0)), 0);

        res.json({
            totalTasks: total,
            completedTasks: completed,
            pendingTasks: pending,
            completionRate,
            totalStudyHours,
            todayStudyHours,
            streak: user?.streak || 0,
            highestStreak: user?.highestStreak || 0,
            totalMaterials: materials.length,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route GET /api/analytics/weekly?days=7d|30d|all
router.get('/weekly', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { days: daysParam, topic, localDate } = req.query;

        // Anchor "today" to client's local date to handle IST vs UTC drift
        let todayStart;
        if (localDate) {
            const [y, m, d] = localDate.split('-').map(Number);
            todayStart = new Date(Date.UTC(y, m - 1, d));
        } else {
            todayStart = utcDayStartFromLocal();
        }

        let numDays = 7;
        if (daysParam === '30d') {
            numDays = 30;
        } else if (daysParam === 'all') {
            const [earliestTask, earliestLog] = await Promise.all([
                Task.findOne({ userId }).sort({ createdAt: 1 }).select('createdAt'),
                Activity.findOne({ userId }).sort({ date: 1 }).select('date')
            ]);
            let earliest = todayStart.getTime();
            if (earliestTask && new Date(earliestTask.createdAt).getTime() < earliest) earliest = new Date(earliestTask.createdAt).getTime();
            if (earliestLog && new Date(earliestLog.date).getTime() < earliest) earliest = new Date(earliestLog.date).getTime();

            const diffDays = Math.ceil((todayStart.getTime() - earliest) / (24 * 60 * 60 * 1000)) + 1;
            numDays = Math.max(7, Math.min(diffDays, 365));
        }

        const days = [];
        for (let i = numDays - 1; i >= 0; i--) {
            days.push(new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000));
        }

        const since = days[0];

        let taskQuery = { userId, createdAt: { $gte: since } };
        let activityQuery = { userId, date: { $gte: since } };
        let materialQuery = { userId, createdAt: { $gte: since } };

        if (topic) {
            const regex = { $regex: topic, $options: 'i' };
            taskQuery.$or = [{ title: regex }, { description: regex }];
            activityQuery.$or = [{ topic: regex }, { type: regex }];
            materialQuery.$or = [{ title: regex }, { description: regex }];
        }

        // When filtering by topic, we MUST query Activity collection directly
        // because StudyLog doesn't store topic/description metadata.
        const [tasks, activities, materials] = await Promise.all([
            Task.find(taskQuery),
            Activity.find(activityQuery),
            Material.find(materialQuery),
        ]);

        const result = days.map(day => {
            const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);

            const dayTasks = tasks.filter(t => {
                const td = new Date(t.createdAt);
                return td >= day && td < dayEnd;
            });
            const completedDay = dayTasks.filter(t => t.status === 'completed').length;

            // Sum study hours from Activity records matching this day
            const dayActivities = activities.filter(a => {
                const ad = new Date(a.date);
                return ad >= day && ad < dayEnd;
            });
            const studyHours = dayActivities.reduce((sum, a) => sum + (a.minutes / 60), 0);

            const dayMaterials = materials.filter(m => {
                const md = new Date(m.createdAt);
                return md >= day && md < dayEnd;
            }).length;

            const label = day.toLocaleDateString('en-US', numDays > 7
                ? { month: 'short', day: 'numeric' }
                : { weekday: 'short' });

            return {
                date: day.toISOString(),
                label,
                shortLabel: label,
                totalTasks: dayTasks.length,
                completedTasks: completedDay,
                studyHours,
                totalMaterials: dayMaterials,
                isActive: completedDay > 0 || studyHours > 0 || dayMaterials > 0
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route GET /api/analytics/study-hours
router.get('/study-hours', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const logs = await StudyLog.find({ userId }).sort({ date: -1 });
        const total = logs.reduce((s, l) => s + ((l.studyHours || 0) + (l.codingHours || 0) + (l.watchingHours || 0)), 0);
        const avg = logs.length > 0 ? total / logs.length : 0;

        // Today using UTC
        const todayStart = utcDayStartFromLocal();
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        const todayLog = logs.find(l => {
            const ld = new Date(l.date);
            return ld >= todayStart && ld < todayEnd;
        });

        res.json({
            total,
            todayHours: todayLog ? ((todayLog.studyHours || 0) + (todayLog.codingHours || 0) + (todayLog.watchingHours || 0)) : 0,
            avgDaily: avg,
            logs: logs.map(l => ({ date: l.date, hours: ((l.studyHours || 0) + (l.codingHours || 0) + (l.watchingHours || 0)), createdAt: l.createdAt }))
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route GET /api/analytics/recent?days=7d|30d|all
router.get('/recent', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const since = getDateFilter(req.query.days);
        const dateQ = since ? { $gte: since } : {};

        const [recentTasks, recentLogs, recentMaterials, recentActivities] = await Promise.all([
            Task.find({ userId, status: 'completed', ...(since ? { completedAt: dateQ } : {}) }).sort({ completedAt: -1 }).limit(8),
            StudyLog.find({ userId, ...(since ? { createdAt: dateQ } : {}) }).sort({ createdAt: -1 }).limit(8),
            Material.find({ userId, ...(since ? { createdAt: dateQ } : {}) }).sort({ createdAt: -1 }).limit(8),
            Activity.find({ userId, ...(since ? { date: dateQ } : {}) }).sort({ createdAt: -1 }).limit(8),
        ]);

        const activities = [
            ...recentTasks.map(t => ({
                type: 'task', title: `Completed: ${t.title}`,
                time: t.completedAt || t.updatedAt
            })),
            ...recentActivities.map(a => ({
                type: 'study',
                title: `${a.type}: ${a.topic || a.type} — ${a.minutes} min`,
                time: a.createdAt
            })),
            ...recentLogs
                .filter(l => !recentActivities.some(a => {
                    // Skip StudyLog entries that are covered by Activity entries (same day)
                    const ld = new Date(l.date).toDateString();
                    const ad = new Date(a.date).toDateString();
                    return ld === ad;
                }))
                .map(l => ({
                    type: 'study', title: `Focus session — ${parseFloat((((l.studyHours || 0) + (l.codingHours || 0) + (l.watchingHours || 0)) * 60).toFixed(1))} min`,
                    time: l.createdAt
                })),
            ...recentMaterials.map(m => ({
                type: 'material', title: `Uploaded: ${m.title}`,
                time: m.createdAt
            })),
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

        res.json(activities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route GET /api/analytics/activity
router.get('/activity', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const activities = await Activity.find({ userId });

        const summary = { Study: 0, Coding: 0, Watching: 0 };
        activities.forEach(a => {
            if (summary.hasOwnProperty(a.type)) {
                summary[a.type] = +(summary[a.type] + a.minutes).toFixed(2);
            }
        });

        res.json({
            studyHours: +(summary.Study / 60).toFixed(2),
            codingHours: +(summary.Coding / 60).toFixed(2),
            watchingHours: +(summary.Watching / 60).toFixed(2)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route GET /api/analytics/yearly
router.get('/yearly', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const currentYear = new Date().getUTCFullYear();
        const startOfYear = new Date(Date.UTC(currentYear, 0, 1));
        const endOfYear = new Date(Date.UTC(currentYear + 1, 0, 1));

        const activities = await Activity.find({
            userId,
            date: { $gte: startOfYear, $lt: endOfYear }
        });

        const monthTotals = {};
        for (let i = 1; i <= 12; i++) monthTotals[i] = 0;

        activities.forEach(a => {
            const m = new Date(a.date).getUTCMonth() + 1;
            monthTotals[m] += a.minutes;
        });

        const currentMonthIdx = new Date().getUTCMonth();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const result = months.map((month, index) => {
            const totalMinutes = monthTotals[index + 1] || 0;
            return {
                month,
                hours: index <= currentMonthIdx ? +(totalMinutes / 60).toFixed(2) : null
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
