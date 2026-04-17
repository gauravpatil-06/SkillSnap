import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListTodo, CheckCircle2, Clock, Calendar, Search, RefreshCw, Trash2, User, FileText, ExternalLink, Download, Info, TrendingUp, ArrowUpDown } from 'lucide-react';
import api, { BASE_URL } from '../../utils/api';
import { PageLoader } from '../../components/ui/PageLoader';
import { PageHeader } from '../../components/ui/PageHeader';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { toast } from 'react-hot-toast';
import { format, subDays, startOfMonth, startOfYear } from 'date-fns';

export const AdminTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [deletingId, setDeletingId] = useState(null);
    const [filters, setFilters] = useState({
        searchTerm: '',
        from: '',
        to: '',
        timeFilter: 'all',
        sortBy: 'latest'
    });

    const filterOpts = [
        { id: 'all', label: 'All' },
        { id: '7d', label: 'Last 7 Days' },
        { id: 'monthly', label: 'Monthly' },
        { id: 'yearly', label: 'Yearly' }
    ];

    const fetchTasks = async () => {
        try {
            const { data } = await api.get('/admin/tasks');
            setTasks(data || []);
        } catch (error) {
            console.error('Failed to fetch tasks', error);
            toast.error('Failed to refresh data');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchTasks();
        setRefreshKey(prev => prev + 1);
        setTimeout(() => {
            setIsRefreshing(false);
        }, 600);
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        try {
            await api.delete(`/admin/tasks/${deletingId}`);
            setTasks(tasks.filter(t => t._id !== deletingId));
            toast.success('Task deleted successfully');
        } catch (error) {
            toast.error('Failed to delete task');
        } finally {
            setDeletingId(null);
        }
    };

    const handleDownload = async (fileUrl, originalName) => {
        try {
            const loadingToast = toast.loading('Downloading file...');
            const response = await fetch(`${BASE_URL}${fileUrl}`);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = originalName || 'task-document';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            toast.success('Download complete', { id: loadingToast });
        } catch (error) {
            console.error('Download error:', error);
            toast.error("Download failed");
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleTimePillClick = (id) => {
        setFilters(prev => ({ ...prev, timeFilter: id, from: '', to: '' }));
    };

    const filteredTasks = useMemo(() => {
        // First filter out "Deleted Users" or missing users
        let result = tasks.filter(t => t.userId && t.userId.name);

        // 1. Search Filter
        if (filters.searchTerm) {
            const query = filters.searchTerm.toLowerCase().trim();
            result = result.filter(t => {
                const studentName = (t.userId?.name || '').toLowerCase();
                const title = (t.title || '').toLowerCase();
                const description = (t.description || '').toLowerCase();
                const status = (t.status || '').toLowerCase();

                const dateObj = t.createdAt ? new Date(t.createdAt) : null;
                let dateMatches = false;
                if (dateObj) {
                    const dateStr1 = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }).toLowerCase();
                    const dateStr2 = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
                    const dateStr3 = format(dateObj, 'dd-MM-yyyy');
                    const dateStr4 = format(dateObj, 'dd/MM/yyyy');
                    const dateStr5 = format(dateObj, 'd MMM').toLowerCase();
                    dateMatches = dateStr1.includes(query) || dateStr2.includes(query) || dateStr3.includes(query) || dateStr4.includes(query) || dateStr5.includes(query);
                }

                return title.includes(query) ||
                    studentName.includes(query) ||
                    description.includes(query) ||
                    status.includes(query) ||
                    dateMatches;
            });
        }

        // 2. Date Filter
        let fromDate = filters.from ? new Date(filters.from) : null;
        let toDate = filters.to ? new Date(filters.to) : null;

        if (filters.timeFilter) {
            const now = new Date();
            if (filters.timeFilter === '7d') {
                fromDate = subDays(now, 7);
                toDate = now;
            } else if (filters.timeFilter === 'monthly') {
                fromDate = startOfMonth(now);
                toDate = now;
            } else if (filters.timeFilter === 'yearly') {
                fromDate = startOfYear(now);
                toDate = now;
            }
        }

        if (fromDate || toDate) {
            result = result.filter(t => {
                const itemDate = new Date(t.createdAt);
                if (fromDate) {
                    const bg = new Date(fromDate);
                    bg.setHours(0, 0, 0, 0);
                    if (itemDate < bg) return false;
                }
                if (toDate) {
                    const en = new Date(toDate);
                    en.setHours(23, 59, 59, 999);
                    if (itemDate > en) return false;
                }
                return true;
            });
        }

        // 3. Sort Filter
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return filters.sortBy === 'latest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [tasks, filters]);

    // PageLoader handled by AppLayout transition

    return (
        <div className="space-y-6 pb-10 max-w-full mx-auto px-0">
            {/* Header Area */}
            <PageHeader
                icon={ListTodo}
                title="All Tasks"
                subtitle="Monitor student productivity and task accountability."
                right={
                    <div className="flex items-center gap-2">
                        <motion.div
                            key={refreshKey}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="hidden lg:flex items-center gap-3 px-6 py-2.5 bg-[#47C4B7] rounded-xl shadow-lg shadow-[#47C4B7]/25 border border-transparent hover:border-white/50 transition-all cursor-default relative overflow-hidden min-w-[220px]"
                        >
                            {/* Trading Terminal Grid BG */}
                            <div className="absolute inset-0 opacity-[0.1] pointer-events-none"
                                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '12px 12px' }}>
                            </div>

                            {/* Refined Performance Sparkline BG */}
                            <div className="absolute inset-0 pointer-events-none opacity-[0.25]">
                                <svg width="100%" height="100%" viewBox="0 0 200 60" preserveAspectRatio="none">
                                    <path
                                        d="M0,55 L20,48 L40,52 L60,40 L80,45 L100,30 L120,35 L140,15 L160,20 L180,5 L200,8"
                                        stroke="white"
                                        strokeWidth="3"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M0,55 L20,48 L40,52 L60,40 L80,45 L100,30 L120,35 L140,15 L160,20 L180,5 L200,8 L200,60 L0,60 Z"
                                        fill="white"
                                        opacity="0.2"
                                    />
                                    <circle cx="180" cy="5" r="3" fill="white" className="animate-pulse" />
                                </svg>
                            </div>

                            <div className="relative z-10 w-full text-center sm:text-left">
                                <p className="text-[10px] font-bold text-white/90 tracking-wide">Total System Tasks</p>
                                <div className="flex items-baseline gap-1.5 justify-center sm:justify-start">
                                    <span className="text-3xl font-black tabular-nums text-white leading-tight">{filteredTasks.length}</span>
                                    <span className="text-[11px] font-black text-white/80 uppercase">Entries</span>
                                </div>
                                <p className="text-[9px] font-semibold text-white/60 italic mt-0.5 whitespace-nowrap">Available for all students</p>
                            </div>
                        </motion.div>
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className={`shrink-0 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-500 hover:text-[#47C4B7] transition-all hover:shadow-md ${isRefreshing ? 'cursor-not-allowed opacity-50' : ''}`}
                            title="Refresh Data"
                        >
                            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : 'hover:rotate-180 transition-transform duration-500'} />
                        </button>
                    </div>
                }
            />

            <div className="flex lg:hidden justify-end mb-4">
                <div className="flex items-center gap-3 px-6 py-3 bg-[#47C4B7] rounded-xl shadow-lg border border-transparent hover:border-white/50 transition-all cursor-default relative overflow-hidden w-full max-w-[240px]">
                    {/* Grid Overlay for Mobile */}
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
                    </div>

                    <div className="absolute inset-0 pointer-events-none opacity-[0.22]">
                        <svg width="100%" height="100%" viewBox="0 0 200 60" preserveAspectRatio="none">
                            <path
                                d="M0,55 L40,50 L80,35 L120,40 L160,15 L200,5"
                                stroke="white"
                                strokeWidth="4"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    <div className="relative z-10 w-full">
                        <p className="text-[10px] font-bold text-white/90">Total System Tasks</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black tabular-nums text-white">{filteredTasks.length}</span>
                            <span className="text-[11px] font-black text-white/80 uppercase">Entries</span>
                        </div>
                        <p className="text-[9px] font-semibold text-white/60 italic mt-0.5">Available for all students</p>
                    </div>
                </div>
            </div>

            <motion.div
                key={refreshKey}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
            >
                {/* Filter Bar */}
                <div className="p-0 sm:p-0 mb-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key="filter-bar"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col gap-3"
                    >
                        {/* Primary Filter Row: Search + Secondary Filters */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
                            {/* Search */}
                            <div className="relative flex-1 group">
                                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isRefreshing ? 'text-[#47C4B7] animate-pulse' : 'text-gray-400'}`} size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by student, title or date (e.g. 14 Mar)..."
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
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
                                        onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value, timeFilter: '' }))}
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
                                        onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value, timeFilter: '' }))}
                                        className="bg-transparent border-none text-[11px] font-black focus:ring-0 p-0 w-[105px] text-gray-500/80 hover:text-gray-500 outline-none uppercase"
                                    />

                                </div>

                                {/* Box 3: Sort */}
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, sortBy: prev.sortBy === 'latest' ? 'oldest' : 'latest' }))}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all whitespace-nowrap bg-transparent text-gray-500/80 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 min-w-[75px] justify-center"
                                >
                                    <ArrowUpDown size={11} className="text-[#47C4B7]" />
                                    {filters.sortBy === 'latest' ? 'Newest' : 'Oldest'}
                                </button>
                            </div>
                        </div>

                        {/* Row: Time Pills */}
                        <div className="flex items-center gap-2 flex-nowrap overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                            {filterOpts.map(pill => (
                                <button
                                    key={pill.id}
                                    onClick={() => handleTimePillClick(pill.id)}
                                    className={`px-4 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all whitespace-nowrap ${filters.timeFilter === pill.id
                                        ? 'bg-[#47C4B7] text-white shadow-lg shadow-[#47C4B7]/20 border-none'
                                        : 'bg-transparent text-gray-500/80 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'
                                        }`}
                                >
                                    {pill.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Table Area */}
            <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-white/20 rounded-3xl shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1500px] border-hidden">
                    <thead className="text-center">
                        <tr className="bg-[#47C4B7]/10 dark:bg-[#47C4B7]/5 border-b-2 border-gray-800/20 dark:border-white/40">
                            <th className="px-3 py-5 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest whitespace-nowrap text-center border-r border-gray-800/20 dark:border-white/40 w-20">Sr. No.</th>
                            <th className="px-[15px] py-5 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest whitespace-nowrap text-center border-r border-gray-800/20 dark:border-white/40 w-1">User Name</th>
                            <th className="px-5 py-5 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest whitespace-nowrap text-center border-r border-gray-800/20 dark:border-white/40">Task Title</th>
                            <th className="px-5 py-5 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest text-center border-r border-gray-800/20 dark:border-white/40">Description</th>
                            <th className="px-5 py-5 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest whitespace-nowrap text-center border-r border-gray-800/20 dark:border-white/40">Status</th>
                            <th className="px-5 py-5 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest whitespace-nowrap text-center border-r border-gray-800/20 dark:border-white/40">Open</th>
                            <th className="px-5 py-5 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest whitespace-nowrap text-center border-r border-gray-800/20 dark:border-white/40">Download</th>
                            <th className="px-5 py-5 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest whitespace-nowrap text-center border-r border-gray-800/20 dark:border-white/40">Date & Time</th>
                            <th className="px-5 py-5 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest whitespace-nowrap text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/20 dark:divide-white/40 border-b border-gray-800/20 dark:border-white/40">
                        <AnimatePresence mode='popLayout'>
                            {filteredTasks.map((t, i) => (
                                <motion.tr
                                    key={t._id || i}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 100,
                                        damping: 15
                                    }}
                                    className="hover:bg-[#47C4B7]/5 dark:hover:bg-[#47C4B7]/5 transition-colors group"
                                >
                                    <td className="px-6 py-5 text-center border-r border-gray-800/20 dark:border-white/40">
                                        <span className="text-xs font-black text-gray-800 dark:text-gray-200">{String(i + 1).padStart(2, '0')}</span>
                                    </td>
                                    <td className="px-[15px] py-5 border-r border-gray-800/20 dark:border-white/40 text-center">
                                       <div className="flex items-center justify-center gap-3">
                                            <UserAvatar name={t.userId?.name} avatar={t.userId?.avatar} size="w-9 h-9" />
                                            <span className="text-xs font-black text-gray-900 dark:text-white whitespace-nowrap">{t.userId?.name || 'Deleted User'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center border-r border-gray-800/20 dark:border-white/40">
                                        <span className="text-xs font-black text-gray-800 dark:text-gray-200">{t.title}</span>
                                    </td>
                                    <td className="px-6 py-5 text-center border-r border-gray-300 dark:border-white/20 max-w-[250px]">
                                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 whitespace-normal break-words line-clamp-3">{t.description || 'N/A'}</span>
                                    </td>
                                    <td className="px-6 py-5 text-center border-r border-gray-800/20 dark:border-white/40">
                                        <div className="flex justify-center">
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${t.status === 'completed'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/30'
                                                : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/30'
                                                }`}>
                                                {t.status === 'completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                {t.status}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center border-r border-gray-800/20 dark:border-white/40">
                                        {t.pdfUrl ? (
                                            <a
                                                href={`${BASE_URL}${t.pdfUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-[#47C4B7]/10 text-[#47C4B7] hover:bg-[#47C4B7] hover:text-white transition-all rounded-xl border border-[#47C4B7]/20 group/btn"
                                            >
                                                <ExternalLink size={14} className="group-hover/btn:scale-110 transition-transform" />
                                                <span className="text-[10px] font-black uppercase tracking-tighter">Open</span>
                                            </a>
                                        ) : <span className="text-[10px] font-black text-gray-300 uppercase">No File</span>}
                                    </td>
                                    <td className="px-6 py-5 text-center border-r border-gray-800/20 dark:border-white/40">
                                        {t.pdfUrl ? (
                                            <button
                                                onClick={() => handleDownload(t.pdfUrl, t.fileName)}
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all rounded-xl border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/30 group/btn"
                                            >
                                                <Download size={14} className="group-hover/btn:translate-y-0.5 transition-transform" />
                                                <span className="text-[10px] font-black uppercase tracking-tighter">Download</span>
                                            </button>
                                        ) : <span className="text-[10px] font-black text-gray-300 uppercase">No File</span>}
                                    </td>
                                    <td className="px-6 py-5 text-center border-r border-gray-300 dark:border-white/20 whitespace-nowrap">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                                <Calendar size={12} className="text-[#47C4B7]" />
                                                {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1 flex items-center gap-1">
                                                <Clock size={10} className="text-amber-500" />
                                                {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button
                                            onClick={() => setDeletingId(t._id)}
                                            className="p-2.5 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-xl border border-red-100 dark:bg-red-500/10 dark:border-red-500/30 transition-all active:scale-95 shadow-sm"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
                {filteredTasks.length === 0 && (
                    <div className="py-24 text-center">
                        <div className="bg-[#47C4B7]/10 w-12 h-12 sm:w-16 sm:h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Info size={24} className="text-[#47C4B7]" />
                        </div>
                        <p className="text-[12px] sm:text-sm text-gray-400 font-bold italic tracking-tight text-center px-4">No tasks matching your focus found.</p>
                    </div>
                )}
            </div>
        </motion.div>

            {/* ---------- DELETE CONFIRMATION MODAL ---------- */}
            <AnimatePresence>
                {deletingId && (
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
                                This task will be permanently removed.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeletingId(null)}
                                    className="flex-1 py-3 text-[15px] font-bold bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-750 transition"
                                >
                                    No, keep it
                                </button>
                                <button
                                    onClick={confirmDelete}
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
