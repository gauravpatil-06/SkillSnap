import React from 'react';
import { motion } from 'framer-motion';

/**
 * PageHeader — consistent title + subtitle + optional right action across ALL pages.
 *
 * Props:
 *  icon       – Lucide icon component
 *  title      – Page title string
 *  subtitle   – Subtitle / description string
 *  right      – Optional JSX to render on the right (e.g. refresh button, filters)
 */
export const PageHeader = ({ icon: Icon, title, subtitle, right }) => (
    <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="flex items-center justify-between gap-2 mb-3 w-full min-w-0"
    >
        {/* Left: title + subtitle stacked */}
        <div className="flex flex-col gap-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-gray-600 dark:text-gray-300 tracking-tight flex items-center gap-2 min-w-0">
                {Icon && <Icon className="text-[#47C4B7]/70 shrink-0" size={18} />}
                <span className="truncate">{title}</span>
            </h1>
            {subtitle && (
                <p className="text-xs font-semibold italic text-gray-500 border-l-4 border-[#47C4B7] pl-3 pr-2 break-words">
                    {subtitle}
                </p>
            )}
        </div>

        {/* Right: actions (vertically centered against the left block) */}
        {right && <div className="shrink-0">{right}</div>}
    </motion.div>
);
