import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, WifiOff } from 'lucide-react';

/**
 * Shared placeholder rendered for all admin pages in offline mode.
 * Admin features require a live backend and are not available offline.
 */
export const AdminOfflinePlaceholder = ({ title = 'Admin Page' }) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6 text-center">
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-5"
        >
            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl px-5 py-3">
                <WifiOff size={20} className="text-amber-500 shrink-0" />
                <span className="text-amber-700 dark:text-amber-300 text-sm font-bold">Offline Mode Active</span>
            </div>

            <div className="p-5 bg-gray-100 dark:bg-gray-800 rounded-3xl">
                <ShieldAlert size={40} className="text-gray-400" strokeWidth={1.5} />
            </div>

            <div className="max-w-sm">
                <h2 className="text-xl font-black text-gray-800 dark:text-white mb-2">{title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Admin features require a live server connection and are not available in offline mode.
                    All your personal data continues to be saved locally.
                </p>
            </div>
        </motion.div>
    </div>
);
