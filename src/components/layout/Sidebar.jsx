import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    CheckSquare,
    Clock,
    BookOpen,
    BarChart3,
    User,
    Settings,
    LogOut,
    X,
    Book,
    Info,
    MessageSquare,
    UserCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export const Sidebar = ({ isMobileOpen, closeMobile }) => {
    const { logout, user } = useAuth();

    const formatStudyTime = (hours) => {
        const totalSeconds = Math.round((hours || 0) * 3600);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const mainItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'All Tasks', path: '/all-tasks', icon: CheckSquare },
        { name: 'Total Study Hours', path: '/activity-log', icon: Clock },
        { name: 'Study Materials', path: '/study-materials', icon: BookOpen },
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    ];

    const settingsItems = [
        { name: 'Profile', path: '/profile', icon: User },
        { name: 'About', path: '/about', icon: Info },
        { name: 'Feedback', path: '/feedback', icon: MessageSquare },
    ];

    const sidebarContent = (
        <div style={{
            width: '280px',
            height: '100vh',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #f0f4f8',
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem 1.5rem',
            position: 'relative',
            fontFamily: "'Inter', sans-serif",
            boxShadow: '4px 0 24px rgba(0,0,0,0.02)'
        }}>
            {/* Logo Section */}
            <div style={{ marginBottom: '2.5rem', paddingLeft: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                        padding: '0.5rem',
                        background: '#4CB9AC',
                        borderRadius: '12px',
                        color: 'white',
                    }}>
                        <Book size={24} strokeWidth={2.5} />
                    </div>
                    <h1 style={{
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        color: '#1a202c',
                        margin: 0,
                    }}>
                        SkillSnap
                    </h1>
                </div>

                {/* Mobile Close Button */}
                {window.innerWidth < 768 && (
                    <button onClick={closeMobile} style={{
                        position: 'absolute',
                        top: '2.5rem',
                        right: '1.5rem',
                        color: '#a0aec0',
                        border: 'none',
                        background: 'rgba(0,0,0,0.03)',
                        padding: '0.5rem',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Navigation Links */}
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }} className="custom-scrollbar">
                {mainItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={window.innerWidth < 768 ? closeMobile : undefined}
                    >
                        {({ isActive }) => (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '0.85rem 1rem',
                                borderRadius: '14px',
                                color: isActive ? '#ffffff' : '#4a5568',
                                backgroundColor: isActive ? '#4CB9AC' : 'transparent',
                                fontWeight: isActive ? '700' : '600',
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                marginBottom: '0.25rem'
                            }}>
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                <span>{item.name}</span>
                            </div>
                        )}
                    </NavLink>
                ))}

                {/* Settings Section Label */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.25rem 1rem 0.6rem 1rem',
                    color: '#4CB9AC',
                    fontSize: '0.95rem',
                    fontWeight: '800',
                    marginTop: '0.5rem',
                }}>
                    <Settings size={20} strokeWidth={2.5} />
                    <span style={{ letterSpacing: '-0.01em' }}>Settings</span>
                </div>

                {/* Settings Sub-menu */}
                <div style={{
                    marginLeft: '1.2rem',
                    paddingLeft: '1rem',
                    borderLeft: '2px solid rgba(76, 185, 172, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    paddingBottom: '2.5rem'
                }}>
                    {settingsItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={window.innerWidth < 768 ? closeMobile : undefined}
                        >
                            {({ isActive }) => (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    color: isActive ? '#ffffff' : '#718096',
                                    backgroundColor: isActive ? '#4CB9AC' : 'transparent',
                                    fontWeight: isActive ? '700' : '600',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                }}>
                                    <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                    <span>{item.name}</span>
                                </div>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                <button
                    onClick={logout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem 1.25rem',
                        width: '100%',
                        color: '#ef4444',
                        fontWeight: '700',
                        borderRadius: '16px',
                        transition: 'all 0.2s ease',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <LogOut size={24} />
                    <span>Log out</span>
                </button>
            </div>
        </div>
    );

    // Mobile wrapper with overlay
    if (window.innerWidth < 768) {
        return (
            <AnimatePresence>
                {isMobileOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeMobile}
                            style={{
                                position: 'fixed', inset: 0,
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                backdropFilter: 'blur(4px)'
                            }}
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{ position: 'relative', zIndex: 101, height: '100%' }}
                        >
                            {sidebarContent}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        );
    }

    return (
        <div style={{ position: 'sticky', top: 0, height: '100vh', zIndex: 30 }}>
            {sidebarContent}
        </div>
    );
};
