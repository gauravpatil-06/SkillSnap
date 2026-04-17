import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';
import Material from '../models/Material.js';
import StudyLog from '../models/StudyLog.js';
import Feedback from '../models/Feedback.js';

const router = express.Router();

/* Helper for intelligent date search (supports formats: 14 Mar, 14 Mar 2026, 14-03-2026, 14/03/2026) */
const parseDateSearch = (query) => {
    if (!query || typeof query !== 'string') return null;
    const q = query.trim();

    // 1. Matches: 14 Mar, 14 Mar 2026, 14 March 2026
    const dateStrMatch = q.match(/^(\d{1,2})\s+([A-Za-z]{3,9})(?:\s+(\d{4}))?$/i);
    // 2. Matches: 14-03-2026, 14/03/2026
    const dateNumMatch = q.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);

    let parsedDate = null;
    if (dateStrMatch) {
        const day = dateStrMatch[1];
        const month = dateStrMatch[2];
        const year = dateStrMatch[3] || new Date().getFullYear();
        parsedDate = new Date(`${month} ${day}, ${year}`);
    } else if (dateNumMatch) {
        const day = dateNumMatch[1];
        const month = dateNumMatch[2];
        const year = dateNumMatch[3];
        parsedDate = new Date(`${year}-${month}-${day}`);
    }

    if (parsedDate && !isNaN(parsedDate.getTime())) {
        const start = new Date(parsedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(parsedDate);
        end.setHours(23, 59, 59, 999);
        return { $gte: start, $lte: end };
    }
    return null;
};


// ────────────────────────────────────────────────────────────────
//  GET /api/admin/dashboard  — aggregate overview for AdminDashboard
// ────────────────────────────────────────────────────────────────
router.get('/dashboard', protect, isAdmin, async (req, res) => {
    try {
        const { from, to, timeFilter, topic } = req.query;

        // 1. Construct Date Range Filter
        let dateFilter = {};
        if (from || to) {
            if (from) dateFilter.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                dateFilter.$lte = toDate;
            }
        } else if (timeFilter) {
            const now = new Date();
            if (timeFilter === '7d') {
                dateFilter.$gte = new Date(now.setDate(now.getDate() - 7));
            } else if (timeFilter === 'monthly') {
                dateFilter.$gte = new Date(now.setMonth(now.getMonth() - 1));
            } else if (timeFilter === 'yearly') {
                dateFilter.$gte = new Date(now.setFullYear(now.getFullYear() - 1));
            }
        }

        // 2. Intelligent Date Search & Regex Parsing
        let searchRegex = null;
        let dateSearchMatch = parseDateSearch(topic);

        if (topic && topic.trim() !== "") {
            const safeQuery = topic.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            searchRegex = new RegExp(safeQuery, "i");
        }


        let baseDate = from ? new Date(from) : new Date();

        let userMatch = {};
        if (searchRegex) {
            userMatch = {
                $or: [
                    { name: { $regex: searchRegex } },
                    { email: { $regex: searchRegex } }
                ]
            };
        }
        const users = await User.find(userMatch).select('-password');
        const matchedUserIds = users.map(u => u._id);

        const taskMatch = {
            ...( (dateFilter.$gte || dateFilter.$lte) ? { createdAt: dateFilter } : (dateSearchMatch ? { createdAt: dateSearchMatch } : {}) ),
            ...(searchRegex ? {
                $or: [
                    { title: searchRegex }, { topic: searchRegex }, { explanation: searchRegex }, { userId: { $in: matchedUserIds } }
                ]
            } : {})
        };

        const activityMatch = {
            ...( (dateFilter.$gte || dateFilter.$lte) ? { date: dateFilter } : (dateSearchMatch ? { date: dateSearchMatch } : {}) ),
            ...(searchRegex ? {
                $or: [
                    { topic: searchRegex }, { type: searchRegex }, { method: searchRegex }, { userId: { $in: matchedUserIds } }
                ]
            } : {})
        };


        const materialMatch = {
            ...( (dateFilter.$gte || dateFilter.$lte) ? { createdAt: dateFilter } : (dateSearchMatch ? { createdAt: dateSearchMatch } : {}) ),
            ...(searchRegex ? {
                $or: [
                    { title: searchRegex }, { topic: searchRegex }, { userId: { $in: matchedUserIds } }
                ]
            } : {})
        };

        const feedbackMatch = {
            ...( (dateFilter.$gte || dateFilter.$lte) ? { createdAt: dateFilter } : (dateSearchMatch ? { createdAt: dateSearchMatch } : {}) ),
            ...(searchRegex ? {
                $or: [
                    { message: searchRegex }, { userId: { $in: matchedUserIds } }
                ]
            } : {})
        };

        const studyLogMatch = {
            ...( (dateFilter.$gte || dateFilter.$lte) ? { createdAt: dateFilter } : (dateSearchMatch ? { createdAt: dateSearchMatch } : {}) ),
            ...(searchRegex ? {
                $or: [
                    { topic: searchRegex }, { userId: { $in: matchedUserIds } }
                ]
            } : {})
        };


        const [tasks, activities, materials, feedbacks, studyLogs] = await Promise.all([
            Task.find(taskMatch),
            Activity.find(activityMatch).lean(),
            Material.find(materialMatch),
            Feedback.find(feedbackMatch),
            StudyLog.find(studyLogMatch),
        ]);

        // AGGREGATION: Activity Totals
        const activityTotals = await Activity.aggregate([
            { $match: activityMatch },
            {
                $group: {
                    _id: "$type",
                    totalMinutes: { $sum: "$minutes" }
                }
            }
        ]);

        const totalsMap = { Study: 0, Coding: 0, Watching: 0 };
        activityTotals.forEach(item => {
            if (totalsMap.hasOwnProperty(item._id)) {
                totalsMap[item._id] = item.totalMinutes;
            }
        });

        const totalStudyHours = +(totalsMap.Study / 60).toFixed(2);
        const totalCodingHours = +(totalsMap.Coding / 60).toFixed(2);
        const totalWatchingHours = +(totalsMap.Watching / 60).toFixed(2);

        // Granular Study Mode info
        const timerStats = await Activity.aggregate([
            { $match: { ...activityMatch, type: 'Study' } },
            {
                $group: {
                    _id: "$method",
                    totalMinutes: { $sum: "$minutes" }
                }
            }
        ]);
        const timerMap = { Countdown: 0, Stopwatch: 0 };
        timerStats.forEach(item => {
            if (timerMap.hasOwnProperty(item._id)) timerMap[item._id] = item.totalMinutes;
        });

        const totalCountdownHours = +(timerMap.Countdown / 60).toFixed(2);
        const totalStopwatchHours = +(timerMap.Stopwatch / 60).toFixed(2);

        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const completionRate = tasks.length > 0 ? ((completedTasks / tasks.length) * 100).toFixed(1) : '0';

        // Highest streak user (Global, ignore filters if no topic)
        let highestStreakUser = 'None';
        if (users.length) {
            const top = users.reduce((best, u) => (u.streak > (best.streak || 0) ? u : best), users[0]);
            highestStreakUser = `${top.name} (${top.streak} days)`;
        }

        // Top users by filtered study hours
        const userStudyMap = {};
        activities.forEach(a => {
            const uid = a.userId.toString();
            userStudyMap[uid] = (userStudyMap[uid] || 0) + (a.minutes || 0);
        });
        const topUsers = users
            .map(u => ({
                _id: u._id,
                userName: u.name,
                avatar: u.avatar,
                totalStudyHours: +((userStudyMap[u._id.toString()] || 0) / 60).toFixed(2),
                currentStreak: u.streak || 0,
            }))
            .sort((a, b) => b.totalStudyHours - a.totalStudyHours)
            .slice(0, 10);

        // Daily — dynamically sized from start to end (max 31 days)
        let startDate_iter = new Date(baseDate);
        let endDate_iter = new Date(baseDate);

        if (dateSearchMatch && dateSearchMatch.$gte) {
            // Searched a specific date
            startDate_iter = new Date(dateSearchMatch.$gte);
            endDate_iter = new Date(dateSearchMatch.$gte);
        } else if (from && to) {
            startDate_iter = new Date(from);
            endDate_iter = new Date(to);
        } else if (from) {
            startDate_iter = new Date(from);
            endDate_iter = new Date(); // up to today
        } else if (to) {
            startDate_iter = new Date(to);
            startDate_iter.setDate(startDate_iter.getDate() - 6);
            endDate_iter = new Date(to);
        } else {
            // last 7 days ending on baseDate
            startDate_iter.setDate(startDate_iter.getDate() - 6);
        }

        let diffDays = Math.ceil((endDate_iter - startDate_iter) / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays <= 0) diffDays = 1;
        if (diffDays > 31) {
            startDate_iter = new Date(endDate_iter);
            startDate_iter.setDate(startDate_iter.getDate() - 30);
            diffDays = 31;
        }

        const dailyStudyData = [];
        for (let i = 0; i < diffDays; i++) {
            const d = new Date(startDate_iter);
            d.setDate(d.getDate() + i);
            const dayStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
            const dayEnd = new Date(dayStart.getTime() + 86400000);

            const dayActs = activities.filter(a => {
                const ad = new Date(a.date);
                return ad >= dayStart && ad < dayEnd;
            });

            const manualSMins = dayActs.filter(a => a.type === 'Study' && (a.method === 'Manual' || !a.method)).reduce((s, a) => s + (a.minutes || 0), 0);
            const cMins = dayActs.filter(a => a.type === 'Coding').reduce((s, a) => s + (a.minutes || 0), 0);
            const wMins = dayActs.filter(a => a.type === 'Watching').reduce((s, a) => s + (a.minutes || 0), 0);
            const cdMins = dayActs.filter(a => a.type === 'Study' && a.method === 'Countdown').reduce((s, a) => s + (a.minutes || 0), 0);
            const swMins = dayActs.filter(a => a.type === 'Study' && a.method === 'Stopwatch').reduce((s, a) => s + (a.minutes || 0), 0);

            dailyStudyData.push({
                name: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
                hours: +((manualSMins + cMins + wMins + cdMins + swMins) / 60).toFixed(2),
                study: +(manualSMins / 60).toFixed(2),
                coding: +(cMins / 60).toFixed(2),
                watching: +(wMins / 60).toFixed(2),
                countdown: +(cdMins / 60).toFixed(2),
                stopwatch: +(swMins / 60).toFixed(2)
            });
        }

        // Monthly — 12 months from baseDate year
        const baseYear = baseDate.getUTCFullYear();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyStudyData = months.map((m, idx) => {
            const mStart = new Date(Date.UTC(baseYear, idx, 1));
            const mEnd = new Date(Date.UTC(baseYear, idx + 1, 1));

            const monthActs = activities.filter(a => {
                const ad = new Date(a.date);
                return ad >= mStart && ad < mEnd;
            });

            const manualSMins = monthActs.filter(a => a.type === 'Study' && (a.method === 'Manual' || !a.method)).reduce((s, a) => s + (a.minutes || 0), 0);
            const cMins = monthActs.filter(a => a.type === 'Coding').reduce((s, a) => s + (a.minutes || 0), 0);
            const wMins = monthActs.filter(a => a.type === 'Watching').reduce((s, a) => s + (a.minutes || 0), 0);
            const cdMins = monthActs.filter(a => a.type === 'Study' && a.method === 'Countdown').reduce((s, a) => s + (a.minutes || 0), 0);
            const swMins = monthActs.filter(a => a.type === 'Study' && a.method === 'Stopwatch').reduce((s, a) => s + (a.minutes || 0), 0);

            const realNow = new Date();
            const isFuture = baseYear > realNow.getUTCFullYear() || (baseYear === realNow.getUTCFullYear() && idx > realNow.getUTCMonth());
            const totalH = +((manualSMins + cMins + wMins + cdMins + swMins) / 60).toFixed(2);

            return {
                name: m,
                hours: (isFuture && !topic && !from) ? null : totalH,
                study: +(manualSMins / 60).toFixed(2),
                coding: +(cMins / 60).toFixed(2),
                watching: +(wMins / 60).toFixed(2),
                countdown: +(cdMins / 60).toFixed(2),
                stopwatch: +(swMins / 60).toFixed(2)
            };
        });

        // Yearly — last 3 years from baseYear
        const yearlyStudyData = [];
        for (let y = baseYear - 2; y <= baseYear; y++) {
            const yStart = new Date(Date.UTC(y, 0, 1));
            const yEnd = new Date(Date.UTC(y + 1, 0, 1));

            const yearActs = activities.filter(a => {
                const ad = new Date(a.date);
                return ad >= yStart && ad < yEnd;
            });

            const manualSMins = yearActs.filter(a => a.type === 'Study' && (a.method === 'Manual' || !a.method)).reduce((s, a) => s + (a.minutes || 0), 0);
            const cMins = yearActs.filter(a => a.type === 'Coding').reduce((s, a) => s + (a.minutes || 0), 0);
            const wMins = yearActs.filter(a => a.type === 'Watching').reduce((s, a) => s + (a.minutes || 0), 0);
            const cdMins = yearActs.filter(a => a.type === 'Study' && a.method === 'Countdown').reduce((s, a) => s + (a.minutes || 0), 0);
            const swMins = yearActs.filter(a => a.type === 'Study' && a.method === 'Stopwatch').reduce((s, a) => s + (a.minutes || 0), 0);

            yearlyStudyData.push({
                name: String(y),
                hours: +((manualSMins + cMins + wMins + cdMins + swMins) / 60).toFixed(2),
                study: +(manualSMins / 60).toFixed(2),
                coding: +(cMins / 60).toFixed(2),
                watching: +(wMins / 60).toFixed(2),
                countdown: +(cdMins / 60).toFixed(2),
                stopwatch: +(swMins / 60).toFixed(2)
            });
        }

        res.json({
            totalUsers: users.length,
            totalTasks: tasks.length,
            totalActivities: activities.length,
            totalMaterials: materials.length,
            totalFeedback: feedbacks.length,
            totalStudyHours,
            totalCodingHours,
            totalWatchingHours,
            totalCountdownHours,
            totalStopwatchHours,
            completedTasks,
            completionRate,
            highestStreakUser,
            topUsers,
            dailyStudyData,
            monthlyStudyData,
            yearlyStudyData,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ────────────────────────────────────────────────────────────────
//  GET /api/admin/users         — all users
//  DELETE /api/admin/users/:id  — delete user + associated data
// ────────────────────────────────────────────────────────────────
router.get('/users', protect, isAdmin, async (req, res) => {
    try {
        const { from, to, timeFilter, topic, sortBy } = req.query;

        // 1. Construct Date Range Filter (based on registration/createdAt)
        let dateFilter = {};
        if (from || to) {
            if (from) dateFilter.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                dateFilter.$lte = toDate;
            }
        } else if (timeFilter && timeFilter !== 'all') {
            const now = new Date();
            if (timeFilter === '7d') {
                dateFilter.$gte = new Date(now.setDate(now.getDate() - 7));
            } else if (timeFilter === 'monthly') {
                dateFilter.$gte = new Date(now.setMonth(now.getMonth() - 1));
            } else if (timeFilter === 'yearly') {
                dateFilter.$gte = new Date(now.setFullYear(now.getFullYear() - 1));
            }
        }

        // 2. Intelligent Search (Topic/Name/Email/College) & Date Search
        let searchRegex = null;
        let dateSearchMatch = parseDateSearch(topic);

        if (topic && topic.trim() !== "") {
            const safeQuery = topic.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            searchRegex = new RegExp(safeQuery, "i");
        }

        // 3. Build Query
        let query = {};
        if (Object.keys(dateFilter).length > 0) {
            // Updated to use lastActiveDate for All Users page filtering requirements
            query.lastActiveDate = dateFilter;
        }

        if (searchRegex || dateSearchMatch) {
            const orConditions = [];
            if (searchRegex) {
                orConditions.push(
                    { name: searchRegex },
                    { email: searchRegex },
                    { college: searchRegex }
                );
            }
            if (dateSearchMatch) {
                orConditions.push({ lastActiveDate: dateSearchMatch });
            }
            query.$or = orConditions;
        }

        // 4. Sorting
        let sort = { lastActiveDate: -1 };
        if (sortBy === 'oldest') sort = { lastActiveDate: 1 };
        else if (sortBy === 'latest') sort = { lastActiveDate: -1 };

        const users = await User.find(query).select('-password').sort(sort);
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.delete('/users/:id', protect, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        await Promise.all([
            User.findByIdAndDelete(userId),
            Task.deleteMany({ userId }),
            Activity.deleteMany({ userId }),
            Material.deleteMany({ userId }),
            StudyLog.deleteMany({ userId }),
        ]);
        res.json({ message: 'User and associated data deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ────────────────────────────────────────────────────────────────
//  GET /api/admin/tasks         — all tasks (populated with user)
//  DELETE /api/admin/tasks/:id
// ────────────────────────────────────────────────────────────────
router.get('/tasks', protect, isAdmin, async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate('userId', 'name avatar email')
            .sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/tasks/:id', protect, isAdmin, async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ────────────────────────────────────────────────────────────────
//  GET /api/admin/materials         — all materials (populated)
//  DELETE /api/admin/materials/:id
// ────────────────────────────────────────────────────────────────
router.get('/materials', protect, isAdmin, async (req, res) => {
    try {
        const materials = await Material.find()
            .populate('userId', 'name avatar email')
            .sort({ createdAt: -1 });
        res.json(materials);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/materials/:id', protect, isAdmin, async (req, res) => {
    try {
        await Material.findByIdAndDelete(req.params.id);
        res.json({ message: 'Material deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ────────────────────────────────────────────────────────────────
//  GET /api/admin/activity         — all activity logs (populated)
//  DELETE /api/admin/activity/:id  — delete single activity
// ────────────────────────────────────────────────────────────────
router.get('/activity', protect, isAdmin, async (req, res) => {
    try {
        const activities = await Activity.find()
            .populate('userId', 'name avatar email')
            .sort({ date: -1, createdAt: -1 });
        res.json(activities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/activity/:id', protect, isAdmin, async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);
        if (!activity) return res.status(404).json({ message: 'Activity not found' });

        // Subtract hours from StudyLog
        const hours = +(activity.minutes / 60).toFixed(4);
        const logUpdate = {};
        if (activity.type === 'Study') logUpdate.studyHours = -hours;
        else if (activity.type === 'Coding') logUpdate.codingHours = -hours;
        else if (activity.type === 'Watching') logUpdate.watchingHours = -hours;

        if (Object.keys(logUpdate).length > 0) {
            await StudyLog.findOneAndUpdate(
                { userId: activity.userId, date: activity.date },
                { $inc: logUpdate }
            );
        }

        await activity.deleteOne();
        res.json({ message: 'Activity deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ────────────────────────────────────────────────────────────────
//  GET /api/admin/feedback         — all feedback
//  DELETE /api/admin/feedback/:id
// ────────────────────────────────────────────────────────────────
router.get('/feedback', protect, isAdmin, async (req, res) => {
    try {
        const feedbacks = await Feedback.find().sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/feedback/:id', protect, isAdmin, async (req, res) => {
    try {
        await Feedback.findByIdAndDelete(req.params.id);
        res.json({ message: 'Feedback deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ────────────────────────────────────────────────────────────────
//  GET /api/admin/leaderboard — users sorted by streak + study hours
// ────────────────────────────────────────────────────────────────
router.get('/leaderboard', protect, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        const studyLogs = await StudyLog.find();

        const userStudyMap = {};
        studyLogs.forEach(l => {
            const uid = l.userId.toString();
            userStudyMap[uid] = (userStudyMap[uid] || 0) + l.hours;
        });

        const completedTasksMap = {};
        const tasks = await Task.find({ status: 'completed' });
        tasks.forEach(t => {
            const uid = t.userId.toString();
            completedTasksMap[uid] = (completedTasksMap[uid] || 0) + 1;
        });

        const leaderboard = users.map(u => ({
            _id: u._id,
            name: u.name,
            avatar: u.avatar,
            streak: u.streak || 0,
            studyHours: +((u.studyHours || 0) + (u.codingHours || 0) + (u.watchingHours || 0)).toFixed(2),
            completedTasks: completedTasksMap[u._id.toString()] || 0,
        }))
            .sort((a, b) => b.streak - a.streak || b.studyHours - a.studyHours);

        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ────────────────────────────────────────────────────────────────
//  Admin Analytics endpoints (for AdminAnalytics page)
// ────────────────────────────────────────────────────────────────

// GET /api/admin/analytics/summary
router.get('/analytics/summary', protect, isAdmin, async (req, res) => {
    try {
        const [users, tasks, activities, studyLogs] = await Promise.all([
            User.find().select('-password'),
            Task.find(),
            Activity.find(),
            StudyLog.find(),
        ]);

        const totalStudyHours = studyLogs.reduce((s, l) => s + (l.studyHours || 0) + (l.codingHours || 0) + (l.watchingHours || 0), 0);
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const pendingTasks = tasks.length - completedTasks;
        const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

        // Today's study
        const now = new Date();
        const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const todayEnd = new Date(todayStart.getTime() + 86400000);
        const todayStudyHours = studyLogs
            .filter(l => { const ld = new Date(l.date); return ld >= todayStart && ld < todayEnd; })
            .reduce((s, l) => s + (l.studyHours || 0) + (l.codingHours || 0) + (l.watchingHours || 0), 0);

        // Highest streak
        const streakUser = users.reduce((best, u) => (u.streak > (best?.streak || 0) ? u : best), users[0]);

        res.json({
            totalUsers: users.length,
            totalTasks: tasks.length,
            completedTasks,
            pendingTasks,
            completionRate,
            totalStudyHours: +totalStudyHours.toFixed(2),
            todayStudyHours: +todayStudyHours.toFixed(2),
            totalActivities: activities.length,
            highestStreak: streakUser?.streak || 0,
            highestStreakUser: streakUser ? `${streakUser.name} (${streakUser.streak})` : 'None',
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/admin/analytics/users — per-user analytics
router.get('/analytics/users', protect, isAdmin, async (req, res) => {
    try {
        const [users, tasks, activities, studyLogs] = await Promise.all([
            User.find().select('-password'),
            Task.find(),
            Activity.find(),
            StudyLog.find(),
        ]);

        const userStudyMap = {};
        studyLogs.forEach(l => {
            const uid = l.userId.toString();
            userStudyMap[uid] = (userStudyMap[uid] || 0) + (l.studyHours || 0) + (l.codingHours || 0) + (l.watchingHours || 0);
        });

        const userActivityMap = {};
        activities.forEach(a => {
            const uid = a.userId.toString();
            if (!userActivityMap[uid]) userActivityMap[uid] = { Study: 0, Coding: 0, Watching: 0 };
            userActivityMap[uid][a.type] = (userActivityMap[uid][a.type] || 0) + a.minutes;
        });

        const userTaskMap = {};
        tasks.forEach(t => {
            const uid = t.userId.toString();
            if (!userTaskMap[uid]) userTaskMap[uid] = { total: 0, completed: 0 };
            userTaskMap[uid].total++;
            if (t.status === 'completed') userTaskMap[uid].completed++;
        });

        const result = users.map(u => {
            const uid = u._id.toString();
            const act = userActivityMap[uid] || { Study: 0, Coding: 0, Watching: 0 };
            const tsk = userTaskMap[uid] || { total: 0, completed: 0 };
            return {
                _id: u._id,
                name: u.name,
                avatar: u.avatar,
                streak: u.streak || 0,
                studyHours: +(u.studyHours || 0).toFixed(2),
                codingHours: +(u.codingHours || 0).toFixed(2),
                watchingHours: +(u.watchingHours || 0).toFixed(2),
                totalTasks: tsk.total,
                completedTasks: tsk.completed,
                completionRate: tsk.total > 0 ? Math.round((tsk.completed / tsk.total) * 100) : 0,
            };
        }).sort((a, b) => b.studyHours - a.studyHours);

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/admin/analytics/activity — global activity distribution
router.get('/analytics/activity', protect, isAdmin, async (req, res) => {
    try {
        const aggregations = await Activity.aggregate([
            { $group: { _id: '$type', totalMinutes: { $sum: '$minutes' } } }
        ]);

        const summary = { Study: 0, Coding: 0, Watching: 0 };
        aggregations.forEach(item => {
            if (summary.hasOwnProperty(item._id)) {
                summary[item._id] = +(item.totalMinutes / 60).toFixed(2);
            }
        });

        res.json([
            { name: 'Study', hours: summary.Study },
            { name: 'Coding', hours: summary.Coding },
            { name: 'Watching', hours: summary.Watching },
        ]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/admin/analytics/weekly — weekly platform performance
router.get('/analytics/weekly', protect, isAdmin, async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const days = [];
        for (let i = 6; i >= 0; i--) {
            days.push(new Date(todayStart.getTime() - i * 86400000));
        }

        const since = days[0];
        const [tasks, studyLogs] = await Promise.all([
            Task.find({ createdAt: { $gte: since } }),
            StudyLog.find({ date: { $gte: since } }),
        ]);

        const result = days.map(day => {
            const dayEnd = new Date(day.getTime() + 86400000);
            const dayTasks = tasks.filter(t => {
                const td = new Date(t.createdAt);
                return td >= day && td < dayEnd;
            }).length;

            const studyHours = studyLogs
                .filter(l => { const ld = new Date(l.date); return ld >= day && ld < dayEnd; })
                .reduce((s, l) => s + (l.studyHours || 0) + (l.codingHours || 0) + (l.watchingHours || 0), 0);

            return {
                name: day.toLocaleDateString('en-US', { weekday: 'short' }),
                tasks: dayTasks,
                studyHours: +studyHours.toFixed(2),
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/admin/analytics/yearly — heatmap + growth data
router.get('/analytics/yearly', protect, isAdmin, async (req, res) => {
    try {
        const currentYear = new Date().getUTCFullYear();
        const now = new Date();
        const startOfYear = new Date(Date.UTC(currentYear, 0, 1));
        const endOfYear = new Date(Date.UTC(currentYear + 1, 0, 1));

        const studyLogs = await StudyLog.find({
            date: { $gte: startOfYear, $lt: endOfYear }
        });

        // Heatmap — daily totals
        const dayMap = {};
        studyLogs.forEach(l => {
            const ds = new Date(l.date).toISOString().split('T')[0];
            dayMap[ds] = (dayMap[ds] || 0) + (l.studyHours || 0) + (l.codingHours || 0) + (l.watchingHours || 0);
        });
        const heatmapData = Object.entries(dayMap).map(([date, count]) => ({
            date,
            count: +count.toFixed(2),
        }));

        // Daily — last 7 days
        const dailyStudy = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const ds = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
            const de = new Date(ds.getTime() + 86400000);
            const hrs = studyLogs
                .filter(l => { const ld = new Date(l.date); return ld >= ds && ld < de; })
                .reduce((s, l) => s + (l.studyHours || 0) + (l.codingHours || 0) + (l.watchingHours || 0), 0);
            dailyStudy.push({ name: ds.toLocaleDateString('en-US', { weekday: 'short' }), hours: +hrs.toFixed(2) });
        }

        // Monthly — 12 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyStudy = months.map((m, idx) => {
            const mStart = new Date(Date.UTC(currentYear, idx, 1));
            const mEnd = new Date(Date.UTC(currentYear, idx + 1, 1));
            const hrs = studyLogs
                .filter(l => { const ld = new Date(l.date); return ld >= mStart && ld < mEnd; })
                .reduce((s, l) => s + (l.studyHours || 0) + (l.codingHours || 0) + (l.watchingHours || 0), 0);
            return { name: m, hours: idx <= now.getUTCMonth() ? +hrs.toFixed(2) : null };
        });

        // Yearly — last 3 years (need broader query)
        const allLogs = await StudyLog.find();
        const yearlyStudy = [];
        for (let y = currentYear - 2; y <= currentYear; y++) {
            const yStart = new Date(Date.UTC(y, 0, 1));
            const yEnd = new Date(Date.UTC(y + 1, 0, 1));
            const hrs = allLogs
                .filter(l => { const ld = new Date(l.date); return ld >= yStart && ld < yEnd; })
                .reduce((s, l) => s + (l.studyHours || 0) + (l.codingHours || 0) + (l.watchingHours || 0), 0);
            yearlyStudy.push({ name: String(y), hours: +hrs.toFixed(2) });
        }

        res.json({
            heatmapData,
            dailyStudy,
            monthlyStudy,
            yearlyStudy,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;