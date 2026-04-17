import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({
    children,
    variant = 'primary', // primary, secondary, outline, danger
    size = 'md', // sm, md, lg
    className = '',
    isLoading = false,
    ...props
}) => {
    const baseStyles = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-md)',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        outline: 'none',
    };

    const variants = {
        primary: {
            backgroundColor: 'var(--brand-primary)',
            color: 'var(--bg-secondary)',
            border: '1px solid transparent',
        },
        secondary: {
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid transparent',
        },
        outline: {
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
        },
        danger: {
            backgroundColor: 'var(--danger-color)',
            color: '#fff',
            border: '1px solid transparent',
        }
    };

    const sizes = {
        sm: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
        md: { padding: '0.5rem 1rem', fontSize: '1rem' },
        lg: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' }
    };

    const combinedStyle = {
        ...baseStyles,
        ...variants[variant],
        ...sizes[size],
        opacity: props.disabled || isLoading ? 0.6 : 1,
        cursor: props.disabled || isLoading ? 'not-allowed' : 'pointer'
    };

    return (
        <motion.button
            whileHover={!props.disabled && !isLoading ? { scale: 1.02 } : {}}
            whileTap={!props.disabled && !isLoading ? { scale: 0.98 } : {}}
            style={combinedStyle}
            className={className}
            {...props}
        >
            {isLoading ? (
                <span style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }}>⟳</span>
            ) : null}
            {children}
        </motion.button>
    );
};
