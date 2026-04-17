import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, CheckCircle2, Circle, Clock, RotateCcw } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { isSameDay, parseISO } from 'date-fns';
import { PageLoader } from '../components/ui/PageLoader';

export const TodayTasks = () => {
    const { tasks, isLoading, addTask, updateTask, deleteTask, toggleTaskStatus } = useTasks();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({ title: '', description: '' });

    const today = new Date();

    // PageLoader handled by AppLayout transition
    if (isLoading && tasks.length === 0) return null;

    const todayTasks = useMemo(() => {
        return tasks.filter(t => isSameDay(parseISO(t.date), today));
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
        setEditingId(null);
        setFormData({ title: '', description: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (task) => {
        setEditingId(task.id);
        setFormData({ title: task.title, description: task.description || '' });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        if (editingId) {
            updateTask(editingId, { title: formData.title, description: formData.description });
        } else {
            addTask(formData.title, formData.description, new Date().toISOString());
        }
        setIsModalOpen(false);
    };

    const statusColors = {
        pending: 'var(--text-primary)',
        completed: 'var(--success-color)',
        overdue: 'var(--danger-color)'
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', minHeight: '80vh' }}>
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ marginBottom: '2rem' }}
            >
                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Today's Tasks
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    What are you planning to study today?
                </p>
            </motion.header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2.5rem' }}>
                <AnimatePresence>
                    {sortedTasks.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-tertiary)' }}
                        >
                            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                                <CheckCircle2 size={48} opacity={0.2} />
                            </div>
                            <p>No tasks for today. Enjoy your day or add a new study goal!</p>
                        </motion.div>
                    ) : (
                        sortedTasks.map(task => {
                            const isCompleted = task.status === 'completed';
                            const isOverdue = task.status === 'overdue';

                            return (
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
                                >
                                    <Card
                                        padding="1.25rem"
                                        hoverable
                                        style={{
                                            opacity: isCompleted ? 0.7 : 1,
                                            borderLeft: `4px solid ${statusColors[task.status]}`
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                            <button
                                                onClick={() => toggleTaskStatus(task.id)}
                                                style={{ color: isCompleted ? 'var(--text-tertiary)' : isOverdue ? 'var(--danger-color)' : 'var(--text-tertiary)', marginTop: '0.25rem', transition: 'color 0.2s' }}
                                                title={isCompleted ? "Mark as Incomplete" : "Mark as Completed"}
                                            >
                                                {isCompleted ? <RotateCcw size={22} /> : isOverdue ? <Clock size={24} /> : <Circle size={24} />}
                                            </button>

                                            <div style={{ flex: 1 }}>
                                                <h3 style={{
                                                    fontSize: '1.125rem',
                                                    fontWeight: '600',
                                                    color: isCompleted ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                                    textDecoration: isCompleted ? 'line-through' : 'none'
                                                }}>
                                                    {task.title}
                                                </h3>
                                                {task.description && (
                                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                        {task.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem', opacity: isCompleted ? 0 : 1, transition: 'opacity 0.2s', className: 'task-actions' }}>
                                                <button onClick={() => openEditModal(task)} style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => deleteTask(task.id)} style={{ padding: '0.5rem', color: 'var(--danger-color)' }}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openAddModal}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--accent-color)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 10
                }}
            >
                <Plus size={28} />
            </motion.button>

            {/* Add / Edit Task Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Edit Task" : "Add New Task"}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <Input
                        label="Task Title"
                        placeholder="e.g. Read Chapter 5 of React Docs"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                        autoFocus
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                            Description (Optional)
                        </label>
                        <textarea
                            style={{
                                width: '100%',
                                padding: '0.625rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                fontSize: '1rem',
                                outline: 'none',
                                resize: 'vertical',
                                minHeight: '80px'
                            }}
                            placeholder="Add more details about what needs to be done..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingId ? "Save Changes" : "Add Task"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <style>
                {`
          .task-actions { opacity: 0.5; }
          .task-actions:hover, div[style*="borderLeft"]:hover .task-actions { opacity: 1 !important; }
        `}
            </style>
        </div>
    );
};
