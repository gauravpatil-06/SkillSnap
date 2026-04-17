import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Plus, CheckCircle2, Trash2, LayoutDashboard, Flame, Play, Pause,
    RotateCcw, BookOpen, Clock, FileText, Upload, X, Trophy, Pencil, Download, Calendar, History,
    StopCircle, Timer, Target, BookMarked, Code2, Eye, CheckCircle, XCircle, Zap, RefreshCw
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useMaterials } from '../context/MaterialContext';
import { useActivities } from '../context/ActivityContext';
import api, { BASE_URL } from '../utils/api'; // kept for BASE_URL compat
import * as localDb from '../services/localDb';

import toast from 'react-hot-toast';
import { PageLoader } from '../components/ui/PageLoader';
import { WelcomeModal } from '../components/ui/WelcomeModal';



import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import dayjs from 'dayjs';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#47C4B7',
        },
    },
});

const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#47C4B7',
        },
    },
});




/* ─────────────────────────────────────────────────────────────────
   Inline styles for the zoom + border hover effect on cards
───────────────────────────────────────────────────────────────── */
const cardBaseStyle = {
    transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease, border-color 0.28s ease',
};

const cardHoverStyle = {
    transform: 'scale(1.05) translateY(-6px)',
    boxShadow: '0 20px 40px -8px rgba(71,196,183,0.22), 0 8px 16px -4px rgba(71,196,183,0.12)',
    borderColor: 'rgba(71,196,183,0.6)',
};

const HoverCard = ({ children, className, style, delay, rKey, extraHover = {} }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            key={rKey}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
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

const StatCard = ({ label, value, icon: Icon, colorClass, delay, rKey, borderColorClass, path }) => {
    const content = (
        <HoverCard
            rKey={rKey}
            delay={delay}
            className={`glass-card bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl p-1 flex flex-col justify-center shadow-xl h-full min-h-[70px] ${borderColorClass || ''}`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-full ${colorClass.replace('text-', 'bg-')}/10 flex items-center justify-center`}>
                        <Icon size={18} className={`${colorClass} shrink-0`} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <p className="text-[clamp(10px,1.2vw,15px)] font-bold text-gray-500 dark:text-gray-400 truncate tracking-tight mb-0.5">{label}</p>
                        <h3 className="text-[clamp(9px,1.1vw,13px)] font-black text-gray-600 dark:text-gray-400 leading-none tracking-tight truncate">
                            {value}
                        </h3>
                    </div>
                </div>
            </div>
        </HoverCard>
    );

    return path ? (
        <Link to={path} className="block no-underline h-full">
            {content}
        </Link>
    ) : content;
};

export const Dashboard = () => {
    const { user, addStudyHours, fetchMe } = useAuth();
    const { tasks, isLoading, addTask, deleteTask, toggleTaskStatus, updateTask, fetchTasks } = useTasks();
    const { materials } = useMaterials();
    const {
        fetchActivities,
        todayActivities, setTodayActivities,
        monthlySummary, setMonthlySummary,
        goals, setGoals,
        totalActivityCount, setTotalActivityCount,
    } = useActivities();

    // UI States
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [todayStudyHours, setTodayStudyHours] = useState(0);
    const [totalStudyHoursFromDB, setTotalStudyHoursFromDB] = useState(0);
    const [deletingActivityId, setDeletingActivityId] = useState(null);
    const [deletingTaskId, setDeletingTaskId] = useState(null);
    const [expandedTasks, setExpandedTasks] = useState(new Set());
    const [quote, setQuote] = useState({ content: 'Loading motivation...', author: '' });


    // Form States
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [pdfFile, setPdfFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Timer States
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerMode, setTimerMode] = useState('1h'); // '30m', '1h', '2h', '3h', 'custom'
    const [customTime, setCustomTime] = useState('01:30'); // "HH:mm"
    const [timeLeft, setTimeLeft] = useState(60 * 60);

    const fileInputRef = useRef(null);
    const swIntervalRef = useRef(null);

    // Stopwatch States
    const [focusMode, setFocusMode] = useState('countdown');
    const [swRunning, setSwRunning] = useState(false);
    const [swElapsed, setSwElapsed] = useState(0);

    // Helper: get local date as YYYY-MM-DD (avoids UTC vs IST mismatch)
    const getLocalDateStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // ── Activity Log States ──
    const [actDate, setActDate] = useState(getLocalDateStr);
    const [actMinutes, setActMinutes] = useState('');
    const [actType, setActType] = useState('Study');
    const [actTopic, setActTopic] = useState('');
    const [actSaving, setActSaving] = useState(false);
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

    // ── Welcome Modal Check (Only show to brand new signups) ──
    useEffect(() => {
        const isNewSignup = localStorage.getItem('studyhub_welcome_new_signup');
        if (isNewSignup) {
            // Once detected, hide it from future refreshes
            localStorage.removeItem('studyhub_welcome_new_signup');

            // Short delay to let the dashboard render first
            const timer = setTimeout(() => setIsWelcomeModalOpen(true), 1200);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleConfirmWelcome = () => {
        setIsWelcomeModalOpen(false);
    };






    // ── Goals States ──

    const [editGoals, setEditGoals] = useState(false);
    const [goalForm, setGoalForm] = useState({ codingGoalHrs: 100, watchingGoalHrs: 50, studyGoalHrs: 100 });

    // Sync goalForm when goals load from context
    useEffect(() => {
        if (goals) {
            setGoalForm({
                codingGoalHrs: goals.codingGoalHrs || 100,
                watchingGoalHrs: goals.watchingGoalHrs || 50,
                studyGoalHrs: goals.studyGoalHrs || 100,
            });
        }
    }, [goals]);

    // Motivational quotes — static pool, rotated daily
    useEffect(() => {
        const quotes = [
            { content: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
            { content: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
            { content: 'Education is the most powerful weapon.', author: 'Nelson Mandela' },
            { content: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
            { content: 'Learning is a treasure that follows everywhere.', author: 'Chinese Proverb' },
            { content: 'The more that you read, the more you will know.', author: 'Dr. Seuss' },
        ];
        const idx = new Date().getDate() % quotes.length;
        setQuote(quotes[idx]);
    }, []);


    // ── Fetch today's activities from localDb ──
    const fetchActivityData = (refresh = false) => {
        try {
            if (refresh) setIsRefreshing(true);
            if (!user) return;

            const activities = localDb.getActivities(user._id);
            const now = new Date();
            const todayStr = now.toISOString().slice(0, 10);

            // Today's activities
            const todayActs = activities.filter(a =>
                (a.localDate || a.createdAt?.slice(0, 10)) === todayStr
            );
            setTodayActivities(todayActs);

            // Monthly summary & Goals from localDb
            const monthlySum = localDb.getMonthlySummary(user._id);
            setMonthlySummary(monthlySum);

            // Goals from localDb
            const storedGoals = localDb.getGoals(user._id);
            setGoals(storedGoals);
            setGoalForm({
                codingGoalHrs: storedGoals.codingGoalHrs || 100,
                watchingGoalHrs: storedGoals.watchingGoalHrs || 50,
                studyGoalHrs: storedGoals.studyGoalHrs || 100,
            });

            setTotalActivityCount(activities.length);
            if (refresh) setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error('Local fetchActivityData error:', err);
        } finally {
            if (refresh) setTimeout(() => setIsRefreshing(false), 600);
        }
    };

    const formatDisplayTime = (decimalHours) => {
        const totalMinutes = Math.round(parseFloat(decimalHours || 0) * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours > 0 && minutes > 0) return `${hours} hrs ${minutes} m`;
        if (hours > 0) return `${hours} hrs`;
        return `${minutes} m`;
    };

    // No mount fetch — data comes from ActivityContext pre-cached at login

    const handleLogActivity = (e) => {
        e.preventDefault();
        if (!actMinutes || Number(actMinutes) < 1) return toast.error('Enter valid minutes');
        setActSaving(true);
        try {
            localDb.addActivity(user._id, {
                localDate: actDate,
                minutes: Number(actMinutes),
                type: actType,
                topic: actTopic || actType,
            });
            toast.success(`Logged ${actMinutes} min of ${actType}! 🎯`);
            setActMinutes('');
            setActTopic('');
            fetchActivityData();
            fetchActivities();
        } catch (err) {
            toast.error('Failed to log activity');
        } finally {
            setActSaving(false);
        }
    };

    const handleSaveGoals = () => {
        localDb.saveGoals(user._id, goalForm);
        setGoals(goalForm);
        setEditGoals(false);
        toast.success('Goals updated! 🎯');
    };

    const handleDeleteActivity = () => {
        if (!deletingActivityId) return;
        localDb.deleteActivity(user._id, deletingActivityId);
        toast.success('Session removed! 🗑️');
        fetchActivityData();
        fetchActivities();
        setDeletingActivityId(null);
    };

    const handleConfirmDeleteTask = async () => {
        if (!deletingTaskId) return;
        try {
            await deleteTask(deletingTaskId);
            toast.success('Task removed! 🗑️');
            setDeletingTaskId(null);
        } catch (err) {
            toast.error('Failed to delete task');
        }
    };

    const toggleExpandTask = (taskId) => {
        setExpandedTasks(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) next.delete(taskId);
            else next.add(taskId);
            return next;
        });
    };

    const todayHasActivity = todayActivities.length > 0;

    // Derived Metrics
    const metrics = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, completionRate };
    }, [tasks]);

    const displayedTasks = useMemo(() => {
        const todayStr = new Date().toDateString();
        return tasks.filter(t => new Date(t.createdAt).toDateString() === todayStr);
    }, [tasks]);

    // Timer Logic
    useEffect(() => {
        let interval = null;
        if (isTimerRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (isTimerRunning && timeLeft === 0) {
            setIsTimerRunning(false);
            const totalMinutes = getInitialSeconds(timerMode, customTime) / 60;
            const hoursAdded = +(totalMinutes / 60).toFixed(2);
            toast.promise(
                addStudyHours(hoursAdded, 'Countdown').then(() => fetchActivityData()),
                {
                    loading: 'Saving study session...',
                    success: `Excellent! You've logged ${hoursAdded} hours🔥`,
                    error: 'Could not log session.'
                }
            );
            // reset timer
            setTimeLeft(getInitialSeconds(timerMode, customTime));
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft, timerMode, customTime, addStudyHours]);

    // --- Stopwatch Logic (persists across tab switches) ---
    useEffect(() => {
        // Restore stopwatch state from localStorage on mount
        const savedStart = localStorage.getItem('sw_start_ts');
        const savedElapsed = localStorage.getItem('sw_elapsed_s');
        if (savedStart && savedElapsed) {
            const elapsed = parseInt(savedElapsed, 10) + Math.floor((Date.now() - parseInt(savedStart, 10)) / 1000);
            setSwElapsed(elapsed);
            setSwRunning(true);
            setFocusMode('stopwatch');
        }
    }, []);

    useEffect(() => {
        if (swRunning) {
            const startTs = Date.now() - swElapsed * 1000;
            localStorage.setItem('sw_start_ts', startTs.toString());
            localStorage.setItem('sw_elapsed_s', '0'); // will re-read via startTs
            swIntervalRef.current = setInterval(() => {
                setSwElapsed(Math.floor((Date.now() - startTs) / 1000));
            }, 1000);
        } else {
            clearInterval(swIntervalRef.current);
            if (swElapsed > 0) {
                localStorage.setItem('sw_elapsed_s', swElapsed.toString());
                localStorage.removeItem('sw_start_ts');
            }
        }
        return () => clearInterval(swIntervalRef.current);
    }, [swRunning]);

    // Auto-save on page close (offline: save sw_elapsed to localDb)
    useEffect(() => {
        const handleUnload = () => {
            if (swRunning && swElapsed > 60 && user) {
                const hours = +(swElapsed / 3600).toFixed(4);
                localDb.addStudyHours(user._id, hours, 'Stopwatch');
            }
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, [swRunning, swElapsed, user]);

    const handleSwSaveEnd = async () => {
        if (swElapsed < 60) {
            toast('Session too short to log (under 1 min).', { icon: 'ℹ️' });
        } else {
            const hoursAdded = +(swElapsed / 3600).toFixed(4);
            await toast.promise(
                addStudyHours(hoursAdded, 'Stopwatch').then(() => Promise.all([fetchActivityData(), fetchActivities()])),
                {
                    loading: 'Saving stopwatch session...',
                    success: `Great! Logged ${(hoursAdded * 60).toFixed(0)} min 🔥`,
                    error: 'Could not save session.'
                }
            );
        }
        setSwRunning(false);
        setSwElapsed(0);
        localStorage.removeItem('sw_start_ts');
        localStorage.removeItem('sw_elapsed_s');
    };

    const handleSwToggle = () => {
        setSwRunning(prev => !prev);
    };

    const getInitialSeconds = (mode, customTimeString) => {
        switch (mode) {
            case '30m': return 30 * 60;
            case '1h': return 60 * 60;
            case '2h': return 120 * 60;
            case '3h': return 180 * 60;
            case 'custom': {
                const [h, m] = customTimeString.split(':').map(Number);
                return (h * 3600) + (m * 60);
            }
            default: return 60 * 60;
        }
    };

    const handleTimerModeChange = (mode) => {
        setTimerMode(mode);
        setIsTimerRunning(false);
        setTimeLeft(getInitialSeconds(mode, customTime));
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) {
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatSecondsToHMS = (hoursAsDec) => {
        const totalSeconds = Math.round(hoursAsDec * 3600);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // Derive today study hours from localDb
    useEffect(() => {
        if (!user) return;
        const activities = localDb.getActivities(user._id);
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayActs = activities.filter(a => (a.localDate || a.createdAt?.slice(0, 10)) === todayStr);
        const todayHrs = todayActs.reduce((s, a) => s + (a.minutes || 0) / 60, 0);
        setTodayStudyHours(todayHrs);
        const total = activities.reduce((s, a) => s + (a.minutes || 0) / 60, 0);
        setTotalStudyHoursFromDB(total);
    }, [user?.studyHours, user]);

    const handleStopAndSave = () => {
        const initialSeconds = getInitialSeconds(timerMode, customTime);
        const elapsedSeconds = initialSeconds - timeLeft;

        if (elapsedSeconds > 60) { // If studied for more than 1 minute
            const hoursAdded = +(elapsedSeconds / 3600).toFixed(2);
            if (hoursAdded > 0) {
                toast.promise(
                    addStudyHours(hoursAdded, 'Countdown').then(() => Promise.all([fetchActivityData(), fetchActivities()])),
                    {
                        loading: 'Saving partial session...',
                        success: `Excellent! Logged ${hoursAdded} hrs🔥`,
                        error: 'Could not log session.'
                    }
                );
            }
        } else if (elapsedSeconds > 0) {
            toast('Session too short to log (under 1 min).', { icon: 'ℹ️' });
        }

        setIsTimerRunning(false);
        setTimeLeft(initialSeconds);
    };

    // Weekly Calendar Logic
    const weekDates = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as 0

        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            d.setHours(0, 0, 0, 0);

            // Find if task completed on this day
            const hasCompletedTask = tasks.some(t => {
                if (!t.completedAt) return false;
                const taskDate = new Date(t.completedAt);
                taskDate.setHours(0, 0, 0, 0);
                return taskDate.getTime() === d.getTime();
            });

            return {
                day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
                date: d.getDate(),
                active: hasCompletedTask,
                isToday: d.getTime() === today.getTime()
            };
        });
    }, [tasks]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
                toast.error('Only PDF or Image files are allowed');
                return;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                toast.error('File size must be less than 10MB');
                return;
            }
            setPdfFile(file);
        }
    };

    const submitTask = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setIsSubmitting(true);
        try {
            // File upload disabled offline — pdfUrl not supported in offline mode
            if (editingTask) {
                await updateTask(editingTask._id, { title, description });
                toast.success('Task updated!');
            } else {
                await addTask(title, description, '');
                toast.success('Task added successfully!');
            }
            setTitle('');
            setDescription('');
            setPdfFile(null);
            setEditingTask(null);
            setIsAddModalOpen(false);
        } catch (error) {
            toast.error('Failed to process task.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setTitle(task.title);
        setDescription(task.description || '');
        setPdfFile(null);
        setIsAddModalOpen(true);
    };

    const handleDownloadFile = async (fileUrl, originalName) => {
        try {
            const loadingToast = toast.loading('Downloading file...');
            const url = `${BASE_URL}${fileUrl}`; // Point directly to the backend
            const response = await fetch(url);

            if (!response.ok) throw new Error('File not found on server');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            const safeOriginalName = originalName || fileUrl.split('/').pop() || 'document.pdf';
            const cleanFileName = decodeURIComponent(safeOriginalName).replace(/-\d{13}-\d+(?=\.[^.]+$)/, '').replace(/-/g, ' ');
            link.download = cleanFileName;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            toast.success('Download complete!', { id: loadingToast });
        } catch (error) {
            console.error("Download failed:", error);
            toast.error("Failed to download file");
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchActivityData(true);
        fetchActivities();
        fetchTasks();
        setRefreshKey(prev => prev + 1);
        setTimeout(() => setIsRefreshing(false), 600);
    };

    // Ensure we don't show a blank/broken dash if user isn't here yet
    if (!user) return <PageLoader />;

    // No blank return on loading — render immediately with available data

    return (
        <div className="space-y-6 pb-10 max-w-full px-0">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col gap-1.5 bg-transparent mb-6 w-full"
            >
                <div className="flex items-center justify-between gap-2 w-full min-w-0">
                    <h1 className="text-lg sm:text-xl font-black text-gray-600 dark:text-gray-300 tracking-tight flex items-center gap-2 min-w-0">
                        <LayoutDashboard className="text-[#47C4B7]/70 shrink-0" size={18} />
                        <span className="truncate">Hello, {user?.name?.split(' ')[0] || 'Scholar'}!</span>
                    </h1>
                    <button
                        onClick={handleRefresh}
                        className={`shrink-0 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-500 hover:text-[#47C4B7] transition-all hover:shadow-md ${isRefreshing ? 'animate-spin cursor-not-allowed opacity-50' : ''}`}
                        title="Refresh Data"
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
                <p className="text-[13px] font-semibold italic text-gray-500 border-l-4 border-[#47C4B7] pl-3 pr-2 w-full break-words">
                    "{quote.content}"
                </p>

            </motion.div>

            {/* Top Stat Cards Grid - 5 columns on laptop, 2 columns on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3">
                {/* 1. Day Streak */}
                <HoverCard
                    rKey={`streak-${refreshKey}`}
                    delay={0.05}
                    className="glass-card bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl p-1 flex flex-col justify-center shadow-xl relative overflow-hidden group h-full min-h-[70px]"
                    extraHover={{ borderColor: 'rgba(249, 115, 22, 0.6)', boxShadow: '0 20px 40px -8px rgba(249, 115, 22, 0.22)' }}
                >
                    <div className="absolute -right-2 -top-2 opacity-5 blur-lg w-16 h-16 bg-orange-500 rounded-full" />
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <Flame size={18} className="text-orange-500 shrink-0" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <p className="text-[clamp(11px,1.2vw,15px)] font-bold text-gray-500 dark:text-gray-400 truncate tracking-tight mb-0.5">Day streak</p>
                                <h3 className="text-[clamp(10px,1.1vw,13px)] font-black text-gray-600 dark:text-gray-400 leading-none tracking-tight truncate">
                                    {user?.streak || 0}
                                </h3>
                            </div>
                        </div>
                        <span className="text-[9px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded shrink-0">
                            High: {user?.highestStreak || 0}
                        </span>
                    </div>
                </HoverCard>

                <StatCard rKey={`study-${refreshKey}`} delay={0.1} label="Study Time" value={formatDisplayTime(monthlySummary?.totalStudyHrs || 0)} icon={Clock} colorClass="text-[#47C4B7]" path="/total-study-hours" />
                <StatCard rKey={`coding-${refreshKey}`} delay={0.15} label="Coding" value={formatDisplayTime(monthlySummary?.totalCodingHrs || 0)} icon={Code2} colorClass="text-indigo-500" path="/total-study-hours" />
                <StatCard rKey={`watch-${refreshKey}`} delay={0.2} label="Watching" value={formatDisplayTime(monthlySummary?.totalWatchingHrs || 0)} icon={Target} colorClass="text-rose-500" path="/total-study-hours" />

                <Link to="/all-tasks" className="block no-underline h-full">
                    <HoverCard
                        rKey={`progress-${refreshKey}`}
                        delay={0.25}
                        className="glass-card bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl p-1 flex flex-col justify-center shadow-xl h-full min-h-[70px]"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 rounded-full bg-[#47C4B7]/10 flex items-center justify-center">
                                    <CheckCircle2 size={18} className="text-[#47C4B7] shrink-0" strokeWidth={2.5} />
                                </div>
                                <p className="text-[clamp(11px,1.2vw,15px)] font-bold text-gray-500 dark:text-gray-400 truncate tracking-tight">Completion</p>
                            </div>
                            <h3 className="text-[clamp(10px,1.1vw,13px)] font-black text-[#47C4B7] leading-none tracking-tight">
                                {metrics.completionRate}%
                            </h3>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1.5 md:mt-2 lg:mt-3">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${metrics.completionRate}%` }}
                                transition={{ duration: 1.5, ease: "circOut", delay: 0.5 }}
                                className="h-full bg-gradient-to-r from-[#47C4B7] to-emerald-400 rounded-full"
                            />
                        </div>
                    </HoverCard>
                </Link>

                {/* Row 2 */}
                <StatCard rKey={`all-tasks-${refreshKey}`} delay={0.3} label="All Tasks" value={metrics.total} icon={FileText} colorClass="text-blue-500" path="/all-tasks" />
                <StatCard rKey={`done-tasks-${refreshKey}`} delay={0.35} label="Completed" value={metrics.completed} icon={CheckCircle} colorClass="text-emerald-500" path="/all-tasks" />
                <StatCard rKey={`pending-tasks-${refreshKey}`} delay={0.4} label="Pending" value={metrics.total - metrics.completed} icon={XCircle} colorClass="text-rose-500" path="/all-tasks" />
                <StatCard rKey={`activity-${refreshKey}`} delay={0.45} label="Activity Log" value={totalActivityCount} icon={History} colorClass="text-amber-500" path="/activity-log" />
                <StatCard rKey={`materials-${refreshKey}`} delay={0.5} label="Study Materials" value={materials.length} icon={BookMarked} colorClass="text-teal-500" path="/study-materials" />
            </div>

            {/* Middle Grid: Weekly Calendar & Focus Timer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">

                {/* Focus Timer */}
                <HoverCard
                    rKey={`focus-${refreshKey}`}
                    delay={0.1}
                    className="glass-card lg:col-span-1 border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl p-4 flex flex-col items-center justify-center text-gray-900 dark:text-white shadow-xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#47C4B7] opacity-[0.15] dark:opacity-[0.08] filter blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                    {/* Header + Mode Toggle */}
                    <div className="w-full flex items-center gap-3 mb-5 z-[2] relative">
                        <Clock size={16} className="text-[#47C4B7]" />
                        <h2 className="text-[12px] sm:text-[15px] font-extrabold text-gray-600 dark:text-gray-400 tracking-tight">Focus Session</h2>
                        <div className="flex-1 h-[1px] bg-gray-100 dark:bg-gray-800 ml-1" />
                    </div>
                    {/* Header + Mode Toggle */}
                    <div className="w-full flex items-center justify-center mb-6 z-10">
                        {/* Countdown / Stopwatch Toggle */}
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                            <button
                                onClick={() => { setFocusMode('countdown'); setSwRunning(false); }}
                                className={`flex items-center gap-1.5 px-3 py-1 text-[11px] sm:text-[13px] font-bold rounded-lg transition-all ${focusMode === 'countdown'
                                    ? 'bg-[#47C4B7] text-white shadow'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                <Timer size={13} /> Countdown
                            </button>
                            <button
                                onClick={() => { setFocusMode('stopwatch'); setIsTimerRunning(false); }}
                                className={`flex items-center gap-1.5 px-3 py-1 text-[11px] sm:text-[13px] font-bold rounded-lg transition-all ${focusMode === 'stopwatch'
                                    ? 'bg-[#47C4B7] text-white shadow'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                <StopCircle size={13} /> Stopwatch
                            </button>
                        </div>
                    </div>

                    {focusMode === 'countdown' ? (
                        <>
                            <div
                                className="text-xl sm:text-3xl font-black tracking-tight mb-6 z-10 tabular-nums text-slate-900/60 dark:text-white/60"
                                style={{ fontWeight: 900, letterSpacing: '-0.02em' }}
                            >
                                {formatTime(timeLeft)}
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-2 mb-6 z-10">
                                {['30m', '1h', '2h', '3h', 'custom'].map(m => (
                                    <button
                                        key={m} onClick={() => handleTimerModeChange(m)}
                                        className={`px-3 py-1.5 text-[11px] sm:text-[13px] font-bold rounded-lg transition-colors ${timerMode === m ? 'bg-[#47C4B7] text-white shadow' : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 hover:bg-gray-300'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>

                            {timerMode === 'custom' && (
                                <div className="flex flex-col items-center gap-2 mb-6 z-10 w-full px-4">
                                    <label className="text-[13px] opacity-60 font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Set Duration</label>
                                    <ThemeProvider theme={document.documentElement.classList.contains('dark') ? darkTheme : lightTheme}>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <MobileTimePicker
                                                value={dayjs(`2024-01-01T${customTime}`)}
                                                ampm={false}
                                                onChange={(newValue) => {
                                                    if (newValue) {
                                                        const h = newValue.hour();
                                                        const min = newValue.minute();
                                                        const stringTime = `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                                                        setCustomTime(stringTime);
                                                        setTimeLeft((h * 3600) + (min * 60));
                                                    }
                                                }}
                                                slotProps={{
                                                    textField: {
                                                        variant: 'outlined',
                                                        size: 'small',
                                                        sx: {
                                                            input: { fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center', padding: '10px' },
                                                            bgcolor: 'background.paper',
                                                            borderRadius: '0.75rem',
                                                        }
                                                    }
                                                }}
                                            />
                                        </LocalizationProvider>
                                    </ThemeProvider>
                                </div>
                            )}

                            <div className="flex items-center justify-center gap-3 z-10 w-full px-2">
                                <button
                                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                                    className={`flex justify-center items-center gap-2 px-4 py-2 text-[12px] sm:text-[15px] font-semibold rounded-xl shadow-xl transition-all active:scale-95 border hover:opacity-90 ${isTimerRunning ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-[#47C4B7]/10 text-[#47C4B7] border-[#47C4B7]/20'}`}
                                >
                                    {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                                    {isTimerRunning ? 'Pause' : 'Start'}
                                </button>
                                <button
                                    onClick={handleStopAndSave}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-[12px] sm:text-[15px] font-semibold rounded-xl shadow-xl transition-all active:scale-95 flex items-center gap-2 border border-transparent"
                                    title="End Session & Save"
                                >
                                    <RotateCcw size={16} />
                                    <span className="hidden sm:inline">Save & End</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        /* ── Stopwatch Mode ── */
                        <div className="flex flex-col items-center w-full z-10">
                            {/* Big elapsed time display */}
                            <div
                                className="text-xl sm:text-3xl font-black tracking-tight mb-3 tabular-nums opacity-60"
                                style={{
                                    fontWeight: 900, letterSpacing: '-0.02em',
                                    color: swRunning ? '#47C4B7' : 'inherit'
                                }}
                            >
                                {formatTime(swElapsed)}
                            </div>
                            <p className="text-[11px] font-semibold text-gray-400 mb-6">
                                {swRunning ? '● Recording…' : swElapsed > 0 ? 'Paused' : 'Ready to start'}
                            </p>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-3 w-full px-2">
                                <button
                                    onClick={handleSwToggle}
                                    className={`flex justify-center items-center gap-2 px-4 py-2 text-[12px] sm:text-[15px] font-semibold rounded-xl shadow-xl transition-all active:scale-95 border hover:opacity-90 ${swRunning
                                        ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                        : 'bg-[#47C4B7]/10 text-[#47C4B7] border-[#47C4B7]/20'
                                        }`}
                                >
                                    {swRunning ? <Pause size={16} /> : <Play size={16} />}
                                    {swRunning ? 'Pause' : 'Start'}
                                </button>
                                <button
                                    onClick={handleSwSaveEnd}
                                    disabled={swElapsed === 0}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-[12px] sm:text-[15px] font-semibold rounded-xl shadow-xl transition-all active:scale-95 flex items-center gap-2 border border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Save & End"
                                >
                                    <RotateCcw size={16} />
                                    <span className="hidden sm:inline">Save & End</span>
                                </button>
                            </div>

                            {swElapsed > 0 && (
                                <p className="text-[11px] text-gray-400 mt-4 text-center">
                                    Saved to Activity Log &amp; Today's Hours on Save &amp; End
                                </p>
                            )}
                        </div>
                    )}
                </HoverCard>

                {/* Weekly Calendar */}
                <HoverCard
                    rKey={`calendar-${refreshKey}`}
                    delay={0.2}
                    className="glass-card lg:col-span-2 border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col relative overflow-hidden"
                >
                    <Link to="/activity-log" className="flex items-center gap-3 mb-6 z-[2] relative hover:opacity-80 transition-opacity no-underline w-fit group">
                        <Calendar size={16} className="text-[#47C4B7] group-hover:scale-110 transition-transform" />
                        <h2 className="text-[12px] sm:text-[15px] font-extrabold text-gray-600 dark:text-gray-400 tracking-tight">Activity This Week</h2>
                        <div className="flex-1 h-[1px] bg-gray-100 dark:bg-gray-800 ml-2 min-w-[30px]" />
                    </Link>
                    <div className="grid grid-cols-7 gap-2 sm:gap-4 flex-1 items-center z-10">
                        {weekDates.map((d, i) => (
                            <div key={i} className={`flex flex-col items-center justify-center p-2 sm:py-4 rounded-2xl transition-all relative border ${d.isToday ? 'ring-2 ring-[#47C4B7] ring-offset-2 dark:ring-offset-gray-900 border-transparent shadow-xl' : ''
                                } ${d.active ? 'bg-[#47C4B7] border-[#47C4B7] text-white shadow-[#47C4B7]/20 scale-105 shadow-md' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}>
                                <span className="text-[8px] sm:text-[13px] font-bold mb-1 opacity-70 uppercase tracking-widest">{d.day}</span>
                                <span className="text-sm sm:text-xl font-black">{d.date}</span>
                                {d.active && <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-xl">
                                    <div className="w-2 h-2 bg-[#47C4B7] rounded-full" />
                                </div>}
                            </div>
                        ))}
                    </div>
                </HoverCard>
            </div>

            {/* ── NEW ROW: Log Activity (left) + Monthly Goals (right) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">

                {/* Log Activity Card */}
                <HoverCard
                    rKey={`log-${refreshKey}`}
                    delay={0.3}
                    className="glass-card lg:col-span-1 border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 flex flex-col text-gray-900 dark:text-white shadow-xl relative overflow-hidden"
                >
                    <div className="flex items-center gap-3 mb-6 z-[2] relative">
                        <Zap size={16} className="text-[#47C4B7]" />
                        <h2 className="text-[12px] sm:text-[15px] font-extrabold text-gray-600 dark:text-gray-400 tracking-tight">Log Activity</h2>
                        <div className="flex-1 h-[1px] bg-gray-100 dark:bg-gray-800 ml-2" />
                    </div>

                    <form onSubmit={handleLogActivity} className="space-y-3 z-10">
                        {/* ... form content same ... */}
                        <div>
                            <label className="text-[10px] font-semibold tracking-wider text-gray-400 dark:text-gray-500 block mb-1">Date</label>
                            <input
                                type={actDate ? "date" : "text"}
                                placeholder="DD-MM-YYYY"
                                onFocus={(e) => (e.target.type = "date")}
                                onBlur={(e) => !e.target.value && (e.target.type = "text")}
                                value={actDate}
                                onChange={e => setActDate(e.target.value)}
                                max={getLocalDateStr()}
                                className="w-full px-3 py-2 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-[12px] sm:text-[15px] font-semibold text-gray-800 dark:text-white focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] outline-none transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-semibold tracking-wider text-gray-400 dark:text-gray-500 block mb-1">Minutes</label>
                                <input
                                    type="number" min="1" max="720"
                                    value={actMinutes}
                                    onChange={e => setActMinutes(e.target.value)}
                                    placeholder="e.g. 60"
                                    className="w-full px-3 py-2 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-[15px] font-semibold text-gray-800 dark:text-white focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold tracking-wider text-gray-400 dark:text-gray-500 block mb-1">Type</label>
                                <select
                                    value={actType}
                                    onChange={e => setActType(e.target.value)}
                                    className="w-full px-3 py-2 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-[15px] font-semibold text-gray-800 dark:text-white focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] outline-none transition-all"
                                >
                                    <option value="Study">📖 Study</option>
                                    <option value="Coding">💻 Coding</option>
                                    <option value="Watching">🎬 Watching</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold tracking-wider text-gray-400 dark:text-gray-500 block mb-1">Topic</label>
                            <input
                                type="text"
                                value={actTopic}
                                onChange={e => setActTopic(e.target.value)}
                                placeholder="e.g. Arrays, DSA, React..."
                                className="w-full px-3 py-2 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-[15px] font-medium text-gray-800 dark:text-white focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] outline-none transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={actSaving || !actMinutes}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#47C4B7] hover:bg-[#3db3a6] text-white font-extrabold text-[12px] sm:text-[15px] rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                        >
                            {actSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={16} strokeWidth={3} />}
                            {actSaving ? 'Saving...' : 'Log Activity'}
                        </button>
                    </form>

                    {todayActivities.length > 0 && (
                        <div className="mt-4 z-10">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Today's Logs</p>
                            <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                                {todayActivities.map((a, i) => (
                                    <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-white/40 dark:bg-gray-800/40 rounded-xl text-[13px]">
                                        <span className="font-bold text-gray-700 dark:text-gray-200">
                                            {a.type === 'Study' ? '📖' : a.type === 'Coding' ? '💻' : '🎬'} {a.topic || a.type}
                                        </span>
                                        <span className="font-black text-[#47C4B7]">{a.minutes}m</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </HoverCard>

                {/* Monthly Goals + Today's Status Card */}
                <HoverCard
                    rKey={`goals-${refreshKey}`}
                    delay={0.45}
                    className="glass-card lg:col-span-2 border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 text-gray-900 dark:text-white shadow-xl relative overflow-hidden"
                >

                    <div className="flex items-center justify-between mb-6 z-[2] relative">
                        <div className="flex items-center gap-3 flex-1">
                            <Target size={16} className="text-[#47C4B7]" />
                            <h2 className="text-[12px] sm:text-[15px] font-extrabold text-gray-600 dark:text-gray-400 tracking-tight">Monthly Goals</h2>
                            <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap">— {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span>
                            <div className="flex-1 h-[1px] bg-gray-100 dark:bg-gray-800 ml-2" />
                        </div>
                        <button
                            onClick={() => setEditGoals(!editGoals)}
                            className="text-[11px] sm:text-[13px] font-bold px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-[#47C4B7]/20 text-gray-600 dark:text-gray-300 transition-all"
                        >
                            {editGoals ? 'Cancel' : 'Edit Goals'}
                        </button>
                    </div>

                    {editGoals ? (
                        <div className="space-y-4 z-10 relative">
                            {[
                                { key: 'studyGoalHrs', label: '📖 Study Goal (hrs)' },
                                { key: 'codingGoalHrs', label: '💻 Coding Goal (hrs)' },
                                { key: 'watchingGoalHrs', label: '🎬 Watching Goal (hrs)' }
                            ].map(g => (
                                <div key={g.key} className="flex items-center gap-4">
                                    <label className="text-[13px] font-bold text-gray-500 dark:text-gray-400 w-40 flex-shrink-0">{g.label}</label>
                                    <input
                                        type="number" min="1" max="744"
                                        value={goalForm[g.key]}
                                        onChange={e => setGoalForm(prev => ({ ...prev, [g.key]: Number(e.target.value) }))}
                                        className="flex-1 px-3 py-2 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-[15px] font-semibold text-gray-800 dark:text-white focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] outline-none"
                                    />
                                </div>
                            ))}
                            <button
                                onClick={handleSaveGoals}
                                className="w-full py-2.5 bg-[#47C4B7] hover:bg-[#3db3a6] text-white font-extrabold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                            >
                                <CheckCircle size={16} /> Save Goals
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5 z-10 relative">
                            {[
                                { label: 'Study', icon: '📖', done: monthlySummary.studyHrs, target: goals.studyGoalHrs, color: '#47C4B7' },
                                { label: 'Coding', icon: '💻', done: monthlySummary.codingHrs, target: goals.codingGoalHrs, color: '#6366f1' },
                                { label: 'Watching', icon: '🎬', done: monthlySummary.watchingHrs, target: goals.watchingGoalHrs, color: '#f59e0b' },
                            ].map(g => {
                                const pct = Math.min(100, g.target > 0 ? Math.round((g.done / g.target) * 100) : 0);
                                return (
                                    <div key={g.label}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[12px] sm:text-[15px] font-bold text-gray-800 dark:text-white">{g.icon} {g.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] sm:text-[13px] font-semibold text-gray-500">
                                                    {Math.floor(g.done)}hrs {Math.round((g.done % 1) * 60)}m / {g.target} hrs
                                                </span>
                                                <span className="text-[10px] sm:text-[13px] font-black px-2 py-0.5 rounded-full" style={{ background: `${g.color}22`, color: g.color }}>{pct}%</span>
                                            </div>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${pct}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                className="h-full rounded-full"
                                                style={{ background: `linear-gradient(90deg, ${g.color}99, ${g.color})` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Today's Status */}
                            <div className="mt-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Today's Status</p>
                                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${todayHasActivity
                                    ? 'bg-[#47C4B7]/10 border-[#47C4B7]/30 dark:bg-[#47C4B7]/5'
                                    : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/30'
                                    }`}>
                                    {todayHasActivity
                                        ? <CheckCircle size={22} className="text-[#47C4B7] flex-shrink-0" />
                                        : <XCircle size={22} className="text-red-400 flex-shrink-0" />
                                    }
                                    <div>
                                        <p className={`text-[12px] sm:text-[15px] font-extrabold ${todayHasActivity ? 'text-[#47C4B7]' : 'text-red-500'}`}>
                                            {todayHasActivity ? '✔ Completed' : '❌ Not Yet'}
                                        </p>
                                        <p className="text-[10px] sm:text-[13px] text-gray-400 font-medium">
                                            {todayHasActivity
                                                ? `${todayActivities.reduce((s, a) => s + a.minutes, 0)} min logged today across ${todayActivities.length} activit${todayActivities.length > 1 ? 'ies' : 'y'}`
                                                : 'No activity logged today. Start now!'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </HoverCard>
            </div>

            <HoverCard
                rKey={`tasks-${refreshKey}`}
                delay={0.2}
                className="glass-card bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xl"
            >
                <div className="flex flex-row items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 shrink-0">
                            <Target size={18} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-[12px] sm:text-[15px] font-extrabold text-gray-600 dark:text-gray-400 tracking-tight">Today's Tasks</h2>
                    </div>

                    {/* Add Task Button for mobile shrinking */}
                    <button
                        onClick={() => {
                            setEditingTask(null);
                            setTitle('');
                            setDescription('');
                            setPdfFile(null);
                            setIsAddModalOpen(true);
                        }}
                        className="shrink-0 flex items-center justify-center gap-1.5 p-2 sm:px-4 sm:py-1.5 bg-[#47C4B7] hover:bg-[#3bb5a8] text-white font-extrabold text-[13px] rounded-full sm:rounded-xl shadow-xl transition-all group"
                        title="Add Task"
                    >
                        <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} />
                        <span className="hidden sm:inline">Add Task</span>
                    </button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    {displayedTasks.length === 0 ? (
                        <div className="py-8 flex flex-col items-center justify-center text-gray-400">
                            <FileText size={36} className="mb-2 opacity-20" />
                            <p className="font-bold text-gray-500 text-[15px]">No tasks today.</p>
                            <p className="text-[13px] opacity-60">Click Add Task to plan your sessions.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                                        <Calendar size={14} className="text-[#47C4B7]" />
                                        <span className="text-[10px] sm:text-[13px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                                </div>
                                <div className="space-y-4">
                                    <AnimatePresence mode="popLayout">
                                        {displayedTasks.map(task => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                key={task._id}
                                                className={`p-3 sm:p-4 rounded-xl border flex flex-row items-center gap-3 group transition-colors ${task.status === 'completed'
                                                    ? 'bg-[#47C4B7]/10 dark:bg-[#47C4B7]/10 border-[#47C4B7]/20 dark:border-[#47C4B7]/10 hover:border-[#47C4B7]/40'
                                                    : 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700/50 hover:border-[#47C4B7]/50'
                                                    }`}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        {/* Task Checkbox */}
                                                        <button
                                                            onClick={() => toggleTaskStatus(task._id)}
                                                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'completed'
                                                                ? 'bg-[#47C4B7] border-[#47C4B7] text-white shadow-md shadow-[#47C4B7]/30'
                                                                : 'border-gray-300 dark:border-gray-600 hover:border-[#47C4B7]'
                                                                }`}
                                                        >
                                                            {task.status === 'completed' && <CheckCircle2 size={16} strokeWidth={3} />}
                                                        </button>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0 flex flex-row items-center gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className={`text-[12px] sm:text-[15px] font-bold truncate transition-colors ${task.status === 'completed' ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                                                    {task.title}
                                                                </h4>
                                                                {task.description && (
                                                                    <div className="mt-1">
                                                                        <p className={`text-[12px] sm:text-[15px] text-gray-500 dark:text-gray-400 leading-snug break-words transition-all duration-300 ${expandedTasks.has(task._id) ? '' : 'line-clamp-1'}`}>
                                                                            {task.description}
                                                                        </p>
                                                                        {task.description.length > 60 && (
                                                                            <button
                                                                                onClick={() => toggleExpandTask(task._id)}
                                                                                className="text-[9px] sm:text-[11px] font-black text-[#47C4B7] hover:underline mt-0.5 flex items-center gap-1"
                                                                            >
                                                                                {expandedTasks.has(task._id) ? 'Show Less' : 'Read more'}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {task.createdAt && (
                                                                    <p className="text-[10px] sm:text-[12px] text-gray-400 dark:text-gray-500 font-medium mt-1.5 flex items-center gap-1.5 whitespace-nowrap">
                                                                        <Clock size={12} />
                                                                        {new Date(task.createdAt).toLocaleString('en-US', {
                                                                            month: 'short', day: 'numeric',
                                                                            hour: '2-digit', minute: '2-digit'
                                                                        })}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Only show Edit/Delete here on mobile if NO PDF - Vertically centered */}
                                                            {!task.pdfUrl && (
                                                                <div className="flex sm:hidden flex-row items-center gap-1 shrink-0">
                                                                    <button
                                                                        onClick={() => openEditModal(task)}
                                                                        className="p-1 text-gray-400 hover:text-blue-500"
                                                                        title="Edit Task"
                                                                    >
                                                                        <Pencil size={13} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeletingTaskId(task._id)}
                                                                        className="p-1 text-gray-400 hover:text-red-500"
                                                                        title="Delete Task"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Mobile Separator - Only show if PDF exists */}
                                                    {task.pdfUrl && (
                                                        <div className="sm:hidden h-px bg-gray-100 dark:bg-gray-700/30 w-full mb-0.5" />
                                                    )}

                                                    {/* Action Buttons — bottom on mobile, right on desktop */}
                                                    <div className={`${!task.pdfUrl ? 'hidden sm:flex' : 'flex'} items-center gap-2 justify-end sm:shrink-0`}>
                                                        {task.pdfUrl && (
                                                            <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 text-[10px] sm:text-[13px] font-black relative z-10">
                                                                <a
                                                                    href={`${BASE_URL}${task.pdfUrl}`}
                                                                    target="_blank" rel="noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="flex items-center gap-1 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                                                                    title="Open File"
                                                                >
                                                                    <FileText size={12} className="sm:w-[14px] sm:h-[14px] shrink-0" /> Open
                                                                </a>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleDownloadFile(task.pdfUrl, task.fileName);
                                                                    }}
                                                                    className="flex items-center gap-1 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                                                                    title="Download File"
                                                                >
                                                                    <Download size={12} className="sm:w-[14px] sm:h-[14px] shrink-0" /> Download
                                                                </button>
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={() => openEditModal(task)}
                                                            className={`${!task.pdfUrl ? 'hidden sm:block' : ''} p-1 text-gray-400 hover:text-blue-500 transition-colors`}
                                                            title="Edit Task"
                                                        >
                                                            <Pencil className="w-[13px] h-[13px] sm:w-[18px] sm:h-[18px]" />
                                                        </button>

                                                        <button
                                                            onClick={() => setDeletingTaskId(task._id)}
                                                            className={`${!task.pdfUrl ? 'hidden sm:block' : ''} p-1 text-gray-400 hover:text-red-500 transition-colors`}
                                                            title="Delete Task"
                                                        >
                                                            <Trash2 className="w-[13px] h-[13px] sm:w-[18px] sm:h-[18px]" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </HoverCard>

            {/* ── Today's Study Hours ── separate card */}
            <HoverCard
                rKey={`study-hours-${refreshKey}`}
                delay={0.25}
                className="glass-card bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xl"
            >
                <div className="flex items-center gap-2.5 mb-6">
                    <div className="p-2 rounded-full bg-[#47C4B7]/10 text-[#47C4B7] shrink-0">
                        <History size={18} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-[12px] sm:text-[15px] font-extrabold text-gray-600 dark:text-gray-400 tracking-tight">Today's Study Hours</h2>
                </div>

                <div className="space-y-6">
                    {todayActivities.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                                    <Calendar size={14} className="text-[#47C4B7]" />
                                    <span className="text-[10px] sm:text-[13px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                            </div>

                            <div className="space-y-4">
                                <AnimatePresence>
                                    {todayActivities.map((act) => (
                                        <motion.div
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
                                                        {act.topic || 'Based on activity timer'}
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
                                                <div className="px-2 py-0.5 bg-[#47C4B7]/10 text-[#47C4B7]/80 rounded-md text-[9px] sm:text-[13px] font-black flex items-center gap-1 shrink-0">
                                                    <Clock size={10} className="opacity-70" />
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
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 flex flex-col items-center justify-center text-gray-400 px-4">
                            <Clock size={32} className="mb-2 opacity-20" />
                            <p className="text-[13px] sm:text-[15px] font-bold text-gray-500 text-center">No study session today.</p>
                            <p className="text-[11px] sm:text-[13px] opacity-60 text-center">Your focus timer activity will appear here.</p>
                        </div>
                    )}
                </div>
            </HoverCard>

            {/* ---------- NEW TASK MODAL ---------- */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 sm:p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="glass-card bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-3xl p-5 sm:p-6 w-full max-w-[26rem] shadow-2xl relative overflow-hidden flex flex-col"
                        >
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#47C4B7]/5 blur-3xl rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />

                            <div className="flex justify-between items-center mb-5 z-10">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2.5 tracking-tight">
                                    <div className="p-1.5 bg-[#47C4B7]/10 dark:bg-[#47C4B7]/20 rounded-md">
                                        {editingTask ? <Pencil size={14} className="text-[#47C4B7]" /> : <Plus size={14} className="text-[#47C4B7]" />}
                                    </div>
                                    {editingTask ? 'Edit Task' : 'Create Task'}
                                </h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            </div>

                            <form onSubmit={submitTask} className="space-y-4 z-10">
                                <div className="space-y-1.5">
                                    <label className="block text-[15px] font-semibold text-gray-700 dark:text-gray-300 tracking-tight">Task Title <span className="text-red-500">*</span></label>
                                    <input
                                        type="text" required autoFocus
                                        value={title} onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-3.5 py-2.5 text-[15px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] text-gray-900 dark:text-white outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 font-medium"
                                        placeholder="e.g., Core Java Notes (OOPs Concepts)"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[15px] font-semibold text-gray-700 dark:text-gray-300 tracking-tight">Description</label>
                                    <textarea
                                        rows="2" value={description} onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-3.5 py-2.5 text-[15px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] text-gray-900 dark:text-white outline-none resize-none transition-all custom-scrollbar placeholder-gray-400 dark:placeholder-gray-500"
                                        placeholder="Add notes, links, or instructions..."
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[15px] font-semibold text-gray-700 dark:text-gray-300 tracking-tight">Reference Material</label>

                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-full py-4 border-2 border-dashed ${pdfFile ? 'border-[#47C4B7] bg-[#47C4B7]/5' : 'border-gray-300 dark:border-gray-700 hover:border-[#47C4B7]/40 hover:bg-gray-50 dark:hover:bg-gray-800/50'} rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group`}
                                    >
                                        <div className={`p-2.5 rounded-full ${pdfFile ? 'bg-[#47C4B7]/20' : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-[#47C4B7]/10 transition-colors'}`}>
                                            <Upload size={18} className={pdfFile ? 'text-[#47C4B7]' : 'text-gray-400 group-hover:text-[#47C4B7] transition-colors'} />
                                        </div>
                                        <div className="text-center">
                                            {pdfFile ? (
                                                <>
                                                    <p className="text-[13px] font-bold text-[#47C4B7] flex items-center justify-center gap-1.5">
                                                        <FileText size={14} /> {pdfFile.name}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-[#47C4B7]/80 mt-1">Click to change document</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                                                        Upload Document (PDF, Image)
                                                    </p>
                                                    <p className="text-[10px] font-medium text-gray-500 mt-0.5">
                                                        Max file size: 10MB
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp" className="hidden"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800 mt-2">
                                    <button
                                        type="button" onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 py-2.5 text-[15px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit" disabled={isSubmitting || !title.trim()}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[15px] bg-[#47C4B7] hover:bg-[#3db3a6] text-white font-extrabold rounded-xl shadow-md disabled:opacity-50 transition"
                                    >
                                        {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                                        {isSubmitting ? 'Saving...' : 'Save Task'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ---------- DELETE ACTIVITY CONFIRMATION MODAL ---------- */}
            <AnimatePresence>
                {deletingActivityId && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-[320px] shadow-2xl text-center border border-gray-100 dark:border-gray-800"
                        >
                            <div className="w-14 h-14 bg-[#47C4B7]/10 dark:bg-[#47C4B7]/10 rounded-2xl flex items-center justify-center text-[#47C4B7] mx-auto mb-4 border border-[#47C4B7]/20 dark:border-[#47C4B7]/10">
                                <Trash2 size={24} />
                            </div>

                            <h3 className="text-[1.05rem] font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Delete session?</h3>
                            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-6">
                                This will permanently remove this session and update your total hours.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeletingActivityId(null)}
                                    className="flex-1 py-3 text-[15px] font-bold bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-750 transition"
                                >
                                    No, keep it
                                </button>
                                <button
                                    onClick={handleDeleteActivity}
                                    className="flex-1 py-3 text-[15px] font-bold bg-[#47C4B7] text-white rounded-xl hover:bg-[#3db3a6] shadow-lg shadow-[#47C4B7]/25 transition"
                                >
                                    Yes, delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* ---------- DELETE TASK CONFIRMATION MODAL ---------- */}
                {deletingTaskId && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-[320px] shadow-2xl text-center border border-gray-100 dark:border-gray-800"
                        >
                            <div className="w-14 h-14 bg-[#47C4B7]/10 dark:bg-[#47C4B7]/10 rounded-2xl flex items-center justify-center text-[#47C4B7] mx-auto mb-4 border border-[#47C4B7]/20 dark:border-[#47C4B7]/10">
                                <Trash2 size={24} />
                            </div>

                            <h3 className="text-[1.05rem] font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Delete task?</h3>
                            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-6">
                                This will permanently remove the task.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeletingTaskId(null)}
                                    className="flex-1 py-3 text-[15px] font-bold bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-750 transition"
                                >
                                    No, keep it
                                </button>
                                <button
                                    onClick={handleConfirmDeleteTask}
                                    className="flex-1 py-3 text-sm font-bold bg-[#47C4B7] text-white rounded-xl hover:bg-[#3db3a6] shadow-lg shadow-[#47C4B7]/25 transition"
                                >
                                    Yes, delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <WelcomeModal
                isOpen={isWelcomeModalOpen}
                userName={user?.name?.split(' ')[0] || 'Scholar'}
                onConfirm={handleConfirmWelcome}
            />
        </div>
    );
};


