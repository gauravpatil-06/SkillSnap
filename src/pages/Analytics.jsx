import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, CheckCircle2, Clock, Flame, BookOpen,
    Target, Zap, Award, Activity, FileText, FolderOpen,
    Brain, RefreshCw, ChevronUp, ChevronDown, Minus, Info,
    Calendar, Star, AlertCircle, Code, MonitorPlay,
    History as HistoryIcon, Search, Filter, ArrowUpDown
} from 'lucide-react';
import * as localDb from '../services/localDb';
import { format, parseISO, subDays, startOfMonth, startOfYear } from 'date-fns';
import { PageLoader } from '../components/ui/PageLoader';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';

/* ─── Constants ─── */
const TEAL = '#47C4B7';
const AMBER = '#f59e0b';
const INDIGO = '#6366f1';
const ROSE = '#f43f5e';
const PURPLE = '#8b5cf6';
const AMBER_ALT = '#fbbf24';
const PIE_COLORS = [TEAL, AMBER];
const BREAKDOWN_COLORS = { 'Study': TEAL, 'Coding': INDIGO, 'Watching': ROSE, 'Countdown': AMBER_ALT, 'Stopwatch': PURPLE };

/* ─── Helpers ─── */
const formatHMS = (hours) => {
    const s = Math.round((hours || 0) * 3600);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};
const formatMins = (h) => {
    const m = Math.round((h || 0) * 60);
    return m === 0 ? '—' : m < 60 ? `${m}m` : `${Math.floor(m / 60)}hrs ${m % 60}m`;
};
const formatAxis = (v) => {
    if (v === 0) return '0m';
    if (v < 1) return `${Math.round(v * 60)}m`;
    return `${v}h`;
};

const scoreLabel = (s) =>
    s >= 80 ? { text: 'Excellent 🏆', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' }
        : s >= 55 ? { text: 'Good 👍', color: 'text-[#47C4B7]', bg: 'bg-[#47C4B7]/10' }
            : { text: 'Keep Going 💪', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' };

/* ─── Sub-components ─── */
const cardBaseStyle = {
    transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease, border-color 0.28s ease',
};
const cardHoverStyle = {
    transform: 'scale(1.02) translateY(-4px)',
    boxShadow: '0 20px 40px -8px rgba(71,196,183,0.18), 0 8px 16px -4px rgba(71,196,183,0.1)',
    borderColor: 'rgba(71,196,183,0.5)',
};

const HoverCard = ({ children, className, style, delay, rKey, extraHover = {} }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <motion.div
            key={rKey}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
            className={className}
            style={{
                ...cardBaseStyle,
                ...(hovered ? { ...cardHoverStyle, ...extraHover } : {}),
                ...style,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {children}
        </motion.div>
    );
};

const Sk = ({ className }) => (
    <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl ${className}`} />
);

const CustomTooltip = ({ active, payload, label, isGrowthChart, summary, allMaterials }) => {
    if (!active) return null;

    const formatVal = (name, val) => {
        if (name === 'Hours' || name === 'Study Hours' || name === 'Total Study Hours') {
            const totalMinutes = Math.round(parseFloat(val) * 60);
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            return `${h}hrs ${m}m`;
        }
        return val;
    };

    if (active && payload && payload.length) {
        const data = payload[0].payload;
        if (isGrowthChart) {
            return (
                <div className="relative bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-lg shadow-xl drop-shadow-md min-w-[160px]">
                    {/* Message Bubble Tail at bottom-left corner */}
                    <div className="absolute w-3.5 h-3.5 bg-white dark:bg-gray-900 border-b border-l border-gray-300 dark:border-gray-600 transform -rotate-45 -bottom-[7.5px] left-2.5 rounded-bl-[2px] pointer-events-none"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-teal-700 dark:text-[#47C4B7] uppercase tracking-wider mb-2 border-b border-teal-700/20 dark:border-[#47C4B7]/20 pb-1.5">{label || data.label}</p>
                        <div className="space-y-2">
                            <p className="text-[13px] font-bold text-gray-900 dark:text-white flex items-center justify-between gap-4">
                                Total Tasks: <span className="text-teal-700 dark:text-[#47C4B7]">{data.tasks ?? 0}</span>
                            </p>
                            <p className="text-[13px] font-bold text-gray-900 dark:text-white flex items-center justify-between gap-4">
                                Total Study Hours: <span className="text-teal-700 dark:text-[#47C4B7]">{formatMins(data.hours ?? 0)}</span>
                            </p>
                            <p className="text-[13px] font-bold text-gray-900 dark:text-white flex items-center justify-between gap-4">
                                Total Study Materials: <span className="text-teal-700 dark:text-[#47C4B7]">{data.materials ?? 0}</span>
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
        if (payload.length > 1) {
            // Breakdown tooltip (stacked bars)
            return (
                <div className="relative bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-lg shadow-xl drop-shadow-md min-w-[150px]">
                    {/* Message Bubble Tail at bottom-left corner */}
                    <div className="absolute w-3.5 h-3.5 bg-white dark:bg-gray-900 border-b border-l border-gray-300 dark:border-gray-600 transform -rotate-45 -bottom-[7.5px] left-2.5 rounded-bl-[2px] pointer-events-none"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-teal-700 dark:text-[#47C4B7] uppercase tracking-wider mb-2 border-b border-teal-700/20 dark:border-[#47C4B7]/20 pb-1.5">{label}</p>
                        <div className="space-y-2">
                            {payload.map((p, idx) => (
                                <p key={idx} className="text-[11px] font-bold flex items-center justify-between gap-4" style={{ color: p.color }}>
                                    {p.name}: <span className="text-teal-700 dark:text-[#47C4B7]">{formatMins(p.value)}</span>
                                </p>
                            ))}
                            <p className="text-[13px] font-black text-gray-900 dark:text-white border-t border-teal-700/20 dark:border-[#47C4B7]/20 pt-2 mt-2 flex items-center justify-between gap-4">
                                Total: <span className="text-teal-700 dark:text-[#47C4B7]">{formatMins(data.hours)}</span>
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className="relative bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-3.5 py-2.5 rounded-lg shadow-xl drop-shadow-md min-w-[100px]">
                {/* Message Bubble Tail at bottom-left corner */}
                <div className="absolute w-3.5 h-3.5 bg-white dark:bg-gray-900 border-b border-l border-gray-300 dark:border-gray-600 transform -rotate-45 -bottom-[7.5px] left-2.5 rounded-bl-[2px] pointer-events-none"></div>
                <div className="relative z-10 flex flex-col">
                    <p className="text-[10px] font-black text-teal-700 dark:text-[#47C4B7] uppercase tracking-tight mb-2 border-b border-teal-700/20 dark:border-[#47C4B7]/20 pb-1.5">{label || data.name || data.label}</p>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] font-bold text-gray-900 dark:text-white capitalize">{payload[0].name?.replace('Total ', '')}:</span>
                        <span className="text-[11px] font-bold text-teal-700 dark:text-[#47C4B7]">{formatVal(payload[0].name, payload[0].value)}</span>
                    </div>
                </div>
            </div>
        );
    }
};

const EmptyChartState = ({ icon: Icon, title, message }) => (
    <div className="flex flex-col items-center justify-center h-[220px] text-center px-4">
        <div className="bg-gray-50/80 dark:bg-gray-800/50 p-3.5 rounded-2xl mb-3.5 border border-gray-200 dark:border-gray-700/50 shadow-sm">
            <Icon size={22} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
        </div>
        <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-[11px] font-medium text-gray-400 max-w-[220px] leading-relaxed">{message}</p>
    </div>
);

const StatCard = ({ icon: Icon, label, value, sub, color, trend, glow }) => {
    const palettes = {
        teal: { icon: 'bg-[#47C4B7]/10 text-[#47C4B7]', border: 'hover:border-[#47C4B7]', shadow: 'shadow-[#47C4B7]/5' },
        amber: { icon: 'bg-amber-50  dark:bg-amber-900/20  text-amber-500', border: 'hover:border-amber-400', shadow: 'shadow-amber-500/5' },
        red: { icon: 'bg-red-50    dark:bg-red-900/20    text-red-500', border: 'hover:border-red-400', shadow: 'shadow-red-500/5' },
        purple: { icon: 'bg-purple-50  dark:bg-purple-900/20 text-purple-500', border: 'hover:border-purple-400', shadow: 'shadow-purple-500/5' },
        blue: { icon: 'bg-blue-50   dark:bg-blue-900/20   text-blue-500', border: 'hover:border-blue-400', shadow: 'shadow-blue-500/5' },
        green: { icon: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600', border: 'hover:border-emerald-400', shadow: 'shadow-emerald-500/5' },
    };
    const p = palettes[color] || palettes.teal;
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 320 }}
            className={`glass-card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 sm:p-5 flex flex-col justify-end transition-all relative overflow-hidden group ${p.border} ${glow
                ? 'bg-gradient-to-br from-[#47C4B7]/10 to-emerald-500/10 border-2 border-[#47C4B7]/40 shadow-xl ' + p.shadow
                : 'shadow-sm'
                }`}
        >
            {glow && <div className="absolute -right-4 -top-4 opacity-10 blur-xl w-32 h-32 bg-[#47C4B7] rounded-full group-hover:opacity-20 transition-opacity pointer-events-none" />}

            <div className="flex items-center justify-between mb-auto">
                <div className={`p-3 rounded-2xl ${p.icon} group-hover:scale-110 transition-transform`}>
                    <Icon size={26} strokeWidth={2.5} />
                </div>
                {trend !== undefined && (
                    <span className={`text-[13px] font-bold flex items-center gap-0.5 px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : trend < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                        }`}>
                        {trend > 0 ? <ChevronUp size={14} /> : trend < 0 ? <ChevronDown size={14} /> : <Minus size={14} />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>

            <div className="mt-3">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">{value}</h3>
                <p className="text-[13px] sm:text-[15px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                {sub && <p className="text-[13px] font-medium text-gray-400 mt-1">{sub}</p>}
            </div>
        </motion.div>
    );
};

/* ─── Main Component ─── */
export const Analytics = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [weekly, setWeekly] = useState([]);
    const [recent, setRecent] = useState([]);
    const [activityStats, setActivityStats] = useState(null);
    const [yearlyStats, setYearlyStats] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [allMaterials, setAllMaterials] = useState([]);
    const [allActivities, setAllActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filters, setFilters] = useState({
        from: '',
        to: '',
        type: 'All',
        topic: '',
        timeFilter: '7d',
        sortBy: 'latest'
    });
    const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear());
    const [refreshKey, setRefreshKey] = useState(0);
    const [showGrowthTotals, setShowGrowthTotals] = useState(false);

    const getLocalDateStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // Global Search Helper
    const matchesSearch = useCallback((item, query) => {
        if (!query) return true;
        const q = query.toLowerCase();

        // 1. Extract and Normalize common fields
        const title = (item.title || item.name || '').toLowerCase();
        const topic = (item.topic || '').toLowerCase();
        const type = (item.type || '').toLowerCase();
        const method = (item.method || '').toLowerCase();
        const status = (item.status || '').toLowerCase();
        const desc = (item.description || item.notes || '').toLowerCase();

        // 2. Date Matching (Format dates into searchable strings)
        const itemDate = item.date || item.createdAt;
        let dateStr = '';
        if (itemDate) {
            const d = new Date(itemDate);
            try {
                // Create multiple searchable date formats: "Mar 08", "08/03", "Sunday", "2026-03-08"
                dateStr = `${format(d, 'MMM d yyyy')} ${format(d, 'EEEE')} ${format(d, 'yyyy-MM-dd')}`.toLowerCase();
            } catch (e) { dateStr = ''; }
        }

        // 3. Keyword Overrides
        if (q === 'study' && (type.includes('study') || method.includes('countdown') || method.includes('stopwatch'))) return true;
        if (q.includes('hrs') || q.includes('hour')) {
            if (item.minutes > 0) return true; // Match anything with time if searching for "hrs"
        }
        if (q === 'coding' && type.includes('coding')) return true;
        if (q === 'watching' && type.includes('watching')) return true;
        if (q === 'task' && !item.type) return true;

        // 4. Final multi-field check
        return title.includes(q) ||
            topic.includes(q) ||
            type.includes(q) ||
            method.includes(q) ||
            status.includes(q) ||
            desc.includes(q) ||
            dateStr.includes(q);
    }, []);

    const fetchData = useCallback((showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            else setLoading(true);

            if (!user) return;

            const activities = localDb.getActivities(user._id);
            const tasks = localDb.getTasks(user._id);
            const materials = localDb.getMaterials(user._id);

            setAllActivities(activities);
            setAllTasks(tasks);
            setAllMaterials(materials);

            // Build weekly data (last 90 days day-by-day)
            const now = new Date();
            const weeklyData = [];
            for (let i = 89; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                const dateStr = d.toISOString().slice(0, 10);
                const dStart = new Date(d); dStart.setHours(0, 0, 0, 0);
                const dEnd = new Date(d); dEnd.setHours(23, 59, 59, 999);

                const dayTasks = tasks.filter(t => {
                    const td = new Date(t.createdAt);
                    return td >= dStart && td <= dEnd;
                });
                const dayActs = activities.filter(a => {
                    const ad = new Date(a.createdAt);
                    return ad >= dStart && ad <= dEnd;
                });
                const studyHours = dayActs.reduce((acc, a) => acc + (a.minutes || 0) / 60, 0);

                weeklyData.push({
                    date: d.toISOString(),
                    label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    shortLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    totalTasks: dayTasks.length,
                    completedTasks: dayTasks.filter(t => t.status === 'completed').length,
                    studyHours,
                    isActive: dayTasks.length > 0 || studyHours > 0,
                });
            }
            setWeekly(weeklyData);
            setRecent(weeklyData.slice(-7));

            // Build summary object
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.status === 'completed').length;
            const pendingTasks = totalTasks - completedTasks;
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const totalStudyHours = activities.reduce((s, a) => s + (a.minutes || 0) / 60, 0);
            const todayStr = now.toISOString().slice(0, 10);
            const todayActs = activities.filter(a => (a.localDate || a.createdAt?.slice(0, 10)) === todayStr);
            const todayStudyHours = todayActs.reduce((s, a) => s + (a.minutes || 0) / 60, 0);

            // Compute streak from user
            const userObj = localDb.getCurrentUser();
            const streak = userObj?.currentStreak || 0;

            setSummary({
                totalTasks, completedTasks, pendingTasks, completionRate,
                totalStudyHours, todayStudyHours, streak,
            });

            // Activity type stats
            const typeStats = activities.reduce((acc, a) => {
                const key = a.type || 'Study';
                acc[key] = (acc[key] || 0) + (a.minutes || 0) / 60;
                return acc;
            }, {});
            setActivityStats(typeStats);

        } catch (e) {
            console.error('Analytics local fetch error:', e);
        } finally {
            setLoading(false);
            if (showRefresh) setTimeout(() => setRefreshing(false), 600);
        }
    }, [user]);

    useEffect(() => {
        if (user) fetchData();
    }, [fetchData, user]);

    const handleManualRefresh = async () => {
        setRefreshing(true);
        await fetchData(true);
        setRefreshKey(prev => prev + 1);
    };

    const totalCalculatedHours = useMemo(() => {
        let total = 0;
        const typeLabels = { 'study': true, 'coding': true, 'watching': true, 'countdown': true, 'stopwatch': true };
        allActivities.filter(a => matchesSearch(a, filters.topic)).forEach(a => {
            if (typeLabels[a.type?.toLowerCase()]) total += a.minutes / 60;
            if (typeLabels[a.method?.toLowerCase()]) total += a.minutes / 60;
        });
        return total;
    }, [allActivities, filters.topic, matchesSearch]);

    /* ─── Unified Dynamic Trend Logic ─── */
    const dynamicTrendData = useMemo(() => {
        let raw = [...weekly];
        const now = new Date();
        const startOf7d = subDays(now, 7);
        const startOfMonthVal = startOfMonth(now);
        const startOfYearVal = startOfYear(now);

        // 1. Time Boundaries
        let filtered = raw;
        if (filters.from || filters.to) {
            if (filters.from) filtered = filtered.filter(d => new Date(d.date) >= new Date(filters.from));
            if (filters.to) filtered = filtered.filter(d => new Date(d.date) <= new Date(filters.to + 'T23:59:59'));
        } else {
            if (filters.timeFilter === '7d') filtered = filtered.filter(d => new Date(d.date) >= startOf7d);
            else if (filters.timeFilter === 'monthly') filtered = filtered.filter(d => new Date(d.date) >= startOfMonthVal);
            else if (filters.timeFilter === 'yearly') filtered = filtered.filter(d => new Date(d.date) >= startOfYearVal);
        }

        // 2. Aggregation
        const currentMonthIdx = now.getMonth();
        const currentDay = now.getDate();

        const catMap = { 'study': 'Study', 'coding': 'Coding', 'watching': 'Watching', 'countdown': 'Countdown', 'stopwatch': 'Stopwatch' };

        let result = [];
        if (filters.timeFilter === 'monthly' && !filters.from && !filters.to) {
            const stats = [
                { label: 'Week 1', hours: 0, tasks: 0, materials: 0, Study: 0, Coding: 0, Watching: 0, Countdown: 0, Stopwatch: 0 },
                { label: 'Week 2', hours: 0, tasks: 0, materials: 0, Study: 0, Coding: 0, Watching: 0, Countdown: 0, Stopwatch: 0 },
                { label: 'Week 3', hours: 0, tasks: 0, materials: 0, Study: 0, Coding: 0, Watching: 0, Countdown: 0, Stopwatch: 0 },
                { label: 'Week 4', hours: 0, tasks: 0, materials: 0, Study: 0, Coding: 0, Watching: 0, Countdown: 0, Stopwatch: 0 }
            ];

            // 1. Weekly data (tasks/hours)
            allTasks.filter(t => matchesSearch(t, filters.topic)).forEach(d => {
                const date = new Date(d.createdAt);
                if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
                    const day = date.getDate();
                    let wIdx = day > 21 ? 3 : day > 14 ? 2 : day > 7 ? 1 : 0;
                    if (d.status === 'completed') stats[wIdx].tasks += 1;
                }
            });

            // 1b. Weekly hours calculation (Double counting formula)
            allActivities.filter(a => matchesSearch(a, filters.topic)).forEach(a => {
                const date = new Date(a.date);
                if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
                    const day = date.getDate();
                    let wIdx = day > 21 ? 3 : day > 14 ? 2 : day > 7 ? 1 : 0;
                    const hours = (a.minutes || 0) / 60;
                    const typeLabels = { 'study': true, 'coding': true, 'watching': true, 'countdown': true, 'stopwatch': true };
                    if (typeLabels[a.type?.toLowerCase()]) stats[wIdx].hours += hours;
                    if (typeLabels[a.method?.toLowerCase()]) stats[wIdx].hours += hours;
                }
            });

            // 2. Materials data
            allMaterials.filter(m => matchesSearch(m, filters.topic)).forEach(m => {
                const date = new Date(m.createdAt || m.date);
                if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
                    const day = date.getDate();
                    let wIdx = 0;
                    if (day > 21) wIdx = 3; else if (day > 14) wIdx = 2; else if (day > 7) wIdx = 1;
                    stats[wIdx].materials += 1;
                }
            });

            // 3. Breakdown data
            allActivities.filter(a => matchesSearch(a, filters.topic)).forEach(a => {
                const date = new Date(a.date);
                if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
                    const day = date.getDate();
                    let wIdx = 0;
                    if (day > 21) wIdx = 3; else if (day > 14) wIdx = 2; else if (day > 7) wIdx = 1;
                    const cat = catMap[a.type?.toLowerCase()] || catMap[a.method?.toLowerCase()];
                    if (cat) stats[wIdx][cat] += (a.minutes || 0) / 60;
                }
            });
            result = stats;
        } else if (filters.timeFilter === 'yearly' && !filters.from && !filters.to) {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const stats = [];
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                stats.push({
                    year: d.getFullYear(),
                    month: d.getMonth(),
                    label: months[d.getMonth()],
                    tasks: 0,
                    hours: 0,
                    materials: 0,
                    Study: 0, Coding: 0, Watching: 0, Countdown: 0, Stopwatch: 0
                });
            }

            allTasks.filter(t => matchesSearch(t, filters.topic)).forEach(d => {
                const date = new Date(d.createdAt);
                const entry = stats.find(s => s.year === date.getFullYear() && s.month === date.getMonth());
                if (entry && d.status === 'completed') {
                    entry.tasks += 1;
                }
            });

            // Aggregate yearly hours with formula
            allActivities.filter(a => matchesSearch(a, filters.topic)).forEach(a => {
                const date = new Date(a.date);
                const entry = stats.find(s => s.year === date.getFullYear() && s.month === date.getMonth());
                if (entry) {
                    const hours = (a.minutes || 0) / 60;
                    const typeLabels = { 'study': true, 'coding': true, 'watching': true, 'countdown': true, 'stopwatch': true };
                    if (typeLabels[a.type?.toLowerCase()]) entry.hours += hours;
                    if (typeLabels[a.method?.toLowerCase()]) entry.hours += hours;
                }
            });

            allMaterials.filter(m => matchesSearch(m, filters.topic)).forEach(m => {
                const date = new Date(m.createdAt || m.date);
                const entry = stats.find(s => s.year === date.getFullYear() && s.month === date.getMonth());
                if (entry) entry.materials += 1;
            });

            allActivities.filter(a => matchesSearch(a, filters.topic)).forEach(a => {
                const date = new Date(a.date);
                const entry = stats.find(s => s.year === date.getFullYear() && s.month === date.getMonth());
                if (entry) {
                    const cat = catMap[a.type?.toLowerCase()] || catMap[a.method?.toLowerCase()];
                    if (cat) entry[cat] += (a.minutes || 0) / 60;
                }
            });
            result = stats;
        } else {
            // Default: Day by Day
            result = filtered.map(d => {
                const dStart = new Date(d.date);
                dStart.setHours(0, 0, 0, 0);
                const dEnd = new Date(d.date);
                dEnd.setHours(23, 59, 59, 999);

                const dayTasksCount = allTasks.filter(t => {
                    const td = new Date(t.createdAt);
                    return td >= dStart && td <= dEnd && t.status === 'completed' && matchesSearch(t, filters.topic);
                }).length;

                const mats = allMaterials.filter(m => {
                    const md = new Date(m.createdAt || m.date);
                    return md >= dStart && md <= dEnd && matchesSearch(m, filters.topic);
                }).length;

                const catStats = { Study: 0, Coding: 0, Watching: 0, Countdown: 0, Stopwatch: 0 };
                let totalDailyHours = 0;
                const typeLabels = { 'study': true, 'coding': true, 'watching': true, 'countdown': true, 'stopwatch': true };

                allActivities.filter(a => {
                    const ad = new Date(a.date);
                    return ad >= dStart && ad <= dEnd && matchesSearch(a, filters.topic);
                }).forEach(a => {
                    const hours = (a.minutes || 0) / 60;
                    const catType = catMap[a.type?.toLowerCase()];
                    const catMethod = catMap[a.method?.toLowerCase()];

                    if (catType) catStats[catType] += hours;
                    if (catMethod) catStats[catMethod] += hours;

                    if (typeLabels[a.type?.toLowerCase()]) totalDailyHours += hours;
                    if (typeLabels[a.method?.toLowerCase()]) totalDailyHours += hours;
                });

                return {
                    label: d.label || d.shortLabel,
                    tasks: dayTasksCount,
                    hours: totalDailyHours,
                    materials: mats,
                    date: d.date,
                    ...catStats
                };
            });
        }

        if (filters.sortBy === 'latest') return [...result].reverse();
        return result;
    }, [weekly, filters, allTasks, allMaterials, allActivities, matchesSearch]);

    /* Dynamic Summary Metrics (Filtered) */
    const dynamicMetrics = useMemo(() => {
        if (!allTasks.length && !allActivities.length) return { completion: 0, activeDays: 0, streak: summary?.streak || 0 };

        const filteredTasks = allTasks.filter(t => matchesSearch(t, filters.topic));
        const completed = filteredTasks.filter(t => t.status === 'completed').length;
        const completion = filteredTasks.length > 0 ? Math.round((completed / filteredTasks.length) * 100) : 0;

        const activeDays = dynamicTrendData.filter(d => d.tasks > 0 || d.hours > 0).length;

        return {
            completion,
            activeDays,
            streak: filters.topic ? 0 : (summary?.streak || 0) // Streak is global, hide if searching specific topic
        };
    }, [allTasks, allActivities, filters.topic, matchesSearch, dynamicTrendData, summary]);

    /* Productivity Score (0-100) - Dynamic */
    const prodScore = useMemo(() => {
        const streakScore = Math.min(dynamicMetrics.streak * 5, 30);
        const completionScore = dynamicMetrics.completion * 0.4;
        const studyScore = Math.min(totalCalculatedHours * 10, 20);
        const activityScore = Math.min(dynamicMetrics.activeDays * (10 / 7), 10);
        return Math.min(Math.round(completionScore + streakScore + studyScore + activityScore), 100);
    }, [dynamicMetrics, totalCalculatedHours]);

    /* ─── Distribution Aggregations ─── */
    /* ─── Distribution Hooks (Filtered by Time) ─── */
    const taskByTopicData = useMemo(() => {
        const now = new Date();
        const limit = filters.timeFilter === '7d' ? subDays(now, 7) :
            filters.timeFilter === 'monthly' ? startOfMonth(now) :
                filters.timeFilter === 'yearly' ? startOfYear(now) : null;

        let filtered = allTasks;
        if (limit) filtered = allTasks.filter(t => new Date(t.createdAt) >= limit);
        if (filters.from) filtered = filtered.filter(t => new Date(t.createdAt) >= new Date(filters.from));
        if (filters.to) filtered = filtered.filter(t => new Date(t.createdAt) <= new Date(filters.to + 'T23:59:59'));

        // Apply Global Search
        filtered = filtered.filter(t => matchesSearch(t, filters.topic));

        const topics = {};
        filtered.forEach(t => {
            const topic = t.topic || 'General';
            topics[topic] = (topics[topic] || 0) + 1;
        });
        const res = Object.entries(topics).map(([name, value]) => ({ name, value }));
        return filters.sortBy === 'newest' ? res.reverse() : res;
    }, [allTasks, filters, matchesSearch]);

    const studyDistribution = useMemo(() => {
        const dist = { 'Study': 0, 'Coding': 0, 'Watching': 0, 'Countdown': 0, 'Stopwatch': 0 };
        const now = new Date();
        const start = filters.from ? new Date(filters.from) : (filters.timeFilter === '7d' ? subDays(now, 7) : filters.timeFilter === 'monthly' ? startOfMonth(now) : filters.timeFilter === 'yearly' ? startOfYear(now) : null);
        const end = filters.to ? new Date(filters.to + 'T23:59:59') : null;

        let filtered = allActivities;
        if (start) filtered = filtered.filter(a => new Date(a.date) >= start);
        if (end) filtered = filtered.filter(a => new Date(a.date) <= end);

        // Apply Global Search
        filtered = filtered.filter(a => matchesSearch(a, filters.topic));

        filtered.forEach(a => {
            const typeLabels = { 'study': 'Study', 'coding': 'Coding', 'watching': 'Watching', 'countdown': 'Countdown', 'stopwatch': 'Stopwatch' };
            const typeKey = a.type?.toLowerCase();
            const methodKey = a.method?.toLowerCase();
            if (typeLabels[typeKey]) dist[typeLabels[typeKey]] += a.minutes / 60;
            if (methodKey && typeLabels[methodKey]) dist[typeLabels[methodKey]] += a.minutes / 60;
        });
        const res = Object.entries(dist).map(([name, value]) => ({ name, value: +value.toFixed(1) }));
        return res;
    }, [allActivities, filters, matchesSearch]);

    const materialByTopicData = useMemo(() => {
        const now = new Date();
        const start = filters.from ? new Date(filters.from) : (filters.timeFilter === '7d' ? subDays(now, 7) : filters.timeFilter === 'monthly' ? startOfMonth(now) : filters.timeFilter === 'yearly' ? startOfYear(now) : null);
        const end = filters.to ? new Date(filters.to + 'T23:59:59') : null;

        let filtered = allMaterials;
        if (start) filtered = filtered.filter(m => new Date(m.createdAt) >= start);
        if (end) filtered = filtered.filter(m => new Date(m.createdAt) <= end);

        // Apply Global Search
        filtered = filtered.filter(m => matchesSearch(m, filters.topic));

        const topics = {};
        filtered.forEach(m => {
            const t = m.topic || 'General';
            topics[t] = (topics[t] || 0) + 1;
        });
        const res = Object.entries(topics).map(([name, value]) => ({ name, value }));
        return filters.sortBy === 'newest' ? res.reverse() : res;
    }, [allMaterials, filters, matchesSearch]);

    /* Client-side filtered data for Table (Fully Dynamic) */
    const filteredWeeklyTable = useMemo(() => {
        let data = [...weekly];
        const now = new Date();
        const startOf7d = subDays(now, 7);
        const startOfMonthVal = startOfMonth(now);
        const startOfYearVal = startOfYear(now);

        if (filters.from || filters.to) {
            if (filters.from) data = data.filter(d => new Date(d.date) >= new Date(filters.from));
            if (filters.to) data = data.filter(d => new Date(d.date) <= new Date(filters.to + 'T23:59:59'));
        } else {
            if (filters.timeFilter === '7d') data = data.filter(d => new Date(d.date) >= startOf7d);
            else if (filters.timeFilter === 'monthly') data = data.filter(d => new Date(d.date) >= startOfMonthVal);
            else if (filters.timeFilter === 'yearly') data = data.filter(d => new Date(d.date) >= startOfYearVal);
        }

        // Fully Dynamic Table Filter
        const tblResult = data.map(d => {
            const dStart = new Date(d.date); dStart.setHours(0, 0, 0, 0);
            const dEnd = new Date(d.date); dEnd.setHours(23, 59, 59, 999);

            const dayTasks = allTasks.filter(t => {
                const td = new Date(t.createdAt);
                return td >= dStart && td <= dEnd && matchesSearch(t, filters.topic);
            });
            const compTasks = dayTasks.filter(t => t.status === 'completed').length;

            const dayActs = allActivities.filter(a => {
                const ad = new Date(a.date);
                return ad >= dStart && ad <= dEnd && matchesSearch(a, filters.topic);
            });

            const hours = dayActs.reduce((acc, a) => {
                const h = (a.minutes || 0) / 60;
                const typeLabels = { 'study': true, 'coding': true, 'watching': true, 'countdown': true, 'stopwatch': true };
                let daily = 0;
                if (typeLabels[a.type?.toLowerCase()]) daily += h;
                if (typeLabels[a.method?.toLowerCase()]) daily += h;
                return acc + daily;
            }, 0);

            return {
                ...d,
                totalTasks: dayTasks.length,
                completedTasks: compTasks,
                studyHours: hours,
                isActive: dayTasks.length > 0 || hours > 0
            };
        });

        // Filter out empty rows if searching
        let filteredTbl = tblResult;
        if (filters.topic) filteredTbl = tblResult.filter(r => r.totalTasks > 0 || r.studyHours > 0);

        // Sort
        if (filters.sortBy === 'oldest') return [...filteredTbl].sort((a, b) => new Date(a.date) - new Date(b.date));
        return [...filteredTbl].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [weekly, filters, allTasks, allActivities, matchesSearch]);

    /* Smart Insights */
    const insights = useMemo(() => {
        if (!summary || !weekly.length) return [];
        const tips = [];
        const today = weekly[weekly.length - 1];
        const activeDays = weekly.filter(d => d.isActive).length;
        const avgStudy = weekly.reduce((a, b) => a + b.studyHours, 0) / 7;

        if (today?.completedTasks > 0)
            tips.push({ icon: '🎉', text: `You completed ${today.completedTasks} task(s) today — great momentum!`, c: 'emerald' });
        else
            tips.push({ icon: '📝', text: 'No tasks completed today. Start with a small one!', c: 'amber' });

        if (summary.streak >= 5)
            tips.push({ icon: '🔥', text: `${summary.streak}-day streak! You're on fire. Don't break it!`, c: 'amber' });
        else if (summary.streak === 0)
            tips.push({ icon: '💪', text: 'Start today to build your streak. Consistency is key!', c: 'blue' });

        if (summary.completionRate >= 80)
            tips.push({ icon: '🏆', text: `${summary.completionRate}% completion rate — outstanding performance!`, c: 'purple' });
        else if (summary.completionRate < 40 && summary.totalTasks > 0)
            tips.push({ icon: '⚡', text: 'Focus on finishing tasks you\'ve already started.', c: 'red' });

        if (summary.todayStudyHours === 0)
            tips.push({ icon: '⏱️', text: 'No study session today. Open a focus timer and start!', c: 'red' });
        else
            tips.push({ icon: '📚', text: `Already logged ${formatMins(summary.todayStudyHours)} of study today. Keep going!`, c: 'teal' });

        if (activeDays >= 6)
            tips.push({ icon: '📈', text: 'You\'ve been active 6+ days this week. Elite consistency!', c: 'teal' });

        return tips.slice(0, 4);
    }, [summary, weekly]);

    /* ── Full-year GitHub heatmap ── */
    const yearHeatmap = useMemo(() => {
        const startDate = new Date(heatmapYear, 0, 1);
        const endDate = new Date(heatmapYear, 11, 31);
        const logMap = {};
        allActivities.filter(a => matchesSearch(a, filters.topic)).forEach(a => {
            const k = new Date(a.date).toDateString();
            const hours = (a.minutes || 0) / 60;
            const typeLabels = { 'study': true, 'coding': true, 'watching': true, 'countdown': true, 'stopwatch': true };
            let dailyTotal = 0;
            if (typeLabels[a.type?.toLowerCase()]) dailyTotal += hours;
            if (typeLabels[a.method?.toLowerCase()]) dailyTotal += hours;
            logMap[k] = (logMap[k] || 0) + dailyTotal;
        });

        // Build weeks array
        const weeks = [];
        const baseDate = new Date(startDate);
        baseDate.setDate(baseDate.getDate() - baseDate.getDay());
        const cur = new Date(baseDate);

        while (cur <= endDate) {
            const week = [];
            for (let d = 0; d < 7; d++) {
                const day = new Date(cur);
                const inYear = day.getFullYear() === heatmapYear;
                const h = inYear ? (logMap[day.toDateString()] || 0) : -1;
                week.push({ date: new Date(day), hours: h, inYear });
                cur.setDate(cur.getDate() + 1);
            }
            weeks.push(week);
        }

        // Month labels (which week each month starts)
        const months = [];
        for (let m = 0; m < 12; m++) {
            const firstDay = new Date(heatmapYear, m, 1);
            // Precisely calculate which week column (0-indexed) the 1st of the month falls into
            const weekIdx = Math.floor((firstDay.getTime() - baseDate.getTime()) / (7 * 86400000));
            months.push({ label: firstDay.toLocaleDateString('en-US', { month: 'short' }), weekIdx });
        }

        return { weeks, months };
    }, [allActivities, heatmapYear, filters.topic, matchesSearch]);

    const heatColor = (h) => {
        if (h < 0) return 'bg-transparent';
        if (h === 0) return 'bg-gray-100 dark:bg-gray-800';
        if (h < 0.5) return 'bg-[#47C4B7]/30';
        if (h < 1) return 'bg-[#47C4B7]/55';
        if (h < 2) return 'bg-[#47C4B7]/80';
        return 'bg-[#47C4B7]';
    };

    const availableYears = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

    /* Pie data */
    const pieData = summary ? [
        { name: 'Completed', value: summary.completedTasks },
        { name: 'Pending', value: summary.pendingTasks },
    ].filter(d => d.value > 0) : [];

    /* Filter label */
    const filterOpts = [
        { id: '7d', label: 'Last 7 Days' },
        { id: 'monthly', label: 'Monthly' },
        { id: 'yearly', label: 'Yearly' }
    ];

    const badge = scoreLabel(prodScore);
    const fade = { hidden: { opacity: 0, y: 18 }, visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, type: 'spring', stiffness: 300 } }) };

    const hasTasks = useMemo(() => dynamicTrendData.some(d => (d.tasks || 0) > 0), [dynamicTrendData]);
    const hasHours = useMemo(() => dynamicTrendData.some(d => (d.hours || 0) > 0), [dynamicTrendData]);
    const hasMaterials = useMemo(() => dynamicTrendData.some(d => (d.materials || 0) > 0), [dynamicTrendData]);
    const hasAnyGrowth = hasTasks || hasHours || hasMaterials;

    // PageLoader handled by AppLayout transition

    const getFilterLabel = () => {
        if (filters.timeFilter === '7d') return 'Last 7 days';
        if (filters.timeFilter === '30d') return 'Last 30 days';
        if (filters.timeFilter === 'monthly') return 'This Month';
        if (filters.timeFilter === 'yearly') return 'This Year';
        return 'All Time';
    };

    return (
        <div className="space-y-3 pb-10 max-w-full px-0">

            {/* ── Header ── */}
            <PageHeader
                icon={Activity}
                title="Analytics"
                subtitle="Track all your performance — tasks, study hours, streaks & more"
                right={
                    <button onClick={handleManualRefresh} disabled={refreshing}
                        className="p-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-gray-500 hover:text-[#47C4B7] transition-all">
                        <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#47C4B7]' : ''} />
                    </button>
                }
            />

            {/* Filter Bar */}
            <div className="p-2 sm:p-0">
                <HoverCard
                    rKey={`filters-${refreshKey}`}
                    delay={0.1}
                    className="p-1 mb-0"
                    style={{ border: 'none', background: 'transparent', boxShadow: 'none', transform: 'none' }}
                >
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.05, delayChildren: 0.1 }
                            }
                        }}
                        className="flex flex-col gap-3 mb-0"
                    >
                        <motion.div
                            variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
                            className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4"
                        >
                            {/* Search */}
                            <div className="relative flex-1 group min-w-0">
                                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${refreshing ? 'text-[#47C4B7] animate-pulse' : 'text-gray-400'}`} size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by topic, type, tasks, description, date..."
                                    value={filters.topic}
                                    onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
                                    className="w-full pl-11 pr-4 py-2 sm:py-2.5 bg-transparent border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] text-[15px] text-gray-900 dark:text-white outline-none transition-all placeholder-gray-400 shadow-sm"
                                />
                            </div>

                            {/* Secondary Filters Container - 3 Separate Distinct Boxes */}
                            <div className="flex flex-row flex-nowrap items-center justify-start gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                                {/* Box 1: From Date */}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all whitespace-nowrap bg-transparent text-gray-500/80 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700">
                                    <input
                                        type={filters.from ? "date" : "text"}
                                        placeholder="DD-MM-YYYY"
                                        onFocus={(e) => (e.target.type = "date")}
                                        onBlur={(e) => !e.target.value && (e.target.type = "text")}
                                        value={filters.from}
                                        onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                                        className="bg-transparent border-none text-[11px] font-black focus:ring-0 p-0 w-[105px] text-gray-500/80 hover:text-gray-500 outline-none uppercase"
                                    />
                                </div>

                                {/* Box 2: To Date */}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all whitespace-nowrap bg-transparent text-gray-500/80 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700">
                                    <input
                                        type={filters.to ? "date" : "text"}
                                        placeholder="DD-MM-YYYY"
                                        onFocus={(e) => (e.target.type = "date")}
                                        onBlur={(e) => !e.target.value && (e.target.type = "text")}
                                        value={filters.to}
                                        onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                                        className="bg-transparent border-none text-[11px] font-black focus:ring-0 p-0 w-[105px] text-gray-500/80 hover:text-gray-500 outline-none uppercase"
                                    />
                                </div>

                                {/* Box 3: Sort */}
                                <button
                                    onClick={() => setFilters({ ...filters, sortBy: filters.sortBy === 'latest' ? 'oldest' : 'latest' })}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all whitespace-nowrap bg-transparent text-gray-500/80 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 min-w-[75px] justify-center"
                                >
                                    <ArrowUpDown size={11} className="text-[#47C4B7]" />
                                    {filters.sortBy === 'latest' ? 'Newest' : 'Oldest'}
                                </button>
                            </div>
                        </motion.div>

                        {/* Row: Time Pills */}
                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 5 }, visible: { opacity: 1, y: 0 } }}
                            className="flex items-center gap-2 flex-nowrap overflow-x-auto custom-scrollbar pb-2 md:pb-0"
                        >
                            {filterOpts.map(pill => (
                                <button
                                    key={pill.id}
                                    onClick={() => {
                                        if (pill.id === 'all') {
                                            setFilters({ from: '', to: '', type: 'All', topic: '', timeFilter: '7d', sortBy: 'latest' });
                                        } else setFilters({ ...filters, timeFilter: pill.id, from: '', to: '' });
                                    }}
                                    className={`px-4 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all whitespace-nowrap ${filters.timeFilter === pill.id
                                        ? 'bg-[#47C4B7] text-white shadow-lg shadow-[#47C4B7]/20 hover:scale-105 active:scale-95'
                                        : 'bg-transparent text-gray-500/80 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'
                                        }`}
                                >
                                    {pill.label}
                                </button>
                            ))}
                        </motion.div>
                    </motion.div>
                </HoverCard>
            </div>



            {/* Fine-tuned spacer for exact balance */}
            <div className="h-1 sm:h-3" />

            {/* ── Productivity Score Banner ── */}
            {!loading && (
                <HoverCard
                    rKey={`prod-banner-${refreshKey}`}
                    delay={0.05}
                    className="glass-card border-2 border-[#47C4B7]/20 dark:border-[#47C4B7]/30 bg-gradient-to-br from-[#47C4B7]/10 to-white/50 dark:from-[#47C4B7]/10 dark:to-gray-900/50 backdrop-blur-sm rounded-3xl py-2 sm:py-3 px-4 sm:px-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-6 shadow-xl relative overflow-hidden"
                >
                    {/* Circular Progress */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                            <circle
                                cx="50" cy="50" r="40" fill="none"
                                stroke={TEAL} strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 40}`}
                                strokeDashoffset={2 * Math.PI * 40 * (1 - prodScore / 100)}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex items-baseline">
                                <span className={`text-2xl sm:text-3xl font-bold ${badge.color} tracking-tight`}>{prodScore}</span>
                                <span className="text-[10px] sm:text-[13px] font-bold text-gray-400">/100</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                        <p className="text-[11px] font-bold text-gray-400 tracking-tight mb-0.5">Productivity Score</p>
                        <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">{badge.text}</p>
                        <div className="flex flex-row flex-nowrap items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar justify-start">
                            {[
                                { l: 'Completion', v: `${dynamicMetrics.completion}%`, c: 'text-[#47C4B7]' },
                                { l: 'Streak', v: `${dynamicMetrics.streak}d`, c: 'text-amber-500' },
                                { l: 'Study', v: formatMins(totalCalculatedHours), c: 'text-purple-500' },
                                { l: 'Active Days', v: `${dynamicMetrics.activeDays}/${filters.timeFilter === '7d' ? '7' : filters.timeFilter === 'monthly' ? '30' : '365'}`, c: 'text-blue-500' },
                            ].map(x => (
                                <span key={x.l} className="shrink-0 px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-[10px] sm:text-[13px] font-bold text-gray-500">
                                    {x.l}: <span className={`font-black ${x.c}`}>{x.v}</span>
                                </span>
                            ))}
                        </div>
                    </div>

                </HoverCard>
            )}

            {/* Removed the 8 Summary Cards as per user request */}

            {/* ── Grid of 6 Charts (3 Rows x 2 Cols) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <HoverCard rKey={`task-dist-${refreshKey}`} delay={0.1} className="glass-card bg-white/60 backdrop-blur-lg dark:bg-gray-900/30 border-2 border-gray-100/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 shrink-0">
                            <Target size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-[1.05rem] font-bold text-gray-900 dark:text-white tracking-tight">Tasks by Topic</h2>
                            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Distribution of tasks across different subjects</p>
                        </div>
                    </div>
                    {loading ? <Sk className="h-52" /> : hasTasks ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={dynamicTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={25} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} cursor={false} />
                                <Bar dataKey="tasks" name="Total Tasks" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChartState icon={Target} title="No tasks found" message="No completed tasks match your selected timeframe or search." />
                    )}
                </HoverCard>

                <HoverCard rKey={`task-trend-${refreshKey}`} delay={0.15} className="glass-card bg-white/60 backdrop-blur-lg dark:bg-gray-900/30 border-2 border-gray-100/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 shrink-0">
                            <Activity size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-[1.05rem] font-bold text-gray-900 dark:text-white tracking-tight">Task Completion Trend</h2>
                            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Daily progress and learning momentum</p>
                        </div>
                    </div>
                    {loading ? <Sk className="h-52" /> : hasTasks ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={dynamicTrendData}>
                                <defs>
                                    <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} axisLine={false} tickLine={false} padding={{ left: 20, right: 20 }} />
                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={25} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="tasks" name="Total Tasks" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#tg)" dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 0 }} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChartState icon={Activity} title="No task trends" message="No completed tasks match your selected timeframe or search." />
                    )}
                </HoverCard>

                {/* ROW 2: STUDY HOURS */}
                <HoverCard rKey={`study-dist-${refreshKey}`} delay={0.2} className="glass-card bg-white/60 backdrop-blur-lg dark:bg-gray-900/30 border-2 border-gray-100/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="p-2 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-500 shrink-0">
                            <Clock size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-[1.05rem] font-bold text-gray-900 dark:text-white tracking-tight">Study Hours Breakdown</h2>
                            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Distribution of time spent on study activities</p>
                        </div>
                    </div>
                    {loading ? <Sk className="h-52" /> : hasHours ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={dynamicTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={30} tickFormatter={formatAxis} />
                                <Tooltip content={<CustomTooltip />} cursor={false} />
                                <Bar dataKey="Study" name="Study" stackId="a" fill={BREAKDOWN_COLORS.Study} radius={[0, 0, 0, 0]} maxBarSize={20} isAnimationActive={false} />
                                <Bar dataKey="Coding" name="Coding" stackId="a" fill={BREAKDOWN_COLORS.Coding} radius={[0, 0, 0, 0]} maxBarSize={20} isAnimationActive={false} />
                                <Bar dataKey="Watching" name="Watching" stackId="a" fill={BREAKDOWN_COLORS.Watching} radius={[0, 0, 0, 0]} maxBarSize={20} isAnimationActive={false} />
                                <Bar dataKey="Countdown" name="Countdown" stackId="a" fill={BREAKDOWN_COLORS.Countdown} radius={[0, 0, 0, 0]} maxBarSize={20} isAnimationActive={false} />
                                <Bar dataKey="Stopwatch" name="Stopwatch" stackId="a" fill={BREAKDOWN_COLORS.Stopwatch} radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChartState icon={Clock} title="No study hours" message="No timed study sessions match your selected timeframe or search." />
                    )}
                </HoverCard>

                <HoverCard rKey={`study-trend-${refreshKey}`} delay={0.25} className="glass-card bg-white/60 backdrop-blur-lg dark:bg-gray-900/30 border-2 border-gray-100/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="p-2 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-500 shrink-0">
                            <Zap size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-[1.05rem] font-bold text-gray-900 dark:text-white tracking-tight">Study Hours Trend</h2>
                            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Daily progress and learning momentum</p>
                        </div>
                    </div>
                    {loading ? <Sk className="h-52" /> : hasHours ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={dynamicTrendData}>
                                <defs>
                                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={TEAL} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={TEAL} stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} axisLine={false} tickLine={false} padding={{ left: 20, right: 20 }} />
                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={30} tickFormatter={formatAxis} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="hours" name="Study Hours" stroke={TEAL} strokeWidth={2.5} fill="url(#sg)" dot={{ r: 3, fill: TEAL, strokeWidth: 0 }} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChartState icon={Zap} title="No study progress" message="No timed study sessions match your selected timeframe or search." />
                    )}
                </HoverCard>

                {/* ROW 3: STUDY MATERIALS */}
                <HoverCard rKey={`mat-dist-${refreshKey}`} delay={0.3} className="glass-card bg-white/60 backdrop-blur-lg dark:bg-gray-900/30 border-2 border-gray-100/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="p-2 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-500 shrink-0">
                            <BookOpen size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-[1.05rem] font-bold text-gray-900 dark:text-white tracking-tight">Materials by Topic</h2>
                            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Study resources organized by subject</p>
                        </div>
                    </div>
                    {loading ? <Sk className="h-52" /> : hasMaterials ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={dynamicTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={25} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} cursor={false} />
                                <Bar dataKey="materials" name="Study Materials" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChartState icon={BookOpen} title="No materials" message="No study resources found for your selected timeframe or search." />
                    )}
                </HoverCard>

                <HoverCard rKey={`mat-trend-${refreshKey}`} delay={0.35} className="glass-card bg-white/60 backdrop-blur-lg dark:bg-gray-900/30 border-2 border-gray-100/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="p-2 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-500 shrink-0">
                            <FileText size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-[1.05rem] font-bold text-gray-900 dark:text-white tracking-tight">Materials Added Trend</h2>
                            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Trend of newly added learning materials</p>
                        </div>
                    </div>
                    {loading ? <Sk className="h-52" /> : hasMaterials ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={dynamicTrendData}>
                                <defs>
                                    <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} axisLine={false} tickLine={false} padding={{ left: 20, right: 20 }} />
                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={25} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="materials" name="Study Materials" stroke="#f59e0b" strokeWidth={2.5} fill="url(#mg)" dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChartState icon={FileText} title="No materials" message="No study resources found for your selected timeframe or search." />
                    )}
                </HoverCard>

                {/* Yearly Analytics — Summary Indicator */}
                <HoverCard rKey={`yearly-summary-${refreshKey}`} delay={0.4} className="lg:col-span-2 glass-card bg-white dark:bg-gray-900/40 border-2 border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xl">
                    <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-2 mb-6">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-500 shrink-0">
                                <TrendingUp size={18} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-[1.05rem] font-bold text-gray-900 dark:text-white tracking-tight">Overall Growth Momentum</h2>
                                <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Tracking overall learning growth and study performance over time</p>
                            </div>
                        </div>

                        <AnimatePresence>
                            {showGrowthTotals && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Tasks</p>
                                            <p className="text-[15px] font-bold text-gray-900 dark:text-white">{summary?.completedTasks || 0}</p>
                                        </div>
                                        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-gray-700 pt-3 sm:pt-0 sm:pl-4">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Study Hours</p>
                                            <p className="text-[15px] font-bold text-[#47C4B7]">{formatMins(summary?.totalStudyHours || 0)}</p>
                                        </div>
                                        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-gray-700 pt-3 sm:pt-0 sm:pl-4">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Study Materials</p>
                                            <p className="text-[15px] font-bold text-amber-500">{allMaterials?.length || 0}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {hasAnyGrowth ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={dynamicTrendData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="yg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={TEAL} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={TEAL} stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} axisLine={false} tickLine={false} padding={{ left: 30, right: 30 }} />
                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={45} tickFormatter={formatAxis} />
                                <Tooltip content={<CustomTooltip isGrowthChart={true} summary={summary} allMaterials={allMaterials} />} />
                                <Area type="monotone" dataKey="hours" name="Study Hours" stroke={TEAL} strokeWidth={3} fill="url(#yg)" dot={{ r: 3, fill: TEAL, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5, strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[260px] flex items-center justify-center">
                            <EmptyChartState icon={TrendingUp} title="No growth data" message="No learning activity found matching your selected timeframe or search parameters." />
                        </div>
                    )}
                </HoverCard>
            </div>



            {/* ── Activity Heatmap ── */}
            < HoverCard
                rKey={`heatmap-${refreshKey}`}
                delay={0.1}
                className="glass-card bg-white dark:bg-gray-900/40 border-2 border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xl"
            >

                {/* Header */}
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 mb-3 sm:mb-6">
                    <div className="p-2 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-500 shrink-0 mt-1 sm:mt-0">
                        <Flame size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-3 items-start">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-[16px] sm:text-[1.05rem] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">Activity Heatmap</h2>
                                <p className="text-[11px] sm:text-[13px] font-medium text-gray-400 dark:text-gray-500 leading-snug mt-0.5 truncate sm:whitespace-normal">
                                    {yearHeatmap.weeks?.flat().filter(d => d.inYear && d.hours > 0).length || 0} active days in {heatmapYear} &mdash; darker = more study time
                                </p>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-2xl shrink-0 self-end sm:self-center sm:mt-0">
                                {availableYears.map(y => (
                                    <button key={y} onClick={() => setHeatmapYear(y)}
                                        className={`text-[10px] font-black px-2.5 py-1 rounded-xl transition-all ${y === heatmapYear
                                            ? 'bg-[#47C4B7] text-white shadow-lg shadow-[#47C4B7]/25'
                                            : 'text-gray-500 hover:text-[#47C4B7] dark:text-gray-400'
                                            }`}>{y}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? <Sk className="h-32" /> : (
                    /* overflow-x-auto: no scrollbar on laptop (cells fill 100%), slider on mobile */
                    <div className="overflow-x-auto">
                        {/* minWidth ensures mobile slider; width:100% fills laptop container */}
                        <div style={{ minWidth: 560, width: '100%' }}>

                            {/* Month labels — same flex structure as week columns to ensure perfect alignment */}
                            <div className="flex mb-1" style={{ paddingLeft: 28 }}>
                                {yearHeatmap.weeks?.map((_, wi) => {
                                    const monthMatch = yearHeatmap.months?.find(m => m.weekIdx === wi);
                                    return (
                                        <div key={wi} className="flex-1 min-w-0" style={{ marginRight: 2 }}>
                                            {monthMatch && (
                                                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                                    {monthMatch.label}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Grid: day-labels + week columns */}
                            <div className="flex">
                                {/* Day labels */}
                                <div className="flex flex-col flex-shrink-0" style={{ width: 28 }}>
                                    {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                                        <div key={i} className="text-[9px] font-bold text-gray-400 text-right pr-1"
                                            style={{ height: 12, marginBottom: 2, lineHeight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                {/* Week columns — flex-1 fills full width */}
                                {yearHeatmap.weeks?.map((week, wi) => (
                                    <div key={wi} className="flex flex-col flex-1" style={{ marginRight: 2 }}>
                                        {week.map((day, di) => {
                                            const mins = Math.round((day.hours || 0) * 60);
                                            const opacity = day.hours <= 0 ? 0
                                                : mins < 15 ? 0.22
                                                    : mins < 30 ? 0.40
                                                        : mins < 60 ? 0.60
                                                            : mins < 120 ? 0.80
                                                                : 1.00;
                                            return (
                                                <div key={di}
                                                    title={day.inYear
                                                        ? `${day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}: ${mins > 0 ? mins + ' min studied' : 'No activity'}`
                                                        : ''}
                                                    style={{
                                                        height: 12,
                                                        marginBottom: 2,
                                                        borderRadius: 2,
                                                        ...(day.inYear && day.hours > 0
                                                            ? { backgroundColor: `rgba(71,196,183,${opacity})` }
                                                            : {}),
                                                    }}
                                                    className={
                                                        !day.inYear ? ''
                                                            : day.hours <= 0 ? 'bg-gray-100 dark:bg-gray-800'
                                                                : 'cursor-pointer hover:opacity-75'
                                                    }
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-1.5 mt-3 justify-end">
                                <span className="text-[10px] font-bold text-gray-400">Less</span>
                                <div style={{ width: 11, height: 11, borderRadius: 2 }} className="bg-gray-100 dark:bg-gray-700" title="No activity" />
                                {[0.22, 0.40, 0.60, 0.80, 1.0].map((o, i) => (
                                    <div key={i} style={{ width: 11, height: 11, borderRadius: 2, backgroundColor: `rgba(71,196,183,${o})` }}
                                        title={['<15min', '15-30min', '30-60min', '1-2h', '>2h'][i]} />
                                ))}
                                <span className="text-[10px] font-bold text-gray-400">More</span>
                            </div>
                        </div>
                    </div>
                )}
            </HoverCard >

            {/* ── Weekly Performance Table ── */}
            <HoverCard
                rKey={`perf-table-${refreshKey}`}
                delay={0.15}
                className="glass-card bg-white dark:bg-gray-900/40 border-2 border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xl"
            >
                <div className="flex items-center gap-2.5 mb-6">
                    <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 shrink-0">
                        <Activity size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-[1.05rem] font-bold text-gray-900 dark:text-white tracking-tight">Detailed Performance Breakdown</h2>
                        <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">
                            {filters.from || filters.to ? 'Custom date range' : filters.timeFilter === '7d' ? 'Last 7 days' : filters.timeFilter === 'monthly' ? 'This month' : 'This year'} — day‑by‑day overview
                        </p>
                    </div>
                </div>
                {loading ? <Sk className="h-48" /> : (
                    <div className="overflow-x-auto rounded-2xl border border-gray-300 dark:border-white/20">
                        <table className="w-full text-left border-collapse min-w-[720px]">
                            <thead>
                                <tr className="bg-cyan-50/80 dark:bg-cyan-950/30">
                                    <th className="px-5 py-4 text-[15px] font-semibold text-gray-800 dark:text-gray-200 text-center border-b border-r border-gray-300 dark:border-white/20 whitespace-nowrap">Day</th>
                                    <th className="px-5 py-4 text-[15px] font-semibold text-gray-800 dark:text-gray-200 text-center border-b border-r border-gray-300 dark:border-white/20 whitespace-nowrap">Total Tasks</th>
                                    <th className="px-5 py-4 text-[15px] font-semibold text-gray-800 dark:text-gray-200 text-center border-b border-r border-gray-300 dark:border-white/20 whitespace-nowrap">Completed</th>
                                    <th className="px-5 py-4 text-[15px] font-semibold text-gray-800 dark:text-gray-200 text-center border-b border-r border-gray-300 dark:border-white/20 whitespace-nowrap">Study Time</th>
                                    <th className="px-5 py-4 text-[15px] font-semibold text-gray-800 dark:text-gray-200 text-center border-b border-r border-gray-300 dark:border-white/20 whitespace-nowrap">Rate</th>
                                    <th className="px-5 py-4 text-[15px] font-semibold text-gray-800 dark:text-gray-200 text-center border-b border-gray-300 dark:border-white/20 whitespace-nowrap">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWeeklyTable.map((day, i) => {
                                    const dayUTC = new Date(day.date).toISOString().slice(0, 10);
                                    const todayUTC = getLocalDateStr();
                                    const isToday = dayUTC === todayUTC;
                                    const rate = day.totalTasks > 0 ? Math.round((day.completedTasks / day.totalTasks) * 100) : 0;
                                    return (
                                        <motion.tr key={i}
                                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.55 + i * 0.04 }}
                                            className={`transition-colors ${isToday ? 'bg-cyan-50/30 dark:bg-cyan-900/10' : 'hover:bg-gray-50/50 dark:hover:bg-white/5'}`}>
                                            <td className="px-3 md:px-2.5 py-4 border-b border-r border-gray-300 dark:border-white/20 whitespace-nowrap min-w-[140px] md:min-w-[100px]">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="relative flex items-center justify-center">
                                                        <span className="font-semibold text-gray-800 dark:text-gray-200 text-[15px]">{day.shortLabel || day.label}</span>
                                                        {isToday && (
                                                            <span className="absolute left-full ml-1.5 text-[9px] font-semibold text-[#47C4B7] bg-[#47C4B7]/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                                TODAY
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-1">
                                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center border-b border-r border-gray-300 dark:border-white/20 whitespace-nowrap">
                                                <span className="text-[15px] font-semibold text-gray-700 dark:text-gray-300">{day.totalTasks}</span>
                                            </td>
                                            <td className="px-5 py-4 text-center border-b border-r border-gray-300 dark:border-white/20 whitespace-nowrap">
                                                <span className="text-[15px] font-semibold text-emerald-600 dark:text-emerald-400">{day.completedTasks}</span>
                                            </td>
                                            <td className="px-5 py-4 text-center border-b border-r border-gray-300 dark:border-white/20 whitespace-nowrap">
                                                <span className="text-[15px] font-semibold text-[#47C4B7]">{formatMins(day.studyHours)}</span>
                                            </td>
                                            <td className="px-5 py-4 text-center border-b border-r border-gray-300 dark:border-white/20 whitespace-nowrap">
                                                <div className="flex items-center gap-2 justify-center">
                                                    <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#47C4B7] rounded-full" style={{ width: `${rate}%` }} />
                                                    </div>
                                                    <span className="text-[15px] font-semibold text-gray-600 dark:text-gray-400">{rate}%</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center border-b border-gray-300 dark:border-white/20 whitespace-nowrap">
                                                {day.isActive ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/30">
                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="text-[15px] font-semibold text-gray-500 dark:text-gray-500">—</span>
                                                )}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </HoverCard>
        </div>
    );
};
