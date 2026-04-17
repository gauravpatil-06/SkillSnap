import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, ArrowRight } from 'lucide-react';

export const WelcomeModal = ({ isOpen, userName, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-md p-6"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 w-[85%] max-w-[250px] sm:max-w-[270px] md:max-w-[290px] shadow-2xl text-center border-2 border-[#47C4B7]/20 dark:border-[#47C4B7]/10 relative overflow-hidden"
                >
                    {/* Decorative Background */}
                    <div className="absolute top-0 left-0 w-24 h-24 bg-[#47C4B7]/5 blur-2xl rounded-full -z-10 -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full -z-10 translate-x-1/2 translate-y-1/2" />

                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#47C4B7]/10 dark:bg-[#47C4B7]/20 rounded-xl flex items-center justify-center text-[#47C4B7] mx-auto mb-4 border border-[#47C4B7]/30 shadow-inner">
                        <Rocket size={18} className="animate-pulse sm:size-22" />
                    </div>

                    <h2 className="text-[13px] sm:text-[14px] md:text-[15px] font-black text-gray-800 dark:text-white tracking-tight mb-1.5 sm:mb-2 text-center">
                        Welcome, {userName} 👋
                    </h2>

                    <p className="text-[9px] sm:text-[11px] md:text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-5 sm:mb-6 leading-relaxed text-center whitespace-nowrap">
                        Let’s start your journey with <span className="text-[#47C4B7] font-bold">SkillSnap</span> 🚀
                    </p>

                    <button
                        onClick={onConfirm}
                        className="w-full py-2.5 sm:py-3 text-[11px] sm:text-[12px] md:text-[13px] font-black bg-[#47C4B7] text-white rounded-xl hover:bg-[#3db3a6] shadow-lg shadow-[#47C4B7]/25 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                    >
                        <span>Get Started</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
