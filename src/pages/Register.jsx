import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await register(formData.name, formData.email, formData.password);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-bg" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ width: '100%', maxWidth: '28rem', zIndex: 1 }}
            >
                <div className="auth-card" style={{ padding: '2.5rem' }}>

                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <GraduationCap size={28} color="#6366f1" />
                            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6366f1', letterSpacing: '-0.025em' }}>
                                SkillSnap
                            </h1>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Create a new account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {/* Name Field */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                        >
                            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Full Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)',
                                    outline: 'none',
                                    fontSize: '0.875rem',
                                    backgroundColor: 'transparent',
                                    color: 'var(--text-primary)',
                                }}
                            />
                        </motion.div>

                        {/* Email Field */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                        >
                            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Email Address</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)',
                                    outline: 'none',
                                    fontSize: '0.875rem',
                                    backgroundColor: 'transparent',
                                    color: 'var(--text-primary)',
                                }}
                            />
                        </motion.div>

                        {/* Password Field */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                        >
                            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Password</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 2.5rem 0.75rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-color)',
                                        outline: 'none',
                                        fontSize: '0.875rem',
                                        backgroundColor: 'transparent',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '1rem', color: 'var(--text-tertiary)', padding: 0 }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </motion.div>

                        {error && (
                            <div style={{ color: 'var(--danger-color)', fontSize: '0.875rem', backgroundColor: 'var(--danger-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                backgroundColor: '#6366f1',
                                color: '#ffffff',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                fontSize: '0.875rem',
                                marginTop: '0.5rem',
                                opacity: isLoading ? 0.7 : 1,
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>

                        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: '#6366f1', fontWeight: '500' }}>
                                Sign in
                            </Link>
                        </p>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};
