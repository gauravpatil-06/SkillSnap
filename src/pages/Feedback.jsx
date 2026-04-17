import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, RefreshCw, Star, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FEEDBACK_KEY = 'studyhub_global_feedback';

const getStoredFeedback = () => {
    try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]'); }
    catch { return []; }
};

const saveStoredFeedback = (data) => {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(data));
};

const cardBaseStyle = {
    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, border-color 0.4s ease',
};

const cardHoverStyle = {
    transform: 'scale(1.02) translateY(-4px)',
    boxShadow: '0 20px 40px -8px rgba(71,196,183,0.15), 0 8px 16px -4px rgba(71,196,183,0.08)',
    borderColor: 'rgba(71,196,183,0.5)',
};

const HoverCard = ({ children, className, style, delay, rKey, extraHover = {} }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            key={rKey}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay, ease: [0.23, 1, 0.32, 1] }}
            className={className}
            style={{
                ...cardBaseStyle,
                ...(hovered ? { ...cardHoverStyle, ...extraHover } : {}),
                ...style,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {children}
        </motion.div>
    );
};

const ReviewItem = ({ review, i, rKey }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLong, setIsLong] = useState(false);
    const textRef = useRef(null);

    useEffect(() => {
        if (textRef.current) {
            setIsLong(textRef.current.scrollHeight > textRef.current.clientHeight);
        }

        const handleResize = () => {
            if (textRef.current) setIsLong(textRef.current.scrollHeight > textRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [review.message]);

    return (
        <HoverCard
            rKey={rKey}
            delay={0.2 + (i * 0.1)}
            className="flex flex-col p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border-2 border-gray-100 dark:border-gray-800 h-full relative group transition-all"
        >
            <div className="mb-2.5">
                <div className="flex items-center gap-2.5 mb-3">
                    <div className="-ml-2 w-10 h-10 rounded-full bg-[#47C4B7]/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {review.profilePic ? (
                            <img
                                src={review.profilePic}
                                alt={review.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/default-avatar.png';
                                }}
                            />
                        ) : (
                            <User size={20} className="text-[#47C4B7]" />
                        )}
                    </div>
                    <div>
                        <p className="text-[0.95rem] font-bold text-gray-900 dark:text-white leading-tight">{review.name}</p>
                        <p className="text-[#47C4B7] text-[13px] font-semibold">{review.role}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 ml-1.5">
                    {[...Array(5)].map((_, index) => (
                        <Star
                            key={index}
                            size={16}
                            className={index < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-600"}
                        />
                    ))}
                </div>
            </div>

            <div
                className="pt-2 border-t border-gray-100 dark:border-gray-800 flex-grow flex flex-col justify-start cursor-pointer group"
                onClick={() => isLong && setIsExpanded(!isExpanded)}
            >
                <div className="relative">
                    <p ref={textRef} className={`text-[0.875rem] text-gray-800 dark:text-gray-200 font-normal leading-relaxed transition-all duration-300 ${!isExpanded ? 'line-clamp-4' : ''}`}>
                        "{review.message}"
                    </p>

                    {/* Inline See more with horizontal fade out behind it on the right side */}
                    {!isExpanded && isLong && (
                        <div className="absolute bottom-[2px] right-0 flex items-center justify-end pl-14 pt-1 bg-gradient-to-r from-transparent via-white dark:via-gray-900 to-white dark:to-gray-900">
                            <button
                                className="text-[#47C4B7] text-[13px] font-bold hover:underline transition-all active:scale-95 px-1 bg-white dark:bg-gray-900"
                                onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                            >
                                See more
                            </button>
                        </div>
                    )}
                </div>

                {isExpanded && isLong && (
                    <div className="flex justify-end mt-1">
                        <button
                            className="text-[#47C4B7] text-[13px] font-bold hover:underline transition-all active:scale-95"
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                        >
                            See less
                        </button>
                    </div>
                )}
            </div>
        </HoverCard>
    );
};

export const Feedback = () => {
    const { user } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [formData, setFormData] = useState({ name: '', mobile: '', email: '', message: '' });
    const [userRating, setUserRating] = useState(5);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || prev.name,
                mobile: user.phone || prev.mobile,
                email: user.email || prev.email
            }));
        }
    }, [user]);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = (silent = false) => {
        if (!silent) setIsLoading(true);
        const data = getStoredFeedback();
        setReviews(data);
        if (!silent) setIsLoading(false);
    };

    const handleFeedbackSubmit = (e) => {
        e.preventDefault();
        const existing = getStoredFeedback();
        const newReview = {
            _id: `${Date.now()}`,
            name: formData.name,
            mobile: formData.mobile,
            email: formData.email,
            message: formData.message,
            rating: userRating,
            role: 'User',
            profilePic: user?.avatar || null,
            createdAt: new Date().toISOString(),
        };
        saveStoredFeedback([newReview, ...existing]);
        toast.success('Feedback submitted successfully!');
        setFormData({
            name: user?.name || '',
            mobile: user?.phone || '',
            email: user?.email || '',
            message: ''
        });
        setUserRating(5);
        fetchReviews();
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setRefreshKey(prev => prev + 1);
        fetchReviews(true);
        setTimeout(() => setIsRefreshing(false), 600);
    };

    return (
        <div className="space-y-6 pb-10 max-w-full px-0">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col gap-1.5 bg-transparent mb-6 w-full"
            >
                <div className="flex items-center justify-between gap-2 w-full min-w-0">
                    <h1 className="text-lg sm:text-xl font-black text-gray-600 dark:text-gray-300 tracking-tight flex items-center gap-2 min-w-0">
                        <MessageSquare className="text-[#47C4B7]/70 shrink-0" size={18} />
                        <span className="truncate">Feedback</span>
                    </h1>
                    <button
                        onClick={handleRefresh}
                        className={`shrink-0 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-500 hover:text-[#47C4B7] transition-all hover:shadow-md ${isRefreshing ? 'animate-spin cursor-not-allowed opacity-50' : ''}`}
                        title="Refresh Data"
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
                <p className="text-[13px] font-semibold italic text-gray-500 border-l-4 border-[#47C4B7] pl-3 pr-2 w-full break-words">
                    Share your thoughts and suggestions with us.
                </p>
            </motion.div>

            {/* QUICK FEEDBACK FORM */}
            <div className="space-y-12">
                <HoverCard
                    rKey={`form-${refreshKey}`}
                    delay={0.1}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 shadow-xl border-2 border-gray-100 dark:border-gray-800 relative w-full"
                >
                    <div className="mb-6 flex items-center border-b border-gray-100 dark:border-gray-800 pb-4 gap-2.5">
                        <div className="p-2 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-500 shrink-0">
                            <MessageSquare size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-[1.05rem] font-bold tracking-tight text-gray-900 dark:text-white">Give Feedback</h2>
                            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Share your thoughts and suggestions with us</p>
                        </div>
                    </div>
                    <form onSubmit={handleFeedbackSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="flex flex-col gap-1">
                                <label className="text-[15px] font-semibold text-gray-700 dark:text-gray-300">Your Name *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    readOnly={!!user?.name}
                                    className={`w-full px-3 py-1.5 text-[14px] border rounded-md outline-none transition-all ${!!user?.name
                                        ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        : "bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-600 focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white"
                                        }`}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[15px] font-semibold text-gray-700 dark:text-gray-300">Mobile No *</label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="Your Mobile Number"
                                    value={formData.mobile}
                                    onChange={(e) => {
                                        const numericValue = e.target.value.replace(/\D/g, '');
                                        if (numericValue.length <= 10) {
                                            setFormData({ ...formData, mobile: numericValue });
                                        }
                                    }}
                                    readOnly={!!user?.phone}
                                    className={`w-full px-3 py-1.5 text-[14px] border rounded-md outline-none transition-all ${!!user?.phone
                                        ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        : "bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-600 focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white"
                                        }`}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[15px] font-semibold text-gray-700 dark:text-gray-300">Email *</label>
                                <input
                                    required
                                    type="email"
                                    pattern=".*@gmail\.com$"
                                    title="Please enter a valid @gmail.com address"
                                    placeholder="Your Email Address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    readOnly={!!user?.email}
                                    className={`w-full px-3 py-1.5 text-[14px] border rounded-md outline-none transition-all ${!!user?.email
                                        ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        : "bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-600 focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white"
                                        }`}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[15px] font-semibold text-gray-700 dark:text-gray-300">Overall Rating *</label>
                            <div className="flex items-center gap-2 pt-1 pb-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setUserRating(star)}
                                        className="transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <Star
                                            size={28}
                                            className={star <= userRating ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-600"}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <label className="text-[15px] font-semibold text-gray-700 dark:text-gray-300">Message *</label>
                            </div>
                            <textarea
                                required
                                rows="4"
                                placeholder="Type your suggestion or query here..."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className="w-full px-3 py-2 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded-md focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none resize-none transition-all"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                className="px-4 py-1.5 bg-[#47C4B7] hover:bg-[#3bb1a5] text-white font-semibold rounded-md shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center text-[15px]"
                            >
                                Send Feedback
                            </button>
                        </div>
                    </form>
                </HoverCard>
            </div>

            {/* USER REVIEWS SECTION */}
            <div className="space-y-6 pt-6">
                <div className="mb-6 flex items-center border-b border-gray-100 dark:border-gray-800 pb-4 gap-2.5">
                    <div className="p-2 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-500 shrink-0">
                        <Star size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-[1.05rem] font-bold tracking-tight text-gray-900 dark:text-white">User Feedback</h2>
                        <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">See what our users think about SkillSnap</p>
                    </div>
                </div>

                {isLoading && reviews.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-[#47C4B7] border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-gray-500 font-medium animate-pulse">Loading reviews...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-0">
                        {reviews.length > 0 ? (
                            reviews.map((review, i) => (
                                <ReviewItem key={`${i}-${refreshKey}`} review={review} i={i} rKey={`${i}-${refreshKey}`} />
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                className="col-span-full py-12 text-center bg-gray-50/50 dark:bg-gray-800/50 rounded-3xl border border-gray-200 dark:border-gray-700"
                            >
                                <p className="text-gray-500 font-normal italic">No reviews yet. Be the first to share your experience!</p>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
