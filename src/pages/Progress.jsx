import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Trophy, Target, Award } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { PageLoader } from '../components/ui/PageLoader';
import { Card } from '../components/ui/Card';
import { subDays, isSameDay, parseISO, format } from 'date-fns';

export const Progress = () => {
    const { tasks, isLoading } = useTasks();

    const stats = useMemo(() => {
        if (!Array.isArray(tasks)) return { total: 0, completed: 0, completionRate: 0, chartData: [], currentStreak: 0 };

        const total = tasks.length;
        const completed = tasks.filter(t => t?.status === 'completed').length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Calculate last 7 days metrics
        const today = new Date();
        const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));

        const chartData = last7Days.map(date => {
            const dayTasks = tasks.filter(t => {
                try {
                    const taskDate = t?.createdAt ? new Date(t.createdAt) : null;
                    return taskDate && !isNaN(taskDate.getTime()) && isSameDay(taskDate, date);
                } catch (e) {
                    return false;
                }
            });
            const dayTotal = dayTasks.length;
            const dayCompleted = dayTasks.filter(t => t?.status === 'completed').length;
            const dayRate = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;

            return {
                date,
                label: format(date, 'EEE'),
                total: dayTotal,
                completed: dayCompleted,
                rate: dayRate,
                allDone: dayTotal > 0 && dayTotal === dayCompleted
            };
        });

        let currentStreak = 0;
        // Calculate streak from today backwards
        for (let i = 6; i >= 0; i--) {
            if (chartData[i].completed > 0) {
                currentStreak++;
            } else if (i < 6) {
                break;
            }
        }

        return { total, completed, completionRate, chartData, currentStreak };
    }, [tasks]);

    // PageLoader handled by AppLayout transition
    if (isLoading) return null;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ marginBottom: '2rem' }}
            >
                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Your Progress
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Track your study habits and completion rates.
                </p>
            </motion.header>

            {/* Top Metrics Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {[
                    { icon: Trophy, label: 'Overall Rate', value: `${stats.completionRate}%`, color: 'var(--brand-primary)', bg: 'var(--brand-primary)' },
                    { icon: Target, label: 'Completed Tasks', value: stats.completed, color: 'var(--success-color)', bg: 'var(--success-bg)' },
                    { icon: Award, label: 'Current Streak', value: `${stats.currentStreak} Days`, color: 'var(--warning-color)', bg: 'rgba(245, 158, 11, 0.1)' }
                ].map((m, i) => (
                    <motion.div
                        key={m.label}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease: "easeOut" }}
                    >
                        <Card padding="1.5rem" hoverable>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '0.75rem', backgroundColor: m.bg, color: m.color === 'var(--brand-primary)' ? 'var(--bg-secondary)' : m.color, borderRadius: 'var(--radius-md)' }}>
                                    <m.icon size={24} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{m.label}</p>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{m.value}</h3>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Weekly Chart */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >

                <Card padding="2rem">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <TrendingUp size={24} color="var(--accent-color)" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>Last 7 Days Activity</h2>
                    </div>

                    <div style={{ display: 'flex', height: '250px', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                        {stats.chartData.map((day, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)' }}>{day.rate}%</span>

                                <div style={{
                                    width: '100%',
                                    maxWidth: '40px',
                                    height: '200px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-sm)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${day.rate}%` }}
                                        transition={{ duration: 1, type: 'spring', bounce: 0.3 }}
                                        style={{
                                            position: 'absolute',
                                            bottom: 0, left: 0, right: 0,
                                            backgroundColor: day.allDone ? 'var(--success-color)' : 'var(--accent-color)',
                                            borderRadius: 'var(--radius-sm)'
                                        }}
                                    />
                                </div>

                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{day.label}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--accent-color)' }} />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Partial</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success-color)' }} />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Perfect Day</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)' }} />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No Tasks / None</span>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};
