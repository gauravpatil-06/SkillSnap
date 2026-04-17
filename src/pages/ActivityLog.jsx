import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Trash2, BookOpen, Code2, Tv, Clock, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useActivities } from '../context/ActivityContext';
import toast from 'react-hot-toast';
import { PageLoader } from '../components/ui/PageLoader';
import { PageHeader } from '../components/ui/PageHeader';
import { format, parseISO, startOfDay, endOfDay, subDays, startOfMonth, startOfYear } from 'date-fns';


/* ── helpers ── */
const TYPE_META = {
    Study: { emoji: '📖', icon: BookOpen, color: '#47C4B7', bg: 'bg-[#47C4B7]/10 text-[#47C4B7]', border: 'border-[#47C4B7]/30' },
    Coding: { emoji: '💻', icon: Code2, color: '#a855f7', bg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400', border: 'border-purple-300/40' },
    Watching: { emoji: '🎬', icon: Tv, color: '#f59e0b', bg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400', border: 'border-amber-300/40' },
};

const formatMins = (mins) => {
    if (!mins) return '0 m';
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    if (h > 0 && m > 0) return `${h} hrs ${m} m`;
    if (h > 0) return `${h} hrs`;
    return `${m} m`;
};

const formatDisplayTime = (decimalHours) => {
    const totalMinutes = Math.round(parseFloat(decimalHours || 0) * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) return `${hours} hrs ${minutes} m`;
    if (hours > 0) return `${hours} hrs`;
    return `${minutes} m`;
};

const parseLocalDate = (isoStr) => {
    // Parse as UTC-stored date (YYYY-MM-DDT00:00:00Z) → show in local calendar format
    const d = new Date(isoStr);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

const formatGroupDate = (localDate) =>
    localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

/* ─────────────────────────────────────────────────────────────────
   Inline styles for the zoom + border hover effect on cards
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

export const ActivityLog = () => {
    const { activities, isLoading: globalLoading, fetchActivities, deleteActivity } = useActivities();
    const [refreshing, setRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [filters, setFilters] = useState({
        searchTerm: '',
        from: '',
        to: '',
        timeFilter: 'all'
    });
    const [deletingActivityId, setDeletingActivityId] = useState(null);

    const handleRefresh = async () => {
        setRefreshing(true);
        setFilters({ searchTerm: '', from: '', to: '', timeFilter: 'all' });
        try {
            await fetchActivities();
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error(err);
        } finally {
            setTimeout(() => setRefreshing(false), 600);
        }
    };

    // Auto-refresh whenever user navigates back to this page or switches tab
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') fetchActivities();
        };
        const onFocus = () => fetchActivities();
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('focus', onFocus);
        return () => {
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('focus', onFocus);
        };
    }, [fetchActivities]);

    const handleConfirmDeleteActivity = async () => {
        if (!deletingActivityId) return;
        try {
            await deleteActivity(deletingActivityId);
            toast.success('Activity deleted');
            setDeletingActivityId(null);
        } catch {
            toast.error('Failed to delete activity');
        }
    };

    /* Filter activities based on searchTerm and time filters */
    const filteredActivities = useMemo(() => {
        const searchLower = filters.searchTerm.toLowerCase();
        return activities.filter(a => {
            const localDate = parseLocalDate(a.date);
            const dateStr = formatGroupDate(localDate).toLowerCase();
            const sessionTitle = `${a.method && a.method !== 'Manual' ? a.method : a.type} Session`.toLowerCase();
            const timeStr = formatMins(a.minutes).toLowerCase();

            // Text match
            const textMatch = (a.topic || '').toLowerCase().includes(searchLower) ||
                (a.type || '').toLowerCase().includes(searchLower) ||
                sessionTitle.includes(searchLower) ||
                dateStr.includes(searchLower) ||
                timeStr.includes(searchLower);

            // Date filtering
            const dateObj = new Date(a.date);
            let fromDate = filters.from ? new Date(filters.from) : null;
            let toDate = filters.to ? new Date(filters.to) : null;

            if (filters.timeFilter !== 'all' && !filters.from && !filters.to) {
                const now = new Date();
                if (filters.timeFilter === '7d') fromDate = subDays(now, 7);
                if (filters.timeFilter === 'monthly') fromDate = startOfMonth(now);
                if (filters.timeFilter === 'yearly') fromDate = startOfYear(now);
            }

            let dateMatch = true;
            if (fromDate) dateMatch = dateMatch && dateObj >= startOfDay(fromDate);
            if (toDate) dateMatch = dateMatch && dateObj <= endOfDay(toDate);

            return textMatch && dateMatch;
        });
    }, [activities, filters]);

    /* Summary stats - Calculated based on filtered results */
    const filteredTotalMins = useMemo(() =>
        filteredActivities.reduce((s, a) => s + a.minutes, 0)
        , [filteredActivities]);

    /* Group activities by local calendar date */
    const groupedActivities = useMemo(() => {
        const groups = {};
        filteredActivities.forEach(a => {
            const localDate = parseLocalDate(a.date);
            const key = formatGroupDate(localDate);
            if (!groups[key]) groups[key] = { label: key, localDate, items: [] };
            groups[key].items.push(a);
        });

        return Object.values(groups).sort((a, b) => b.localDate - a.localDate);
    }, [filteredActivities]);



    // PageLoader handled by AppLayout transition

    return (
        <div className="space-y-6 pb-10 max-w-full px-0">

            <PageHeader
                icon={Zap}
                title="Total Study Hours"
                subtitle="All logged study, coding & watching sessions"
                right={
                    <div className="flex items-center gap-2">
                        {/* Total badge — hidden on mobile */}
                        <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-[#47C4B7]/20 to-[#47C4B7]/5 border border-[#47C4B7]/30 rounded-2xl shadow-lg shadow-[#47C4B7]/10 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-[#47C4B7]/20">
                            <div className="p-1 bg-[#47C4B7]/20 rounded-lg">
                                <Clock size={14} className="text-[#2b8a80] dark:text-[#47C4B7] stroke-[3px]" />
                            </div>
                            <span className="text-[15px] font-black text-[#2b8a80] dark:text-[#47C4B7] tracking-tight">
                                {formatMins(filteredTotalMins)} Total
                            </span>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 hover:text-[#47C4B7] transition-all active:scale-90 disabled:opacity-50"
                            title="Refresh Data"
                        >
                            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#47C4B7]' : ''} />
                        </button>
                    </div>
                }
            />

            <div className="p-2 sm:p-0">
                <HoverCard
                    rKey={`header-controls-${refreshKey}`}
                    delay={0.1}
                    className="p-1 mb-0"
                    style={{ border: 'none', background: 'transparent', boxShadow: 'none', transform: 'none' }}
                >
                    <div className="flex flex-col gap-4 sm:gap-5 mb-2">
                        {/* Row 1: Search */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#47C4B7] transition-colors" size={15} />
                                <input
                                    type="text"
                                    placeholder="Search hours..."
                                    value={filters.searchTerm}
                                    onChange={e => setFilters({ ...filters, searchTerm: e.target.value })}
                                    className="w-full pl-11 pr-4 py-2 sm:py-2.5 bg-transparent border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] text-[15px] text-gray-900 dark:text-white outline-none transition-all placeholder-gray-400 shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Row 2: Dates + Time Pills (One Line on Mobile) */}
                        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
                            <div className="flex items-center gap-2 shrink-0">
                                {/* From Date */}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all whitespace-nowrap bg-transparent text-gray-500/80 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <input
                                        type={filters.from ? "date" : "text"}
                                        placeholder="DD-MM-YYYY"
                                        onFocus={(e) => (e.target.type = "date")}
                                        onBlur={(e) => !e.target.value && (e.target.type = "text")}
                                        value={filters.from}
                                        onChange={e => setFilters({ ...filters, from: e.target.value, timeFilter: 'all' })}
                                        className="bg-transparent border-none text-[11px] font-black focus:ring-0 p-0 w-[105px] text-gray-500/80 hover:text-gray-500 outline-none uppercase"
                                    />
                                </div>

                                {/* To Date */}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all whitespace-nowrap bg-transparent text-gray-500/80 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <input
                                        type={filters.to ? "date" : "text"}
                                        placeholder="DD-MM-YYYY"
                                        onFocus={(e) => (e.target.type = "date")}
                                        onBlur={(e) => !e.target.value && (e.target.type = "text")}
                                        value={filters.to}
                                        onChange={e => setFilters({ ...filters, to: e.target.value, timeFilter: 'all' })}
                                        className="bg-transparent border-none text-[11px] font-black focus:ring-0 p-0 w-[105px] text-gray-500/80 hover:text-gray-500 outline-none uppercase"
                                    />
                                </div>
                            </div>

                            {/* Time Pills */}
                            <div className="flex items-center gap-2 flex-nowrap shrink-0">
                                {[
                                    { id: '7d', label: 'Last 7 Days' },
                                    { id: 'monthly', label: 'Monthly' },
                                    { id: 'yearly', label: 'Yearly' }
                                ].map(pill => (
                                    <button
                                        key={pill.id}
                                        onClick={() => {
                                            if (pill.id === 'all') setFilters({ from: '', to: '', searchTerm: '', timeFilter: 'all' });
                                            else setFilters({ ...filters, timeFilter: pill.id, from: '', to: '' });
                                        }}
                                        className={`px-4 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all whitespace-nowrap ${filters.timeFilter === pill.id
                                            ? 'bg-[#47C4B7] text-white shadow-lg shadow-[#47C4B7]/20 hover:scale-105 active:scale-95'
                                            : 'bg-transparent text-gray-500/80 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'
                                            }`}
                                    >
                                        {pill.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </HoverCard>

                {/* Mobile-only total */}
                <div className="sm:hidden flex justify-end mt-2 mb-1">
                    <div className="flex items-center gap-2 px-3 py-1.5 border border-[#47C4B7]/40 rounded-xl">
                        <Clock size={12} className="text-[#47C4B7]" />
                        <span className="text-[11px] font-black text-[#47C4B7] tracking-tight whitespace-nowrap">
                            {formatMins(filteredTotalMins)} Total
                        </span>
                    </div>
                </div>


                <div className="space-y-8 mt-4">
                    {globalLoading ? (
                        <div className="py-20 flex justify-center">
                            <RefreshCw className="animate-spin text-[#47C4B7]" size={32} />
                        </div>
                    ) : groupedActivities.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-gray-400 text-center px-6">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-full mb-4">
                                <Search size={40} className="opacity-20" />
                            </div>
                            <p className="text-[10px] sm:text-[14px] font-bold text-gray-600 dark:text-gray-300">No study hours logged yet</p>
                            <p className="text-[8px] sm:text-[10px] opacity-60 mt-1">Start logging your study sessions to track your progress</p>
                        </div>
                    ) : (
                        <div className="space-y-6 pb-0">
                            {groupedActivities.map(({ label, items }, index) => (
                                <HoverCard
                                    key={label}
                                    rKey={`${label}-cards-${refreshKey}`}
                                    delay={0.1 + (index * 0.08)}
                                    className="space-y-6 p-5 sm:p-7 glass-card bg-white dark:bg-gray-900/40 border-2 border-gray-100 dark:border-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-shadow"
                                >
                                    {/* Date header — same style as AllTasks */}
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                                            <Calendar size={14} className="text-[#47C4B7]" />
                                            <span className="text-[10px] sm:text-[13px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                                {label}
                                            </span>
                                        </div>
                                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                                        <div className="flex items-center px-1.5 py-0.5 sm:px-3 sm:py-1 bg-gray-50 dark:bg-gray-800/40 rounded-full border border-gray-100 dark:border-gray-700/50">
                                            <span className="text-[9px] sm:text-[11px] font-black text-gray-400 dark:text-gray-500">
                                                {formatMins(items.reduce((s, a) => s + a.minutes, 0))} Total
                                            </span>
                                        </div>
                                    </div>

                                    {/* Activity rows */}
                                    <div className="space-y-3">
                                        <AnimatePresence mode="popLayout">
                                            {items.map((act, i) => {
                                                const meta = TYPE_META[act.type] || TYPE_META.Study;
                                                const Icon = meta.icon;
                                                return (
                                                    <motion.div
                                                        layout
                                                        key={act._id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        className="group p-3 sm:p-4 rounded-xl border flex flex-row items-center gap-3 transition-colors bg-[#47C4B7]/10 dark:bg-[#47C4B7]/10 border-[#47C4B7]/20 dark:border-[#47C4B7]/10 hover:border-[#47C4B7]/40"
                                                    >
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#47C4B7] border-[#47C4B7] border-2 text-white shadow-md shadow-[#47C4B7]/30 flex items-center justify-center">
                                                                <CheckCircle2 size={14} strokeWidth={3} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-[12px] sm:text-[15px] font-bold truncate text-gray-700 dark:text-gray-300">
                                                                    {act.method && act.method !== 'Manual' ? act.method : act.type} Session
                                                                </h4>
                                                                <p className="text-[10px] sm:text-[13px] text-gray-400 dark:text-gray-500 font-medium mt-1 flex items-center gap-1.5 line-clamp-1">
                                                                    <BookOpen size={12} />
                                                                    {act.topic || 'Activity Session'}
                                                                </p>
                                                                {act.createdAt && (
                                                                    <p className="text-[8px] sm:text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-2 sm:mt-3 flex items-center gap-1.5 whitespace-nowrap">
                                                                        <Calendar size={10} className="text-[#47C4B7]" />
                                                                        {new Date(act.createdAt).toLocaleString('en-US', {
                                                                            month: 'short', day: 'numeric',
                                                                            hour: '2-digit', minute: '2-digit'
                                                                        })}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 justify-end shrink-0">
                                                            <div className="px-2 py-0.5 rounded-md text-[9px] sm:text-[13px] font-black flex items-center gap-1 bg-[#47C4B7]/10 text-[#47C4B7]">
                                                                <Clock size={10} className="opacity-80" />
                                                                {formatDisplayTime(act.minutes / 60)}
                                                            </div>

                                                            <button
                                                                onClick={() => setDeletingActivityId(act._id)}
                                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                                title="Delete Session"
                                                            >
                                                                <Trash2 className="w-[13px] h-[13px] sm:w-[16px] sm:h-[16px]" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                </HoverCard>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ---------- DELETE ACTIVITY CONFIRMATION MODAL ---------- */}
            <AnimatePresence>
                {deletingActivityId && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-[340px] shadow-2xl text-center border border-gray-100 dark:border-gray-800"
                        >
                            <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-100 dark:border-red-500/20">
                                <Trash2 size={24} />
                            </div>

                            <h3 className="text-[1.05rem] font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Delete Session?</h3>
                            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-6">
                                This session will be permanently removed from your activity log.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeletingActivityId(null)}
                                    className="flex-1 py-3 text-[15px] font-bold bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-750 transition"
                                >
                                    No, keep it
                                </button>
                                <button
                                    onClick={handleConfirmDeleteActivity}
                                    className="flex-1 py-3 text-[15px] font-bold bg-[#47C4B7] text-white rounded-xl hover:bg-[#3db3a6] shadow-lg shadow-[#47C4B7]/25 transition"
                                >
                                    Yes, delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};
