import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = '', hoverable = false, padding = '1.5rem', ...props }) => {
    const baseStyle = {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-color)',
        padding: padding,
        transition: 'all 0.3s ease',
    };

    if (hoverable) {
        return (
            <motion.div
                whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }}
                style={baseStyle}
                className={className}
                {...props}
            >
                {children}
            </motion.div>
        );
    }

    return (
        <div style={baseStyle} className={className} {...props}>
            {children}
        </div>
    );
};
