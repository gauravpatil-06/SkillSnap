import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Zap, Target, BarChart3, Flame,
    BookMarked, Brain, History, ListTodo,
    CheckCircle2, ChevronDown, ChevronRight, Mail, Phone, MapPin,
    Globe, Sparkles, Rocket, ShieldCheck,
    Clock, Calendar, Star, Info, Heart, Send, MessageSquare, RefreshCw, ExternalLink, Gem as Diamond, ArrowRight
} from 'lucide-react';
import logo from '../assets/studyhub_logo.png';

const cardBaseStyle = {
    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, border-color 0.4s ease',
};

const cardHoverStyle = {
    transform: 'scale(1.015) translateY(-4px)',
    boxShadow: '0 20px 40px -8px rgba(71,196,183,0.18), 0 8px 16px -4px rgba(71,196,183,0.1)',
    borderColor: 'rgba(71,196,183,0.5)',
};

const HoverCard = ({ children, className, style, delay, rKey, extraHover = {} }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            key={rKey}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay, ease: [0.23, 1, 0.32, 1] }}
            className={className}
            style={{
                ...cardBaseStyle,
                ...(hovered ? { ...cardHoverStyle, ...extraHover } : {}),
                ...style,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {children}
        </motion.div>
    );
};

const FAQItem = ({ question, answer, isOpen, onClick, i, refreshKey }) => (
    <motion.div
        key={`${i}-${refreshKey}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className="border-2 border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden mb-3 bg-white dark:bg-gray-900 transition-all duration-300 hover:border-[#47C4B7]/40"
    >
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between px-5 py-[11.5px] text-left focus:outline-none"
        >
            <span className={`text-[12px] sm:text-[0.95rem] font-bold transition-colors ${isOpen ? 'text-[#47C4B7]' : 'text-gray-900/75 dark:text-gray-100'}`}>
                {question}
            </span>
            <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className={`${isOpen ? 'text-[#47C4B7]' : 'text-gray-400 dark:text-gray-500'}`}
            >
                <ChevronDown size={18} />
            </motion.div>
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="px-5 pb-5 text-[12px] sm:text-[1rem] text-gray-600 dark:text-gray-400 font-medium leading-relaxed border-t border-gray-50 dark:border-gray-800/50 pt-3">
                        {answer}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
);

export const About = () => {
    const [openFAQ, setOpenFAQ] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    useEffect(() => {
        // Keeping an empty effect for any future lifecycle needs or removing if not needed
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setRefreshKey(prev => prev + 1);
        setTimeout(() => {
            setIsRefreshing(false);
        }, 600);
    };

    const aboutSections = [
        {
            title: "Our Vision",
            icon: Sparkles,
            points: ["SkillSnap aims to create a modern platform that supports effective learning.", "It helps students become consistent, focused, and productive learners."]
        },
        {
            title: "Our Mission",
            icon: Target,
            points: ["Our mission is to help students stay organized and focused every day.", "SkillSnap provides smart tools and analytics to improve study habits."]
        },
        {
            title: "What SkillSnap Offers",
            icon: Globe,
            points: ["SkillSnap brings task management, analytics, and study tools together.", "Students can plan, track, and improve their learning easily."]
        },
        {
            title: "Smart Task Management",
            icon: ListTodo,
            points: ["Students can create and organize daily study tasks with ease.", "This helps them stay focused and manage their work efficiently."]
        },
        {
            title: "Focus Sessions & Timer",
            icon: Clock,
            points: ["The focus timer helps students concentrate during study sessions.", "It supports deep learning and better productivity."]
        },
        {
            title: "Activity Tracking System",
            icon: Zap,
            points: ["Students can track study, coding, and other learning activities.", "This helps them understand how they spend their time."]
        },
        {
            title: "Monthly Goals & Progress",
            icon: Star,
            points: ["Students can set clear monthly goals for their learning.", "They can track progress and stay motivated to achieve them."]
        },
        {
            title: "Advanced Analytics",
            icon: BarChart3,
            points: ["Analytics shows study hours and productivity patterns clearly.", "It helps students understand and improve their performance."]
        },
        {
            title: "Streak Tracking",
            icon: Flame,
            points: ["SkillSnap tracks daily study streaks to encourage consistency.", "This helps students build discipline and strong study habits."]
        },
        {
            title: "History Tracking",
            icon: History,
            points: ["Students can review their past study sessions anytime.", "It helps them monitor progress and maintain consistency."]
        },
        {
            title: "Topic Analytics",
            icon: Brain,
            points: ["Students can track the time spent on each study topic.", "This helps identify weak areas and improve understanding."]
        },
        {
            title: "Study Materials",
            icon: BookMarked,
            points: ["Students can upload and manage PDFs, notes, and documents.", "All study materials remain organized in one place."]
        },
        {
            title: "Smart Insights",
            icon: Rocket,
            points: ["SkillSnap provides useful insights about learning productivity.", "These insights help students improve their study strategy."]
        },
        {
            title: "Real-Time Updates",
            icon: RefreshCw,
            points: ["All study data updates instantly across the platform.", "This ensures a smooth and responsive user experience."]
        },
        {
            title: "Why SkillSnap",
            icon: Heart,
            points: ["SkillSnap helps students stay organized, focused, and productive.", "It supports consistent learning and better study habits."]
        },
        {
            title: "Learning Productivity Platform",
            icon: ShieldCheck,
            points: ["SkillSnap is designed to support modern learning productivity.", "It combines planning, tracking, and progress tools."]
        }
    ];

    const features = [
        {
            title: "Smart Task Management",
            icon: ListTodo,
            points: ["Create and organize your daily study tasks easily.", "Stay focused and track your progress every day."]
        },
        {
            title: "Focus Sessions",
            icon: Clock,
            points: ["Use countdown and stopwatch timers for focused study.", "Improve concentration and build strong learning habits."]
        },
        {
            title: "Study Hour Tracking",
            icon: BarChart3,
            points: ["Record and monitor your daily study hours clearly.", "Understand how much time you spend learning."]
        },
        {
            title: "Activity Tracking",
            icon: Zap,
            points: ["Track study, coding, and other learning activities easily.", "Understand how your time is used for learning."]
        },
        {
            title: "Monthly Goals",
            icon: Target,
            points: ["Set clear monthly goals for study and learning progress.", "Stay motivated while working toward your targets."]
        },
        {
            title: "Goal Progress",
            icon: CheckCircle2,
            points: ["Track how close you are to achieving your study goals.", "Monitor progress and improve your learning consistency."]
        },
        {
            title: "Study Analytics",
            icon: BarChart3,
            points: ["View detailed analytics of your study hours and progress.", "Understand patterns and improve productivity."]
        },
        {
            title: "Topic Analytics",
            icon: Brain,
            points: ["Track study time spent on each topic or subject.", "Identify weak areas and improve your understanding."]
        },
        {
            title: "Streak Tracking",
            icon: Flame,
            points: ["Maintain daily study streaks to stay consistent.", "Build discipline and strong learning routines."]
        },
        {
            title: "Study Materials",
            icon: BookMarked,
            points: ["Upload and manage PDFs, notes, and documents easily.", "Keep all study resources organized in one place."]
        },
        {
            title: "Learning History",
            icon: History,
            points: ["Review your past study sessions and activities anytime.", "Track progress and analyze your learning journey."]
        },
        {
            title: "Smart Insights",
            icon: Rocket,
            points: ["Get helpful insights about your study productivity.", "Improve your learning strategy with useful data."]
        },
        {
            title: "Clean Dashboard",
            icon: Globe,
            points: ["Use a clean and distraction-free dashboard interface.", "Focus better on your learning tasks and progress."]
        },
        {
            title: "Real-Time Updates",
            icon: RefreshCw,
            points: ["All your study data updates instantly across the platform.", "Enjoy a fast and smooth learning experience."]
        },
        {
            title: "Organized Workspace",
            icon: ShieldCheck,
            points: ["Manage tasks, materials, and analytics in one place.", "Keep your learning environment structured and efficient."]
        },
        {
            title: "Productivity Support",
            icon: Heart,
            points: ["SkillSnap helps students stay organized and productive.", "Build consistent habits and improve learning outcomes."]
        }
    ];

    const faqs = [
        { q: "What is SkillSnap?", a: "SkillSnap is a simple platform made to help students study in a more organized way. Instead of managing tasks, notes, and study hours in different places, everything comes together in one workspace. You can plan what to study, track how much you studied, and review your progress. It makes learning more structured and easier to manage every day." },
        { q: "How does SkillSnap help improve study habits?", a: "Good study habits come from consistency and awareness of how you spend your time. SkillSnap helps you track your daily study activities and progress. When you can clearly see how much you study, it becomes easier to improve your routine. Over time, this helps you build stronger and more productive learning habits." },
        { q: "How can I plan my daily study tasks?", a: "Planning daily study tasks becomes easy with SkillSnap. You can create tasks for each subject or topic and organize them in a simple way. This helps you know exactly what needs to be done next. It also helps reduce confusion and keeps your study schedule clear." },
        { q: "How does the focus timer help students?", a: "Many students get distracted while studying for long periods. The focus timer helps you concentrate on one task at a time. You can start a focused study session and work without interruptions. This helps improve concentration and makes your study time more productive." },
        { q: "Can I track how much I study every day?", a: "Yes, SkillSnap allows you to track your daily study hours easily. Each study session is recorded so you can see how much time you spend learning. This gives you a clear view of your effort and productivity. It also helps you understand whether you are improving over time." },
        { q: "How does SkillSnap help with learning progress?", a: "SkillSnap shows your study progress through simple insights and activity records. You can see completed tasks, study hours, and learning history in one place. This makes it easier to understand how your progress is improving. It helps you stay motivated and focused on your goals." },
        { q: "Can I review my previous study activities?", a: "Yes, SkillSnap stores your past study sessions and activities. You can go back anytime and review what you studied before. This helps you understand how your learning journey is progressing. It also helps you identify areas where more practice is needed." },
        { q: "How does SkillSnap help manage study materials?", a: "Students often struggle to keep notes and study materials organized. SkillSnap allows you to upload and manage PDFs, notes, and documents easily. Everything stays stored in one place for quick access. This saves time and keeps your learning resources well organized." },
        { q: "How does SkillSnap help with goal setting?", a: "Setting goals is important for staying motivated while studying. SkillSnap allows you to set monthly study goals and track your progress. You can see how close you are to achieving them. This helps you stay motivated and focused on your learning targets." },
        { q: "Is my study data safe?", a: "Yes, your study data is stored securely within your account. Only you can access and manage your personal learning information. SkillSnap focuses on keeping your data private and protected. Your progress and activity records remain safe." },
        { q: "Can SkillSnap help reduce study stress?", a: "Yes, when your study tasks and materials are well organized, studying becomes easier. SkillSnap helps you plan tasks and manage resources clearly. This reduces confusion and saves time during study sessions. As a result, learning feels more manageable and less stressful." },
        { q: "Who can use SkillSnap?", a: "SkillSnap is designed mainly for students and learners. Anyone who wants to stay organized while studying can use it. It is useful for school students, college learners, and even self-learners. The platform helps anyone who wants to improve productivity in learning." },
    ];

    return (
        <div className="space-y-6 pb-10 max-w-full px-0">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col gap-1.5 bg-transparent mb-6 w-full pt-4"
            >
                <div className="flex items-center justify-between gap-2 w-full min-w-0">
                    <h1 className="text-[14px] sm:text-xl font-black text-gray-600 dark:text-gray-300 tracking-tight flex items-center gap-2 min-w-0">
                        <Info className="text-[#47C4B7]/70 shrink-0" size={16} />
                        <span className="truncate">About SkillSnap</span>
                    </h1>
                    <button
                        onClick={handleRefresh}
                        className={`shrink-0 p-1.5 sm:p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-500 hover:text-[#47C4B7] transition-all hover:shadow-md ${isRefreshing ? 'animate-spin cursor-not-allowed opacity-50' : ''}`}
                        title="Refresh Page"
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={14} className="sm:w-[16px] sm:h-[16px]" />
                    </button>
                </div>
                <p className="text-[11px] sm:text-[13px] font-semibold italic text-gray-500 border-l-4 border-[#47C4B7] pl-3 pr-2 w-full break-words">
                    Plan, track progress, and build better study habits.
                </p>
            </motion.div>

            {/* HERO SECTION */}
            <HoverCard
                rKey={`hero-${refreshKey}`}
                delay={0.1}
                className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-xl border-2 border-gray-100 dark:border-gray-800 relative"
            >
                <div className="px-6 py-6 md:py-12 relative flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-8 md:gap-16">
                    {/* Logo - Shifted right on laptop, compact on mobile */}
                    <div className="shrink-0 relative z-10 flex justify-center items-center md:ml-6 lg:ml-10">
                        <div className="w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] md:w-[200px] md:h-[200px] rounded-full flex items-center justify-center overflow-hidden">
                            <img src={logo} alt="SkillSnap Logo" className="w-full h-full object-contain scale-110 sm:scale-125" />
                        </div>
                    </div>

                    <div className="space-y-5 flex-1 text-center">

                        <h1 className="text-[16px] sm:text-[22px] md:text-[22px] xl:text-[30px] font-extrabold leading-[1.15] tracking-tight text-center">
                            <span className="text-[#47C4B7]">SkillSnap</span>
                            <span className="text-gray-500 dark:text-gray-400 font-bold ml-1.5 sm:ml-2">is a modern productivity platform for focused learning.</span>
                        </h1>

                        <div className="space-y-2 max-w-2xl mt-2">
                            {[
                                "Plan your tasks, track study hours, and manage study materials in one powerful workspace.",
                                "Stay organized, monitor progress, and build consistent study habits every day.",
                                "Visualize your productivity with analytics and review your learning history.",
                                "Set goals, track progress, and improve productivity in one seamless learning platform."
                            ].map((text, idx) => (
                                <div key={idx} className="relative pl-5">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                        <div className="w-5 h-5 rounded-full bg-[#47C4B7]/10 flex items-center justify-center border border-[#47C4B7]/10">
                                            <ChevronRight size={12} className="text-[#47C4B7]" strokeWidth={3} />
                                        </div>
                                    </div>
                                    <p className="text-[13px] sm:text-[14px] md:text-[0.9375rem] text-gray-700/90 dark:text-gray-200 font-medium leading-[1.3] sm:leading-[1.4] text-left border-l border-gray-100 dark:border-gray-800/80 pl-2">
                                        {text}
                                    </p>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </HoverCard>

            {/* ECOSYSTEM SECTION */}
            <div className="space-y-3 sm:space-y-6 pt-4 sm:pt-6">
                <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-gray-800 pb-3 sm:pb-4">
                    <div className="p-1.5 sm:p-2 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-500 shrink-0">
                        <Globe size={14} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-[14px] sm:text-[1.05rem] font-bold tracking-tight text-gray-900 dark:text-white">Our Ecosystem</h2>
                        <p className="text-[11px] sm:text-[13px] font-medium text-gray-500 dark:text-gray-400">Core features designed to support your learning.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
                    {aboutSections.map((section, i) => (
                        <HoverCard
                            key={section.title}
                            rKey={`${section.title}-${refreshKey}`}
                            delay={0.1 + (i % 4) * 0.05}
                            className="bg-white dark:bg-gray-900 rounded-[1rem] sm:rounded-[1.5rem] p-2 sm:p-5 shadow-lg border-2 border-gray-100 dark:border-gray-800 flex flex-col items-start gap-1.5 sm:gap-4"
                        >
                            <div className="flex items-center gap-1.5 sm:gap-3 w-full">
                                <div className="w-4.5 h-4.5 sm:w-8 sm:h-8 bg-[#47C4B7]/10 rounded-full flex items-center justify-center text-[#47C4B7] shrink-0 border border-[#47C4B7]/10">
                                    <section.icon size={10} className="sm:w-[16px] sm:h-[16px]" />
                                </div>
                                <h3 className="text-[10.5px] sm:text-[0.9375rem] font-bold text-gray-900/85 dark:text-gray-100 leading-tight">{section.title}</h3>
                            </div>

                            <div className="space-y-1 sm:space-y-2 w-full">
                                {section.points.map((point, pIdx) => (
                                    <div key={pIdx} className="flex items-start gap-1 sm:gap-2">
                                        <div className="mt-1 sm:mt-1.5 w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-[#47C4B7] shrink-0"></div>
                                        <p className="text-[8.25px] sm:text-[11.5px] md:text-[0.8125rem] text-gray-600 dark:text-gray-400 font-medium leading-tight sm:leading-relaxed">
                                            {point}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </HoverCard>
                    ))}
                </div>
            </div>

            {/* CAPABILITIES SECTION */}
            <div className="space-y-3 sm:space-y-6 pt-4 sm:pt-10">
                <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-gray-800 pb-3 sm:pb-4">
                    <div className="p-1.5 sm:p-2 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-500 shrink-0">
                        <Diamond size={14} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-[14px] sm:text-[1.05rem] font-bold tracking-tight text-gray-900 dark:text-white">Capabilities</h2>
                        <p className="text-[11px] sm:text-[13px] font-medium text-gray-500 dark:text-gray-400">Everything you need to succeed in one place.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
                    {features.map((feature, i) => (
                        <HoverCard
                            key={feature.title}
                            rKey={`feat-${feature.title}-${refreshKey}`}
                            delay={0.2 + (i % 4) * 0.05}
                            className="bg-white dark:bg-gray-900 rounded-[1rem] sm:rounded-[1.5rem] p-2 sm:p-5 shadow-lg border-2 border-gray-100 dark:border-gray-800 flex flex-col items-start gap-1.5 sm:gap-4"
                        >
                            <div className="flex items-center gap-1.5 sm:gap-3 w-full">
                                <div className="w-4.5 h-4.5 sm:w-8 sm:h-8 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-500 shrink-0 border border-amber-100/30">
                                    <feature.icon size={10} className="sm:w-[16px] sm:h-[16px]" />
                                </div>
                                <h3 className="text-[10.5px] sm:text-[0.9375rem] font-bold text-gray-900/85 dark:text-gray-100 leading-tight">{feature.title}</h3>
                            </div>

                            <div className="space-y-1 sm:space-y-2 w-full">
                                {feature.points.map((point, pIdx) => (
                                    <div key={pIdx} className="flex items-start gap-1 sm:gap-2">
                                        <div className="mt-1 sm:mt-1.5 w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-amber-500 shrink-0"></div>
                                        <p className="text-[8.25px] sm:text-[11.5px] md:text-[0.8125rem] text-gray-600 dark:text-gray-400 font-medium leading-tight sm:leading-relaxed">
                                            {point}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </HoverCard>
                    ))}
                </div>
            </div>


            {/* FAQ SECTION */}
            <div className="space-y-3 sm:space-y-6 pt-4 sm:pt-10">
                <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-gray-800 pb-3 sm:pb-4">
                    <div className="p-1.5 sm:p-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 shrink-0">
                        <MessageSquare size={14} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-[14px] sm:text-[1.05rem] font-bold tracking-tight text-gray-900 dark:text-white">Common Questions (FAQ)</h2>
                        <p className="text-[11px] sm:text-[13px] font-medium text-gray-500 dark:text-gray-400">Everything you need to know.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <FAQItem
                            key={i}
                            i={i}
                            refreshKey={refreshKey}
                            question={faq.q}
                            answer={faq.a}
                            isOpen={openFAQ === i}
                            onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                        />
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="pt-6 pb-2 text-center">
                <p className="text-[11px] sm:text-[0.875rem] font-bold text-gray-900/60 dark:text-gray-400">
                    © 2026 SkillSnap · Precision Productivity
                </p>
            </div>
        </div>
    );
};
