import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('user'); // 'user' or 'admin'
    const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Forgot Password Mock State
    const [isForgotOpen, setIsForgotOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(formData.email, formData.password, activeTab === 'admin');
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotSubmit = (e) => {
        e.preventDefault();
        if (forgotEmail) {
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                setForgotSuccess(true);
                setTimeout(() => setIsForgotOpen(false), 2000);
            }, 1000);
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
                            Welcome back! Please login to your account.
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {!isForgotOpen ? (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                            >
                                {/* Tabs as separate buttons */}
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div
                                        className={`auth-tab ${activeTab === 'user' ? 'active' : 'inactive'}`}
                                        onClick={() => { setActiveTab('user'); setError(''); }}
                                    >
                                        User Login
                                    </div>
                                    <div
                                        className={`auth-tab ${activeTab === 'admin' ? 'active' : 'inactive'}`}
                                        onClick={() => { setActiveTab('admin'); setError(''); }}
                                    >
                                        Admin Login
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {/* Email Field */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                                        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                                    >
                                        <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Email</label>
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
                                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
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

                                    {/* Remember Me & Forgot Password */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-0.25rem' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                id="remember"
                                                style={{ width: '0.875rem', height: '0.875rem', accentColor: '#6366f1' }}
                                                checked={formData.rememberMe}
                                                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                                            />
                                            <label htmlFor="remember" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                                Remember me
                                            </label>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsForgotOpen(true);
                                                setForgotSuccess(false);
                                                setError('');
                                            }}
                                            style={{ fontSize: '0.875rem', color: '#6366f1', fontWeight: '500' }}
                                        >
                                            Forgot password?
                                        </button>
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
                                        {isLoading ? 'Signing In...' : `Sign In as ${activeTab === 'admin' ? 'Admin' : 'User'}`}
                                    </button>

                                    <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        Don't have an account?{' '}
                                        <Link to="/register" style={{ color: '#6366f1', fontWeight: '500' }}>
                                            Sign up
                                        </Link>
                                    </p>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="forgot"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleForgotSubmit}
                                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                            >
                                <div style={{ padding: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    Enter your email to receive a password reset link.
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
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
                                </div>

                                {forgotSuccess ? (
                                    <div style={{ color: 'var(--success-color)', fontSize: '0.875rem', backgroundColor: 'var(--success-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                                        If an account exists, a reset link has been sent.
                                    </div>
                                ) : (
                                    <>
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
                                                opacity: isLoading ? 0.7 : 1
                                            }}
                                        >
                                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsForgotOpen(false)}
                                            style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}
                                        >
                                            Back to login
                                        </button>
                                    </>
                                )}
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
