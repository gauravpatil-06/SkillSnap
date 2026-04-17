import { format, isSameDay } from 'date-fns';
import { PageLoader } from '../components/ui/PageLoader';
import { PageHeader } from '../components/ui/PageHeader';
import { BASE_URL } from '../utils/api';
import { Plus, Trash2, CheckCircle2, Circle, Clock, FileText, Upload, Pencil, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export const TodayTasks = () => {
    const { tasks, isLoading, addTask, updateTask, deleteTask, toggleTaskStatus } = useTasks();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [pdfFile, setPdfFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = React.useRef(null);

    const today = new Date();

    // PageLoader handled by AppLayout transition
    if (isLoading && tasks.length === 0) return null;

    const handleDownloadFile = async (fileUrl, originalName) => {
        try {
            const loadingToast = toast.loading('Downloading file...');
            let downloadUrl = fileUrl;
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

    const todayTasks = useMemo(() => {
        return tasks.filter(t => {
            const dateToCompare = t.dueDate || t.date || t.createdAt;
            if (!dateToCompare) return false;
            try {
                return isSameDay(new Date(dateToCompare), today);
            } catch (e) {
                return false;
            }
        });
    }, [tasks, today]);

    const sortedTasks = useMemo(() => {
        // pending first, completed last
        return [...todayTasks].sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (a.status !== 'completed' && b.status === 'completed') return -1;
            return 0;
        });
    }, [todayTasks]);

    const openAddModal = () => {
        setEditingTask(null);
        setTitle('');
        setDescription('');
        setDueDate(new Date().toISOString().split('T')[0]);
        setStartTime('09:00');
        setEndTime('10:00');
        setPdfFile(null);
        setIsModalOpen(true);
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setTitle(task.title);
        setDescription(task.description || '');
        setDueDate(task.dueDate || new Date().toISOString().split('T')[0]);
        setStartTime(task.startTime || '09:00');
        setEndTime(task.endTime || '10:00');
        setPdfFile(null);
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
                toast.error('Only PDF or Image files are allowed');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                toast.error('File too large (Max 2MB)');
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

            const taskData = {
                title, description,
                dueDate: dueDate || new Date().toISOString().split('T')[0],
                startTime, endTime,
                pdfUrl: uploadedPdfUrl, fileName
            };

            if (editingTask) {
                await updateTask(editingTask._id, taskData);
                toast.success('Task updated!');
            } else {
                await addTask(taskData);
                toast.success('Task added for today!');
            }
            setIsModalOpen(false);
        } catch {
            toast.error('Failed to save task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const statusColors = {
        pending: 'var(--text-primary)',
        completed: 'var(--success-color)',
        overdue: 'var(--danger-color)'
    };

    return (
        <div className="max-w-3xl mx-auto pb-10">
            <PageHeader 
                icon={CheckCircle2}
                title="Today's Tasks"
                subtitle="What are you planning to study today?"
                right={
                   <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 p-2 bg-[#47C4B7] text-white rounded-full hover:bg-[#3db3a6] transition-all shadow-lg"
                   >
                    <Plus size={20} />
                   </button>
                }
            />

            <div className="space-y-4 mt-6">
                <AnimatePresence>
                    {sortedTasks.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-20 text-gray-400"
                        >
                            <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-bold text-gray-500">No tasks for today.</p>
                        </motion.div>
                    ) : (
                        sortedTasks.map((task, i) => {
                            const isCompleted = task.status === 'completed';
                            return (
                                <motion.div
                                    key={task._id}
                                    layout
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                    className={`group p-4 rounded-3xl border-2 transition-all ${isCompleted ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-[#47C4B7]/40 shadow-sm hover:shadow-md'}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <button
                                            onClick={() => toggleTaskStatus(task._id)}
                                            className={`mt-1 flex-shrink-0 transition-colors ${isCompleted ? 'text-[#47C4B7]' : 'text-gray-300 hover:text-[#47C4B7]'}`}
                                        >
                                            {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <h3 className={`text-base font-black truncate tracking-tight transition-all ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                                {task.title}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
                                                    <Clock size={12} />
                                                    {task.startTime} – {task.endTime}
                                                </div>
                                                {task.pdfUrl && (
                                                    <div className="flex items-center gap-2.5 mt-2">
                                                        <button
                                                            onClick={() => handleOpenFile(task.pdfUrl)}
                                                            className="flex items-center gap-1.5 text-[11px] font-black text-blue-600 hover:text-blue-800 transition-colors"
                                                        >
                                                            <FileText size={12} /> Open Doc
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownloadFile(task.pdfUrl, task.fileName)}
                                                            className="flex items-center gap-1.5 text-[11px] font-black text-[#47C4B7] hover:text-[#3db3a6] transition-colors"
                                                        >
                                                            <Download size={12} /> Download
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {task.description && (
                                                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(task)} className="p-2 text-gray-400 hover:text-[#47C4B7]">
                                                <Pencil size={18} />
                                            </button>
                                            <button onClick={() => deleteTask(task._id)} className="p-2 text-gray-400 hover:text-red-500">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Add / Edit Task Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 10, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                             <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                                    <div className="p-1.5 bg-[#47C4B7]/10 rounded-lg">
                                        {editingTask ? <Pencil size={14} className="text-[#47C4B7]" /> : <Plus size={14} className="text-[#47C4B7]" />}
                                    </div>
                                    {editingTask ? 'Edit Task' : 'Create Task'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300">Task Title <span className="text-red-500">*</span></label>
                                    <input
                                        type="text" required
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
                                        placeholder="Add notes..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300">Start Time</label>
                                        <input
                                            type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                                            className="w-full px-3.5 py-2.5 text-[14px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300">End Time</label>
                                        <input
                                            type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                                            className="w-full px-3.5 py-2.5 text-[14px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                     <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300 tracking-tight">Reference Material</label>
                                     <div
                                         onClick={() => fileInputRef.current?.click()}
                                         className={`w-full py-3 border-2 border-dashed ${pdfFile ? 'border-[#47C4B7] bg-[#47C4B7]/5' : 'border-gray-200 dark:border-gray-700 hover:border-[#47C4B7]/40 hover:bg-gray-50 dark:hover:bg-gray-800/50'} rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all group`}
                                     >
                                         <FileText size={16} className={pdfFile ? 'text-[#47C4B7]' : 'text-gray-400 group-hover:text-[#47C4B7]'} />
                                         <p className="text-[11px] font-bold text-gray-500">{pdfFile ? pdfFile.name : 'Upload PDF/Image'}</p>
                                         <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf,image/*" className="hidden" />
                                     </div>
                                 </div>

                                <button
                                    type="submit" disabled={isSubmitting || !title.trim()}
                                    className="w-full py-3 text-[14px] font-extrabold bg-[#47C4B7] hover:bg-[#3db3a6] text-white rounded-xl shadow-md transition"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Task'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
