import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles, LogIn, ArrowRight, BookOpen,
    CheckCircle2, Star, Target, Zap, Clock,
    BarChart3, FolderOpen, Flame, Rocket,
    Layers, Layout, LayoutDashboard, Calendar,
    FileText, TrendingUp, ShieldCheck, ZapOff,
    Check, User, Moon, Sun, ChevronRight, Menu, X
} from 'lucide-react';
import { storage } from '../utils/storage';
import { AboutLandingPage } from './AboutLandingPage';
import AnimatedCounter from '../components/common/AnimatedCounter';

export const LandingPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState('Home');
    const [isDark, setIsDark] = React.useState(() => storage.get('theme', 'light') === 'dark');
    const [activeFeature, setActiveFeature] = React.useState(null);
    const [activeStep, setActiveStep] = React.useState(null);
    const [activeStat, setActiveStat] = React.useState(null);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    // Apply theme on mount and change
    React.useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            storage.set('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            storage.set('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark(!isDark);

    // Stats Data
    const stats = [
        { label: 'Study Hours Logged', value: '10,000+', icon: <Clock /> },
        { label: 'Active Students', value: '5,000+', icon: <User /> },
        { label: 'Tasks Completed', value: '25,000+', icon: <CheckCircle2 /> },
        { label: 'Study Materials Uploaded', value: '1,000+', icon: <FileText /> }
    ];

    // Feature Cards
    const features = [
        {
            icon: <BookOpen className="text-[#47C4B7]" />,
            title: "Smart Task Management",
            desc: "Create and organize daily study tasks efficiently and stay structured."
        },
        {
            icon: <Clock className="text-[#47C4B7]" />,
            title: "Focus Sessions & Timer",
            desc: "Use powerful timers to improve concentration and build deep work habits."
        },
        {
            icon: <BarChart3 className="text-[#47C4B7]" />,
            title: "Advanced Analytics",
            desc: "Track study hours, monitor productivity, and understand performance patterns."
        },
        {
            icon: <FolderOpen className="text-[#47C4B7]" />,
            title: "Study Materials",
            desc: "Upload and manage PDFs, notes, and documents in one organized space."
        },
        {
            icon: <Target className="text-[#47C4B7]" />,
            title: "Goals & Progress Tracking",
            desc: "Set monthly goals and monitor your learning progress clearly."
        },
        {
            icon: <Flame className="text-[#47C4B7]" />,
            title: "Streak & Consistency",
            desc: "Build daily study streaks and develop strong habits over time."
        },
        {
            icon: <Calendar className="text-[#47C4B7]" />,
            title: "Learning History",
            desc: "Review past performance trends easily and keep a complete history of activities."
        },
        {
            icon: <ShieldCheck className="text-[#47C4B7]" />,
            title: "Private & Secure",
            desc: "Enjoy a distraction-free workspace where your data stays completely private."
        }
    ];

    // How It Works Steps
    const steps = [
        { title: 'Plan Your Workflow', desc: 'Create daily tasks, organize study materials, and set clear academic goals for the week.' },
        { title: 'Deep Focus Sessions', desc: 'Use the integrated timer to concentrate deeply and build strong habits without any digital distractions.' },
        { title: 'Track & Improve', desc: 'Analyze your study patterns with real-time analytics to understand your optimal performance times.' }
    ];

    // Benefits
    const benefits = [
        'Clean and distraction-free UI',
        'Fast and responsive system',
        'Organized workflow',
        'Data-driven productivity',
        'Built for students'
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-gray-900 dark:text-gray-100 overflow-x-hidden selection:bg-[#47C4B7]/30 relative">
            {/* Background Arch */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#47C4B7]/5 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-[#6366f1]/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.01]" style={{ backgroundImage: 'radial-gradient(#47C4B7 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
            </div>

            {/* NAVBAR */}
            <nav className="fixed top-0 left-0 w-full z-[100] border-b border-gray-200/50 dark:border-white/5 bg-white/70 dark:bg-gray-950/50 backdrop-blur-xl transition-all duration-300">
                <div className="max-w-[1440px] mx-auto px-[12px] md:px-[30px] lg:px-[50px] h-16 sm:h-20 flex items-center justify-between">
                    {/* Left: Logo + Name */}
                    <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            setActiveTab('Home');
                        }}
                    >
                        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#47C4B7] rounded-lg flex items-center justify-center shadow-lg shadow-[#47C4B7]/20 shrink-0">
                            <BookOpen className="text-white w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                        </div>
                        <span className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">SkillSnap</span>
                    </div>

                    {/* Right: Nav Links + Login */}
                    <div className="flex items-center gap-4 sm:gap-8">
                        <div className="hidden sm:flex items-center gap-8 mr-2">
                            {['Home', 'About'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        if (tab === 'Home') {
                                            setActiveTab('Home');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        } else {
                                            setActiveTab('About');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                    className={`relative text-sm font-bold transition-colors ${activeTab === tab ? 'text-[#47C4B7]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeNavUnderline"
                                            className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#47C4B7] rounded-full"
                                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={toggleTheme}
                                className="p-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-[#47C4B7] dark:hover:text-[#47C4B7] transition-all transform hover:scale-110 active:scale-90"
                                aria-label="Toggle Theme"
                            >
                                {isDark ? <Sun size={18} className="sm:w-[20px]" /> : <Moon size={18} className="sm:w-[20px]" />}
                            </button>

                            <button
                                onClick={() => navigate('/login')}
                                className="flex items-center gap-2 px-2.5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-[#47C4B7] text-white text-[11px] sm:text-sm font-bold shadow-lg shadow-[#47C4B7]/20 hover:bg-[#35988D] hover:-translate-y-0.5 transition-all active:scale-95 group"
                            >
                                <User size={13} className="group-hover:scale-110 transition-transform" />
                                Login
                            </button>

                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="sm:hidden p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#47C4B7] dark:hover:text-[#47C4B7] transition-all"
                                aria-label="Toggle Menu"
                            >
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Dropdown */}
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            className="absolute top-16 right-0 w-full sm:w-48 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/5 p-4 sm:hidden z-50 shadow-2xl shadow-black/10"
                        >
                            <div className="flex flex-col gap-3">
                                {['Home', 'About'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => {
                                            if (tab === 'Home') {
                                                setActiveTab('Home');
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            } else {
                                                setActiveTab('About');
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }
                                            setIsMenuOpen(false);
                                        }}
                                        className={`text-center py-1.5 text-sm font-bold rounded-lg transition-colors ${activeTab === tab ? 'text-[#47C4B7] bg-[#47C4B7]/5' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </nav>

            <div className="relative z-10">
                {activeTab === 'Home' ? (
                    <>
                        {/* HERO SECTION */}
                        <section className="pt-24 sm:pt-28 pb-4 sm:pb-8 px-[12px] md:px-[30px] lg:px-[50px] max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#47C4B7]/10 text-gray-900 dark:text-white text-[10px] sm:text-xs font-bold mb-6 sm:mb-8">
                                    <Sparkles size={12} className="sm:w-[14px]" />
                                    Plan smarter. Learn better. Grow faster.
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight mb-4 sm:mb-8 max-w-4xl mx-auto">
                                    Master Your <br />
                                    <span className="text-[#47C4B7]">Academic Journey</span>
                                </h1>
                                <p className="text-sm sm:text-base lg:text-lg text-gray-500 dark:text-gray-400 font-medium mb-6 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
                                    A powerful learning workspace to track your study and coding progress, stay focused, and build consistent habits with clarity and control.
                                </p>

                                <div className="space-y-3 mb-6 sm:mb-10">
                                    {[
                                        'Track study & coding hours efficiently',
                                        'Manage focused learning sessions',
                                        'Analyze performance with real-time insights',
                                        'Build consistency with daily streaks'
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                            <div className="w-5 h-5 rounded-full bg-[#47C4B7]/20 flex items-center justify-center text-[#47C4B7]">
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                            <span className="text-xs sm:text-sm font-semibold">{item}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-row items-center gap-2 sm:gap-4">
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="flex-1 sm:flex-none px-4 sm:px-8 py-3.5 sm:py-4 bg-[#47C4B7] text-white rounded-xl font-bold text-[11px] sm:text-sm shadow-xl shadow-[#47C4B7]/20 hover:bg-[#35988D] hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap"
                                    >
                                        Get Started
                                        <ArrowRight size={14} className="sm:w-[18px]" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab('About');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="flex-1 sm:flex-none px-4 sm:px-8 py-3.5 sm:py-4 bg-transparent border-2 border-[#47C4B7] text-[#47C4B7] rounded-xl font-bold text-[11px] sm:text-sm hover:bg-[#47C4B7]/5 transition-all active:scale-95 flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap"
                                    >
                                        About SkillSnap
                                    </button>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative hidden md:block"
                            >
                                {/* Premium Dynamic SkillSnap Mockup (Slim Version) */}
                                <div className="max-w-lg ml-auto">
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        className="relative bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-3xl overflow-hidden p-6 pb-8 cursor-default"
                                    >
                                        {/* Floating Badge */}
                                        <motion.div
                                            initial={{ x: 20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 1 }}
                                            className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-2xl px-3 py-1.5 shadow-lg border border-gray-100 dark:border-white/5 flex items-center gap-2 z-20"
                                        >
                                            <div className="w-4 h-4 bg-[#47C4B7] rounded-full flex items-center justify-center">
                                                <Check size={10} className="text-white" strokeWidth={4} />
                                            </div>
                                            <span className="text-[9px] font-bold text-[#47C4B7]">Study goal met 🚀</span>
                                        </motion.div>

                                        <div className="space-y-4">
                                            {/* Header Section */}
                                            <motion.div
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                            >
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Study Time</p>
                                                <h2 className="text-4xl font-black text-gray-800 dark:text-white/80 tracking-tight flex items-baseline gap-1">
                                                    75<span className="text-lg text-gray-400 font-bold ml-1">Hours</span>
                                                </h2>
                                                <p className="text-[11px] font-semibold text-gray-500 mt-1">85% of Monthly Target Completed</p>
                                            </motion.div>

                                            {/* Colorful Mini Cards */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <motion.div
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: 0.4 }}
                                                    className="p-4 rounded-[1.5rem] bg-[#6366f1]/5 border border-[#6366f1]/10"
                                                >
                                                    <p className="text-[8px] font-bold text-[#6366f1] uppercase tracking-widest mb-1">Focus Score</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 bg-[#6366f1] rounded-full flex items-center justify-center text-[9px] text-white font-bold">98</div>
                                                        <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">Peak Concentration Achieved</span>
                                                    </div>
                                                </motion.div>
                                                <motion.div
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: 0.5 }}
                                                    className="p-4 rounded-[1.5rem] bg-[#47C4B7]/5 border border-[#47C4B7]/10"
                                                >
                                                    <p className="text-[8px] font-bold text-[#47C4B7] uppercase tracking-widest mb-1">Next Milestone</p>
                                                    <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 leading-tight">2 Days · Complete Data Structures</span>
                                                </motion.div>
                                            </div>

                                            {/* Dynamic Task Stream */}
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Active Coding Sessions</p>
                                                <div className="space-y-2">
                                                    {[
                                                        { name: 'Java Programming Practice', time: '1h 12m', subtitle: 'Deep Focus Mode', status: 'In Progress', color: '#8b5cf6' },
                                                        { name: 'Data Structures Problems', time: '2h 30m', subtitle: 'Problem Solving Session', status: 'Scheduled', color: '#f43f5e' }
                                                    ].map((task, i) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ x: -20, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            transition={{ delay: 0.6 + (i * 0.1) }}
                                                            className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-white/5 shadow-sm"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center opacity-80" style={{ backgroundColor: `${task.color}15`, color: task.color }}>
                                                                    <FileText size={16} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-100">{task.name}</p>
                                                                    <p className="text-[9px] text-gray-400 font-semibold mt-0.5">{task.time} · {task.subtitle}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className={`text-[8px] font-bold uppercase tracking-widest`} style={{ color: task.color }}>{task.status}</p>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Animated Weekly Pattern */}
                                            <div className="pt-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Weekly Performance</p>
                                                    <div className="text-[9px] font-bold text-[#47C4B7] flex items-center gap-1">
                                                        +12.5% <TrendingUp size={9} />
                                                    </div>
                                                </div>
                                                <div className="flex items-end justify-between gap-1.5 h-14 px-1">
                                                    {[
                                                        { h: 30, c: '#47C4B7', o: 0.2 },
                                                        { h: 45, c: '#47C4B7', o: 0.4 },
                                                        { h: 58, c: '#47C4B7', o: 0.6 },
                                                        { h: 72, c: '#47C4B7', o: 0.8 },
                                                        { h: 84, c: '#47C4B7', o: 0.9 },
                                                        { h: 92, c: '#47C4B7', o: 0.95 },
                                                        { h: 100, c: '#47C4B7', o: 1 }
                                                    ].map((bar, i) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${bar.h}%` }}
                                                            transition={{ duration: 1, delay: 1 + (i * 0.1), ease: "circOut" }}
                                                            className="flex-1 rounded-t-md shadow-sm"
                                                            style={{ backgroundColor: bar.c, opacity: bar.o }}
                                                        ></motion.div>
                                                    ))}
                                                </div>

                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Glow Overlays */}
                                <div className="absolute -z-10 -top-12 -right-12 w-96 h-96 bg-[#47C4B7]/10 blur-[100px] rounded-full animate-pulse"></div>
                                <div className="absolute -z-10 -bottom-12 -left-12 w-72 h-72 bg-[#6366f1]/10 blur-[80px] rounded-full"></div>
                            </motion.div>
                        </section>

                        {/* TRUST / SOCIAL PROOF */}
                        <section className="py-6 sm:py-10 border-y border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                            <div className="max-w-[1440px] mx-auto px-[12px] md:px-[30px] lg:px-[50px] grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                {stats.map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                        whileInView={{ opacity: 1, scale: activeStat === i ? 1.05 : 1, y: 0 }}
                                        animate={{ scale: activeStat === i ? 1.05 : 1, borderColor: activeStat === i ? "rgba(71,196,183,0.5)" : "rgba(255,255,255,0.05)" }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
                                        onClick={() => setActiveStat(activeStat === i ? null : i)}
                                        whileHover={{ y: -5, scale: 1.05, borderColor: "rgba(71,196,183,0.5)" }}
                                        className="p-4 sm:p-7 rounded-xl sm:rounded-2xl bg-white dark:bg-[#0B1120] border-2 border-gray-100 dark:border-white/[0.05] shadow-2xl shadow-gray-200/40 dark:shadow-none flex flex-col sm:flex-row items-center gap-2 sm:gap-4 transition-all duration-300 cursor-pointer text-center sm:text-left justify-center sm:justify-start"
                                    >
                                        <div className="w-8 h-8 sm:w-10 lg:w-12 sm:h-10 lg:h-12 bg-[#47C4B7]/10 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center text-[#47C4B7] shrink-0">
                                            {React.cloneElement(stat.icon, { size: 14, strokeWidth: 2.5, className: "sm:w-[22px] lg:w-[18px]" })}
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-base sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                                                <AnimatedCounter target={stat.value} duration={2} />
                                            </div>
                                            <div className="text-[9px] sm:text-[13px] font-bold text-gray-500 dark:text-gray-400 leading-tight">
                                                {stat.label}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* WHY CHOOSE SKILLSNAP */}
                        <section id="about-section" className="py-6 sm:py-8 px-[12px] md:px-[30px] lg:px-[50px] max-w-[1440px] mx-auto text-center">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white mb-3 sm:mb-4 tracking-tight">Why Choose SkillSnap?</h2>
                                <p className="text-[12px] sm:text-base text-gray-500 dark:text-gray-400 font-medium mb-6 sm:mb-8 underline-offset-4 max-w-3xl mx-auto leading-relaxed px-2">
                                    <strong className="text-gray-700 dark:text-gray-300">Plan smarter. Learn better. Grow faster.</strong><br />
                                    Take full control of your learning workflow — from studying concepts to practicing code and tracking progress.
                                </p>
                            </motion.div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                {features.map((feature, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                        whileInView={{ opacity: 1, scale: activeFeature === i ? 1.05 : 1, y: 0 }}
                                        animate={{ scale: activeFeature === i ? 1.05 : 1, borderColor: activeFeature === i ? "rgba(71,196,183,0.5)" : "rgba(255,255,255,0.05)" }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
                                        onClick={() => setActiveFeature(activeFeature === i ? null : i)}
                                        whileHover={{ y: -5, scale: 1.05, borderColor: "rgba(71,196,183,0.5)", transition: { duration: 0.2 } }}
                                        className="p-2.5 sm:p-5 bg-white dark:bg-[#0B1120] rounded-xl sm:rounded-2xl border-2 border-gray-100 dark:border-white/[0.05] shadow-sm dark:shadow-none text-left flex flex-col transition-all duration-300 cursor-pointer"
                                    >
                                        <div className="flex flex-row items-center gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-5">
                                            <div className="w-7 h-7 sm:w-10 lg:w-11 sm:h-10 lg:h-11 bg-[#47C4B7]/10 rounded-full flex items-center justify-center text-[#47C4B7] shrink-0">
                                                {React.cloneElement(feature.icon, { size: 14, strokeWidth: 2.5, className: "sm:w-5 sm:h-5 lg:w-4 lg:h-4" })}
                                            </div>
                                            <h3 className="text-[12px] sm:text-sm lg:text-[15px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight">{feature.title}</h3>
                                        </div>
                                        <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{feature.desc}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* HOW IT WORKS */}
                        {/* HOW IT WORKS */}
                        <section className="py-4 sm:py-8 border-t border-gray-100 dark:border-white/5 mt-0 mb-4 sm:mb-12">
                            <div className="max-w-[1440px] mx-auto px-[12px] md:px-[30px] lg:px-[50px] text-center">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                >
                                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white mb-3 sm:mb-4 tracking-tight">How It Works</h2>
                                    <p className="text-[11px] sm:text-base text-gray-500 dark:text-gray-400 font-medium mb-6 sm:mb-8 underline-offset-4 max-w-2xl mx-auto leading-relaxed">
                                        A simple yet powerful 3-step system designed to optimize your study routine and keep you on track.
                                    </p>
                                </motion.div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                                    {steps.map((step, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                            whileInView={{ opacity: 1, scale: activeStep === i ? 1.05 : 1, y: 0 }}
                                            animate={{ scale: activeStep === i ? 1.05 : 1, borderColor: activeStep === i ? "rgba(71,196,183,0.5)" : "rgba(255,255,255,0.05)" }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.08, duration: 0.3, ease: "easeOut" }}
                                            onClick={() => setActiveStep(activeStep === i ? null : i)}
                                            whileHover={{ y: -5, scale: 1.05, borderColor: "rgba(71,196,183,0.5)", transition: { duration: 0.2 } }}
                                            className="p-3 sm:p-5 bg-white dark:bg-[#0B1120] rounded-xl sm:rounded-2xl border-2 border-gray-100 dark:border-white/[0.05] shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-none text-left flex flex-col relative overflow-hidden group transition-all duration-300 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-5 relative z-10">
                                                <div className="w-8 h-8 sm:w-10 lg:w-9 sm:h-10 lg:h-9 bg-[#47C4B7]/10 dark:bg-[#47C4B7]/20 rounded-full flex items-center justify-center text-[#47C4B7] shrink-0">
                                                    <span className="text-base sm:text-xl font-bold">{i + 1}</span>
                                                </div>
                                                <h3 className="text-[13px] sm:text-sm lg:text-[15px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight">{step.title}</h3>
                                            </div>
                                            <p className="text-[10px] sm:text-[13px] lg:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed relative z-10">{step.desc}</p>

                                            <div className="absolute -bottom-4 -right-2 text-[6rem] sm:text-[8rem] lg:text-[10rem] font-bold text-gray-50 dark:text-white/[0.02] z-0 group-hover:scale-105 transition-transform duration-500 pointer-events-none leading-none select-none">
                                                {i + 1}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </>
                ) : (
                    <AboutLandingPage onBackToHome={() => setActiveTab('Home')} />
                )}


                {/* FOOTER */}
                {activeTab === 'Home' && (
                    <footer className={`pt-8 pb-8 ${isDark ? 'bg-white border-t border-gray-100' : 'bg-[#0B1121] border-t border-white/5'} transition-colors duration-300 relative z-10 w-full overflow-hidden`}>
                        <div className="max-w-[1440px] mx-auto px-[12px] md:px-[30px] lg:px-[50px]">
                            {/* Top Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="flex flex-col items-center mb-6 text-center"
                            >
                                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#47C4B7] rounded-xl flex items-center justify-center shadow-lg shadow-[#47C4B7]/20">
                                        <BookOpen className="text-white w-4 h-4 sm:w-[20px] sm:h-[20px]" strokeWidth={2.5} />
                                    </div>
                                    <span className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-black' : 'text-white'}`}>SkillSnap</span>
                                </div>
                                <p className={`text-sm sm:text-lg leading-relaxed max-w-2xl mb-4 ${isDark ? 'text-black' : 'text-gray-400'}`}>
                                    A powerful learning workspace to track your study and coding progress, stay focused, and build consistent habits with clarity and control.
                                </p>
                            </motion.div>

                            <div className={`h-[1px] w-full mb-6 ${isDark ? 'bg-gray-200' : 'bg-white/5'}`}></div>

                            {/* Middle Columns Section */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 font-medium mb-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.1 }}
                                >
                                    <h4 className={`text-sm sm:text-lg font-bold mb-4 sm:mb-6 ${isDark ? 'text-black' : 'text-white'}`}>User Module</h4>
                                    <ul className="space-y-1.5 text-[11px] sm:text-sm">
                                        {[
                                            'Dashboard', 'All Tasks', 'Total Study Hours',
                                            'Study Materials', 'Analytics', 'History',
                                            'Profile', 'About', 'Feedback'
                                        ].map((item, i) => (
                                            <motion.li
                                                key={i}
                                                whileHover={{ x: 5 }}
                                                whileTap={{ scale: 0.98, x: 7 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                onClick={() => {
                                                    if (item === 'About') {
                                                        setActiveTab('About');
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    } else {
                                                        navigate('/login');
                                                    }
                                                }}
                                                className="flex items-center gap-1.5 group cursor-pointer hover:text-[#47C4B7] transition-colors"
                                            >
                                                <ChevronRight className="text-[#3b82f6] sm:w-[14px]" size={10} />
                                                <span className={`leading-relaxed font-medium transition-colors ${isDark ? 'text-black group-hover:text-[#47C4B7]' : 'text-gray-400 group-hover:text-white'}`}>{item}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </motion.div>

                                {/* Column 2: Admin Module */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                >
                                    <h4 className={`text-sm sm:text-lg font-bold mb-4 sm:mb-6 ${isDark ? 'text-black' : 'text-white'}`}>Admin Module</h4>
                                    <motion.ul
                                        className="space-y-1.5 text-[11px] sm:text-sm"
                                    >
                                        {[
                                            'Dashboard', 'User Management', 'All Users',
                                            'Leaderboard', 'Study Materials', 'Tasks',
                                            'Study Hours', 'Feedback', 'Analytics'
                                        ].map((item, i) => (
                                            <motion.li
                                                key={i}
                                                whileHover={{ x: 5 }}
                                                whileTap={{ scale: 0.98, x: 7 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                onClick={() => navigate('/login')}
                                                className="flex items-center gap-1.5 group cursor-pointer hover:text-[#47C4B7] transition-colors"
                                            >
                                                <ChevronRight className="text-[#3b82f6] sm:w-[14px]" size={10} />
                                                <span className={`leading-relaxed font-medium transition-colors ${isDark ? 'text-black group-hover:text-[#47C4B7]' : 'text-gray-400 group-hover:text-white'}`}>{item}</span>
                                            </motion.li>
                                        ))}
                                    </motion.ul>
                                </motion.div>

                                {/* Column 3: Quick Links */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.3 }}
                                >
                                    <h4 className={`text-sm sm:text-lg font-bold mb-4 sm:mb-6 ${isDark ? 'text-black' : 'text-white'}`}>Quick Links</h4>
                                    <ul className="space-y-1.5">
                                        {['Home', 'About', 'Login'].map(link => (
                                            <motion.li
                                                key={link}
                                                whileHover={{ x: 5 }}
                                                whileTap={{ scale: 0.98, x: 7 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                onClick={() => {
                                                    if (link === 'Login') navigate('/login');
                                                    else {
                                                        setActiveTab(link);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }
                                                }}
                                                className="flex items-center gap-1.5 group cursor-pointer hover:text-[#47C4B7] transition-colors"
                                            >
                                                <ChevronRight className="text-[#3b82f6] sm:w-[14px]" size={10} />
                                                <span className={`text-[11px] sm:text-sm leading-relaxed font-medium transition-colors ${isDark ? 'text-black group-hover:text-[#47C4B7]' : 'text-gray-400 group-hover:text-white'}`}>{link}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </motion.div>

                                {/* Column 4: Contact Us */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    <h4 className={`text-sm sm:text-lg font-bold mb-4 sm:mb-6 ${isDark ? 'text-black' : 'text-white'}`}>Contact Us</h4>
                                    <ul className="space-y-3 sm:space-y-5">
                                        <motion.li
                                            whileHover={{ x: 5 }}
                                            whileTap={{ scale: 0.98, x: 7 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            className="flex items-start gap-2"
                                        >
                                            <User size={12} className="text-[#3b82f6] shrink-0 mt-0.5 sm:w-4" />
                                            <span className={`text-[10px] sm:text-sm leading-relaxed font-medium transition-colors ${isDark ? 'text-black hover:text-[#47C4B7]' : 'text-gray-400 hover:text-white'}`}>Mr. Gaurav Patil</span>
                                        </motion.li>
                                        <motion.li
                                            whileHover={{ x: 5 }}
                                            whileTap={{ scale: 0.98, x: 7 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            className="flex items-start gap-2"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3b82f6] shrink-0 mt-0.5 sm:w-4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                            <a href="tel:+917875335539" className={`text-[10px] sm:text-sm leading-relaxed font-medium transition-colors ${isDark ? 'text-black hover:text-[#47C4B7]' : 'text-gray-400 hover:text-white'}`}>+91 7875335539</a>
                                        </motion.li>
                                        <motion.li
                                            whileHover={{ x: 5 }}
                                            whileTap={{ scale: 0.98, x: 7 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            className="flex items-start gap-2"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3b82f6] shrink-0 mt-0.5 sm:w-4"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                                            <a href="mailto:gauravpatil@gmail.com" className={`text-[10px] sm:text-sm leading-relaxed font-medium transition-colors ${isDark ? 'text-black hover:text-[#47C4B7]' : 'text-gray-400 hover:text-white'}`}>gauravpatil@gmail.com</a>
                                        </motion.li>
                                    </ul>
                                </motion.div>
                            </div>

                            <div className={`h-[1px] w-full mb-6 ${isDark ? 'bg-gray-200' : 'bg-white/5'}`}></div>

                            {/* Bottom Copyright */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="text-center"
                            >
                                <p className={`font-black text-sm tracking-wide ${isDark ? 'text-black' : 'text-white'}`}>© 2026 SkillSnap. All rights reserved.</p>
                            </motion.div>
                        </div>
                    </footer>
                )}
            </div>
        </div>
    );
};
