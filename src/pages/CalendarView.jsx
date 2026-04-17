import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Plus, X, CheckCircle2, Trash2,
    Clock, Pencil, CalendarDays, FileText
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import toast from 'react-hot-toast';

/* ─── Helpers ─── */
const PAD = (n) => String(n).padStart(2, '0');

const getWeekDays = (baseDate) => {
    const d = new Date(baseDate);
    const day = d.getDay(); // 0 = Sun
    const monday = new Date(d);
    monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    return Array.from({ length: 7 }, (_, i) => {
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        return dt;
    });
};

const toDateKey = (date) =>
    `${date.getFullYear()}-${PAD(date.getMonth() + 1)}-${PAD(date.getDate())}`;

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6am – 11pm
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const PASTEL_COLORS = [
    { bg: 'bg-teal-100 dark:bg-teal-900/40', border: 'border-teal-300 dark:border-teal-600', text: 'text-teal-800 dark:text-teal-200' },
    { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-600', text: 'text-blue-800 dark:text-blue-200' },
    { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-300 dark:border-purple-600', text: 'text-purple-800 dark:text-purple-200' },
    { bg: 'bg-rose-100 dark:bg-rose-900/40', border: 'border-rose-300 dark:border-rose-600', text: 'text-rose-800 dark:text-rose-200' },
    { bg: 'bg-amber-100 dark:bg-amber-900/40', border: 'border-amber-300 dark:border-amber-600', text: 'text-amber-800 dark:text-amber-200' },
    { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-300 dark:border-green-600', text: 'text-green-800 dark:text-green-200' },
    { bg: 'bg-indigo-100 dark:bg-indigo-900/40', border: 'border-indigo-300 dark:border-indigo-600', text: 'text-indigo-800 dark:text-indigo-200' },
];

const getTaskColor = (id) => PASTEL_COLORS[parseInt(String(id).replace(/\D/g, '').slice(-2) || '0', 10) % PASTEL_COLORS.length];

/* ─── Main Component ─── */
export const CalendarView = () => {
    const { tasks, addTask, updateTask, deleteTask, toggleTaskStatus } = useTasks();
    const { user } = useAuth();
    const BASE_URL = 'http://localhost:5001';

    const today = new Date();
    const [currentWeekBase, setCurrentWeekBase] = useState(today);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [deletingTaskId, setDeletingTaskId] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);

    // Form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const weekDays = useMemo(() => getWeekDays(currentWeekBase), [currentWeekBase]);

    const prevWeek = () => {
        const d = new Date(currentWeekBase);
        d.setDate(d.getDate() - 7);
        setCurrentWeekBase(d);
    };
    const nextWeek = () => {
        const d = new Date(currentWeekBase);
        d.setDate(d.getDate() + 7);
        setCurrentWeekBase(d);
    };
    const goToday = () => setCurrentWeekBase(new Date());

    // Map tasks by date key
    const tasksByDate = useMemo(() => {
        const map = {};
        tasks.forEach(t => {
            const key = t.dueDate || toDateKey(new Date(t.createdAt));
            if (!map[key]) map[key] = [];
            map[key].push(t);
        });
        return map;
    }, [tasks]);

    const openAddModal = (dateStr = '', st = '09:00', et = '10:00') => {
        setEditingTask(null);
        setTitle('');
        setDescription('');
        setDueDate(dateStr || toDateKey(today));
        setStartTime(st);
        setEndTime(et);
        setIsModalOpen(true);
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setTitle(task.title);
        setDescription(task.description || '');
        setDueDate(task.dueDate || toDateKey(new Date(task.createdAt)));
        setStartTime(task.startTime || '09:00');
        setEndTime(task.endTime || '10:00');
        setIsModalOpen(true);
        setSelectedTask(null);
    };

    const [pdfFile, setPdfFile] = useState(null);
    const fileInputRef = React.useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
                toast.error('Only PDF or Image files are allowed');
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // 2MB limit for local storage
                toast.error('File size must be less than 2MB');
                return;
            }
            setPdfFile(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setIsSubmitting(true);
        try {
            let uploadedPdfUrl = editingTask?.pdfUrl || '';
            let fileName = editingTask?.fileName || '';

            if (pdfFile) {
                uploadedPdfUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(pdfFile);
                });
                fileName = pdfFile.name;
            }

            if (editingTask) {
                await updateTask(editingTask._id, { title, description, dueDate, startTime, endTime, pdfUrl: uploadedPdfUrl, fileName });
                toast.success('Task updated!');
            } else {
                await addTask({ title, description, pdfUrl: uploadedPdfUrl, fileName, dueDate, startTime, endTime });
                toast.success('Task added!');
            }
            closeModal();
            setPdfFile(null);
        } catch {
            toast.error('Failed to save task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
        setPdfFile(null);
    };

    const handleConfirmDelete = async () => {
        if (!deletingTaskId) return;
        await deleteTask(deletingTaskId);
        toast.success('Task deleted!');
        setDeletingTaskId(null);
        setSelectedTask(null);
    };

    const handleOpenFile = (fileUrl) => {
        if (!fileUrl) return;

        if (fileUrl.startsWith('data:')) {
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
                toast.error("Could not open this file.");
            }
        } else {
            window.open(`${BASE_URL}${fileUrl}`, '_blank');
        }
    };

    const monthYearLabel = (() => {
        const months = new Set(weekDays.map(d => d.getMonth()));
        if (months.size === 1) {
            return `${MONTH_NAMES[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}`;
        }
        return `${MONTH_NAMES[weekDays[0].getMonth()]} – ${MONTH_NAMES[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`;
    })();

    const todayKey = toDateKey(today);

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] min-h-0 overflow-hidden">
            {/* ── Header ── */}
            <PageHeader 
                icon={CalendarDays}
                title={monthYearLabel}
                subtitle="Visualize your study schedule for the week"
                right={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={prevWeek}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#47C4B7] hover:text-[#47C4B7] text-gray-500 transition-all font-bold"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={goToday}
                            className="px-3 py-1.5 text-[12px] font-bold rounded-lg bg-[#47C4B7] text-white shadow-md shadow-[#47C4B7]/25 hover:bg-[#3db3a6] transition-all"
                        >
                            Today
                        </button>
                        <button
                            onClick={nextWeek}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#47C4B7] hover:text-[#47C4B7] text-gray-500 transition-all font-bold"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => openAddModal()}
                            className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-[#47C4B7] text-white text-[12px] font-bold rounded-xl shadow-lg shadow-[#47C4B7]/25 hover:bg-[#3db3a6] transition-all"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Add Task
                        </button>
                    </div>
                }
            />

            {/* ── Calendar Grid ── */}
            <div className="flex-1 min-h-0 overflow-auto rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl custom-scrollbar">
                <div className="flex min-w-[640px]">
                    {/* Time gutter */}
                    <div className="w-14 shrink-0 border-r border-gray-100 dark:border-gray-800 sticky left-0 bg-white dark:bg-gray-900 z-20">
                        {/* Header spacer */}
                        <div className="h-12 border-b border-gray-100 dark:border-gray-800" />
                        {HOURS.map(h => (
                            <div
                                key={h}
                                className="h-16 flex items-start justify-end pr-2 pt-1 text-[10px] text-gray-400 dark:text-gray-500 font-semibold border-b border-gray-50 dark:border-gray-800/50"
                            >
                                {h === 12 ? 'Noon' : h > 12 ? `${h - 12}pm` : `${h}am`}
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    <div className="flex-1 grid grid-cols-7">
                        {weekDays.map((day, di) => {
                            const dateKey = toDateKey(day);
                            const isToday = dateKey === todayKey;
                            const dayTasks = tasksByDate[dateKey] || [];

                            return (
                                <div key={dateKey} className="flex flex-col border-r border-gray-100 dark:border-gray-800 last:border-r-0">
                                    {/* Day header */}
                                    <div
                                        className={`h-12 flex flex-col items-center justify-center border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors sticky top-0 bg-white dark:bg-gray-900 z-10 ${isToday ? 'bg-[#47C4B7]/5 dark:bg-[#47C4B7]/10' : ''}`}
                                        onClick={() => openAddModal(dateKey)}
                                    >
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                            {DAY_LABELS[di]}
                                        </span>
                                        <span className={`text-[15px] font-black mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-[#47C4B7] text-white shadow-md' : 'text-gray-700 dark:text-gray-200'}`}>
                                            {day.getDate()}
                                        </span>
                                    </div>

                                    {/* Hour cells */}
                                    <div className="flex-1 relative">
                                        {HOURS.map(h => (
                                            <div
                                                key={h}
                                                className="h-16 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors cursor-pointer"
                                                onClick={() => {
                                                    openAddModal(dateKey, `${PAD(h)}:00`, `${PAD(h + 1)}:00`);
                                                }}
                                            />
                                        ))}

                                        {/* Event blocks — overlay on the hour grid */}
                                        {dayTasks.map(task => {
                                            const st = task.startTime || '09:00';
                                            const et = task.endTime || '10:00';
                                            const [sh, sm] = st.split(':').map(Number);
                                            const [eh, em] = et.split(':').map(Number);
                                            const startMins = sh * 60 + sm - 6 * 60;
                                            const durMins = Math.max((eh * 60 + em) - (sh * 60 + sm), 30);
                                            const top = (startMins / 60) * 64;
                                            const height = Math.max((durMins / 60) * 64, 32);
                                            const color = getTaskColor(task._id);

                                            return (
                                                <motion.div
                                                    key={task._id}
                                                    layoutId={task._id}
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className={`absolute left-[1%] right-[1%] rounded-xl border-2 ${color.bg} ${color.border} ${color.text} px-2 py-1.5 overflow-hidden cursor-pointer hover:shadow-lg hover:z-20 transition-all shadow-sm group`}
                                                    style={{ 
                                                        top: `${top}px`, 
                                                        height: `${height}px`,
                                                        zIndex: task.status === 'completed' ? 5 : 10
                                                    }}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
                                                >
                                                    <div className="flex flex-col h-full">
                                                        <div className="flex items-center gap-1.5 mb-1 shrink-0">
                                                            <div className={`w-2.5 h-2.5 rounded-full border-2 flex items-center justify-center ${task.status === 'completed' ? 'bg-current border-current' : 'border-current opacity-50'}`}>
                                                                {task.status === 'completed' && <CheckCircle2 size={6} className="text-white" />}
                                                            </div>
                                                            <p className={`text-[11px] font-extrabold leading-none truncate ${task.status === 'completed' ? 'line-through opacity-50' : ''}`}>
                                                                {task.title}
                                                            </p>
                                                        </div>
                                                        {height >= 50 && (
                                                            <p className="text-[10px] opacity-70 font-bold truncate">
                                                                {st} – {et}
                                                            </p>
                                                        )}
                                                        {height >= 70 && task.description && (
                                                            <p className="text-[9px] opacity-60 line-clamp-2 leading-tight mt-1">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ─── Task Detail Popover ─── */}
            <AnimatePresence>
                {selectedTask && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
                        onClick={() => setSelectedTask(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <h3 className={`text-base font-black text-gray-900 dark:text-white leading-snug ${selectedTask.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                                    {selectedTask.title}
                                </h3>
                                <button onClick={() => setSelectedTask(null)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 font-bold">
                                    <X size={14} />
                                </button>
                            </div>

                            {selectedTask.description && (
                                <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                                    {selectedTask.description}
                                </p>
                            )}

                            <div className="flex flex-col gap-1.5 mb-4">
                                <div className="flex items-center gap-2 text-[12px] text-gray-400">
                                    <Clock size={13} />
                                    <span>{selectedTask.dueDate || toDateKey(new Date(selectedTask.createdAt))}</span>
                                    {selectedTask.startTime && <span>· {selectedTask.startTime} – {selectedTask.endTime}</span>}
                                </div>
                                {selectedTask.pdfUrl && (
                                    <button 
                                        onClick={() => handleOpenFile(selectedTask.pdfUrl)}
                                        className="flex items-center gap-2 text-[12px] font-bold text-[#47C4B7] hover:underline w-fit"
                                    >
                                        <FileText size={13} />
                                        <span>View Attachment</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => toggleTaskStatus(selectedTask._id).then(() => setSelectedTask(null))}
                                    className="flex-1 py-2 text-[12px] font-bold rounded-xl bg-[#47C4B7]/10 text-[#47C4B7] hover:bg-[#47C4B7]/20 transition-all"
                                >
                                    {selectedTask.status === 'completed' ? 'Mark Pending' : 'Mark Done ✓'}
                                </button>
                                <button
                                    onClick={() => openEditModal(selectedTask)}
                                    className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500 hover:bg-blue-100 transition-all font-bold"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    onClick={() => { setDeletingTaskId(selectedTask._id); setSelectedTask(null); }}
                                    className="p-2 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 transition-all font-bold"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Add/Edit Modal ─── */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 10, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-[#47C4B7]/5 blur-3xl rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />

                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                                    <div className="p-1.5 bg-[#47C4B7]/10 rounded-lg">
                                        {editingTask ? <Pencil size={14} className="text-[#47C4B7]" /> : <Plus size={14} className="text-[#47C4B7]" />}
                                    </div>
                                    {editingTask ? 'Edit Task' : 'Create Task'}
                                </h3>
                                <button onClick={closeModal} className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                                        Task Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text" required autoFocus
                                        value={title} onChange={e => setTitle(e.target.value)}
                                        className="w-full px-3.5 py-2.5 text-[14px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] text-gray-900 dark:text-white outline-none transition-all font-bold"
                                        placeholder="e.g., Study Data Structures"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300">Notes</label>
                                    <textarea
                                        rows="2" value={description} onChange={e => setDescription(e.target.value)}
                                        className="w-full px-3.5 py-2.5 text-[14px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] text-gray-900 dark:text-white outline-none resize-none transition-all"
                                        placeholder="Add notes or details..."
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300">Date</label>
                                    <input
                                        type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                                        className="w-full px-3.5 py-2.5 text-[14px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] text-gray-900 dark:text-white outline-none transition-all font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                     <div className="space-y-1.5">
                                         <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300">Start Time</label>
                                         <input
                                             type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                                             className="w-full px-3.5 py-2.5 text-[14px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] text-gray-900 dark:text-white outline-none transition-all font-bold"
                                         />
                                     </div>
                                     <div className="space-y-1.5">
                                         <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300">End Time</label>
                                         <input
                                             type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                                             className="w-full px-3.5 py-2.5 text-[14px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] text-gray-900 dark:text-white outline-none transition-all font-bold"
                                         />
                                     </div>
                                 </div>

                                 <div className="space-y-1.5">
                                     <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300 tracking-tight">Reference Material</label>
                                     <div
                                         onClick={() => fileInputRef.current?.click()}
                                         className={`w-full py-4 border-2 border-dashed ${pdfFile ? 'border-[#47C4B7] bg-[#47C4B7]/5' : 'border-gray-300 dark:border-gray-700 hover:border-[#47C4B7]/40 hover:bg-gray-50 dark:hover:bg-gray-800/50'} rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group`}
                                     >
                                         <div className={`p-2 rounded-full ${pdfFile ? 'bg-[#47C4B7]/20' : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-[#47C4B7]/10 transition-colors'}`}>
                                             <FileText size={18} className={pdfFile ? 'text-[#47C4B7]' : 'text-gray-400 group-hover:text-[#47C4B7] transition-colors'} />
                                         </div>
                                         <div className="text-center">
                                             {pdfFile ? (
                                                 <p className="text-[12px] font-bold text-[#47C4B7] truncate max-w-[200px] px-2">{pdfFile.name}</p>
                                             ) : (
                                                 <p className="text-[12px] font-medium text-gray-500">Upload PDF or Image (Max 2MB)</p>
                                             )}
                                         </div>
                                         <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf,image/*" className="hidden" />
                                     </div>
                                 </div>

                                <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        type="button" onClick={closeModal}
                                        className="flex-1 py-2.5 text-[14px] font-bold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit" disabled={isSubmitting || !title.trim()}
                                        className="flex-1 py-2.5 text-[14px] font-extrabold bg-[#47C4B7] hover:bg-[#3db3a6] text-white rounded-xl shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : 'Save Task'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Delete Confirm ─── */}
            <AnimatePresence>
                {deletingTaskId && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-[320px] shadow-2xl text-center border border-gray-100 dark:border-gray-800"
                        >
                            <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-100 dark:border-red-500/20">
                                <Trash2 size={20} />
                            </div>
                            <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">Delete Task?</h3>
                            <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-5">This will permanently remove it from the calendar.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeletingTaskId(null)}
                                    className="flex-1 py-2.5 text-[13px] font-bold bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-100 transition"
                                >
                                    Keep it
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="flex-1 py-2.5 text-[13px] font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-lg transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
