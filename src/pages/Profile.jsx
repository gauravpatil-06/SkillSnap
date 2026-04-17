import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
    Camera, User, Building, Mail, CheckCircle2, ShieldAlert,
    Image as ImageIcon, Pencil, X, RefreshCw, MapPin,
    Globe, Phone, Gift, Link as LinkIcon, ExternalLink,
    ChevronRight, Info, Plus, Eye, Trash2, Gem as Diamond,
    Users, ArrowRight, MoreHorizontal, ArrowLeft, Pin,
    ChevronsUpDown as UpDown, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PageLoader } from '../components/ui/PageLoader';
import { UserAvatar } from '../components/ui/UserAvatar';

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

export const Profile = () => {
    const { user, updateProfile, fetchMe } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const [isEditing, setIsEditing] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showContactInfo, setShowContactInfo] = useState(false);
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [isEditingAbout, setIsEditingAbout] = useState(false);
    const [isAddingWebsite, setIsAddingWebsite] = useState(false);
    const [isAddingSkill, setIsAddingSkill] = useState(false);
    const [isShowingAllSkills, setIsShowingAllSkills] = useState(false);
    const [isManagingSkills, setIsManagingSkills] = useState(false);
    const [editingSkillIdx, setEditingSkillIdx] = useState(null);
    const [showReorderMenu, setShowReorderMenu] = useState(false);
    const [isReordering, setIsReordering] = useState(false);
    const [reorderSkills, setReorderSkills] = useState([]);
    const [pinnedSkills, setPinnedSkills] = useState([]);
    const [isAboutExpanded, setIsAboutExpanded] = useState(false);
    const [showTopSkillsModal, setShowTopSkillsModal] = useState(false);
    const [newSkill, setNewSkill] = useState('');

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchMe().catch(err => console.error(err));
        setRefreshKey(prev => prev + 1);
        setTimeout(() => {
            setIsRefreshing(false);
        }, 600);
    };

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const [formData, setFormData] = useState({
        firstName: user?.name?.split(' ')[0] || '',
        lastName: user?.name?.split(' ').slice(1).join(' ') || '',
        pronouns: user?.pronouns || '',
        headline: user?.headline || user?.bio || '', // Use headline if available, fallback to bio
        education: user?.education || user?.college || '',
        country: user?.country || '',
        city: user?.city || '',
        phone: user?.phone || '',
        phoneType: user?.phoneType || 'Mobile',
        address: user?.address || '',
        birthdayMonth: user?.birthdayMonth || '',
        birthdayDay: user?.birthdayDay || '',
        website: user?.website || '',
        websiteType: user?.websiteType || 'Personal',
        profileUrl: user?.profileUrl || `skillsnap.com/in/${user?.name?.toLowerCase().replace(/\s+/g, '-') || 'user'}`,
        about: user?.about || '',
        avatar: user?.avatar || '',
        coverImage: user?.coverImage || '',
        pinnedSkills: Array.isArray(user?.pinnedSkills) ? user.pinnedSkills : []
    });

    // Update state correctly when user context changes (e.g., after save)
    useEffect(() => {
        if (!isEditing && !isEditingContact && !isEditingAbout) {
            setFormData(prev => ({
                ...prev,
                firstName: user?.name?.split(' ')[0] || '',
                lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                pronouns: user?.pronouns || '',
                headline: user?.headline || user?.bio || '',
                education: user?.education || user?.college || '',
                country: user?.country || '',
                city: user?.city || '',
                phone: user?.phone || '',
                phoneType: user?.phoneType || 'Mobile',
                address: user?.address || '',
                birthdayMonth: user?.birthdayMonth || '',
                birthdayDay: user?.birthdayDay || '',
                website: user?.website || '',
                websiteType: user?.websiteType || 'Personal',
                profileUrl: user?.profileUrl || `skillsnap.com/in/${user?.name?.toLowerCase().replace(/\s+/g, '-') || 'user'}`,
                about: user?.about || '',
                skills: Array.isArray(user?.skills) ? user.skills.join(', ') : '',
                avatar: user?.avatar || '',
                coverImage: user?.coverImage || '',
                pinnedSkills: Array.isArray(user?.pinnedSkills) ? user.pinnedSkills : []
            }));
            if (user?.website) setIsAddingWebsite(true);
        } else {
            // Even if editing, always keep pinnedSkills in sync so they aren't lost on save
            setFormData(prev => ({
                ...prev,
                pinnedSkills: Array.isArray(user?.pinnedSkills) ? user.pinnedSkills : prev.pinnedSkills
            }));
        }
    }, [user, isEditing, isEditingContact, isEditingAbout]);

    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Strict phone number validation: Only digits, max 10
        if (name === 'phone') {
            const numericValue = value.replace(/\D/g, '');
            if (numericValue.length <= 10) {
                setFormData(prev => ({ ...prev, phone: numericValue }));
            }
            return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image size must be less than 2MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = async () => {
                const newAvatar = reader.result;
                setFormData(prev => ({ ...prev, avatar: newAvatar }));

                const toastId = toast.loading('Uploading profile picture...');
                try {
                    await updateProfile({
                        name: user.name,
                        college: user.college || newAvatar, // Keep existing or if it's the only field
                        education: user.education || user.college,
                        bio: user.bio,
                        about: user.about,
                        skills: user.skills,
                        avatar: newAvatar,
                        coverImage: user.coverImage
                    });
                    toast.success('Save was successful.', { id: toastId });
                } catch (error) {
                    toast.error('Failed to upload picture', { id: toastId });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Cover image size must be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = async () => {
                const newCover = reader.result;
                setFormData(prev => ({ ...prev, coverImage: newCover }));

                const toastId = toast.loading('Uploading cover image...');
                try {
                    await updateProfile({
                        name: user.name,
                        college: user.college,
                        education: user.education || user.college,
                        bio: user.bio,
                        about: user.about,
                        skills: user.skills, // array from user state
                        avatar: user.avatar,
                        coverImage: newCover
                    });
                    toast.success('Save was successful.', { id: toastId });
                } catch (error) {
                    toast.error('Failed to upload cover', { id: toastId });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveInfo = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateProfile({
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                pronouns: formData.pronouns,
                headline: formData.headline,
                education: formData.education,
                college: formData.education, // Keep college in sync with education for Admin panel
                country: formData.country,
                city: formData.city,
                phone: formData.phone,
                phoneType: formData.phoneType,
                address: formData.address,
                birthdayMonth: formData.birthdayMonth,
                birthdayDay: formData.birthdayDay,
                website: formData.website,
                websiteType: formData.websiteType,
                profileUrl: formData.profileUrl,
                about: formData.about,
                skills: formData.skills,
                avatar: formData.avatar,
                coverImage: formData.coverImage,
                pinnedSkills: formData.pinnedSkills
            });
            toast.success('Save was successful.');
            if (isEditingContact) {
                setIsEditing(true);
            } else {
                setIsEditing(false);
            }
            setIsEditingContact(false);
            setIsEditingAbout(false);
        } catch (error) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddSkill = async (skillName) => {
        if (!skillName.trim()) return;

        const currentSkills = Array.isArray(user?.skills) ? user.skills : [];
        if (currentSkills.includes(skillName.trim())) {
            toast.error('Skill already added');
            return;
        }

        const updatedSkills = [...currentSkills, skillName.trim()];
        const toastId = toast.loading('Adding skill...');

        try {
            await updateProfile({
                ...user,
                skills: updatedSkills
            });
            toast.success('Skill added', { id: toastId });
            setIsAddingSkill(false);
            setNewSkill('');
        } catch (error) {
            toast.error('Failed to add skill', { id: toastId });
        }
    };

    const handleUpdateSkill = async (index, newName) => {
        if (!newName.trim()) return;
        const oldName = user.skills[index];
        const updatedSkills = [...user.skills];
        updatedSkills[index] = newName.trim();

        // Update pinned skills if the renamed skill was pinned
        const updatedPinned = (user?.pinnedSkills || []).map(s => s === oldName ? newName.trim() : s);

        const toastId = toast.loading('Updating skill...');
        try {
            await updateProfile({
                ...user,
                skills: updatedSkills,
                pinnedSkills: updatedPinned
            });
            toast.success('Skill updated', { id: toastId });
            setEditingSkillIdx(null);
        } catch (error) {
            toast.error('Failed to update skill', { id: toastId });
        }
    };

    const handleDeleteSkill = async (index) => {
        const skillToDelete = user.skills[index];
        const updatedSkills = user.skills.filter((_, i) => i !== index);
        const updatedPinned = (user?.pinnedSkills || []).filter(s => s !== skillToDelete);

        const toastId = toast.loading('Deleting skill...');
        try {
            await updateProfile({
                ...user,
                skills: updatedSkills,
                pinnedSkills: updatedPinned
            });
            toast.success('Skill deleted', { id: toastId });
        } catch (error) {
            toast.error('Failed to delete skill', { id: toastId });
        }
    };

    const handleTogglePin = (skillName) => {
        const isPinned = pinnedSkills.includes(skillName);
        let newPinned = [];
        let newSkills = [...reorderSkills];

        if (isPinned) {
            // Unpin
            newPinned = pinnedSkills.filter(s => s !== skillName);
        } else {
            // Pin (limit to 3)
            if (pinnedSkills.length >= 3) {
                toast.error('You can only pin up to 3 skills');
                return;
            }
            newPinned = [...pinnedSkills, skillName];

            // Move to top: first remove it, then insert it at the end of pinned section
            newSkills = newSkills.filter(s => s !== skillName);
            newSkills.splice(newPinned.length - 1, 0, skillName);
        }

        setPinnedSkills(newPinned);
        setReorderSkills(newSkills);
    };

    if (isLoading) return null;

    return (
        <div className="pb-10 max-w-full space-y-6 px-1 sm:px-0">
            <motion.div
                key={refreshKey}
                initial={{ opacity: 0, y: -20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="flex flex-col gap-1.5 bg-transparent mb-10 w-full"
            >
                <div className="flex items-center justify-between gap-2 w-full min-w-0">
                    <h1 className="text-lg sm:text-xl font-black text-gray-600 dark:text-gray-300 tracking-tight flex items-center gap-2 min-w-0">
                        <User className="text-[#47C4B7]/70 shrink-0" size={18} />
                        <span className="truncate">Profile Overview</span>
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
                    Manage your personal information, academic identity, and professional bio.
                </p>
            </motion.div>

            {/* ---------- TOP INTRODUCTION BLOCK ---------- */}
            <HoverCard
                rKey={`intro-${refreshKey}`}
                delay={0.1}
                className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-xl border-2 border-gray-100 dark:border-gray-800 relative"
            >
                <div
                    className="relative group bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700"
                    style={{ aspectRatio: '4/1', maxHeight: '220px', width: '100%' }}
                >
                    {formData.coverImage ? (
                        <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 bg-[#47C4B7]/20"></div>
                    )}

                    {/* Upload Cover Overlay */}
                    <div className="absolute inset-0 bg-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                coverInputRef.current?.click();
                            }}
                            className="bg-white p-2.5 rounded-full absolute top-4 right-4 border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition shadow-lg cursor-pointer pointer-events-auto"
                            title="Edit Cover"
                        >
                            <Pencil className="text-[#47C4B7]" size={16} />
                        </div>
                        <input
                            type="file"
                            ref={coverInputRef}
                            onChange={handleCoverChange}
                            accept="image/jpeg, image/png, image/webp"
                            className="hidden"
                        />
                    </div>
                </div>

                {/* ---------- PROFILE CONTENT SECTION ---------- */}
                <div className="px-3 sm:px-6 pb-6 sm:pb-8 relative">

                    <div
                        className="absolute left-4 sm:left-6 z-10 group"
                        style={{ top: 'calc(-1 * clamp(40px, 12vw, 100px))' }}
                    >
                        <div
                            className="rounded-full border-[3px] sm:border-[4px] md:border-[5px] border-white dark:border-gray-900 overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-md relative cursor-pointer"
                            style={{ width: 'clamp(72px, 22vw, 180px)', height: 'clamp(72px, 22vw, 180px)' }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <UserAvatar
                                name={user?.name}
                                avatar={formData.avatar}
                                size="w-full h-full"
                                className="border-none shadow-none text-[48px] sm:text-[64px]"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <Camera className="text-white" size={32} />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => {
                                handleImageChange(e);
                                e.target.value = ''; // Reset input so same file can be selected again
                            }}
                            accept="image/jpeg, image/png, image/webp"
                            className="hidden"
                        />
                    </div>

                    <div className="flex justify-end pt-1 pb-0 items-start">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition"
                        >
                            <Pencil size={18} />
                        </button>
                    </div>

                    <div
                        className="flex flex-col md:flex-row gap-4 sm:gap-6"
                        style={{ marginTop: 'calc(clamp(40px, 12vw, 100px) - 36px)' }}
                    >
                        {/* Left Side: Name and Headline */}
                        <div className="flex-grow space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h1 className="text-[20px] font-bold text-gray-900 dark:text-white leading-tight">
                                    {user?.name}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-gray-500 mt-0.5" strokeWidth={2.5} />
                                    {formData.pronouns && (
                                        <span className="text-[0.9rem] text-gray-500 dark:text-gray-400 font-normal">
                                            {formData.pronouns}
                                        </span>
                                    )}
                                    {user?.website && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-400 dark:text-gray-600 font-light ml-1">·</span>
                                            <a
                                                href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-[0.875rem] text-[#0a66c2] dark:text-[#70b5f9] font-bold hover:underline"
                                            >
                                                {user.websiteType || 'Website'}
                                                <ExternalLink size={14} className="mt-0.5" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="text-[14px] md:text-[15px] text-gray-900 dark:text-gray-100 font-normal max-w-3xl leading-snug">
                                {formData.headline}
                            </p>

                            {formData.education && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[0.8rem] font-medium text-gray-600 dark:text-gray-400 hover:text-[#0a66c2] dark:hover:text-[#70b5f9] hover:underline cursor-pointer transition-all">
                                        {formData.education}
                                    </span>
                                </div>
                            )}

                            {(formData.city || formData.country) && (
                                <div className="flex items-center gap-1 text-[0.8rem] font-normal text-gray-500 dark:text-gray-400 pt-0.5">
                                    <span>{[formData.city, formData.country].filter(Boolean).join(', ')}</span>
                                    <span className="mx-1 font-bold">·</span>
                                    <button
                                        onClick={() => setShowContactInfo(true)}
                                        className="text-[#0a66c2] dark:text-[#70b5f9] font-bold hover:underline"
                                    >
                                        Contact info
                                    </button>
                                </div>
                            )}
                            {!formData.city && !formData.country && (
                                <div className="flex items-center gap-1 text-[0.8rem] font-normal text-gray-500 dark:text-gray-400 pt-0.5">
                                    <button
                                        onClick={() => setShowContactInfo(true)}
                                        className="text-[#0a66c2] dark:text-[#70b5f9] font-bold hover:underline"
                                    >
                                        Contact info
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </HoverCard>

            {/* ---------- ABOUT SECTION BLOCK ---------- */}
            <HoverCard
                rKey={`about-${refreshKey}`}
                delay={0.25}
                className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border-2 border-gray-100 dark:border-gray-800 relative"
            >
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-[1.05rem] font-bold tracking-tight text-gray-900 dark:text-white">About</h2>
                    <button
                        onClick={() => setIsEditingAbout(true)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 transition"
                    >
                        <Pencil size={18} />
                    </button>
                </div>

                <div className="text-[0.875rem] text-gray-800 dark:text-gray-200 leading-[1.5] space-y-4">
                    <div className="relative">
                        <p className={`whitespace-pre-wrap text-[0.875rem] text-gray-800 dark:text-gray-200 leading-[1.6] transition-all ${!isAboutExpanded ? 'line-clamp-4' : ''}`}>
                            {user?.about}
                            {isAboutExpanded && user?.about?.length > 260 && (
                                <button
                                    onClick={() => setIsAboutExpanded(false)}
                                    className="text-gray-500 dark:text-gray-400 hover:text-[#0a66c2] dark:hover:text-[#70b5f9] font-bold ml-1 transition-colors cursor-pointer"
                                >
                                    see less
                                </button>
                            )}
                        </p>
                        {!isAboutExpanded && user?.about?.length > 260 && (
                            <div className="absolute bottom-0 right-0 bg-gradient-to-l from-white via-white dark:from-gray-900 dark:via-gray-900 to-transparent pl-12 h-[1.6em] flex items-center">
                                <button
                                    onClick={() => setIsAboutExpanded(true)}
                                    className="text-gray-500 dark:text-gray-400 hover:text-[#0a66c2] dark:hover:text-[#70b5f9] font-bold text-[0.875rem] transition-colors cursor-pointer"
                                >
                                    ...see more
                                </button>
                            </div>
                        )}
                        {!user?.about && <p className="text-gray-400 italic">Nothing shared yet. Add a short bio to introduce yourself.</p>}
                    </div>

                    {(user?.pinnedSkills?.length > 0 || (user?.skills && user.skills.length > 0)) && (
                        <div
                            onClick={() => setShowTopSkillsModal(true)}
                            className="mt-4 p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-1">
                                    <Diamond size={20} className="text-[#47C4B7] dark:text-[#47C4B7]/90" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[15px] font-bold text-gray-900 dark:text-white leading-none">Top skills</p>
                                    <p className="text-[15px] text-gray-600 dark:text-gray-400">
                                        {user?.pinnedSkills?.length > 0
                                            ? user.pinnedSkills.join(' · ')
                                            : user?.skills?.slice(0, 3).join(' · ')}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </div>
                    )}
                </div>
            </HoverCard>

            {/* ---------- SKILLS SECTION BLOCK ---------- */}
            <HoverCard
                rKey={`skills-${refreshKey}`}
                delay={0.4}
                className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border-2 border-gray-100 dark:border-gray-800 relative"
            >
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-[1.05rem] font-bold tracking-tight text-gray-900 dark:text-white">Skills</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsAddingSkill(true)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 transition"
                            title="Add Skill"
                        >
                            <Plus size={18} />
                        </button>
                        <button
                            onClick={() => setIsManagingSkills(true)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 transition"
                            title="Edit Skills"
                        >
                            <Pencil size={18} />
                        </button>
                    </div>
                </div>

                {user?.skills && user.skills.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {(isShowingAllSkills ? user.skills : user.skills.slice(0, 3)).map((skill, index) => (
                            <div key={index} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-[#47C4B7] shadow-[0_0_8px_rgba(71,196,183,0.5)]"></div>
                                <h3 className="text-[1rem] font-medium text-gray-800 dark:text-gray-200">{skill}</h3>
                            </div>
                        ))}
                    </div>
                ) : (
                    <span className="text-gray-400 text-[15px] italic">No skills added yet. Click + to add your skills.</span>
                )}

                {user?.skills && user.skills.length > 3 && !isShowingAllSkills && (
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={() => setIsShowingAllSkills(true)}
                            className="w-full py-2.5 flex items-center justify-center gap-2 text-[1rem] font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg"
                        >
                            Show all {user.skills.length} skills <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {user?.skills && user.skills.length > 3 && isShowingAllSkills && (
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:divide-gray-800">
                        <button
                            onClick={() => setIsShowingAllSkills(false)}
                            className="w-full py-2.5 flex items-center justify-center gap-2 text-[1rem] font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg"
                        >
                            Show less <ArrowRight size={18} className="rotate-180" />
                        </button>
                    </div>
                )}
            </HoverCard>

            {/* ---------- EDIT OVERLAY MODAL ---------- */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsEditing(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
                                <h2 className="text-[1.05rem] font-bold tracking-tight text-gray-900 dark:text-white">Edit intro</h2>
                                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                    <X size={24} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Modal Body / Form */}
                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                <form id="edit-profile-intro-form" onSubmit={handleSaveInfo} className="space-y-6">

                                    <p className="text-[13px] text-gray-500 font-normal">* Indicates required</p>

                                    {/* Name Fields */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[15px] font-normal text-gray-700 dark:text-gray-300">First name *</label>
                                            <input
                                                type="text" name="firstName" required
                                                value={formData.firstName} onChange={handleChange}
                                                className="w-full px-3 py-1.5 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[15px] font-normal text-gray-700 dark:text-gray-300">Last name *</label>
                                            <input
                                                type="text" name="lastName" required
                                                value={formData.lastName} onChange={handleChange}
                                                className="w-full px-3 py-1.5 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Pronouns */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[15px] font-normal text-gray-700 dark:text-gray-300">Pronouns</label>
                                        <div className="relative">
                                            <select
                                                name="pronouns"
                                                value={formData.pronouns}
                                                onChange={handleChange}
                                                className="w-full appearance-none px-3 py-1.5 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none"
                                            >
                                                <option value="">Please select</option>
                                                <option value="He/Him">He/Him</option>
                                                <option value="She/Her">She/Her</option>
                                                <option value="They/Them">They/Them</option>
                                                <option value="Custom">Custom</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <ChevronRight className="rotate-90 text-gray-500" size={18} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Headline */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[15px] font-normal text-gray-700 dark:text-gray-300">Headline *</label>
                                        </div>
                                        <textarea
                                            name="headline" rows="3" required
                                            maxLength={220}
                                            value={formData.headline} onChange={handleChange}
                                            className="w-full px-3 py-1.5 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none resize-none transition-all"
                                        />
                                        <div className="flex justify-end mt-1">
                                            <span className={`text-[13px] ${formData.headline.length > 220 ? 'text-red-500' : 'text-gray-500'}`}>
                                                {formData.headline.length}/220
                                            </span>
                                        </div>
                                    </div>

                                    {/* Education */}
                                    <div className="space-y-4 pt-2">
                                        <h3 className="text-[16px] font-normal text-gray-900 dark:text-white">Education</h3>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[15px] font-normal text-gray-700 dark:text-gray-300">School *</label>
                                            <input
                                                type="text" name="education" required
                                                value={formData.education} onChange={handleChange}
                                                className="w-full px-3 py-1.5 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none transition-all"
                                                placeholder="Ex: D.Y. Patil College of Engineering"
                                            />
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="space-y-4 pt-2">
                                        <h3 className="text-[16px] font-normal text-gray-900 dark:text-white">Location</h3>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[15px] font-normal text-gray-700 dark:text-gray-300">Country/Region *</label>
                                            <input
                                                type="text" name="country" required
                                                value={formData.country} onChange={handleChange}
                                                placeholder="Add your location"
                                                className="w-full px-3 py-1.5 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[15px] font-normal text-gray-700 dark:text-gray-300">City *</label>
                                            <input
                                                type="text" name="city" required
                                                value={formData.city} onChange={handleChange}
                                                placeholder="Add your location"
                                                className="w-full px-3 py-1.5 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Contact Section Preview */}
                                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <h3 className="text-[16px] font-normal text-gray-900 dark:text-white">Contact info</h3>
                                        <p className="text-[15px] text-gray-500 font-normal">Add or edit your profile URL, email, and more</p>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingContact(true)}
                                            className="text-[#0a66c2] dark:text-[#70b5f9] text-[15px] font-bold hover:underline"
                                        >
                                            Edit contact info
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                                <button
                                    type="submit" form="edit-profile-intro-form"
                                    disabled={isSaving}
                                    className="px-6 py-1.5 bg-[#47C4B7] hover:bg-[#3bb1a5] text-white font-semibold rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div >
                )}

                {/* ---------- CONTACT INFO DISPLAY MODAL ---------- */}
                {
                    showContactInfo && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                            >
                                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
                                    <h2 className="text-[1.05rem] font-bold tracking-tight text-gray-900 dark:text-white">
                                        Contact Info
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => { setShowContactInfo(false); setIsEditingContact(true); }}
                                            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                        >
                                            <Pencil size={20} />
                                        </button>
                                        <button onClick={() => setShowContactInfo(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                            <X size={24} className="text-gray-500" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">

                                    <div className="space-y-4">
                                        {/* Website Display */}
                                        {user?.website && (
                                            <div className="flex items-start gap-4">
                                                <Globe className="text-gray-500 mt-1 shrink-0" size={20} />
                                                <div>
                                                    <p className="text-[15px] font-bold text-gray-800 dark:text-gray-200">Website</p>
                                                    <p>
                                                        <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer" className="text-[#0a66c2] dark:text-[#70b5f9] text-[15px] font-bold hover:underline break-all">
                                                            {user.website.replace('https://', '').replace('http://', '')}
                                                        </a>
                                                        <span className="text-gray-600 dark:text-gray-400 text-[15px] ml-1">({user.websiteType || 'Personal'})</span>
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Phone */}
                                        {user?.phone && (
                                            <div className="flex items-start gap-4">
                                                <Phone className="text-gray-500 mt-1 shrink-0" size={20} />
                                                <div>
                                                    <p className="text-[15px] font-bold text-gray-800 dark:text-gray-200">Phone</p>
                                                    <p className="text-[15px] font-medium text-gray-600 dark:text-gray-400">
                                                        {user.phone} {user.phoneType && <span className="text-[13px] ml-1">({user.phoneType})</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Address */}
                                        {user?.address && (
                                            <div className="flex items-start gap-4">
                                                <MapPin className="text-gray-500 mt-1 shrink-0" size={20} />
                                                <div>
                                                    <p className="text-[15px] font-bold text-gray-800 dark:text-gray-200">Address</p>
                                                    <p className="text-[15px] font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                                                        {user.address}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Email */}
                                        <div className="flex items-start gap-4">
                                            <Mail className="text-gray-500 mt-1 shrink-0" size={20} />
                                            <div>
                                                <p className="text-[15px] font-bold text-gray-800 dark:text-gray-200">Email</p>
                                                <a href={`mailto:${user?.email}`} className="text-[#0a66c2] dark:text-[#70b5f9] text-[15px] font-bold hover:underline">
                                                    {user?.email}
                                                </a>
                                            </div>
                                        </div>

                                        {/* Birthday Display */}
                                        {(user?.birthdayMonth || user?.birthdayDay) && (
                                            <div className="flex items-start gap-4">
                                                <Gift className="text-gray-500 mt-1 shrink-0" size={20} />
                                                <div>
                                                    <p className="text-[15px] font-bold text-gray-800 dark:text-gray-200">Birthday</p>
                                                    <p className="text-[15px] font-medium text-gray-600 dark:text-gray-400">
                                                        {user?.birthdayMonth} {user?.birthdayDay}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }

                {/* ---------- EDIT CONTACT INFO MODAL ---------- */}
                {
                    isEditingContact && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
                                    <h2 className="text-[1.05rem] font-bold tracking-tight text-gray-900 dark:text-white">Edit contact info</h2>
                                    <button onClick={() => setIsEditingContact(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                        <X size={24} className="text-gray-500" />
                                    </button>
                                </div>

                                <form id="edit-contact-form" onSubmit={handleSaveInfo} className="p-6 overflow-y-auto custom-scrollbar space-y-8">

                                    {/* URLs Section - Only Email */}
                                    <div className="space-y-6">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[15px] text-gray-500 dark:text-gray-400">Email</label>
                                            <div className="border-b border-gray-200 dark:border-gray-700 pb-1">
                                                <a
                                                    href={`mailto:${user?.email}`}
                                                    className="flex items-center justify-between gap-2 group text-[#0a66c2] dark:text-[#70b5f9] text-[15px] font-semibold hover:no-underline py-0.5 w-full"
                                                >
                                                    <span>{user?.email}</span>
                                                    <ExternalLink size={18} className="text-[#0a66c2] dark:text-[#70b5f9] opacity-80 group-hover:opacity-100 transition-opacity" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Phone Section */}
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[15px] font-normal text-gray-700 dark:text-gray-300">Phone number</label>
                                            <input
                                                type="text" name="phone"
                                                value={formData.phone} onChange={handleChange}
                                                className="w-full px-3 py-1.5 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[15px] font-normal text-gray-700 dark:text-gray-300">Phone type</label>
                                            <div className="relative">
                                                <select
                                                    name="phoneType"
                                                    value={formData.phoneType}
                                                    onChange={handleChange}
                                                    className="w-full appearance-none px-3 py-1.5 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none"
                                                >
                                                    <option value="Mobile">Mobile</option>
                                                    <option value="Home">Home</option>
                                                    <option value="Work">Work</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <ChevronRight className="rotate-90 text-gray-500" size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Section */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[15px] font-normal text-gray-700 dark:text-gray-300">Address</label>
                                        <textarea
                                            name="address" rows="3" maxLength={220}
                                            value={formData.address} onChange={handleChange}
                                            className="w-full px-3 py-1.5 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none resize-none transition-all"
                                            placeholder="Pune, Maharashtra, India"
                                        />
                                        <div className="flex justify-end mt-1">
                                            <span className="text-[13px] text-gray-500">{(formData.address || '').length}/220</span>
                                        </div>
                                    </div>

                                    {/* Birthday Section */}
                                    <div className="space-y-4">
                                        <label className="text-[15px] font-normal text-gray-700 dark:text-gray-300">Birthday</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative">
                                                <select
                                                    name="birthdayMonth" value={formData.birthdayMonth} onChange={handleChange}
                                                    className="w-full appearance-none px-3 py-1.5 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none"
                                                >
                                                    <option value="">Month</option>
                                                    <option value="January">January</option>
                                                    <option value="February">February</option>
                                                    <option value="March">March</option>
                                                    <option value="April">April</option>
                                                    <option value="May">May</option>
                                                    <option value="June">June</option>
                                                    <option value="July">July</option>
                                                    <option value="August">August</option>
                                                    <option value="September">September</option>
                                                    <option value="October">October</option>
                                                    <option value="November">November</option>
                                                    <option value="December">December</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <ChevronRight className="rotate-90 text-gray-500" size={18} />
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <select
                                                    name="birthdayDay" value={formData.birthdayDay} onChange={handleChange}
                                                    className="w-full appearance-none px-3 py-1.5 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none"
                                                >
                                                    <option value="">Day</option>
                                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                        <option key={d} value={d}>{d}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <ChevronRight className="rotate-90 text-gray-500" size={18} />
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Website Section */}
                                    <div className="space-y-4 pt-2">
                                        <h3 className="text-[16px] font-normal text-gray-900 dark:text-white">Website</h3>

                                        {!isAddingWebsite ? (
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingWebsite(true)}
                                                className="flex items-center gap-2 text-[#0a66c2] dark:text-[#70b5f9] font-semibold text-lg hover:underline"
                                            >
                                                <Plus size={24} /> Add website
                                            </button>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[15px] font-normal text-gray-700 dark:text-gray-300">Website URL</label>
                                                    <input
                                                        type="text" name="website"
                                                        value={formData.website} onChange={handleChange}
                                                        className="w-full px-3 py-1.5 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[15px] font-normal text-gray-700 dark:text-gray-300">Website type</label>
                                                    <div className="relative">
                                                        <select
                                                            name="websiteType"
                                                            value={formData.websiteType}
                                                            onChange={handleChange}
                                                            className="w-full appearance-none px-3 py-1.5 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none"
                                                        >
                                                            <option value="Personal">Personal</option>
                                                            <option value="Company">Company</option>
                                                            <option value="Blog">Blog</option>
                                                            <option value="Portfolio">Portfolio</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                            <ChevronRight className="rotate-90 text-gray-500" size={18} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAddingWebsite(false);
                                                        setFormData(prev => ({ ...prev, website: '', websiteType: 'Personal' }));
                                                    }}
                                                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-semibold hover:text-red-500 transition-colors pt-2"
                                                >
                                                    <Trash2 size={20} /> Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </form>

                                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                                    <button
                                        type="submit" form="edit-contact-form"
                                        disabled={isSaving}
                                        className="px-6 py-1.5 bg-[#47C4B7] hover:bg-[#3bb1a5] text-white font-semibold rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }

                {/* ---------- EDIT ABOUT MODAL ---------- */}
                {
                    isEditingAbout && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                    <h2 className="text-[1.05rem] font-bold tracking-tight text-gray-900 dark:text-white">Edit about</h2>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setIsEditingAbout(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                            <X size={24} className="text-gray-500" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6">
                                    <p className="text-[15px] text-gray-500 dark:text-gray-400 leading-normal">
                                        You can write about your years of experience, industry, or skills.
                                    </p>

                                    <form id="edit-about-form" onSubmit={handleSaveInfo} className="space-y-2">
                                        <div className="relative group">
                                            <textarea
                                                name="about" rows="8"
                                                maxLength={2600}
                                                value={formData.about} onChange={handleChange}
                                                className="w-full px-3 py-2 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none resize-none transition-all"
                                            />
                                            <div className="flex justify-end items-center mt-1">
                                                <span className="text-[13px] text-gray-500">
                                                    {formData.about?.length || 0}/2,600
                                                </span>
                                            </div>
                                        </div>
                                    </form>


                                </div>

                                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end bg-white dark:bg-gray-900">
                                    <button
                                        type="submit" form="edit-about-form"
                                        disabled={isSaving}
                                        className="px-6 py-1.5 bg-[#47C4B7] hover:bg-[#3bb1a5] text-white font-bold rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }

                {/* ---------- ADD SKILL MODAL ---------- */}
                {
                    isAddingSkill && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                            >
                                <div className="px-3 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                    <h2 className="text-[1.05rem] font-bold tracking-tight text-gray-900 dark:text-white">Add skill</h2>
                                    <button onClick={() => setIsAddingSkill(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                        <X size={24} className="text-gray-500" />
                                    </button>
                                </div>

                                <div className="px-3 sm:px-6 py-4 space-y-6">
                                    <p className="text-[15px] text-gray-500">* Indicates required</p>

                                    <div className="space-y-1.5">
                                        <label className="text-[15px] font-semibold text-gray-700 dark:text-gray-300">Skill*</label>
                                        <input
                                            type="text"
                                            autoFocus
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            placeholder="Skill (ex: Project Management)"
                                            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded focus:border-[#47C4B7] focus:ring-1 focus:ring-[#47C4B7] text-gray-900 dark:text-white outline-none transition-all"
                                        />
                                    </div>

                                    <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div className="flex flex-wrap gap-2">
                                            {['Java', 'Python', 'SQL', 'Redux.js', 'Git', 'GraphQL', 'Node.js', 'React Native', 'Spring Framework', 'Webpack', 'TypeScript', 'Android'].map((skill) => (
                                                <button
                                                    key={skill}
                                                    type="button"
                                                    onClick={() => setNewSkill(skill)}
                                                    className="px-2.5 py-1 sm:px-4 sm:py-1.5 border border-gray-400 dark:border-gray-600 rounded-full text-[11px] sm:text-[13px] font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                >
                                                    {skill}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-3 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                                    <button
                                        onClick={() => handleAddSkill(newSkill)}
                                        disabled={!newSkill.trim() || isSaving}
                                        className="px-6 py-1.5 bg-[#47C4B7] hover:bg-[#3bb1a5] text-white font-bold rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Save
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }

                {/* ---------- MANAGE SKILLS MODAL ---------- */}
                {
                    isManagingSkills && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setIsManagingSkills(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                            <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
                                        </button>
                                        <h2 className="text-[1.05rem] font-bold tracking-tight text-gray-900 dark:text-white">Skills</h2>
                                    </div>
                                    <div className="flex items-center gap-2 relative">
                                        <button
                                            onClick={() => setShowReorderMenu(!showReorderMenu)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                        >
                                            <MoreHorizontal size={24} className="text-gray-600 dark:text-gray-400" />
                                        </button>

                                        {showReorderMenu && (
                                            <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg shadow-xl z-[60] py-1 border-b-2">
                                                <button
                                                    className="w-full px-4 py-2.5 flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                                    onClick={() => {
                                                        setShowReorderMenu(false);
                                                        setIsManagingSkills(false);
                                                        const currentSkills = Array.isArray(user?.skills) ? [...user.skills] : [];
                                                        const pinned = Array.isArray(user?.pinnedSkills) ? [...user.pinnedSkills] : [];

                                                        // Ensure pinned are at top for the reorder list
                                                        const sortedSkills = [
                                                            ...pinned,
                                                            ...currentSkills.filter(s => !pinned.includes(s))
                                                        ];

                                                        setReorderSkills(sortedSkills);
                                                        setPinnedSkills(pinned);
                                                        setIsReordering(true);
                                                    }}
                                                >
                                                    <UpDown size={18} className="text-gray-600 dark:text-gray-400" />
                                                    <span className="font-medium">Reorder</span>
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => {
                                                setIsManagingSkills(false);
                                                setIsAddingSkill(true);
                                            }}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                        >
                                            <Plus size={24} className="text-gray-600 dark:text-gray-400" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-grow overflow-y-auto custom-scrollbar">
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {user?.skills?.map((skill, index) => (
                                            <div key={index} className="px-6 py-2.5">
                                                <div className="flex justify-between items-center group">
                                                    {editingSkillIdx === index ? (
                                                        <div className="flex-grow flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                defaultValue={skill}
                                                                autoFocus
                                                                onBlur={(e) => handleUpdateSkill(index, e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateSkill(index, e.target.value)}
                                                                className="flex-grow px-2 py-1 border border-[#47C4B7] rounded outline-none text-[15px]"
                                                            />
                                                            <button onClick={() => setEditingSkillIdx(null)}><X size={16} className="text-gray-400" /></button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex-grow flex items-center gap-3">
                                                                <div className="w-2 h-2 rounded-full bg-[#47C4B7] shadow-[0_0_8px_rgba(71,196,183,0.5)]"></div>
                                                                <h3 className="text-[0.95rem] font-medium text-gray-800 dark:text-gray-200">{skill}</h3>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => setEditingSkillIdx(index)}
                                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400"
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSkill(index)}
                                                                    className="p-1 hover:bg-red-50 text-red-600 rounded-full"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
                {/* ---------- REORDER SKILLS MODAL ---------- */}
                {
                    isReordering && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                            onClick={() => {
                                setIsReordering(false);
                                setIsManagingSkills(true);
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                    <h2 className="text-[1.05rem] font-bold tracking-tight text-gray-900 dark:text-white">Reorder</h2>
                                    <button
                                        onClick={() => {
                                            setIsReordering(false);
                                            setIsManagingSkills(true);
                                        }}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                    >
                                        <X size={24} className="text-gray-500" />
                                    </button>
                                </div>

                                <div className="flex-grow overflow-y-auto custom-scrollbar">
                                    <Reorder.Group
                                        axis="y"
                                        values={reorderSkills}
                                        onReorder={(newOrder) => {
                                            // Keeping pinned items at top during drag
                                            const pinned = newOrder.filter(s => pinnedSkills.includes(s));
                                            const unpinned = newOrder.filter(s => !pinnedSkills.includes(s));
                                            setReorderSkills([...pinned, ...unpinned]);
                                        }}
                                        className="divide-y divide-gray-100 dark:divide-gray-800"
                                    >
                                        {reorderSkills.map((skill) => {
                                            const isPinned = pinnedSkills.includes(skill);
                                            return (
                                                <Reorder.Item
                                                    key={skill}
                                                    value={skill}
                                                    dragListener={!isPinned} // Optional: limit dragging if pinned? No, let them reorder within pinned.
                                                    className="px-6 py-4 bg-white dark:bg-gray-900 flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleTogglePin(skill);
                                                            }}
                                                            className={`p-1.5 rounded-full transition-all ${isPinned ? 'text-[#47C4B7] bg-teal-50/50 dark:bg-teal-900/20' : 'text-gray-300 hover:text-gray-500'}`}
                                                            title={isPinned ? 'Unpin skill' : 'Pin to top'}
                                                        >
                                                            <Pin size={18} fill={isPinned ? 'currentColor' : 'none'} className={isPinned ? '' : '-rotate-45'} />
                                                        </button>
                                                        <span className={`text-[0.95rem] font-medium ${isPinned ? 'text-[#47C4B7]' : 'text-gray-800 dark:text-gray-200'}`}>
                                                            {skill}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex flex-col gap-0.5 opacity-40">
                                                            <div className="w-5 h-0.5 bg-gray-500 rounded-full"></div>
                                                            <div className="w-5 h-0.5 bg-gray-500 rounded-full"></div>
                                                            <div className="w-5 h-0.5 bg-gray-500 rounded-full"></div>
                                                            <div className="w-5 h-0.5 bg-gray-500 rounded-full"></div>
                                                        </div>
                                                    </div>
                                                </Reorder.Item>
                                            );
                                        })}
                                    </Reorder.Group>
                                </div>

                                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setIsReordering(false);
                                            setIsManagingSkills(true);
                                        }}
                                        className="px-6 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setIsSaving(true);
                                            try {
                                                await updateProfile({
                                                    ...user,
                                                    skills: reorderSkills,
                                                    pinnedSkills: pinnedSkills
                                                });
                                                setIsReordering(false);
                                                setIsManagingSkills(true);
                                            } catch (error) {
                                                toast.error('Failed to reorder skills');
                                            } finally {
                                                setIsSaving(false);
                                            }
                                        }}
                                        disabled={isSaving}
                                        className="px-6 py-1.5 bg-[#47C4B7] hover:bg-[#3bb1a5] text-white font-bold rounded-full shadow-md transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
                {/* ---------- TOP SKILLS PREVIEW MODAL ---------- */}
                {
                    showTopSkillsModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowTopSkillsModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                            >
                                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                    <h2 className="text-[1.05rem] font-bold tracking-tight text-gray-900 dark:text-white">Top skills</h2>
                                    <button onClick={() => setShowTopSkillsModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                        <X size={24} className="text-gray-500" />
                                    </button>
                                </div>

                                <div className="p-6 divide-y divide-gray-100 dark:divide-gray-800">
                                    {(user?.pinnedSkills?.length > 0 ? user.pinnedSkills : user?.skills?.slice(0, 3) || []).map((skill, index) => (
                                        <div key={index} className="py-4 first:pt-0 last:pb-0 flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#47C4B7] shadow-[0_0_8px_rgba(71,196,183,0.5)]"></div>
                                            <span className="text-[1.1rem] font-medium text-gray-800 dark:text-gray-200">{skill}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
};
