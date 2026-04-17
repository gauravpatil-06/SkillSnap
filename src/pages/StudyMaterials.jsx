import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Calendar, FileText, Image as ImageIcon,
    File, Download, Trash2, Pencil, X, Upload, Filter,
    ExternalLink, ChevronRight, LayoutGrid, List, FileType, Clock, BookOpen, RefreshCw
} from 'lucide-react';
import { useMaterials } from '../context/MaterialContext';
import api, { BASE_URL } from '../utils/api';
import toast from 'react-hot-toast';
import { PageLoader } from '../components/ui/PageLoader';
import { PageHeader } from '../components/ui/PageHeader';
import { format, parseISO, startOfDay, endOfDay, subDays, startOfMonth, startOfYear } from 'date-fns';

/* ─────────────────────────────────────────────────────────────────
   Inline styles for the zoom + border hover effect on cards
───────────────────────────────────────────────────────────────── */
const cardBaseStyle = {
    transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease, border-color 0.28s ease',
};

const cardHoverStyle = {
    transform: 'scale(1.02) translateY(-4px)',
    boxShadow: '0 20px 40px -8px rgba(71,196,183,0.18), 0 8px 16px -4px rgba(71,196,183,0.1)',
    borderColor: 'rgba(71,196,183,0.5)',
};

const HoverCard = ({ children, className, style, delay, rKey, extraHover = {} }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            key={rKey}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
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

export const StudyMaterials = () => {
    const { materials, isLoading, addMaterial, updateMaterial, deleteMaterial, fetchMaterials } = useMaterials();

    // UI States
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [filters, setFilters] = useState({
        searchTerm: '',
        from: '',
        to: '',
        typeFilter: 'all',
        timeFilter: 'all'
    });
    const [viewMode, setViewMode] = useState('grid');
    const [previewFile, setPreviewFile] = useState(null);
    const [expandedMaterials, setExpandedMaterials] = useState(new Set());
    const [deletingMaterialId, setDeletingMaterialId] = useState(null);

    // Form States
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const allowedTypes = [
                'application/pdf',
                'image/jpeg', 'image/png', 'image/webp',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!allowedTypes.includes(selectedFile.type)) {
                toast.error('Supported files: PDF, Images, DOC, DOCX');
                return;
            }
            if (selectedFile.size > 20 * 1024 * 1024) {
                toast.error('File too large (Max 20MB)');
                return;
            }
            setFile(selectedFile);
        }
    };

    const getFileType = (mime) => {
        if (mime.includes('pdf')) return 'pdf';
        if (mime.includes('image')) return 'image';
        return 'doc';
    };

    const submitMaterial = async (e) => {
        e.preventDefault();
        if (!title.trim() || (!editingMaterial && !file)) {
            toast.error('Title and File are required');
            return;
        }

        setIsSubmitting(true);
        let uploadedFileUrl = editingMaterial?.fileUrl || '';
        let detectedFileType = editingMaterial?.fileType || '';
        let originalFileName = file ? file.name : (editingMaterial?.fileName || '');

        try {
            if (file) {
                // Check size for local storage compatibility (roughly 2MB)
                if (file.size > 2 * 1024 * 1024) {
                    toast.error('File too large for offline storage (Max 2MB)');
                    setIsSubmitting(false);
                    return;
                }

                // Process file locally as Data URL for offline mode
                uploadedFileUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(file);
                });
                
                detectedFileType = getFileType(file.type);
            }

            if (editingMaterial) {
                await updateMaterial(editingMaterial._id, {
                    title,
                    description,
                    fileUrl: uploadedFileUrl,
                    fileType: detectedFileType,
                    fileName: originalFileName
                });
                toast.success('Material updated!');
            } else {
                await addMaterial(title, description, uploadedFileUrl, detectedFileType, originalFileName);
                toast.success('Material uploaded successfully!');
            }

            resetForm();
        } catch (error) {
            toast.error('Upload failed');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setFile(null);
        setEditingMaterial(null);
        setIsAddModalOpen(false);
    };

    const openEditModal = (material) => {
        setEditingMaterial(material);
        setTitle(material.title);
        setDescription(material.description || '');
        setFile(null);
        setIsAddModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingMaterialId) return;
        try {
            await deleteMaterial(deletingMaterialId);
            toast.success('Material removed! 🗑️');
            setDeletingMaterialId(null);
        } catch (err) {
            toast.error('Failed to delete material');
        }
    };

    const toggleExpandMaterial = (materialId) => {
        setExpandedMaterials(prev => {
            const next = new Set(prev);
            if (next.has(materialId)) next.delete(materialId);
            else next.add(materialId);
            return next;
        });
    };

    const handleDownload = async (fileUrl, originalName) => {
        try {
            const loadingToast = toast.loading('Downloading...');
            
            let downloadUrl = fileUrl;
            
            // If it's a server path, handle via fetch
            if (fileUrl.startsWith('/uploads')) {
                const response = await fetch(`${BASE_URL}${fileUrl}`);
                if (!response.ok) throw new Error('File not found on server');
                const blob = await response.blob();
                downloadUrl = window.URL.createObjectURL(blob);
            }

            const link = document.createElement('a');
            link.href = downloadUrl;
            
            const safeOriginalName = originalName || 'document.pdf';
            const cleanFileName = decodeURIComponent(safeOriginalName).replace(/-\d{13}-\d+(?=\.[^.]+$)/, '');
            link.download = cleanFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            if (fileUrl.startsWith('/uploads')) {
                window.URL.revokeObjectURL(downloadUrl);
            }
            
            toast.success('Download complete', { id: loadingToast });
        } catch (error) {
            console.error("Download failed:", error);
            toast.error("Download failed");
        }
    };

    const handleOpenFile = (fileUrl) => {
        if (!fileUrl) return;

        if (fileUrl.startsWith('data:')) {
            try {
                const parts = fileUrl.split(',');
                const byteString = atob(parts[1]);
                const mimeString = parts[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: mimeString });
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');
            } catch (err) {
                console.error("Failed to open Base64 material:", err);
                toast.error("Could not open this file.");
            }
        } else {
            window.open(`${BASE_URL}${fileUrl}`, '_blank');
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            setFilters({ searchTerm: '', from: '', to: '', typeFilter: 'all', timeFilter: 'all' });
            await fetchMaterials();
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error(err);
        } finally {
            setTimeout(() => setIsRefreshing(false), 600);
        }
    };

    const filteredAndGroupedMaterials = useMemo(() => {
        const filtered = materials.filter(m => {
            // Text match
            const matchesSearch = m.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                (m.description && m.description.toLowerCase().includes(filters.searchTerm.toLowerCase()));

            // Type match
            const matchesType = filters.typeFilter === 'all' || m.fileType === filters.typeFilter;

            // Date filtering
            const dateObj = new Date(m.createdAt);
            let fromDate = filters.from ? new Date(filters.from) : null;
            let toDate = filters.to ? new Date(filters.to) : null;

            if (filters.timeFilter !== 'all' && !filters.from && !filters.to) {
                const now = new Date();
                if (filters.timeFilter === '7d') fromDate = subDays(now, 7);
                if (filters.timeFilter === 'monthly') fromDate = startOfMonth(now);
                if (filters.timeFilter === 'yearly') fromDate = startOfYear(now);
            }

            let dateMatch = true;
            if (fromDate) dateMatch = dateMatch && dateObj >= startOfDay(fromDate);
            if (toDate) dateMatch = dateMatch && dateObj <= endOfDay(toDate);

            return matchesSearch && matchesType && dateMatch;
        });

        const groups = {};
        filtered.forEach(m => {
            const dateStr = new Date(m.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(m);
        });

        return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
    }, [materials, filters]);

    // Global transition loader handles the initial wait
    // PageLoader handled by AppLayout transition

    const FileIcon = ({ type, className }) => {
        if (type === 'pdf') return <FileText className={`text-red-500 ${className}`} />;
        if (type === 'image') return <ImageIcon className={`text-blue-500 ${className}`} />;
        return <File className={`text-emerald-500 ${className}`} />;
    };

    return (
        <div className="space-y-6 pb-10 max-w-full px-0">
            <PageHeader
                icon={BookOpen}
                title="Study Materials"
                subtitle="Premium file management for your academic journey"
                right={
                    <button
                        onClick={handleRefresh}
                        className={`shrink-0 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-500 hover:text-[#47C4B7] transition-all hover:shadow-md ${isRefreshing ? 'animate-spin cursor-not-allowed opacity-50' : ''}`}
                        title="Refresh Data"
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={16} />
                    </button>
                }
            />

            <div className="p-2 sm:p-0">
                <HoverCard
                    rKey={`header-controls-${refreshKey}`}
                    delay={0.1}
                    className="p-1 mb-0"
                    style={{ border: 'none', background: 'transparent', boxShadow: 'none', transform: 'none' }}
                >
                    <div className="flex flex-col gap-4 sm:gap-5 mb-2">
                        {/* Row 1: Search + Upload */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Search */}
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#47C4B7] transition-colors" size={15} />
                                <input
                                    type="text"
                                    placeholder="Search materials..."
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                                    className="w-full pl-11 pr-4 py-2 sm:py-2.5 bg-transparent border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] text-[15px] text-gray-900 dark:text-white outline-none transition-all placeholder-gray-400 shadow-sm"
                                />
                            </div>

                            {/* Upload Button */}
                            <button
                                onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                                className="shrink-0 flex items-center justify-center gap-1.5 p-2 sm:px-4 sm:py-2.5 bg-[#47C4B7] hover:bg-[#3db3a6] text-white font-black rounded-full sm:rounded-xl shadow-lg shadow-[#47C4B7]/20 transition-all transform hover:scale-[1.02] group"
                                title="Upload Material"
                            >
                                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} />
                                <span className="hidden sm:inline text-[13px] sm:text-[15px]">Upload Material</span>
                            </button>
                        </div>

                        {/* Row 2: Dates + Time Pills + Type Filters */}
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* From Date */}
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all whitespace-nowrap bg-transparent text-gray-500/80 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700">
                                        <input 
                                            type={filters.from ? "date" : "text"} 
                                            placeholder="DD-MM-YYYY"
                                            onFocus={(e) => (e.target.type = "date")}
                                            onBlur={(e) => !e.target.value && (e.target.type = "text")}
                                            value={filters.from} 
                                            onChange={(e) => setFilters({ ...filters, from: e.target.value, timeFilter: 'all' })} 
                                            className="bg-transparent border-none text-[11px] font-black focus:ring-0 p-0 w-[105px] text-gray-500/80 hover:text-gray-500 outline-none uppercase" 
                                        />
                                    </div>

                                    {/* To Date */}
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all whitespace-nowrap bg-transparent text-gray-500/80 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700">
                                        <input 
                                            type={filters.to ? "date" : "text"} 
                                            placeholder="DD-MM-YYYY"
                                            onFocus={(e) => (e.target.type = "date")}
                                            onBlur={(e) => !e.target.value && (e.target.type = "text")}
                                            value={filters.to} 
                                            onChange={(e) => setFilters({ ...filters, to: e.target.value, timeFilter: 'all' })} 
                                            className="bg-transparent border-none text-[11px] font-black focus:ring-0 p-0 w-[105px] text-gray-500/80 hover:text-gray-500 outline-none uppercase" 
                                        />
                                    </div>
                                </div>

                                {/* Quick Pills */}
                                <div className="flex items-center gap-2 flex-nowrap shrink-0">
                                    {[
                                        { id: '7d', label: 'Last 7 Days' },
                                        { id: 'monthly', label: 'Monthly' },
                                        { id: 'yearly', label: 'Yearly' }
                                    ].map(pill => (
                                        <button
                                            key={pill.id}
                                            onClick={() => setFilters({ ...filters, timeFilter: pill.id, from: '', to: '' })}
                                            className={`px-4 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all whitespace-nowrap ${filters.timeFilter === pill.id
                                                ? 'bg-[#47C4B7] text-white shadow-lg shadow-[#47C4B7]/20 hover:scale-105 active:scale-95'
                                                : 'bg-transparent text-gray-500/80 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'
                                                }`}
                                        >
                                            {pill.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Row 3: Type Pills + View Switcher */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {['all', 'pdf', 'image', 'doc'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFilters({ ...filters, typeFilter: type })}
                                            className={`px-4 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all whitespace-nowrap ${filters.typeFilter === type
                                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                                : 'bg-transparent text-gray-500/80 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>

                                {/* View Switcher */}
                                <div className="flex p-0.5 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg shrink-0">
                                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-[#47C4B7] shadow-sm' : 'text-gray-400 hover:text-[#47C4B7]'}`}><LayoutGrid size={15} /></button>
                                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-[#47C4B7] shadow-sm' : 'text-gray-400 hover:text-[#47C4B7]'}`}><List size={15} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </HoverCard>
            </div >

            <div className="space-y-6">
                {filteredAndGroupedMaterials.length === 0 ? (
                    <div className="py-20 sm:py-32 text-center space-y-1.5 sm:space-y-3 px-10">
                        <FileType size={36} className="text-[#47C4B7] opacity-35 mx-auto mb-1.5" />
                        <h3 className="text-[10px] sm:text-[14px] font-bold text-gray-900 dark:text-white opacity-80 tracking-tight">No study materials uploaded yet.</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-[8px] sm:text-[10px] font-medium">Your study resources will appear here once uploaded.</p>
                    </div>
                ) : (
                    filteredAndGroupedMaterials.map(([date, items], gIndex) => (
                        <HoverCard
                            key={date}
                            rKey={`${date}-${refreshKey}`}
                            delay={0.2 + (gIndex * 0.1)}
                            className="space-y-6 p-5 sm:p-7 glass-card bg-white dark:bg-gray-900/40 border-2 border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                                    <Calendar size={14} className="text-[#47C4B7]" />
                                    <span className="text-[10px] sm:text-[13px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300">{date}</span>
                                </div>
                                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800/60" />
                            </div>

                            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6' : 'space-y-4'}>
                                {items.map((m, iIndex) => (
                                    <motion.div
                                        key={m._id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-300 border ${viewMode === 'list' ? 'flex items-center gap-4 sm:gap-6' : 'flex flex-col'} bg-white dark:bg-gray-800/40 border-gray-300 dark:border-gray-600 hover:border-[#47C4B7] shadow-sm hover:shadow-2xl hover:shadow-[#47C4B7]/20`}
                                    >
                                        <div className={`${viewMode === 'grid' ? 'w-full aspect-video mb-4' : 'w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0'} bg-white dark:bg-gray-800/50 rounded-xl overflow-hidden flex items-center justify-center relative cursor-pointer group-hover:bg-[#47C4B7]/5 transition-colors`}
                                            onClick={() => setPreviewFile(m)}
                                        >
                                            {m.fileType === 'image' ? (
                                                <img src={`${BASE_URL}${m.fileUrl}`} alt={m.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                            ) : (
                                                <FileIcon type={m.fileType} className={`${viewMode === 'grid' ? 'w-10 h-10 sm:w-14 sm:h-14' : 'w-10 h-10'} opacity-40 group-hover:opacity-100 transition-opacity`} />
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-all">
                                                <ExternalLink className="text-white opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all" size={24} />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col">
                                            <div className="flex justify-between items-start gap-2 mb-1.5">
                                                <h4 className="text-[12px] sm:text-[15px] font-bold truncate text-gray-700 dark:text-gray-300 group-hover:text-[#47C4B7] transition-colors">{m.title}</h4>
                                            </div>
                                            <div className="mt-1 mb-1">
                                                <p className={`text-[11px] sm:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium transition-all duration-300 break-words overflow-hidden ${expandedMaterials.has(m._id) ? '' : 'line-clamp-2'}`}>
                                                    {m.description || 'Quickly review your uploaded material.'}
                                                </p>
                                                {m.description && m.description.length > 90 && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleExpandMaterial(m._id); }}
                                                        className="text-[9px] sm:text-[11px] font-black text-[#47C4B7] hover:underline mt-0.5 flex items-center gap-1"
                                                    >
                                                        {expandedMaterials.has(m._id) ? 'Show Less' : 'Read more'}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5 mb-2 sm:mb-3 text-gray-400 dark:text-gray-500">
                                                <Clock size={10} className="sm:w-3 sm:h-3" />
                                                <span className="text-[10px] sm:text-[13px] font-medium tracking-tight">
                                                    {new Date(m.createdAt).toLocaleString('en-US', {
                                                        month: 'short', day: 'numeric',
                                                        hour: '2-digit', minute: '2-digit', hour12: true
                                                    })}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 pt-1.5 sm:pt-2 mt-auto border-t border-gray-100 dark:border-gray-800/60">
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-red-600 dark:text-red-400 text-[10px] sm:text-[11px] font-black shrink-0 relative z-10">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { 
                                                            e.preventDefault(); 
                                                            e.stopPropagation(); 
                                                            handleOpenFile(m.fileUrl); 
                                                        }}
                                                        className="flex items-center gap-1 hover:text-red-800 dark:hover:text-red-300 transition-colors bg-transparent border-none p-0 cursor-pointer"
                                                        title="Open File"
                                                    >
                                                        <FileText size={12} className="sm:w-[14px] sm:h-[14px]" /> <span className={viewMode === 'grid' ? 'hidden xs:inline sm:inline' : 'inline'}>Open</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownload(m.fileUrl, m.fileName); }}
                                                        className="flex items-center gap-1 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                                                        title="Download Original"
                                                    >
                                                        <Download size={12} className="sm:w-[14px] sm:h-[14px]" /> <span className={viewMode === 'grid' ? 'hidden sm:inline' : 'inline'}>Download</span>
                                                    </button>
                                                </div>

                                                {/* Separator */}
                                                <div className="w-px h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 shrink-0"></div>

                                                <div className="flex items-center gap-px shrink-0">
                                                    <button onClick={(e) => { e.stopPropagation(); openEditModal(m); }} className="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="Edit Material">
                                                        <Pencil className="w-[13px] h-[13px] sm:w-[16px] sm:h-[16px]" />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); setDeletingMaterialId(m._id); }} className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Delete Material">
                                                        <Trash2 className="w-[13px] h-[13px] sm:w-[16px] sm:h-[16px]" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </HoverCard>
                    ))
                )}
            </div>

            {/* Form Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 sm:p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="glass-card bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-3xl p-5 sm:p-6 w-full max-w-[26rem] shadow-2xl relative overflow-hidden flex flex-col"
                        >
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#47C4B7]/5 blur-3xl rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />

                            <div className="flex justify-between items-center mb-5 z-10">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2.5 tracking-tight">
                                    <div className="p-1.5 bg-[#47C4B7]/10 dark:bg-[#47C4B7]/20 rounded-md">
                                        {editingMaterial ? <Pencil size={14} className="text-[#47C4B7]" /> : <Plus size={14} className="text-[#47C4B7]" />}
                                    </div>
                                    {editingMaterial ? 'Edit Material' : 'Upload Resource'}
                                </h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            </div>

                            <form onSubmit={submitMaterial} className="space-y-4 z-10">
                                <div className="space-y-1.5">
                                    <label className="block text-[15px] font-semibold text-gray-700 dark:text-gray-300 tracking-tight">Material Title <span className="text-red-500">*</span></label>
                                    <input
                                        type="text" required autoFocus
                                        value={title} onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-3.5 py-2.5 text-[15px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] text-gray-900 dark:text-white outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 font-medium"
                                        placeholder="e.g., Core Java Full Notes"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[15px] font-semibold text-gray-700 dark:text-gray-300 tracking-tight">Brief Description</label>
                                    <textarea
                                        rows="2" value={description} onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-3.5 py-2.5 text-[15px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-1 focus:ring-[#47C4B7]/30 focus:border-[#47C4B7] text-gray-900 dark:text-white outline-none resize-none transition-all custom-scrollbar placeholder-gray-400 dark:placeholder-gray-500"
                                        placeholder="Add some context..."
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[15px] font-semibold text-gray-700 dark:text-gray-300 tracking-tight">Attachment</label>

                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-full py-4 border-2 border-dashed ${file ? 'border-[#47C4B7] bg-[#47C4B7]/5' : 'border-gray-300 dark:border-gray-700 hover:border-[#47C4B7]/40 hover:bg-gray-50 dark:hover:bg-gray-800/50'} rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group`}
                                    >
                                        <div className={`p-2.5 rounded-full ${file ? 'bg-[#47C4B7]/20' : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-[#47C4B7]/10 transition-colors'}`}>
                                            <Upload size={18} className={file ? 'text-[#47C4B7]' : 'text-gray-400 group-hover:text-[#47C4B7] transition-colors'} />
                                        </div>
                                        <div className="text-center">
                                            {file ? (
                                                <>
                                                    <p className="text-[13px] font-bold text-[#47C4B7] flex items-center justify-center gap-1.5">
                                                        <FileText size={14} /> {file.name}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-[#47C4B7]/80 mt-1">Click to change document</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                                                        Click to Select File
                                                    </p>
                                                    <p className="text-[10px] font-medium text-gray-500 mt-0.5">
                                                        Max file size: 10MB
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800 mt-2">
                                    <button
                                        type="button" onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 py-2.5 text-[15px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit" disabled={isSubmitting || !title.trim()}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[15px] bg-[#47C4B7] hover:bg-[#3db3a6] text-white font-extrabold rounded-xl shadow-md disabled:opacity-50 transition"
                                    >
                                        {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                                        {isSubmitting ? 'Uploading...' : (editingMaterial ? 'Update' : 'Upload')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview */}
            <AnimatePresence>
                {previewFile && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-4">
                        <div className="absolute top-8 right-8 flex items-center gap-6 z-[210]">
                            <button onClick={() => setPreviewFile(null)} className="p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"><X size={32} /></button>
                        </div>
                        <div className="w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center overflow-hidden rounded-[3rem] bg-black/20 border border-white/5 shadow-2xl">
                            {previewFile.fileType === 'image' ? (
                                <img src={`${BASE_URL}${previewFile.fileUrl}`} alt={previewFile.title} className="max-w-full max-h-full object-contain" />
                            ) : previewFile.fileType === 'pdf' ? (
                                <iframe src={`${BASE_URL}${previewFile.fileUrl}`} className="w-full h-full border-none" />
                            ) : (
                                <div className="text-center space-y-8 p-10">
                                    <FileIcon type="doc" className="w-32 h-32 mx-auto" />
                                    <div className="space-y-4">
                                        <h2 className="text-4xl font-black text-white">{previewFile.title}</h2>
                                        <p className="text-gray-400 text-xl font-medium">Document preview is not available in viewer.</p>
                                    </div>
                                    <button onClick={() => handleDownload(previewFile.fileUrl, previewFile.fileName)} className="px-10 py-5 bg-[#47C4B7] text-white font-black text-xl rounded-3xl shadow-2xl hover:scale-105 transition-all">Download to Open</button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ---------- DELETE MATERIAL CONFIRMATION MODAL ---------- */}
                {deletingMaterialId && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-[340px] shadow-2xl text-center border border-gray-100 dark:border-gray-800"
                        >
                            <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-100 dark:border-red-500/20">
                                <Trash2 size={24} />
                            </div>

                            <h3 className="text-[1.05rem] font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Delete Study Material?</h3>
                            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-6">
                                This study resource will be permanently removed.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeletingMaterialId(null)}
                                    className="flex-1 py-3 text-[15px] font-bold bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-750 transition"
                                >
                                    No, keep it
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="flex-1 py-3 text-[15px] font-bold bg-[#47C4B7] text-white rounded-xl hover:bg-[#3db3a6] shadow-lg shadow-[#47C4B7]/25 transition"
                                >
                                    Yes, delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};
