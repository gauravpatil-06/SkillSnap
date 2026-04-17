import React, { useState, useEffect, useMemo } from 'react';
import { LOADER_DELAY_MS, PAGE_TRANSITION_DURATION } from '../../config/loaderConfig';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogOut, LayoutDashboard, Sun, Moon, BookOpen, Clock, FileText,
    CheckSquare, BarChart3, Menu, X, User, History,
    MessageSquare, Settings, Activity, CalendarDays, Grid
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { PageLoader } from '../ui/PageLoader';
import { UserAvatar } from '../ui/UserAvatar';
import { Info } from 'lucide-react';

/* ─── Nav Structure ─── */
const NAV_STRUCTURE = [
    {
        type: 'link',
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        type: 'link',
        label: 'Calendar',
        path: '/all-tasks',
        icon: CalendarDays,
    },
    {
        type: 'link',
        label: 'Priority Matrix',
        path: '/matrix',
        icon: Grid,
    },
    {
        type: 'link',
        label: 'Focus Mode',
        path: '/focus-mode',
        icon: Clock,
    },
    {
        type: 'link',
        label: 'Total Study Hours',
        path: '/activity-log',
        icon: Clock,
    },
    {
        type: 'link',
        label: 'Study Materials',
        path: '/study-materials',
        icon: BookOpen,
    },
    {
        type: 'group',
        label: 'Analytics',
        icon: BarChart3,
        children: [
            { label: 'Overview', path: '/analytics', icon: Activity },
            { label: 'History', path: '/history', icon: History },
        ],
    },
    {
        type: 'group',
        label: 'Settings',
        icon: Settings,
        children: [
            { label: 'Profile', path: '/profile', icon: User },
            { label: 'About', path: '/about', icon: Info },
            { label: 'Feedback', path: '/feedback', icon: MessageSquare },
        ],
    },
];


/* ─── Single Nav Link ─── */
const NavItem = ({ item, isActive, onClick }) => (
    <Link
        to={item.path}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-[0.8rem] transition-all duration-200 ${isActive
            ? 'bg-[#47C4B7] text-white shadow-md shadow-[#47C4B7]/30'
            : 'text-gray-700 dark:text-gray-200 hover:bg-[#47C4B7]/10 hover:text-[#47C4B7]'
            }`}
    >
        <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
        <span>{item.label}</span>
    </Link>
);

/* ─── Group Header + Collapsible Children ─── */
const NavGroup = ({ group, location, onNavigate }) => {
    const isAnyChildActive = group.children.some(c => location.pathname === c.path || location.pathname.startsWith(c.path + '/'));
    const [open, setOpen] = useState(isAnyChildActive);

    // Auto-expand when navigating to a child route externally
    useEffect(() => {
        if (isAnyChildActive) setOpen(true);
    }, [isAnyChildActive]);

    return (
        <div>
            {/* Group Header */}
            <button
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-[0.8rem] transition-all duration-200 ${isAnyChildActive
                    ? 'text-[#47C4B7]'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-[#47C4B7]/10 hover:text-[#47C4B7]'
                    }`}
            >
                <group.icon size={15} strokeWidth={2} />
                <span>{group.label}</span>
            </button>

            {/* Children */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="children"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="ml-3 pl-3 border-l border-[#47C4B7]/20 mt-1 mb-1 space-y-0.5">
                            {group.children.map(child => (
                                <NavItem
                                    key={child.path + child.label}
                                    item={child}
                                    isActive={location.pathname === child.path}
                                    onClick={onNavigate}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ─── AppLayout ─── */
export const AppLayout = () => {
    const { isSessionValid, isLoading, logout, user } = useAuth();
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [pageLoading, setPageLoading] = useState(false);
    const location = useLocation();

    // Trigger page loader on route changes
    useEffect(() => {
        setPageLoading(true);
        const timer = setTimeout(() => {
            setPageLoading(false);
        }, LOADER_DELAY_MS);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    // Always keep browser tab title as "SkillSnap"
    useEffect(() => { document.title = 'SkillSnap'; }, [location.pathname]);

    if (isLoading) {
        return <PageLoader />;
    }

    if (!isSessionValid) {
        return <Navigate to="/login" replace />;
    }

    const closeSidebar = () => setSidebarOpen(false);

    const navStructure = NAV_STRUCTURE;

    const SidebarContent = () => (
        <div className="flex flex-col h-full w-72 glass border-r border-[#47C4B7]/20 dark:border-[#47C4B7]/10">
            {/* Logo */}
            <div className="p-6 flex items-center justify-between flex-shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-[#47C4B7]/15 rounded-xl">
                            <BookOpen size={22} className="text-[#47C4B7]" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-xl font-extrabold logo-text tracking-tight">SkillSnap</h1>
                    </div>
                    <span className="text-[0.7rem] text-gray-400 dark:text-gray-500 font-medium tracking-wider pl-0.5">
                        Learn · Focus · Grow
                    </span>
                </div>
                <button
                    onClick={closeSidebar}
                    className="lg:hidden text-gray-400 hover:text-gray-700 dark:hover:text-white p-1"
                >
                    <X size={22} />
                </button>
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-gray-100 dark:bg-gray-800 mb-4" />

            {/* Nav */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pb-4">
                {navStructure.map((item, i) =>
                    item.type === 'link' ? (
                        <NavItem
                            key={item.path}
                            item={{ ...item, icon: item.icon }}
                            isActive={location.pathname === item.path || location.pathname === '/'}
                            onClick={closeSidebar}
                        />
                    ) : (
                        <NavGroup
                            key={item.label}
                            group={item}
                            location={location}
                            onNavigate={closeSidebar}
                        />
                    )
                )}
            </nav>

            {/* Bottom */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2 flex-shrink-0">
                {/* Dark mode toggle */}
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium text-sm"
                >
                    {darkMode
                        ? <Sun size={18} className="text-amber-400" />
                        : <Moon size={18} />
                    }
                    <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                {/* User row */}
                <div className="flex items-center justify-between px-2 gap-2">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                        <UserAvatar name={user?.name} avatar={user?.avatar} size="w-9 h-9" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name}</span>
                            <span className="text-[0.7rem] text-gray-400 truncate">{user?.email}</span>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <Toaster position="top-right" />

            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                        onClick={closeSidebar}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar — desktop static, mobile slide-in */}
            <div className={`fixed lg:static top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <SidebarContent />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative min-w-0">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between p-4 glass border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-gray-600 dark:text-gray-200 hover:text-[#47C4B7] transition-colors p-1"
                    >
                        <Menu size={26} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-[#47C4B7]/15 rounded-lg">
                            <BookOpen size={18} className="text-[#47C4B7]" strokeWidth={2.5} />
                        </div>
                        <span className="font-extrabold logo-text text-lg tracking-tight">SkillSnap</span>
                    </div>
                    <div className="w-8" />
                </header>

                {/* Page Content */}
                <main className="flex-1 w-full overflow-x-hidden overflow-y-auto custom-scrollbar p-2.5 md:p-5 lg:p-[30px]">
                    <div className="h-full mx-auto w-full relative max-w-full">
                        {pageLoading && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-gray-950 backdrop-blur-sm">
                                <PageLoader />
                            </div>
                        )}
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: pageLoading ? 0 : 1, y: pageLoading ? 12 : 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: PAGE_TRANSITION_DURATION }}
                            className={`h-full w-full ${pageLoading ? 'pointer-events-none overflow-hidden' : ''}`}
                        >
                            <Outlet />
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
};
