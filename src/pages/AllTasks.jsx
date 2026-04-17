import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, CheckCircle2, Trash2, Clock, FileText, Upload, X, Pencil, Download, Search, Calendar, CheckSquare, RefreshCw
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import api, { BASE_URL } from '../utils/api';
import toast from 'react-hot-toast';
import { PageLoader } from '../components/ui/PageLoader';
import { PageHeader } from '../components/ui/PageHeader';
import { format, parseISO, startOfDay, endOfDay, subDays, startOfMonth, startOfYear, isWithinInterval } from 'date-fns';

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

export const AllTasks = () => {
    const { tasks, isLoading, addTask, deleteTask, toggleTaskStatus, updateTask, fetchTasks } = useTasks();

    // UI States
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [expandedTasks, setExpandedTasks] = useState(new Set());
    const [deletingTaskId, setDeletingTaskId] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        from: '',
        to: '',
        topic: '',
        timeFilter: 'all'
    });

    // Form States
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [pdfFile, setPdfFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef(null);

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
        let uploadedPdfUrl = '';

        try {
            if (pdfFile) {
                // Check size for local storage compatibility (roughly 2MB)
                if (pdfFile.size > 2 * 1024 * 1024) {
                    toast.error('File too large for offline storage (Max 2MB)');
                    setIsSubmitting(false);
                    return;
                }

                // Process file locally as Data URL for offline mode
                uploadedPdfUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(pdfFile);
                });
            }

            if (editingTask) {
                await updateTask(editingTask._id, {
                    title,
                    description,
                    ...(uploadedPdfUrl ? { pdfUrl: uploadedPdfUrl, fileName: pdfFile ? pdfFile.name : editingTask.fileName } : {})
                });
                toast.success('Task updated!');
            } else {
                await addTask(title, description, uploadedPdfUrl, pdfFile ? pdfFile.name : '');
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

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Reset filters for a clean refresh animate
        setFilters({ from: '', to: '', topic: '', timeFilter: 'all' });
        try {
            await fetchTasks();
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error(err);
        } finally {
            setTimeout(() => setIsRefreshing(false), 600);
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

    const handleDownloadFile = async (fileUrl, originalName) => {
        try {
            const loadingToast = toast.loading('Downloading file...');
            
            let downloadUrl = fileUrl;
            
            // If it's a server path, handle via fetch to avoid CORS/extension issues
            if (fileUrl.startsWith('/uploads')) {
                const response = await fetch(`${BASE_URL}${fileUrl}`);
                if (!response.ok) throw new Error('File not found on server');
                const blob = await response.blob();
                downloadUrl = window.URL.createObjectURL(blob);
            }

            const link = document.createElement('a');
            link.href = downloadUrl;
            
            const safeOriginalName = originalName || 'document.pdf';
            const cleanFileName = decodeURIComponent(safeOriginalName).replace(/-\d{13}-\d+(?=\.[^.]+$)/, '').replace(/-/g, ' ');
            
            link.download = cleanFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            if (fileUrl.startsWith('/uploads')) {
                window.URL.revokeObjectURL(downloadUrl);
            }
            
            toast.success('Download complete!', { id: loadingToast });
        } catch (error) {
            console.error("Download failed:", error);
            toast.error("Failed to download file");
        }
    };

    const handleOpenFile = (fileUrl) => {
        if (!fileUrl) return;

        if (fileUrl.startsWith('data:')) {
            // For Base64 Data URLs, we convert to Blob and create an Object URL 
            // to bypass browser security blocks on direct Data URL navigation.
            try {
                const parts = fileUrl.split(',');
                const byteString = atob(parts[1]);
                const mimeString = parts[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: mimeString });
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');
            } catch (err) {
                console.error("Failed to open Base64 file:", err);
                toast.error("Could not open this file version.");
            }
        } else {
            // Normal server-side URL
            window.open(`${BASE_URL}${fileUrl}`, '_blank');
        }
    };

    const filteredAndGroupedTasks = useMemo(() => {
        const filtered = tasks.filter(task => {
            const searchLower = filters.topic.toLowerCase();
            const dateStr = new Date(task.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });

            // Text match
            const textMatch = task.title.toLowerCase().includes(searchLower) ||
                (task.description && task.description.toLowerCase().includes(searchLower)) ||
                dateStr.toLowerCase().includes(searchLower);

            // Date filtering
            const dateObj = new Date(task.createdAt);
            let fromDate = filters.from ? new Date(filters.from) : null;
            let toDate = filters.to ? new Date(filters.to) : null;

            if (filters.timeFilter !== 'all' && !filters.from && !filters.to) {
                const now = new Date();
                if (filters.timeFilter === '7d') fromDate = subDays(now, 7);
                if (filters.timeFilter === 'monthly') fromDate = startOfMonth(now);
                if (filters.timeFilter === 'yearly') fromDate = startOfYear(now);
            }

            let dateMatch = true;
            if (fromDate) {
                dateMatch = dateMatch && dateObj >= startOfDay(fromDate);
            }
            if (toDate) {
                dateMatch = dateMatch && dateObj <= endOfDay(toDate);
            }

            return textMatch && dateMatch;
        });

        const groups = {};
        filtered.forEach(task => {
            const dateStr = new Date(task.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(task);
        });

        return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
    }, [tasks, filters]);

    // Global transition loader handles the initial wait
    // PageLoader handled by AppLayout transition

    return (
        <div className="space-y-4 sm:space-y-6 pb-10 max-w-full px-0">
            <PageHeader
                icon={CheckSquare}
                title="All Tasks"
                subtitle="View and manage your entire study history"
                right={
                    <button
                        onClick={handleRefresh}
                        className={`shrink-0 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-500 hover:text-[#47C4B7] transition-all hover:shadow-md ${isRefreshing ? 'animate-spin cursor-not-allowed opacity-50' : ''}`}
                        title="Refresh Data"
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={16} />
                    </button>
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
                        {/* Row 1: Search + Add Task */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Search */}
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#47C4B7] transition-colors" size={15} />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={filters.topic}
                                    onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
                                    className="w-full pl-11 pr-4 py-2 sm:py-2.5 bg-transparent border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] text-[15px] text-gray-900 dark:text-white outline-none transition-all placeholder-gray-400 shadow-sm"
                                />
                            </div>

                            {/* Add Task Button */}
                            <button
                                onClick={() => {
                                    setEditingTask(null);
                                    setTitle('');
                                    setDescription('');
                                    setPdfFile(null);
                                    setIsAddModalOpen(true);
                                }}
                                className="shrink-0 flex items-center justify-center gap-1.5 p-2 sm:px-4 sm:py-2.5 bg-[#47C4B7] hover:bg-[#3db3a6] text-white font-black rounded-full sm:rounded-xl shadow-lg shadow-[#47C4B7]/20 transition-all transform hover:scale-[1.02] group"
                                title="Add Task"
                            >
                                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} />
                                <span className="hidden sm:inline text-[13px] sm:text-[15px]">Add Task</span>
                            </button>
                        </div>

                        {/* Row 2: Dates + Quick Pills (One Line on Mobile) */}
                        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
                            <div className="flex items-center gap-2 shrink-0">
                                {/* From Date */}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all whitespace-nowrap bg-transparent text-gray-500/80 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700">
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
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all whitespace-nowrap bg-transparent text-gray-500/80 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700">
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

                            {/* Quick Pills */}
                            <div className="flex items-center gap-2 flex-nowrap shrink-0">
                                {[
                                    { id: '7d', label: 'Last 7 Days' },
                                    { id: 'monthly', label: 'Monthly' },
                                    { id: 'yearly', label: 'Yearly' }
                                ].map(pill => (
                                    <button
                                        key={pill.id}
                                        onClick={() => setFilters({ ...filters, timeFilter: pill.id, from: '', to: '' })}
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
            </div>

            <div className="space-y-8 mt-4">
                {filteredAndGroupedTasks.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-400 text-center px-6">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-full mb-4">
                            <Search size={40} className="opacity-20" />
                        </div>
                        <p className="text-[10px] sm:text-[14px] font-bold text-gray-600 dark:text-gray-300">No tasks found</p>
                        <p className="text-[8px] sm:text-[10px] opacity-60">Try adding a new task or changing your search</p>
                    </div>
                ) : (
                    <div className="space-y-6 pb-0">
                        {filteredAndGroupedTasks.map(([date, groupTasks], index) => (
                            <HoverCard
                                key={date}
                                rKey={`${date}-${refreshKey}`}
                                delay={0.2 + (index * 0.1)}
                                className="space-y-6 p-5 sm:p-7 glass-card bg-white dark:bg-gray-900/40 border-2 border-gray-100 dark:border-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                                        <Calendar size={14} className="text-[#47C4B7]" />
                                        <span className="text-[10px] sm:text-[13px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                            {date}
                                        </span>
                                    </div>
                                    <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                                </div>

                                <div className="space-y-4">
                                    <AnimatePresence mode="popLayout">
                                        {groupTasks.map(task => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                key={task._id}
                                                className={`p-3 sm:p-4 rounded-xl border flex flex-row items-center gap-3 group transition-colors ${task.status === 'completed'
                                                    ? 'bg-[#47C4B7]/10 dark:bg-[#47C4B7]/10 border-[#47C4B7]/20 dark:border-[#47C4B7]/10 hover:border-[#47C4B7]/40'
                                                    : 'bg-white dark:bg-gray-900/40 border-gray-100 dark:border-gray-800/50 hover:border-[#47C4B7]/50'
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

                                                    {/* Total Hours Stat Card (optional indicator) */}
                                                    {/* Mobile Separator - Only show if PDF exists */}
                                                    {task.pdfUrl && (
                                                        <div className="sm:hidden h-px bg-gray-100 dark:bg-gray-700/30 w-full mb-0.5" />
                                                    )}

                                                    {/* Action Buttons — bottom on mobile, right on desktop */}
                                                    <div className={`${!task.pdfUrl ? 'hidden sm:flex' : 'flex'} items-center gap-2 justify-end sm:shrink-0`}>
                                                        {task.pdfUrl && (
                                                            <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 text-[10px] sm:text-[13px] font-black relative z-10">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { 
                                                                        e.preventDefault(); 
                                                                        e.stopPropagation(); 
                                                                        handleOpenFile(task.pdfUrl); 
                                                                    }}
                                                                    className="flex items-center gap-1 hover:text-red-800 dark:hover:text-red-300 transition-colors bg-transparent border-none p-0 cursor-pointer"
                                                                    title="Open File"
                                                                >
                                                                     <FileText size={12} className="sm:w-[14px] sm:h-[14px] shrink-0" /> Open
                                                                </button>
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
                            </HoverCard>
                        ))}
                    </div>
                )}
            </div>

            {/* ---------- MODALS ---------- */}
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

                {/* ---------- DELETE TASK CONFIRMATION MODAL ---------- */}
                {deletingTaskId && (
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

                            <h3 className="text-[1.05rem] font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Delete Task?</h3>
                            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-6">
                                This task will be permanently removed from your today's list.
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
                                    className="flex-1 py-3 text-[15px] font-bold bg-[#47C4B7] text-white rounded-xl hover:bg-[#3db3a6] shadow-lg shadow-[#47C4B7]/25 transition"
                                >
                                    Yes, delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
