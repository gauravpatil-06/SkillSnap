import React, { forwardRef } from 'react';

export const Input = forwardRef(({
    label,
    error,
    icon: Icon,
    className = '',
    containerStyle = {},
    ...props
}, ref) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%', ...containerStyle }} className={className}>
            {label && (
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                    {label}
                </label>
            )}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {Icon && (
                    <div style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-tertiary)' }}>
                        <Icon size={18} />
                    </div>
                )}
                <input
                    ref={ref}
                    style={{
                        width: '100%',
                        padding: `0.625rem 1rem ${Icon ? '0.625rem 2.5rem' : '0.625rem 1rem'}`,
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${error ? 'var(--danger-color)' : 'var(--border-color)'}`,
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = error ? 'var(--danger-color)' : 'var(--brand-primary)';
                        e.target.style.boxShadow = `0 0 0 1px ${error ? 'var(--danger-color)' : 'var(--brand-primary)'}`;
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = error ? 'var(--danger-color)' : 'var(--border-color)';
                        e.target.style.boxShadow = 'none';
                    }}
                    {...props}
                />
            </div>
            {error && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>
                    {error}
                </span>
            )}
        </div>
    );
});

Input.displayName = 'Input';
