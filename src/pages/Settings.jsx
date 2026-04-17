import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Target, Moon, Sun, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { storage } from '../utils/storage';
import { PageLoader } from '../components/ui/PageLoader';

export const Settings = () => {
    const { user, updateProfile } = useAuth();
    const { dailyGoal, updateDailyGoal, isLoading } = useTasks();

    const [name, setName] = useState(user?.name || '');
    const [goal, setGoal] = useState(dailyGoal.toString());
    const [isDark, setIsDark] = useState(() => storage.get('theme', 'light') === 'dark');
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        if (newTheme) {
            document.documentElement.classList.add('dark');
            storage.set('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            storage.set('theme', 'light');
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccessMsg('');

        setTimeout(() => {
            if (name !== user?.name) {
                updateProfile(name);
            }

            const parsedGoal = parseInt(goal, 10);
            if (!isNaN(parsedGoal) && parsedGoal >= 0) {
                updateDailyGoal(parsedGoal);
            }

            setIsSaving(false);
            setSuccessMsg('Settings saved successfully!');

            setTimeout(() => setSuccessMsg(''), 3000);
        }, 600);
    };

    // PageLoader handled by AppLayout transition
    if (isLoading) return null;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ marginBottom: '2rem' }}
            >
                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Settings
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Manage your account preferences and goals.
                </p>
            </motion.header>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
            >

                <Card padding="2rem">
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Profile Section */}
                        <section>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <User size={20} color="var(--accent-color)" /> Profile
                            </h2>
                            <div style={{ maxWidth: '400px' }}>
                                <Input
                                    label="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div style={{ marginTop: '1rem', maxWidth: '400px' }}>
                                <Input
                                    label="Email Address"
                                    value={user?.email || ''}
                                    disabled
                                    title="Email cannot be changed"
                                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                />
                            </div>
                        </section>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

                        {/* Preferences Section */}
                        <section>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Target size={20} color="var(--accent-color)" /> Study Goals
                            </h2>
                            <div style={{ maxWidth: '400px' }}>
                                <Input
                                    label="Daily Task Goal"
                                    type="number"
                                    min="0"
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    placeholder="e.g. 5"
                                />
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    Set to 0 to disable the daily progress bar.
                                </p>
                            </div>
                        </section>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

                        {/* Appearance Section */}
                        <section>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {isDark ? <Moon size={20} color="var(--accent-color)" /> : <Sun size={20} color="var(--accent-color)" />}
                                Appearance
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '400px', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                <div>
                                    <h3 style={{ fontWeight: '500' }}>Dark Mode</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Toggle the app's visual theme.</p>
                                </div>

                                {/* Custom Toggle Switch */}
                                <button
                                    type="button"
                                    onClick={toggleTheme}
                                    style={{
                                        width: '3rem',
                                        height: '1.5rem',
                                        backgroundColor: isDark ? 'var(--accent-color)' : 'var(--text-tertiary)',
                                        borderRadius: 'var(--radius-full)',
                                        position: 'relative',
                                        transition: 'background-color 0.3s'
                                    }}
                                >
                                    <motion.div
                                        layout
                                        initial={false}
                                        animate={{
                                            x: isDark ? '1.625rem' : '0.125rem',
                                        }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        style={{
                                            width: '1.25rem',
                                            height: '1.25rem',
                                            backgroundColor: 'white',
                                            borderRadius: '50%',
                                            position: 'absolute',
                                            top: '0.125rem'
                                        }}
                                    />
                                </button>
                            </div>
                        </section>

                        {/* Form Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                            <Button type="submit" size="lg" isLoading={isSaving}>
                                <Save size={18} style={{ marginRight: '0.5rem' }} />
                                Save Changes
                            </Button>
                            {successMsg && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    style={{ color: 'var(--success-color)', fontSize: '0.875rem', fontWeight: '500' }}
                                >
                                    {successMsg}
                                </motion.span>
                            )}
                        </div>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
};
