import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Search, Filter, ArrowUpDown, Clock, Brain,
    LayoutGrid, List, PieChart as PieIcon, TrendingUp,
    ChevronDown, ChevronUp, AlertCircle, Info, Zap, Target, Activity,
    BookOpen, Code, MonitorPlay, RefreshCw, History as HistoryIcon,
    Trash2, Pencil, ExternalLink
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
    BarChart, Bar, Legend
} from 'recharts';
import api from '../utils/api'; // kept for compatibility - unused
import * as localDb from '../services/localDb';
import { useAuth } from '../context/AuthContext';

import { format, parseISO, startOfDay, endOfDay, subDays, startOfMonth, startOfYear } from 'date-fns';
import { PageLoader } from '../components/ui/PageLoader';
import { PageHeader } from '../components/ui/PageHeader';
import toast from 'react-hot-toast';

/* ─── Constants ─── */
const TEAL = '#47C4B7';
const INDIGO = '#6366f1';
const ROSE = '#f43f5e';
const COLORS = [TEAL, INDIGO, ROSE, '#fbbf24', '#8b5cf6', '#06b6d4'];

/* ─── Helpers ─── */
const BREAKDOWN_COLORS = { 'Study': TEAL, 'Coding': INDIGO, 'Watching': ROSE, 'Countdown': '#fbbf24', 'Stopwatch': '#8b5cf6' };

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

/* ─────────────────────────────────────────────────────────────────
   HoverCard — Premium zoom + border effect
───────────────────────────────────────────────────────────────── */
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

const EmptyChartState = ({ icon: Icon, title, message }) => (
    <div className="flex flex-col items-center justify-center h-[220px] text-center px-4">
        <div className="bg-gray-50/80 dark:bg-gray-800/50 p-3.5 rounded-2xl mb-3.5 border border-gray-200 dark:border-gray-700/50 shadow-sm">
            <Icon size={22} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
        </div>
        <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-[11px] font-medium text-gray-400 max-w-[220px] leading-relaxed">{message}</p>
    </div>
);

export const History = () => {
    const { user } = useAuth();
    const [activities, setActivities] = useState([]);
    const [weekly, setWeekly] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Filters
    const [filters, setFilters] = useState({
        from: '',
        to: '',
        type: 'All',
        topic: '',
        timeFilter: '7d',
        sortBy: 'latest'
    });

    const fetchHistory = useCallback((isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            if (!user) return;

            const activities = localDb.getActivities(user._id);
            const tasks = localDb.getTasks(user._id);

            setActivities(activities);

            // Build weekly data (last 90 days)
            const now = new Date();
            const weeklyData = [];
            for (let i = 89; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                const dStart = new Date(d); dStart.setHours(0, 0, 0, 0);
                const dEnd = new Date(d); dEnd.setHours(23, 59, 59, 999);

                const dayTasks = tasks.filter(t => {
                    const td = new Date(t.dueDate || t.createdAt);
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
                    totalTasks: dayTasks.length,
                    completedTasks: dayTasks.filter(t => t.status === 'completed').length,
                    studyHours,
                    isActive: dayTasks.length > 0 || studyHours > 0,
                });
            }
            setWeekly(weeklyData);

            // Build summary
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.status === 'completed').length;
            const totalStudyHours = activities.reduce((s, a) => s + (a.minutes || 0) / 60, 0);
            setSummary({ totalTasks, completedTasks, totalStudyHours });
        } catch (err) {
            console.error('History local fetch error:', err);
        } finally {
            setLoading(false);
            if (isRefresh) setTimeout(() => setRefreshing(false), 600);
        }
    }, [user, filters]);

    const handleRefresh = async () => {
        setRefreshing(true);
        // Reset filters to refresh search bar and all views
        setFilters({
            from: '',
            to: '',
            type: 'All',
            topic: '',
            timeFilter: '7d',
            sortBy: 'latest'
        });
        await fetchHistory(true);
        setRefreshKey(prev => prev + 1);
    };

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Activity Category Distribution (Study + Coding + Watching + Countdown + Stopwatch)
    const activityDistribution = useMemo(() => {
        const dist = { 'Study': 0, 'Coding': 0, 'Watching': 0, 'Countdown': 0, 'Stopwatch': 0 };
        activities.forEach(a => {
            const typeLabels = { 'study': 'Study', 'coding': 'Coding', 'watching': 'Watching', 'countdown': 'Countdown', 'stopwatch': 'Stopwatch' };
            const typeKey = a.type?.toLowerCase();
            const methodKey = a.method?.toLowerCase();
            if (typeLabels[typeKey]) dist[typeLabels[typeKey]] += a.minutes / 60;
            if (methodKey && typeLabels[methodKey]) dist[typeLabels[methodKey]] += a.minutes / 60;
        });

        return Object.entries(dist)
            .filter(([_, value]) => value > 0)
            .map(([name, value]) => ({
                name,
                value: +value.toFixed(1),
                color: BREAKDOWN_COLORS[name] || TEAL
            }));
    }, [activities]);

    // Dynamic Stats for Charts — Calculated from Filtered Activities for Accuracy
    const derivedPeriodStats = useMemo(() => {
        const stats = [];
        const now = new Date();

        // 1. Prepare buckets based on time filter
        if (filters.timeFilter === '7d') {
            for (let i = 0; i < 7; i++) {
                const d = subDays(now, i);
                stats.unshift({
                    date: startOfDay(d),
                    label: format(d, 'EEE'),
                    hours: 0,
                    completedTasks: 0,
                    totalTasks: 0,
                    totalMaterials: 0
                });
            }
        } else if (filters.timeFilter === 'monthly') {
            for (let i = 1; i <= 4; i++) {
                stats.push({ label: `Week ${i}`, hours: 0, completedTasks: 0, totalTasks: 0, totalMaterials: 0, weekIdx: i });
            }
        } else if (filters.timeFilter === 'custom' && filters.from && filters.to) {
            // Pick a reasonable layout for custom (e.g., list all days if range < 14, else months)
            const d1 = new Date(filters.from);
            const d2 = new Date(filters.to);
            const diff = Math.ceil((d2 - d1) / (24 * 60 * 60 * 1000));
            if (diff <= 14) {
                for (let i = 0; i <= diff; i++) {
                    const d = new Date(d1); d.setDate(d.getDate() + i);
                    stats.push({ date: startOfDay(d), label: format(d, 'MMM d'), hours: 0, completedTasks: 0, totalTasks: 0, totalMaterials: 0 });
                }
            } else {
                // Default to month grouping for large ranges
                const startM = d1.getMonth(); const startY = d1.getFullYear();
                const endM = d2.getMonth(); const endY = d2.getFullYear();
                let currM = startM; let currY = startY;
                const monthsNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                while (currY < endY || (currY === endY && currM <= endM)) {
                    stats.push({ year: currY, month: currM, label: monthsNames[currM], hours: 0, completedTasks: 0, totalTasks: 0, totalMaterials: 0 });
                    currM++; if (currM > 11) { currM = 0; currY++; }
                }
            }
        } else {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const periodMonths = filters.timeFilter === 'yearly' ? 12 : 6;
            for (let i = periodMonths - 1; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                stats.push({
                    year: d.getFullYear(),
                    month: d.getMonth(),
                    label: months[d.getMonth()],
                    hours: 0,
                    completedTasks: 0,
                    totalTasks: 0,
                    totalMaterials: 0
                });
            }
        }

        // 2. Aggregate from activities (Hours)
        activities.forEach(a => {
            const ad = new Date(a.date);
            const hours = (a.minutes || 0) / 60;

            let entry = null;
            if (filters.timeFilter === '7d') {
                entry = stats.find(s => startOfDay(s.date).getTime() === startOfDay(ad).getTime());
            } else if (filters.timeFilter === 'monthly') {
                if (ad.getMonth() === now.getMonth() && ad.getFullYear() === now.getFullYear()) {
                    const day = ad.getDate();
                    let wIdx = day > 21 ? 4 : day > 14 ? 3 : day > 7 ? 2 : 1;
                    entry = stats[wIdx - 1];
                }
            } else if (filters.timeFilter === 'custom') {
                entry = stats.find(s => s.date ? (startOfDay(s.date).getTime() === startOfDay(ad).getTime()) : (s.year === ad.getUTCFullYear() && s.month === ad.getUTCMonth()));
            } else {
                entry = stats.find(s => s.year === ad.getUTCFullYear() && s.month === ad.getUTCMonth());
            }

            if (entry) {
                const typeLabels = { 'study': true, 'coding': true, 'watching': true, 'countdown': true, 'stopwatch': true };
                if (typeLabels[a.type?.toLowerCase()]) entry.hours += hours;
                if (typeLabels[a.method?.toLowerCase()]) entry.hours += hours;
            }
        });

        // 3. Aggregate Task/Material counts from "weekly" backend data (as activity array doesn't have tasks)
        weekly.forEach(d => {
            const dd = new Date(d.date);
            let entry = null;
            if (filters.timeFilter === '7d') {
                entry = stats.find(s => startOfDay(s.date).getTime() === startOfDay(dd).getTime());
            } else if (filters.timeFilter === 'monthly') {
                if (dd.getMonth() === now.getMonth() && dd.getFullYear() === now.getFullYear()) {
                    const day = dd.getDate();
                    let wIdx = day > 21 ? 4 : day > 14 ? 3 : day > 7 ? 2 : 1;
                    entry = stats[wIdx - 1];
                }
            } else if (filters.timeFilter === 'custom') {
                entry = stats.find(s => s.date ? (startOfDay(s.date).getTime() === startOfDay(dd).getTime()) : (s.year === dd.getUTCFullYear() && s.month === dd.getUTCMonth()));
            } else {
                entry = stats.find(s => s.year === dd.getUTCFullYear() && s.month === dd.getUTCMonth());
            }

            if (entry) {
                entry.completedTasks += d.completedTasks || 0;
                entry.totalTasks += d.totalTasks || 0;
                entry.totalMaterials += d.totalMaterials || 0;
            }
        });

        const finalStats = stats.map(s => ({
            ...s,
            hours: +s.hours.toFixed(1),
            completedTasks: Math.round(s.completedTasks),
            totalTasks: Math.round(s.totalTasks),
            totalMaterials: Math.round(s.totalMaterials || 0)
        }));

        return filters.sortBy === 'latest' ? [...finalStats].reverse() : finalStats;
    }, [activities, weekly, filters.timeFilter, filters.sortBy]);



    const formatTime = (h) => {
        const m = Math.round((h || 0) * 60);
        if (m === 0) return '0m';
        const hrs = Math.floor(m / 60);
        const mins = m % 60;
        if (hrs === 0) return `${mins}m`;
        return `${hrs}hrs ${mins}m`;
    };

    const hasTopicData = activityDistribution.length > 0;
    const hasPeriodicData = useMemo(() => derivedPeriodStats.some(d => (d.hours || 0) > 0 || (d.completedTasks || 0) > 0 || (d.totalTasks || 0) > 0), [derivedPeriodStats]);

    return (
        <div className="space-y-3 pb-10 max-w-full px-0">



            <PageHeader
                icon={HistoryIcon}
                title="Activity History"
                subtitle="Premium historical view of your entire learning journey"
                right={
                    <button
                        onClick={handleRefresh}
                        className={`shrink-0 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-500 hover:text-[#47C4B7] transition-all hover:shadow-md ${refreshing ? 'animate-spin cursor-not-allowed opacity-50' : ''}`}
                        title="Refresh Data"
                        disabled={refreshing}
                    >
                        <RefreshCw size={16} />
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
                        {/* Primary Filter Row: Search + Secondary Filters */}
                        <motion.div
                            variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
                            className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4"
                        >
                            {/* Search */}
                            <div className="relative flex-1 group">
                                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${refreshing ? 'text-[#47C4B7] animate-pulse' : 'text-gray-400'}`} size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by topic..."
                                    value={filters.topic}
                                    onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
                                    className="w-full pl-11 pr-4 py-2 sm:py-2.5 bg-transparent border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] text-[15px] text-gray-900 dark:text-white outline-none transition-all placeholder-gray-400 shadow-sm"
                                />
                            </div>

                            {/* Secondary Filters Container - 3 Separate Distinct Boxes */}
                            <div className="flex flex-row flex-nowrap items-center justify-start gap-2 w-full lg:w-auto overflow-x-auto custom-scrollbar pb-2 lg:pb-0">
                                {/* Box 1: From Date */}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all whitespace-nowrap bg-transparent text-gray-500/80 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700">
                                    <input
                                        type={filters.from ? "date" : "text"}
                                        placeholder="DD-MM-YYYY"
                                        onFocus={(e) => (e.target.type = "date")}
                                        onBlur={(e) => !e.target.value && (e.target.type = "text")}
                                        value={filters.from}
                                        onChange={(e) => setFilters({ ...filters, from: e.target.value, timeFilter: 'custom' })}
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
                                        onChange={(e) => setFilters({ ...filters, to: e.target.value, timeFilter: 'custom' })}
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
                            className="flex items-center gap-2 flex-nowrap overflow-x-auto custom-scrollbar pb-2 lg:pb-0"
                        >
                            {[
                                { id: '7d', label: 'Last 7 Days' },
                                { id: 'monthly', label: 'Monthly' },
                                { id: 'yearly', label: 'Yearly' }
                            ].map(pill => (
                                <button
                                    key={pill.id}
                                    onClick={() => {
                                        setFilters({ ...filters, timeFilter: pill.id, from: '', to: '' });
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

            {/* Fine-tuned spacer for exact balance (Match Analytics) */}
            <div className="h-1 sm:h-3" />

            {/* ── Analytics Insights Section ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Topic Distribution */}
                <HoverCard
                    rKey={`pie-${refreshKey}`}
                    delay={0.15}
                    className="glass-card bg-white dark:bg-gray-900/40 border-2 border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xl"
                >
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 shrink-0">
                            <Target size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-[1.05rem] font-bold text-gray-900 dark:text-white tracking-tight">Topic Distribution</h3>
                            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Time spent per category</p>
                        </div>
                    </div>
                    {hasTopicData ? (
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={activityDistribution} innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value">
                                        {activityDistribution.map((entry, i) => <Cell key={i} fill={entry.color} border="none" />)}
                                    </Pie>
                                    <Tooltip content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const data = payload[0];
                                        return (
                                            <div className="relative bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-lg shadow-xl drop-shadow-md min-w-[140px]">
                                                {/* Message Bubble Tail at bottom-left corner */}
                                                <div className="absolute w-3.5 h-3.5 bg-white dark:bg-gray-900 border-b border-l border-gray-300 dark:border-gray-600 transform -rotate-45 -bottom-[7.5px] left-2.5 rounded-bl-[2px] pointer-events-none"></div>
                                                <div className="relative z-10">
                                                    <p className="text-[10px] font-black text-teal-700 dark:text-[#47C4B7] uppercase tracking-wider mb-2 border-b border-teal-700/20 dark:border-[#47C4B7]/20 pb-1.5">Category</p>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <p className="text-[11px] font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload?.color || data.color }}></span>
                                                            <span className="capitalize">{data.name}:</span>
                                                        </p>
                                                        <span className="text-[11px] font-bold text-teal-700 dark:text-[#47C4B7]">
                                                            {formatMins(data.value)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center">
                            <EmptyChartState icon={Target} title="No data found" message={filters.timeFilter === 'custom' ? "No activity found for these specific dates." : "No tasks or materials match your selected timeframe or search."} />
                        </div>
                    )}
                </HoverCard>

                {/* 2. Periodic Performance Breakdown */}
                <HoverCard
                    rKey={`periodic-${refreshKey}`}
                    delay={0.2}
                    className="glass-card bg-white dark:bg-gray-900/40 border-2 border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xl"
                >
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 shrink-0">
                            <Activity size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-[1.05rem] font-bold text-gray-900 dark:text-white tracking-tight">Activity Breakdown</h3>
                            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Daily task and hour analysis</p>
                        </div>
                    </div>
                    {hasPeriodicData ? (
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={derivedPeriodStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;
                                        const data = payload[0].payload;
                                        return (
                                            <div className="relative bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-lg shadow-xl drop-shadow-md min-w-[160px]">
                                                {/* Message Bubble Tail at bottom-left corner */}
                                                <div className="absolute w-3.5 h-3.5 bg-white dark:bg-gray-900 border-b border-l border-gray-300 dark:border-gray-600 transform -rotate-45 -bottom-[7.5px] left-2.5 rounded-bl-[2px] pointer-events-none"></div>
                                                <div className="relative z-10">
                                                    <p className="text-[10px] font-black text-teal-700 dark:text-[#47C4B7] uppercase tracking-wider mb-2 border-b border-teal-700/20 dark:border-[#47C4B7]/20 pb-1.5">{label}</p>
                                                    <div className="space-y-2">
                                                        <p className="text-[11px] font-bold text-gray-900 dark:text-white flex items-center justify-between gap-4">
                                                            Total Tasks: <span className="text-teal-700 dark:text-[#47C4B7]">{data.totalTasks || 0}</span>
                                                        </p>
                                                        <p className="text-[11px] font-bold text-gray-900 dark:text-white flex items-center justify-between gap-4">
                                                            Completed: <span className="text-teal-700 dark:text-[#47C4B7]">{data.completedTasks || 0}</span>
                                                        </p>
                                                        <p className="text-[11px] font-bold text-gray-900 dark:text-white flex items-center justify-between gap-4">
                                                            Study Materials: <span className="text-teal-700 dark:text-[#47C4B7]">{data.totalMaterials || 0}</span>
                                                        </p>
                                                        <p className="text-[11px] font-bold text-gray-900 dark:text-white flex items-center justify-between gap-4">
                                                            Total Study Hours: <span className="text-teal-700 dark:text-[#47C4B7]">{formatTime(data.hours || 0)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }} />
                                    <Bar dataKey="totalTasks" fill="#e2e8f0" radius={[4, 4, 0, 0]} maxBarSize={12} isAnimationActive={false} />
                                    <Bar dataKey="completedTasks" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={12} isAnimationActive={false} />
                                    <Bar dataKey="hours" fill={TEAL} radius={[4, 4, 0, 0]} maxBarSize={12} isAnimationActive={false} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center">
                            <EmptyChartState icon={Activity} title="No data found" message={filters.timeFilter === 'custom' ? "No breakdown available for the selected date range." : "No activity found matching your selected timeframe or search parameters."} />
                        </div>
                    )}
                </HoverCard>

                {/* 3. Growth Momentum (Full Width) */}
                <HoverCard
                    rKey={`yearly-trend-${refreshKey}`}
                    delay={0.25}
                    className="lg:col-span-2 glass-card bg-white dark:bg-gray-900/40 border-2 border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xl"
                >
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="p-2 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-500 shrink-0">
                            <TrendingUp size={18} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-row items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-[1.05rem] font-bold text-gray-900 dark:text-white tracking-tight">
                                        {filters.timeFilter === 'yearly' ? 'Yearly Growth' :
                                            filters.timeFilter === 'monthly' ? 'Monthly Growth' :
                                                'Last 7 Days'} Momentum
                                    </h3>
                                    <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Overall learning trend and consistency</p>
                                </div>

                            </div>
                        </div>
                    </div>
                    {hasPeriodicData ? (
                        <div className="h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={derivedPeriodStats} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={TEAL} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} axisLine={false} tickLine={false} padding={{ left: 30, right: 30 }} />
                                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={45} tickFormatter={formatAxis} />
                                    <Tooltip content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;
                                        const data = payload[0].payload;
                                        return (
                                            <div className="relative bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-lg shadow-xl drop-shadow-md min-w-[160px]">
                                                {/* Message Bubble Tail at bottom-left corner */}
                                                <div className="absolute w-3.5 h-3.5 bg-white dark:bg-gray-900 border-b border-l border-gray-300 dark:border-gray-600 transform -rotate-45 -bottom-[7.5px] left-2.5 rounded-bl-[2px] pointer-events-none"></div>
                                                <div className="relative z-10">
                                                    <p className="text-[10px] font-black text-teal-700 dark:text-[#47C4B7] uppercase tracking-wider mb-2 border-b border-teal-700/20 dark:border-[#47C4B7]/20 pb-1.5">{label}</p>
                                                    <div className="space-y-2">
                                                        <p className="text-[11px] font-bold text-gray-900 dark:text-white flex items-center justify-between gap-4">
                                                            Total Tasks: <span className="text-teal-700 dark:text-[#47C4B7]">{data.totalTasks || 0}</span>
                                                        </p>
                                                        <p className="text-[11px] font-bold text-gray-900 dark:text-white flex items-center justify-between gap-4">
                                                            Completed: <span className="text-teal-700 dark:text-[#47C4B7]">{data.completedTasks || 0}</span>
                                                        </p>
                                                        <p className="text-[11px] font-bold text-gray-900 dark:text-white flex items-center justify-between gap-4">
                                                            Study Materials: <span className="text-teal-700 dark:text-[#47C4B7]">{data.totalMaterials || 0}</span>
                                                        </p>
                                                        <p className="text-[11px] font-bold text-gray-900 dark:text-white flex items-center justify-between gap-4">
                                                            Total Study Hours: <span className="text-teal-700 dark:text-[#47C4B7]">{formatTime(data.hours || 0)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }} />
                                    <Area type="monotone" dataKey="hours" stroke={TEAL} strokeWidth={3} fill="url(#areaGradient)" dot={{ r: 3, fill: TEAL, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[260px] flex items-center justify-center">
                            <EmptyChartState icon={TrendingUp} title="No data found" message={filters.timeFilter === 'custom' ? "Try checking a different date range for momentum." : "No learning activity found matching your selected timeframe or search parameters."} />
                        </div>
                    )}
                </HoverCard>
            </div>


        </div>
    );
};
