import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Zap, Target, BarChart3, Flame,
    BookMarked, Brain, History, ListTodo,
    CheckCircle2, ChevronDown, ChevronRight,
    Globe, Sparkles, Rocket, ShieldCheck,
    Clock, Star, Heart,
    ArrowLeft
} from 'lucide-react';
import logo from '../assets/studyhub_logo.png';

const cardBaseStyle = {
    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, border-color 0.4s ease',
};

const HoverCard = ({ children, className, style, delay, rKey }) => {
    return (
        <motion.div
            key={rKey}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{
                scale: 1.05,
                y: -10,
                borderColor: 'rgba(71,196,183,0.5)',
                boxShadow: '0 20px 40px -8px rgba(71,196,183,0.18), 0 8px 16px -4px rgba(71,196,183,0.1)',
                transition: { type: "spring", stiffness: 300, damping: 15 }
            }}
            whileTap={{ scale: 1.08 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay, ease: [0.23, 1, 0.32, 1] }}
            className={className}
            style={{
                ...cardBaseStyle,
                ...style,
            }}
        >
            {children}
        </motion.div>
    );
};

const FAQItem = ({ question, answer, isOpen, onClick, i }) => (
    <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
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

export const AboutLandingPage = ({ onBackToHome }) => {
    const [openFAQ, setOpenFAQ] = useState(null);

    const aboutSections = [
        { title: "Our Vision", icon: Sparkles, points: ["SkillSnap aims to create a modern platform that supports effective learning.", "It helps students become consistent, focused, and productive learners."] },
        { title: "Our Mission", icon: Target, points: ["Our mission is to help students stay organized and focused every day.", "SkillSnap provides smart tools and analytics to improve study habits."] },
        { title: "What SkillSnap Offers", icon: Globe, points: ["SkillSnap brings task management, analytics, and study tools together.", "Students can plan, track, and improve their learning easily."] },
        { title: "Smart Task Management", icon: ListTodo, points: ["Students can create and organize daily study tasks with ease.", "This helps them stay focused and manage their work efficiently."] },
        { title: "Focus Sessions & Timer", icon: Clock, points: ["The focus timer helps students concentrate during study sessions.", "It supports deep learning and better productivity."] },
        { title: "Activity Tracking System", icon: Zap, points: ["Students can track study, coding, and other learning activities.", "This helps them understand how they spend their time."] },
        { title: "Monthly Goals & Progress", icon: Star, points: ["Students can set clear monthly goals for their learning.", "They can track progress and stay motivated to achieve them."] },
        { title: "Advanced Analytics", icon: BarChart3, points: ["Analytics shows study hours and productivity patterns clearly.", "It helps students understand and improve their performance."] },
        { title: "Streak Tracking", icon: Flame, points: ["SkillSnap tracks daily study streaks to encourage consistency.", "This helps students build discipline and strong study habits."] },
        { title: "History Tracking", icon: History, points: ["Students can review their past study sessions anytime.", "It helps them monitor progress and maintain consistency."] },
        { title: "Topic Analytics", icon: Brain, points: ["Students can track the time spent on each study topic.", "This helps identify weak areas and improve understanding."] },
        { title: "Study Materials", icon: BookMarked, points: ["Students can upload and manage PDFs, notes, and documents.", "All study materials remain organized in one place."] },
        { title: "Smart Insights", icon: Rocket, points: ["SkillSnap provides useful insights about learning productivity.", "These insights help students improve their study strategy."] },
        { title: "Real-Time Updates", icon: Zap, points: ["All study data updates instantly across the platform.", "This ensures a smooth and responsive user experience."] },
        { title: "Why SkillSnap", icon: Heart, points: ["SkillSnap helps students stay organized, focused, and productive.", "It supports consistent learning and better study habits."] },
        { title: "Learning Productivity Platform", icon: ShieldCheck, points: ["SkillSnap is designed to support modern learning productivity.", "It combines planning, tracking, and progress tools."] }
    ];

    const features = [
        { title: "Smart Task Management", icon: ListTodo, points: ["Create and organize daily study tasks efficiently and stay structured."] },
        { title: "Focus Sessions & Timer", icon: Clock, points: ["Use powerful timers to improve concentration and build deep work habits."] },
        { title: "Advanced Analytics", icon: BarChart3, points: ["Track study hours, monitor productivity, and understand performance patterns."] },
        { title: "Study Materials", icon: BookMarked, points: ["Upload and manage PDFs, notes, and documents in one organized space."] },
        { title: "Goals & Progress Tracking", icon: Target, points: ["Set monthly goals and monitor your learning progress clearly."] },
        { title: "Streak & Consistency", icon: Flame, points: ["Build daily study streaks and develop strong habits over time."] },
        { title: "Learning History", icon: History, points: ["Review past performance trends easily and keep a complete history of activities."] },
        { title: "Private & Secure", icon: ShieldCheck, points: ["Enjoy a distraction-free workspace where your data stays completely private."] }
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
        <div className="pt-24 sm:pt-28 pb-8 sm:pb-12 space-y-4 sm:space-y-6 max-w-[1440px] mx-auto px-[12px] md:px-[30px] lg:px-[50px] min-h-screen relative z-10">
            {/* Back Button */}
            <motion.button
                onClick={onBackToHome}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-[#47C4B7] font-bold text-sm sm:text-base hover:gap-3 transition-all group mb-4"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back to Home
            </motion.button>

            {/* HERO SECTION */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                className="bg-white dark:bg-gray-950 rounded-3xl overflow-hidden shadow-xl border-2 border-gray-100 dark:border-white/5 hover:border-[#47C4B7]/50 dark:hover:border-[#47C4B7]/50 transition-colors duration-300 relative"
            >
                <div className="px-6 py-6 md:py-8 relative flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-6 md:gap-12">
                    <div className="shrink-0 relative z-10 flex justify-center items-center md:ml-6 lg:ml-10">
                        <div className="w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] md:w-[160px] md:h-[160px] rounded-full flex items-center justify-center overflow-hidden bg-[#47C4B7]/5">
                            <img src={logo} alt="SkillSnap Logo" className="w-full h-full object-contain scale-110 sm:scale-125" />
                        </div>
                    </div>

                    <div className="space-y-3 flex-1 text-center md:text-left">
                        <h1 className="text-[16px] sm:text-[22px] md:text-[28px] xl:text-[32px] font-extrabold leading-[1.15] tracking-tight">
                            <span className="text-[#47C4B7]">SkillSnap </span>
                            <span className="text-gray-700 dark:text-gray-300 font-bold">is a modern productivity platform for focused learning.</span>
                        </h1>

                        <div className="space-y-1.5 max-w-2xl mt-1 mx-auto md:mx-0">
                            {[
                                "Plan your tasks, track study hours, and manage study materials in one powerful workspace.",
                                "Stay organized, monitor progress, and build consistent study habits every day.",
                                "Visualize your productivity with analytics and review your learning history.",
                                "Set goals, track progress, and improve productivity in one seamless learning platform."
                            ].map((text, idx) => (
                                <div key={idx} className="relative pl-5 flex items-start">
                                    <div className="absolute left-0 top-[6px] flex items-center justify-center">
                                        <div className="w-4 h-4 rounded-full bg-[#47C4B7]/10 flex items-center justify-center">
                                            <ChevronRight size={10} className="text-[#47C4B7]" strokeWidth={4} />
                                        </div>
                                    </div>
                                    <p className="text-[12px] sm:text-[14px] md:text-[0.9375rem] text-gray-600 dark:text-gray-300 font-medium leading-[1.3] sm:leading-[1.4] text-left">
                                        {text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ECOSYSTEM SECTION */}
            <div className="space-y-3 sm:space-y-6 pt-6 sm:pt-10">
                <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-white/5 pb-3 sm:pb-4">
                    <div className="p-1.5 sm:p-2 rounded-full bg-[#47C4B7]/10 text-[#47C4B7] shrink-0">
                        <Globe size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-[14px] sm:text-[1.1rem] font-bold tracking-tight text-gray-900 dark:text-white">Our Ecosystem</h2>
                        <p className="text-[11px] sm:text-[13px] font-medium text-gray-500 dark:text-gray-400">Core features designed to support your learning.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-6">
                    {aboutSections.map((section, i) => (
                        <HoverCard key={section.title} rKey={`eco-${section.title}`} delay={0.1 + (i % 4) * 0.05} className="bg-white dark:bg-gray-900 rounded-[1rem] sm:rounded-2xl p-2.5 sm:p-5 shadow-lg border-2 border-gray-100 dark:border-white/5 flex flex-col items-start gap-1.5 sm:gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 w-full">
                                <div className="w-5 h-5 sm:w-8 sm:h-8 bg-[#47C4B7]/10 rounded-full flex items-center justify-center text-[#47C4B7] shrink-0 border border-[#47C4B7]/10">
                                    <section.icon size={12} className="sm:w-[16px] sm:h-[16px]" />
                                </div>
                                <h3 className="text-[11px] sm:text-[15px] font-bold text-gray-900 dark:text-white leading-tight">{section.title}</h3>
                            </div>
                            <div className="space-y-1 sm:space-y-2 w-full">
                                {section.points.map((point, pIdx) => (
                                    <div key={pIdx} className="flex items-start gap-1.5 sm:gap-2">
                                        <div className="mt-1 sm:mt-1.5 w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-[#47C4B7] shrink-0"></div>
                                        <p className="text-[9px] sm:text-[11.5px] md:text-[0.8125rem] text-gray-600 dark:text-gray-400 font-medium leading-tight sm:leading-relaxed">{point}</p>
                                    </div>
                                ))}
                            </div>
                        </HoverCard>
                    ))}
                </div>
            </div>

            {/* CAPABILITIES SECTION */}
            <div className="space-y-3 sm:space-y-6 pt-8 sm:pt-14">
                <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-white/5 pb-3 sm:pb-4">
                    <div className="p-1.5 sm:p-2 rounded-full bg-amber-500/10 text-amber-500 shrink-0">
                        <Star size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-[14px] sm:text-[1.1rem] font-bold tracking-tight text-gray-900 dark:text-white">Capabilities</h2>
                        <p className="text-[11px] sm:text-[13px] font-medium text-gray-500 dark:text-gray-400">Everything you need to succeed in one place.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-6">
                    {features.map((feature, i) => (
                        <HoverCard key={feature.title} rKey={`feat-${feature.title}`} delay={0.2 + (i % 4) * 0.05} className="bg-white dark:bg-gray-900 rounded-[1rem] sm:rounded-2xl p-2.5 sm:p-5 shadow-lg border-2 border-gray-100 dark:border-white/5 flex flex-col items-start gap-1.5 sm:gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 w-full">
                                <div className="w-5 h-5 sm:w-8 sm:h-8 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 shrink-0">
                                    <feature.icon size={12} className="sm:w-[16px] sm:h-[16px]" />
                                </div>
                                <h3 className="text-[11px] sm:text-[15px] font-bold text-gray-900 dark:text-white leading-tight">{feature.title}</h3>
                            </div>
                            <div className="space-y-1 sm:space-y-2 w-full">
                                {feature.points.map((point, pIdx) => (
                                    <div key={pIdx} className="flex items-start gap-1.5 sm:gap-2">
                                        <div className="mt-1 sm:mt-1.5 w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-amber-500 shrink-0"></div>
                                        <p className="text-[9px] sm:text-[11.5px] md:text-[0.8125rem] text-gray-600 dark:text-gray-400 font-medium leading-tight sm:leading-relaxed">{point}</p>
                                    </div>
                                ))}
                            </div>
                        </HoverCard>
                    ))}
                </div>
            </div>

            {/* FAQ SECTION */}
            <div className="space-y-3 sm:space-y-6 pt-8 sm:pt-14">
                <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-white/5 pb-3 sm:pb-4">
                    <div className="p-1.5 sm:p-2 rounded-full bg-blue-500/10 text-blue-500 shrink-0">
                        <Zap size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-[14px] sm:text-[1.1rem] font-bold tracking-tight text-gray-900 dark:text-white">Common Questions (FAQ)</h2>
                        <p className="text-[11px] sm:text-[13px] font-medium text-gray-500 dark:text-gray-400">Everything you need to know.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-1">
                    {faqs.map((faq, i) => (
                        <FAQItem key={i} i={i} question={faq.q} answer={faq.a} isOpen={openFAQ === i} onClick={() => setOpenFAQ(openFAQ === i ? null : i)} />
                    ))}
                </div>
            </div>

        </div>
    );
};
