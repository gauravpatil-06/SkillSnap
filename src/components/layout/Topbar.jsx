import React, { useState, useEffect } from 'react';
import { Menu, Moon, Sun, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../utils/storage';

export const Topbar = ({ openMobile }) => {
    const { user } = useAuth();
    const [isDark, setIsDark] = useState(() => storage.get('theme', 'light') === 'dark');

    // Apply theme on mount and change
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            storage.set('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            storage.set('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark(!isDark);

    const today = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    }).format(new Date());

    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            backgroundColor: 'rgba(var(--bg-primary), 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-color)',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={openMobile}
                    className="mobile-only"
                    style={{
                        display: window.innerWidth < 768 ? 'block' : 'none',
                        color: 'var(--text-primary)'
                    }}
                >
                    <Menu size={24} />
                </button>
                <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Welcome back, {user?.name?.split(' ')[0] || 'User'}
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                        {today}
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={toggleTheme}
                    style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.borderColor = 'var(--text-tertiary)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                    aria-label="Toggle Theme"
                >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button
                    style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                    }}
                    aria-label="Notifications"
                >
                    <Bell size={20} />
                    {/* Notification dot */}
                    <span style={{
                        position: 'absolute',
                        top: '0.25rem',
                        right: '0.25rem',
                        width: '0.5rem',
                        height: '0.5rem',
                        backgroundColor: 'var(--accent-color)',
                        borderRadius: 'var(--radius-full)',
                        border: '2px solid var(--bg-secondary)'
                    }} />
                </button>

                <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '1rem',
                    marginLeft: '0.5rem',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
            </div>
        </header>
    );
};
