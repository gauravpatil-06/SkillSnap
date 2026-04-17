import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Search, CheckCircle, Circle, AlertCircle, Clock, Trash2, LayoutGrid } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { PageLoader } from '../components/ui/PageLoader';
import { PageHeader } from '../components/ui/PageHeader';
import { HoverCard } from '../components/ui/HoverCard';
import toast from 'react-hot-toast';

export const EisenhowerMatrix = () => {
    const { tasks, isLoading, updateTask, toggleTaskStatus } = useTasks();
    const [searchQuery, setSearchQuery] = useState('');

    if (isLoading) return <PageLoader />;

    // Helper for drag & drop
    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ taskId }));
    };

    const handleDragOver = (e) => {
        e.preventDefault(); 
    };

    const handleDrop = (e, quadrantId) => {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (data?.taskId) {
                updateTask(data.taskId, { quadrant: quadrantId });
            }
        } catch (err) {
            console.error('Drop failed', err);
        }
    };

    // Filter tasks based on search
    const filteredTasks = tasks.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Categorize
    const q1 = filteredTasks.filter(t => t.quadrant === 1);
    const q2 = filteredTasks.filter(t => t.quadrant === 2);
    const q3 = filteredTasks.filter(t => t.quadrant === 3);
    const q4 = filteredTasks.filter(t => t.quadrant === 4);
    const unassigned = filteredTasks.filter(t => !t.quadrant);

    const TaskItem = ({ t }) => (
        <motion.div
            layout
            draggable
            onDragStart={(e) => handleDragStart(e, t._id)}
            className="group flex flex-col p-3.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700/50 rounded-2xl mb-3 cursor-grab hover:shadow-lg transition-all active:scale-95 active:rotate-1 shadow-sm"
        >
            <div className="flex items-start gap-3">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskStatus(t._id);
                    }}
                    className="shrink-0 mt-0.5 transition-transform hover:scale-110"
                >
                    {t.status === 'completed' ? (
                        <CheckCircle size={18} className="text-[#47C4B7]" />
                    ) : (
                        <Circle size={18} className="text-gray-300 dark:text-gray-600 hover:text-[#47C4B7] transition-colors" />
                    )}
                </button>
                <div className={`flex-1 min-w-0 ${t.status === 'completed' ? 'opacity-50' : ''}`}>
                    <h4 className={`text-[13px] font-black text-gray-800 dark:text-gray-100 truncate tracking-tight ${t.status === 'completed' ? 'line-through' : ''}`}>
                        {t.title}
                    </h4>
                    {(t.dueDate || t.createdAt) && (
                        <p className="text-[10px] font-bold text-gray-400 truncate mt-0.5 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(t.dueDate || t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );

    const Quadrant = ({ id, title, icon: Icon, bgClass, textClass, borderClass, tasks, color }) => (
        <HoverCard
            className={`flex flex-col h-full min-h-[380px] bg-white dark:bg-gray-900 border-2 ${borderClass} rounded-[32px] p-6 shadow-xl relative overflow-hidden group`}
            extraHover={{ borderColor: color, boxShadow: `0 30px 60px -12px ${color}33` }}
        >
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${bgClass} opacity-20 blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-40 animate-pulse`} />
            
            <div 
                className="relative flex-1 flex flex-col pt-2"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, id)}
            >
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${bgClass} ${textClass} shadow-inner`}>
                            <Icon size={18} strokeWidth={3} />
                        </div>
                        <h2 className={`text-[15px] font-black ${textClass} tracking-tight`}>
                            {title}
                        </h2>
                    </div>
                    <span className={`px-2.5 py-1 ${bgClass} ${textClass} text-[10px] font-black rounded-full shadow-sm`}>
                        {tasks.length}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[200px]">
                    {tasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-10">
                            <div className={`p-4 rounded-full ${bgClass} opacity-10 mb-3`}>
                                <LayoutGrid size={32} className={textClass} />
                            </div>
                            <span className={`text-[11px] font-black ${textClass} uppercase tracking-[0.2em] opacity-40`}>Drop tasks here</span>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {tasks.map(t => <TaskItem key={t._id} t={t} />)}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </HoverCard>
    );

    return (
        <div className="space-y-6 pb-10 max-w-full px-0">
            <PageHeader 
                icon={AlertCircle}
                title="Priority Matrix"
                subtitle="Prioritize your tasks using the 4 quadrants"
                right={
                   <div className="relative w-full sm:w-[450px] shrink-0 z-10 transition-all duration-300 focus-within:sm:w-[550px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1f2937] border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-[14px] font-bold focus:outline-none focus:border-[#47C4B7] dark:focus:border-[#47C4B7] transition-all shadow-sm focus:shadow-xl"
                    />
                   </div>
                }
            />

            {/* Unassigned Tasks Reel */}
            {unassigned.length > 0 && (
                <HoverCard
                    rKey="unassigned-reel"
                    className="mb-10 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-[32px] p-8 shadow-xl relative overflow-hidden group"
                    extraHover={{ borderColor: 'rgba(71, 196, 183, 0.4)', boxShadow: '0 30px 60px -12px rgba(71, 196, 183, 0.15)' }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, null)}
                >
                    {/* Background Pattern / Gradient */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#47C4B7] opacity-5 blur-[80px] -mr-32 -mt-32 transition-opacity group-hover:opacity-10" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8 pb-3 border-b border-gray-100 dark:border-gray-800">
                           <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[#47C4B7]/10 text-[#47C4B7]">
                                    <LayoutGrid size={18} strokeWidth={3} />
                                </div>
                                <h3 className="text-[14px] font-black text-gray-700 dark:text-gray-200 tracking-tight uppercase">
                                    Inbox / Unassigned
                                </h3>
                           </div>
                           <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[11px] font-black rounded-full shadow-sm">
                                {unassigned.length} Tasks
                           </span>
                        </div>

                        <div className="flex gap-5 overflow-x-auto pb-6 pt-1 snap-x custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {unassigned.map(t => (
                                    <motion.div 
                                        key={t._id} 
                                        layout 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="w-72 shrink-0 snap-start"
                                    >
                                        <TaskItem t={t} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </HoverCard>
            )}

            {/* Matrix Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <Quadrant
                    id={1}
                    title="Urgent & Important"
                    icon={AlertCircle}
                    bgClass="bg-rose-50 dark:bg-rose-900/20"
                    textClass="text-rose-500"
                    borderClass="border-rose-100 dark:border-rose-900/30"
                    color="#f43f5e"
                    tasks={q1}
                />
                <Quadrant
                    id={2}
                    title="Not Urgent & Important"
                    icon={Clock}
                    bgClass="bg-amber-50 dark:bg-amber-900/20"
                    textClass="text-amber-500"
                    borderClass="border-amber-100 dark:border-amber-900/30"
                    color="#f59e0b"
                    tasks={q2}
                />
                <Quadrant
                    id={3}
                    title="Urgent & Not Important"
                    icon={Target}
                    bgClass="bg-blue-50 dark:bg-blue-900/20"
                    textClass="text-blue-500"
                    borderClass="border-blue-100 dark:border-blue-900/30"
                    color="#3b82f6"
                    tasks={q3}
                />
                <Quadrant
                    id={4}
                    title="Not Urgent & Not Important"
                    icon={CheckCircle}
                    bgClass="bg-teal-50 dark:bg-teal-900/20"
                    textClass="text-teal-500"
                    borderClass="border-teal-100 dark:border-teal-900/30"
                    color="#14b8a6"
                    tasks={q4}
                />
            </div>
        </div>
    );
};
