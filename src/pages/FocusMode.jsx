import React, { useState, useEffect, useRef } from 'react';
import { Plus, MoreHorizontal, FileText, Clock, Play, Pause, ChevronRight } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';

const FOCUS_TIME = 5 * 60; // default to 5 minutes based on the screenshot

export const FocusMode = () => {
    // Timer states
    const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
    const [isActive, setIsActive] = useState(false);
    const [timerMode, setTimerMode] = useState('Pomo'); // 'Pomo' | 'Stopwatch'

    // Editable timer state
    const [isEditing, setIsEditing] = useState(false);
    const [editMinutes, setEditMinutes] = useState(5);

    const totalTime = FOCUS_TIME; // In a real app this would reflect dynamic selected max time, simplify for now
    const progress = ((totalTime - timeLeft) / totalTime) * 100;

    // Timer Logic
    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            handleComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleComplete = () => {
        setIsActive(false);
    };

    const handleStartPause = () => {
        setIsActive(!isActive);
    };

    // Editable Timer Handlers
    const handleTimeClick = () => {
        if (!isActive) {
            setIsEditing(true);
            setEditMinutes(Math.floor(timeLeft / 60));
        }
    };

    const handleTimeChange = (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 0;
        if (val > 120) val = 120; // max 120 minutes just to cap
        setEditMinutes(val);
    };

    const handleTimeBlur = () => {
        setIsEditing(false);
        setTimeLeft(editMinutes * 60);
    };

    const handleTimeKeyDown = (e) => {
        if (e.key === 'Enter') handleTimeBlur();
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const radius = 130;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="space-y-6 pb-10 max-w-full px-0">
            <PageHeader 
                icon={Clock}
                title="Focus Mode"
                subtitle="Maximize your productivity with a Pomodoro timer"
                right={
                    <div className="flex items-center bg-white dark:bg-gray-800 rounded-2xl p-1.5 shadow-sm border border-gray-100 dark:border-gray-700 h-12 w-fit shrink-0">
                        <button
                            onClick={() => setTimerMode('Pomo')}
                            className={`px-6 py-1.5 text-xs font-bold rounded-xl transition-all ${timerMode === 'Pomo'
                                    ? 'bg-[#47C4B7] text-white shadow-md'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-[#47C4B7]'
                                }`}
                        >
                            Pomo
                        </button>
                        <button
                            onClick={() => setTimerMode('Stopwatch')}
                            className={`px-6 py-1.5 text-xs font-bold rounded-xl transition-all ${timerMode === 'Stopwatch'
                                    ? 'bg-[#47C4B7] text-white shadow-md'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-[#47C4B7]'
                                }`}
                        >
                            Stopwatch
                        </button>
                    </div>
                }
            />

            <div className="bg-white dark:bg-gray-900/40 rounded-[40px] border-2 border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden flex flex-col xl:flex-row font-sans">
                {/* LEFT PANE - Timer */}
                <div className="flex-[1.2] flex flex-col relative border-b xl:border-b-0 xl:border-r border-gray-100 dark:border-gray-800 p-8 py-12">
                    {/* Timer Area */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="relative w-80 h-80 flex items-center justify-center mb-12">
                            {/* SVG Circle */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 280 280">
                                <circle
                                    cx="140"
                                    cy="140"
                                    r={radius}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    className="text-gray-50 dark:text-gray-800/40"
                                />
                                {isActive && (
                                    <circle
                                        cx="140"
                                        cy="140"
                                        r={radius}
                                        fill="none"
                                        stroke="#47C4B7"
                                        strokeWidth="6"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-linear drop-shadow-[0_0_8px_rgba(71,196,183,0.4)]"
                                    />
                                )}
                            </svg>

                            {/* Editable Time Display */}
                            {isEditing ? (
                                <div className="flex items-center gap-2 relative z-10">
                                    <input
                                        type="number"
                                        autoFocus
                                        value={editMinutes}
                                        onChange={handleTimeChange}
                                        onBlur={handleTimeBlur}
                                        onKeyDown={handleTimeKeyDown}
                                        className="w-24 text-center text-[4rem] font-black text-gray-800 dark:text-white tracking-tight bg-transparent focus:outline-none border-b-4 border-[#47C4B7]"
                                    />
                                    <span className="text-[4rem] font-black text-gray-800 dark:text-white tracking-tight">:00</span>
                                </div>
                            ) : (
                                <span
                                    onClick={handleTimeClick}
                                    className={`relative z-10 text-[4.5rem] font-black text-gray-800 dark:text-white tracking-tighter tabular-nums transition-all ${!isActive ? 'cursor-pointer hover:text-[#47C4B7] hover:scale-105' : ''}`}
                                >
                                    {formatTime(timeLeft)}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col items-center gap-6">
                            <button
                                onClick={handleStartPause}
                                className={`px-20 py-4 rounded-[24px] font-black tracking-tight text-sm transition-all ${isActive
                                        ? 'bg-transparent border-2 border-[#47C4B7] text-[#47C4B7] hover:bg-[#47C4B7]/5'
                                        : 'bg-[#47C4B7] border-2 border-transparent text-white hover:shadow-2xl hover:shadow-[#47C4B7]/40 hover:-translate-y-1'
                                    }`}
                            >
                                {isActive ? 'Pause Session' : 'Start Focus'}
                            </button>
                            {!isActive && !isEditing && (
                                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-tight">Click the timer to modify duration</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANE - Overview & Record */}
                <div className="flex-1 flex flex-col p-10 bg-gray-50/30 dark:bg-gray-900/20">
                    {/* Overview Header */}
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-1 h-6 bg-[#47C4B7] rounded-full" />
                        <h2 className="text-[15px] font-black text-gray-700 dark:text-gray-200 tracking-tight">Session Overview</h2>
                    </div>

                    {/* 2x2 Stats Grid */}
                    <div className="grid grid-cols-2 gap-5 mb-14">
                        {[
                            { label: "Today's Pomo", val: "3", sub: "" },
                            { label: "Today's Focus", val: "15", sub: "m" },
                            { label: "Total Pomo", val: "2", sub: "" },
                            { label: "Total Focus", val: "10", sub: "m" }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800/40 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1 tracking-tight">{stat.label}</p>
                                <p className="text-2xl font-black text-gray-800 dark:text-white leading-tight">{stat.val}<span className="text-[13px] ml-0.5 text-[#47C4B7] font-bold">{stat.sub}</span></p>
                            </div>
                        ))}
                    </div>

                    {/* Focus Record */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-6 bg-[#47C4B7] rounded-full" />
                            <h2 className="text-[15px] font-black text-gray-700 dark:text-gray-200 tracking-tight">Focus Record</h2>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-[#47C4B7] bg-white dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-800 transition-all"><Plus size={16} /></button>
                    </div>

                    {/* Timeline list */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <h3 className="text-[11px] font-extrabold text-[#47C4B7] mb-6 tracking-tight px-3 py-1 bg-[#47C4B7]/5 rounded-lg w-fit">Apr 17, 2026</h3>

                        <div className="flex flex-col relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-gray-100 dark:before:bg-gray-800/50">
                            {[
                                { time: '15:22 - 15:27', dur: '5m' },
                                { time: '15:01 - 15:06', dur: '5m' },
                                { time: '14:11 - 14:16', dur: '5m' }
                            ].map((record, i) => (
                                <div key={i} className="flex flex-col mb-8 relative z-10 group last:mb-0">
                                    <div className="flex items-center gap-6">
                                        <div className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 border-2 border-gray-200 dark:border-gray-700 group-hover:border-[#47C4B7] transition-all shadow-sm">
                                            <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 group-hover:bg-[#47C4B7] transition-all" />
                                        </div>
                                        <div className="flex-1 flex items-center justify-between py-2 px-4 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-50 dark:border-gray-800 shadow-sm group-hover:shadow-md transition-all">
                                            <p className="text-[14px] font-bold text-gray-600 dark:text-gray-300">{record.time}</p>
                                            <span className="text-[12px] font-black text-[#47C4B7]">{record.dur}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
