import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundLayout } from './layout/BackgroundLayout';
import { CinematicOverlay } from './ui/CinematicOverlay';
import { SpotlightCard } from './ui/SpotlightCard';
import { FilePreviewer } from './ui/FilePreviewModal';
import {
    Loader2,
    Eye,
    X,
    LayoutDashboard,
    Users,
    Activity,
    Search,
    TrendingUp,
    Briefcase,
    Table,
    ChevronDown,
    MoreHorizontal,
    FileText,
    Download,
    AlertCircle,
    LayoutGrid,
    Clock,
    PlayCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    getAllBoards, getAllFolders, getAllWorkspaces,
    getMultipleBoardItems,
    getAssetPublicUrl,
    prefetchBoardItems
} from '../services/mondayService';
import { supabase } from '../services/boardsService';
import { useVisibilityPolling, useBoardItems, useUpdateItemValue } from '../hooks/useMondayData';
// User management Removed

// --- Helpers ---
// (Updated)
const getBoardIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('dashboard')) return LayoutDashboard;
    if (n.includes('form')) return FileText;
    return Table;
};

// --- Folder & Tree Components ---

const FolderTreeItem = ({ folder, allFolders, allBoards, onSelectBoard, selectedBoardId, depth = 0 }: any) => {
    const [isOpen, setIsOpen] = useState(false);

    // Custom Sort Logic based on Screenshot
    const FOLDER_ORDER = ["Hiring and Onboarding", "Management", "Editors", "Clients", "Old"];
    const getSortWeight = (name: string) => {
        const index = FOLDER_ORDER.findIndex(n => name.includes(n));
        return index === -1 ? 999 : index;
    };

    // Find nested items using IDs (Robust string comparison)
    const childFolders = folder.children
        ? folder.children
            .map((c: any) => allFolders.find((f: any) => String(f.id) === String(c.id)))
            .filter(Boolean)
            .sort((a: any, b: any) => getSortWeight(a.name) - getSortWeight(b.name))
        : [];

    const childBoards = folder.children
        ? folder.children
            .map((c: any) => allBoards.find((b: any) => String(b.id) === String(c.id)))
            .filter(Boolean)
            .sort((a: any, b: any) => a.name.localeCompare(b.name)) // Boards can stay A-Z or unsorted? Let's keep A-Z for boards inside folders for now unless user complains.
        : [];



    // Auto-expand if selected board is inside
    useEffect(() => {
        if (childBoards.some((b: any) => b.id === selectedBoardId)) {
            setIsOpen(true);
        }
    }, [selectedBoardId, childBoards]);

    // Recursive check for content visibility
    const hasVisibleBoards = (fId: string): boolean => {
        // Check direct boards in this folder
        const hasDirectBoards = allBoards.some((b: any) => String(b.folder_id) === String(fId));
        if (hasDirectBoards) return true;

        // Check subfolders
        const thisFolder = allFolders.find((f: any) => String(f.id) === String(fId));
        if (!thisFolder || !thisFolder.children) return false;

        return thisFolder.children.some((child: any) => {
            // Is child a folder?
            const isFolder = allFolders.find((f: any) => String(f.id) === String(child.id));
            if (isFolder) return hasVisibleBoards(isFolder.id);
            // Is child a board? (Already filtered list)
            const isBoard = allBoards.find((b: any) => String(b.id) === String(child.id));
            return !!isBoard;
        });
    };

    const hasContent = hasVisibleBoards(folder.id);
    if (!hasContent) return null;

    const hasChildren = childFolders.length > 0 || childBoards.length > 0;
    // Redundant but safe check? No, childFolders might be populated but empty inside.
    // Actually hasVisibleBoards covers it. But childFolders array is used for rendering.
    // If hasContent is true, then render.

    // We can rely on hasContent.
    if (!hasChildren && !hasContent) return null;

    return (
        <div className="select-none text-[13px] font-sans">
            <div
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all mb-0.5 group ${isOpen ? 'text-white' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}`}
                style={{ paddingLeft: `${depth * 12 + 12}px` }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center transition-colors">
                    <div className={`transition-transform duration-200 ${isOpen ? 'rotate-90 text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                        <svg width="6" height="8" viewBox="0 0 6 8" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 0L6 4L0 8V0Z" />
                        </svg>
                    </div>
                </div>
                {/* Folder Name - Colored */}
                <span className={`font-semibold truncate transition-colors ${isOpen ? 'opacity-100' : 'opacity-90'}`} style={{ color: folder.color || 'inherit' }}>
                    {folder.name}
                </span>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {childFolders.map((subFolder: any) => (
                            <FolderTreeItem
                                key={subFolder.id}
                                folder={subFolder}
                                allFolders={allFolders}
                                allBoards={allBoards}
                                onSelectBoard={onSelectBoard}
                                selectedBoardId={selectedBoardId}
                                depth={depth + 1}
                            />
                        ))}
                        {childBoards.map((board: any) => {
                            const Icon = getBoardIcon(board.name);
                            // Clean Name for Display
                            let displayName = board.name.replace(/ - Workspace/g, '').replace(/\([^)]*\)/g, '').trim();
                            if (!displayName) displayName = board.name.replace(/ - Workspace/g, '').trim();
                            const isSelected = selectedBoardId === board.id;

                            return (
                                <div
                                    key={board.id}
                                    onClick={() => onSelectBoard(board.id)}
                                    className={`flex items-center gap-2.5 px-3 py-1.5 mx-2 rounded-lg cursor-pointer transition-all mb-0.5 relative group/item
                                        ${isSelected
                                            ? 'bg-emerald-500/10 text-white font-semibold'
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 font-medium'}`}
                                    style={{ paddingLeft: `${(depth + 1) * 12 + 12}px` }}
                                    title={board.name} // Show full name on hover
                                >
                                    {/* Active Indicator Bar */}
                                    {isSelected && (
                                        <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-emerald-500 rounded-r-full shadow-[0_0_8px_rgba(16, 185, 129,0.5)]" />
                                    )}

                                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${isSelected ? 'text-emerald-400' : 'text-gray-500 group-hover/item:text-gray-400'}`} />
                                    <span className="truncate tracking-wide">{displayName}</span>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Board Cell Component ---
const BoardCell = ({ item, column, boardId, onUpdate, onPreview }: { item: any, column: any, boardId: string | null, onUpdate: () => void, onPreview: (url: string, name: string, assetId?: string) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { mutateAsync: updateItem } = useUpdateItemValue();

    // Find value for this column
    const colValueObj = item.column_values.find((v: any) => v.id === column.id);
    let displayValue = colValueObj ? (colValueObj.text || '') : '';

    // Robust Parsing for Complex Types
    let linkUrl = null;
    let fileName = null;
    let assetId = null;

    // Fix for Mirror Columns: Use display_value if available (native or from our updated query)
    if ((column.type === 'mirror' || column.type === 'lookup') && colValueObj.display_value) {
        displayValue = colValueObj.display_value;
    }

    if (colValueObj && colValueObj.value) {
        try {
            const val = JSON.parse(colValueObj.value);
            // Link
            if (column.type === 'link') {
                linkUrl = val.url;
                // If we haven't already set displayValue from mirror logic, use the link text
                if (!colValueObj.display_value) {
                    displayValue = val.text || val.url || displayValue;
                }
            }
            // Date
            if (column.type === 'date') {
                displayValue = val.date || displayValue;
            }
            // Email
            if (column.type === 'email') {
                displayValue = val.email || displayValue;
            }
            // Email
            if (column.type === 'email') {
                displayValue = val.email || displayValue;
            }

            // Universal File Extraction (Check for files in ANY column type)
            // This fixes cases where "Submission" or other columns act as files but aren't typed as 'file'
            if (val.files && val.files.length > 0) {
                // If we haven't found a linkUrl yet, or if this is definitely a file structure
                const fileUrl = val.files[0].public_url || val.files[0].url || val.files[0].urlThumbnail;
                if (fileUrl) {
                    linkUrl = fileUrl;
                    fileName = val.files[0].name;
                    assetId = val.files[0].assetId; // Capture assetId for on-demand public URL fetch
                }
            }
            if (val.files && val.files.length > 0) {
                // If we haven't found a linkUrl yet, or if this is definitely a file structure
                const fileUrl = val.files[0].public_url || val.files[0].url || val.files[0].urlThumbnail;
                if (fileUrl) {
                    linkUrl = fileUrl;
                    fileName = val.files[0].name;
                }
            }
        } catch (e) {
            // value might not be JSON, ignore
        }
    }

    // Special handling if displayValue (text) is actually a raw URL for files (User Screenshot Case)
    // OR if it's just a filename that we want to treat as a file (Universal Playback Request)
    const isFileLike = /\.(mp4|mov|webm|ogg|pdf|jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(displayValue);

    if (!linkUrl && (displayValue.startsWith('http') || isFileLike)) {
        // If it looks like a URL, use it as the link
        if (displayValue.startsWith('http') || displayValue.startsWith('blob:')) {
            linkUrl = displayValue;
        }
        // If it's just a filename (e.g. "video.mp4") without HTTP, we might treat it as a relative path or just a file label.
        // For the purpose of the user's request "make it playable", we assume the text MIGHT be a playable URL or at least we should try.
        // If it's just a filename, we can't play it without a base URL.
        // But let's at least capture the filename.

        try {
            // If it's a URL, extract filename. If it's already a filename, keep it.
            fileName = displayValue.startsWith('http') ? decodeURIComponent(displayValue.split('/').pop() || 'File') : displayValue;
        } catch (e) {
            fileName = "Attachment";
        }
    }
    if (fileName) displayValue = fileName; // Override ugly URL text with filename

    // Fallback: Extract assetId from protected_static URL pattern if not already captured
    // URL format: /protected_static/{account}/resources/{assetId}/filename
    // IMPORTANT: This must run AFTER linkUrl is set from displayValue (above)
    if (!assetId && linkUrl && linkUrl.includes('protected_static') && linkUrl.includes('/resources/')) {
        const match = linkUrl.match(/\/resources\/(\d+)\//);
        if (match && match[1]) {
            assetId = match[1];
        }
    }


    // Parse column settings for Status/Dropdown
    let options: any[] = [];
    if (column.type === 'color' || column.type === 'status') {
        try {
            const settings = JSON.parse(column.settings_str || '{}');
            if (settings.labels) {
                options = Object.entries(settings.labels).map(([key, label]: any) => ({
                    id: key,
                    label: label,
                    color: settings.labels_colors ? settings.labels_colors[key]?.color : '#fff'
                }));
            }
        } catch (e) {
            console.error("Failed to parse column settings", e);
        }
    }

    const handleSave = async (newValue: string) => {
        if (newValue === displayValue) {
            setIsEditing(false);
            return;
        }

        if (!boardId) {
            console.error("Cannot save: No board ID");
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            await updateItem({ boardId, itemId: item.id, columnId: column.id, value: newValue });
            await onUpdate();
        } catch (err) {
            console.error(err);
            alert("Failed to update value");
        } finally {
            setIsLoading(false);
            setIsEditing(false);
        }
    };

    if (isLoading) {
        return <div className="text-gray-500 text-xs animate-pulse flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</div>;
    }

    // Heuristic: If it's a mirror column that looks like a status, treat it as one
    const isMirrorStatus = (column.type === 'mirror' || column.type === 'lookup') && column.title.toLowerCase().includes('status');

    // Status / Dropdown Rendering OR Mirror Status
    if (column.type === 'color' || column.type === 'status' || isMirrorStatus) {
        let currentOption = options.find(o => o.label === displayValue);

        // Manual Color Override for Mirror Statuses if options are missing
        if (!currentOption && isMirrorStatus) {
            const val = displayValue;
            // Detailed Mapping based on User Screenshot
            if (val.includes('Unassigned')) currentOption = { label: val, color: '#595959', id: 'unassigned' }; // Dark Grey

            // Yellows
            else if (val.includes('Assigned (CV)')) currentOption = { label: val, color: '#fec12d', id: 'assigned_cv' };

            // Oranges
            else if (val.includes('Working on it (CV)')) currentOption = { label: val, color: '#fdab3d', id: 'working_cv' };
            else if (val.includes('Exporting')) currentOption = { label: val, color: '#ffadad', id: 'exporting' }; // Light Peach/Orange

            // Pinks/Reds
            else if (val.includes('Taking a break (CV)')) currentOption = { label: val, color: '#ff158a', id: 'break_cv' };
            else if (val.includes('Client Info')) currentOption = { label: val, color: '#e2445c', id: 'client_info' };
            else if (val.includes('(Client) Approved')) currentOption = { label: val, color: '#cd3859', id: 'client_approved' }; // Dark Red

            // Purples
            else if (val.includes('For Approval (CV)')) currentOption = { label: val, color: '#5D24AA', id: 'for_approval_cv' }; // Deep Purple
            else if (val.includes('(Client) Uploading')) currentOption = { label: val, color: '#904EE2', id: 'client_uploading' };

            // Greens
            else if (val.includes('1st Approval')) currentOption = { label: val, color: '#9cd326', id: '1st_approval' }; // Lime
            else if (val.includes('Approved (CV)')) currentOption = { label: val, color: '#00c875', id: 'approved_cv' };
            else if (val.includes('(Client) Sent for')) currentOption = { label: val, color: '#009d6c', id: 'client_sent' }; // Dark Green

            // Blues
            else if (val.includes('Waiting for Client')) currentOption = { label: val, color: '#579bfc', id: 'waiting_client' };
            else if (val.includes('Downloading')) currentOption = { label: val, color: '#505f79', id: 'downloading' }; // Dark Blue Grey

            // Fallback Heuristics
            else if (val.includes('Approved')) currentOption = { label: val, color: '#00c875', id: 'approved_gen' };
            else if (val.includes('Revision')) currentOption = { label: val, color: '#eebb4d', id: 'revision' }; // Goldish
            else if (val.includes('Stuck') || val.includes('Error')) currentOption = { label: val, color: '#e2445c', id: 'error' };
            else if (val) currentOption = { label: val, color: '#579bfc', id: 'default' };
        }

        // EDIT MODE (Only for native status, not mirrors)
        if (isEditing && !isMirrorStatus) {
            return (
                <div className="relative z-50">
                    <div className="fixed inset-0" onClick={() => setIsEditing(false)} />
                    <div className="absolute top-0 left-0 min-w-[140px] bg-[#1a1a2e] border border-white/20 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 z-50 py-1">
                        {options.map((opt: any) => (
                            <button
                                key={opt.id}
                                onClick={() => handleSave(opt.label)}
                                className="w-full text-left px-4 py-2 hover:bg-white/10 text-white text-xs transition-colors flex items-center gap-3"
                            >
                                <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white/10" style={{ backgroundColor: opt.color || '#fff' }} />
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <button
                disabled={isMirrorStatus}
                onClick={() => !isMirrorStatus && setIsEditing(true)}
                className={`px-4 py-1.5 rounded-full text-white text-[11px] font-bold text-center min-w-[90px] transition-all shadow-lg shadow-black/20
                    ${!isMirrorStatus ? 'hover:brightness-110 active:scale-95 cursor-pointer' : 'cursor-default opacity-90'}`}
                style={currentOption && currentOption.label ? { backgroundColor: currentOption.color || '#7c3aed' } : { backgroundColor: '#2d2d3d', color: '#9ca3af' }}
            >
                {currentOption ? currentOption.label : (displayValue || 'Empty')}
            </button>
        );
    }

    // Link Rendering
    if (column.type === 'link' && !isEditing && linkUrl) {
        return (
            <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0073ea] hover:text-white hover:underline truncate text-sm flex items-center gap-1"
            >
                {displayValue}
                <span className="text-[10px] opacity-50">↗</span>
            </a>
        );
    }

    // Auto-detect files in Text columns (Universal Playback)
    const isFilePattern = (str: string) => /\.(mp4|mov|webm|ogg|pdf|jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(str);

    // If it's a text column but contains a filename/URL, treat as file
    if (!isEditing && isFilePattern(displayValue) && !linkUrl) {
        // If it's just a filename without a URL, we might need a way to construct the URL 
        // OR if it's a full URL in the text

        // If we strictly have a text value that is a filename (e.g. "video.mp4") but NO URL, 
        // we can't really play it unless we know the base path. 
        // HOWEVER, based on the user request, it seems these MIGHT be "File" columns behaving as text, 
        // or they just want the UI to LOOK like a file even if unplayable?
        // BUT the user said "make it playable". 
        // If the 'displayValue' IS the URL (common in some exports), then we use it.
        // If it's just a filename, we might be limited, but let's assume the column might have hidden value or the text IS the link.

        // Actually, looking at the code above (lines 250-258), we already try to extract linkUrl from text if it starts with http.
        // If we found a linkUrl (even effectively from text), we should render it as a file.

        // Let's broaden the "File Rendering" block above instead of adding a new one here.
    }

    // --- ENHANCED FILE RENDERING ---
    // render if explicit file column OR if we detected a valid link/file pattern in a text column
    const isVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(displayValue) || (linkUrl && /\.(mp4|mov|webm|ogg)(\?|$)/i.test(linkUrl));
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(displayValue) || (linkUrl && /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(linkUrl));
    const isPdf = /\.pdf(\?|$)/i.test(displayValue) || (linkUrl && /\.pdf(\?|$)/i.test(linkUrl));

    const shouldRenderAsFile = (column.type === 'file' && linkUrl) || (linkUrl && (isVideo || isImage || isPdf));

    if (shouldRenderAsFile) {
        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onPreview(linkUrl!, displayValue, assetId || undefined);
                }}
                className={`flex items-center gap-2 py-1.5 px-3 rounded-lg border transition-all group max-w-full text-left relative overflow-hidden
                    ${isVideo ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-400' :
                        isPdf ? 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20 text-orange-400' :
                            'bg-[#0073ea]/10 border-[#0073ea]/20 hover:bg-[#0073ea]/20 text-[#0073ea]'}`}
                title={displayValue}
            >
                {isVideo ? <PlayCircle className="w-4 h-4 flex-shrink-0 animate-pulse" /> :
                    isPdf ? <FileText className="w-4 h-4 flex-shrink-0" /> :
                        <Eye className="w-4 h-4 flex-shrink-0" />}

                <span className="text-[11px] font-bold truncate group-hover:underline decoration-current">
                    {displayValue}
                </span>
            </button>
        );
    }

    // Fallback: If it LOOKS like a file (has extension) but we have NO URL (just text "video.mp4")
    // Use a "Broken Link" or "Request" style? 
    // Or just render it as a file button that does nothing but maybe open a search?
    // User said: "Making finding client...mp4" (Text) playable. 
    // If it's just text, we can't play it. 
    // BUT maybe the "Submission" column IS a file column but the data structure wasn't parsed correctly? 
    // Let's look at lines 238-243 again. 
    // If column type is NOT 'file', we don't extract `val.files`. 
    // We should try to check if `val.files` exists EVEN IF column type is not explicitly 'file' (in case of mislabeled column types from API).

    // Generic Link in Text Column (Re-applied)
    if (!isEditing && displayValue && (displayValue.startsWith('http://') || displayValue.startsWith('https://'))) {
        return (
            <a
                href={displayValue}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[#0073ea] hover:text-white hover:underline truncate text-sm flex items-center gap-1"
            >
                {displayValue}
                <span className="text-[10px] opacity-50">↗</span>
            </a>
        );
    }

    // Text / Numbers / Default Rendering
    if (isEditing) {
        return (
            <input
                autoFocus
                className="bg-[#050511] border border-custom-blue/50 rounded-lg px-3 py-1.5 text-white text-sm w-full outline-none shadow-[0_0_15px_rgba(0,115,234,0.1)] transition-all"
                defaultValue={displayValue}
                onBlur={(e) => handleSave(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave(e.currentTarget.value);
                    if (e.key === 'Escape') setIsEditing(false);
                }}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className="cursor-text hover:bg-white/5 px-2 py-1 rounded-md transition-colors text-gray-200 text-sm min-h-[28px] w-full border border-transparent hover:border-white/5 flex items-center"
        >
            {displayValue || <span className="text-gray-600 text-xs italic">Empty</span>}
        </div>
    );
};

// ... (Rest of sidebar items and structure)
const SidebarItem = ({ icon, label, active = false, onClick, isClientItem = false }: { icon?: any, label: string, active?: boolean, onClick?: () => void, isClientItem?: boolean }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-all duration-200 group relative ${active
            ? 'bg-white/5 text-white border-l-2 border-emerald-500'
            : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
            }`}
    >
        {icon && !isClientItem && <div className={`${active ? 'text-white' : 'text-gray-500 group-hover:text-white'}`}>{icon}</div>}
        {isClientItem && (
            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-600 group-hover:bg-gray-400'} mr-2`} />
        )}
        <span className="truncate font-medium">{label}</span>
    </button>
);

const StatCard = ({ title, value, change, icon, delay }: { title: string, value: string, change: string, icon: any, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
    >
        <SpotlightCard className="p-6 rounded-3xl bg-black/20 border border-white/5 backdrop-blur-xl h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    {icon}
                </div>
                <div className="px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {change}
                </div>
            </div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
            <div className="text-3xl font-black text-white tracking-tight">{value}</div>
        </SpotlightCard>
    </motion.div>
);

export default function ClientPortal() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'Boards' | 'Projects' | 'Analytics'>('Boards');

    // Current logged-in user info (from localStorage)
    const currentUserRole = localStorage.getItem('portal_user_role') || 'client';
    const currentUserName = localStorage.getItem('portal_user_name') || '';

    // Strict Role Check
    useEffect(() => {
        const role = localStorage.getItem('portal_user_role');
        if (role !== 'client') {
            // Allow admins to view client portal? Maybe not for strict separation.
            // If I am admin I should be in admin portal.
            navigate('/portal');
        }
    }, []);

    // Data State
    const [boards, setBoards] = useState<any[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(localStorage.getItem('portal_user_workspace') || null); // null = Main Workspace
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
    const [manualLoading, setManualLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState<{ url: string, name: string, assetId?: string } | null>(null);

    // Board Items Hook (React Query)
    const { boardData, isLoading: isBoardItemsLoading, refreshBoardItems } = useBoardItems(selectedBoardId);

    // Derived loading state (combines manual + hook loading)
    const loading = manualLoading || isBoardItemsLoading;
    const setLoading = setManualLoading;
    // User Permissions State
    const [currentUserAllowedBoards, setCurrentUserAllowedBoards] = useState<string[]>([]);
    const [currentUserWorkspaceId, setCurrentUserWorkspaceId] = useState<string | null>(null);

    // Carousel State for Form Groups
    const [groupCarouselIndices, setGroupCarouselIndices] = useState<Record<string, number>>({});

    // Create Modal State REMOVED

    // Overview Stats State
    const [overviewStats, setOverviewStats] = useState({
        activeClientsCount: 0,
        activeProjectsCount: 0,
        activeEditorsCount: 0,
        topEditor: { name: 'N/A', count: 0 },
        systemStatus: 'Stable',
        clientProjectDistribution: [] as { name: string, count: number }[],
        editorPerformance: [] as { name: string, count: number }[]
    });
    const [overviewLoading, setOverviewLoading] = useState(false);

    // Collapsed Groups State
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    // Fulfillment View Toggle State
    const [fulfillmentViewMode, setFulfillmentViewMode] = useState<'recent' | 'overview'>('recent');
    // Carousel Index for "Recent" view in Fulfillment (iterating sorted list)
    const [fulfillmentRecentIndex, setFulfillmentRecentIndex] = useState(0);
    const [fulfillmentMonthFilter, setFulfillmentMonthFilter] = useState<string>('All');
    const [isMonthFilterOpen, setIsMonthFilterOpen] = useState(false);



    // User Management Logic REMOVED for EditorPortal

    const handleLogout = () => {
        localStorage.removeItem('portal_user_email');
        localStorage.removeItem('portal_user_role');
        localStorage.removeItem('portal_user_name');
        localStorage.removeItem('portal_user_workspace');
        navigate('/portal');
    };



    const [checkingPermissions, setCheckingPermissions] = useState(true);

    // Stabilize reference to prevent infinite loops
    const stableAllowedBoards = useMemo(() => currentUserAllowedBoards, [JSON.stringify(currentUserAllowedBoards)]);


    useEffect(() => {
        // Fetch User Permissions on Mount
        const email = localStorage.getItem('portal_user_email');
        if (email) {
            supabase
                .from('users')
                .select('allowed_board_ids, workspace_id')
                .eq('email', email)
                .single()
                .then(({ data }) => {
                    if (data) {
                        setCurrentUserAllowedBoards(data.allowed_board_ids || []);
                        setCurrentUserWorkspaceId(data.workspace_id || null);
                    }
                    setCheckingPermissions(false);
                })
                .catch(() => setCheckingPermissions(false));
        } else {
            setCheckingPermissions(false);
        }
    }, []);

    // Memoized refresh function for visibility-based polling
    const refreshCallback = useCallback(() => {
        if (!checkingPermissions) {
            refreshBoardsAndFolders(true);
        }
    }, [checkingPermissions, stableAllowedBoards, currentUserWorkspaceId]);

    // Use visibility-based polling instead of setInterval
    // This will pause polling when tab is hidden and resume when visible
    useVisibilityPolling(refreshCallback, 60000); // Poll every 60s when visible

    useEffect(() => {
        if (checkingPermissions) return; // Wait for permissions
        refreshBoardsAndFolders();
    }, [stableAllowedBoards, currentUserWorkspaceId, checkingPermissions]); // Re-run when permissions load

    // --- Background Prefetch ---
    const [prefetchStarted, setPrefetchStarted] = useState(false);
    useEffect(() => {
        if (!checkingPermissions && boards.length > 0 && !prefetchStarted) {
            setPrefetchStarted(true);
            const boardIds = boards.map((b: any) => b.id);
            prefetchBoardItems(boardIds).then(undefined, err => console.error("Prefetch failed", err));
        }
    }, [boards, checkingPermissions, prefetchStarted]);

    // Effect to fetch public URL for preview if assetId is available
    // Using a ref to track fetching state to prevent duplicate requests
    const fetchingRef = useRef<string | null>(null);
    const urlCacheRef = useRef<Map<string, string>>(new Map());

    useEffect(() => {
        if (previewFile?.assetId && previewFile.url) {
            const assetId = previewFile.assetId;

            // Check if we have a cached URL for this assetId
            const cachedUrl = urlCacheRef.current.get(assetId);
            if (cachedUrl) {
                setPreviewFile(prev => prev ? { ...prev, url: cachedUrl, assetId: undefined } : null);
                return;
            }

            // Check if we're already fetching this assetId
            if (fetchingRef.current === assetId) {
                return; // Already fetching, don't duplicate
            }

            fetchingRef.current = assetId;

            const fetchPublicUrl = async () => {
                try {
                    // Get the authorized public URL from Monday.com API
                    const publicUrl = await getAssetPublicUrl(assetId);
                    if (publicUrl) {
                        // Cache and use the URL directly
                        urlCacheRef.current.set(assetId, publicUrl);
                        setPreviewFile(prev => prev ? { ...prev, url: publicUrl, assetId: undefined } : null);
                    }
                } catch (err) {
                    console.error("Failed to fetch public URL", err);
                } finally {
                    fetchingRef.current = null;
                }
            };
            fetchPublicUrl();
        }
    }, [previewFile]);

    async function refreshBoardsAndFolders(background = false) {
        if (!background) setLoading(true);
        try {
            const [boardsData, foldersData, workspacesData] = await Promise.all([
                getAllBoards(),
                getAllFolders(),
                getAllWorkspaces()
            ]);
            // Apply role-based board filtering
            const rawBoards = boardsData || [];
            // Map to flatten workspace_id and filter out subitems
            const mappedBoards = rawBoards
                .filter((b: any) => b.type !== 'sub_items_board' && !b.name.toLowerCase().includes('subitems'))
                .map((b: any) => ({
                    ...b,
                    workspace_id: b.workspace?.id ? String(b.workspace.id) : null
                }));

            let filteredBoards = mappedBoards;

            // 1. Strict Permission Check (Allowed Boards)
            if (currentUserAllowedBoards.length > 0) {
                filteredBoards = mappedBoards.filter((b: any) => currentUserAllowedBoards.includes(b.id));
            }
            // 2. Workspace Check (If no specific boards but assigned workspace)
            else if (currentUserWorkspaceId) {
                filteredBoards = mappedBoards.filter((b: any) => b.workspace_id === currentUserWorkspaceId);
            }
            // 3. Fallback Role-Based Text Matching (Legacy)
            else if (currentUserRole === 'editor') {
                filteredBoards = mappedBoards.filter((b: any) =>
                    b.name?.toLowerCase().includes('workspace') ||
                    b.name?.toLowerCase().includes('editor') ||
                    b.name?.toLowerCase().includes('project')
                );
            } else if (currentUserRole === 'client') {
                filteredBoards = mappedBoards.filter((b: any) =>
                    b.name?.toLowerCase().includes('fulfillment') ||
                    b.name?.toLowerCase().includes('client') ||
                    b.name?.toLowerCase().includes('delivery')
                );
            }
            setBoards(filteredBoards);

            // Filter Folders as well
            let filteredFolders = foldersData || [];
            if (currentUserAllowedBoards.length > 0) {
                // If specific boards allowed, show folders containing them? 
                // Or just show workspace folders?
                // Usually if board access is specific, we might hide folders unless they contain the board.
                // For now, let's filter folders by workspace if workspace_id is present on the board?
                // Harder. Let's start with Workspace filtering which is the main request.
                const allowedWorkspaces = new Set(filteredBoards.map((b: any) => b.workspace_id).filter(Boolean));
                filteredFolders = filteredFolders.filter((f: any) => f.workspace?.id && allowedWorkspaces.has(String(f.workspace.id)));
            } else if (currentUserWorkspaceId) {
                filteredFolders = filteredFolders.filter((f: any) => f.workspace?.id && String(f.workspace.id) === currentUserWorkspaceId);
            }

            setFolders(filteredFolders);
            setWorkspaces(workspacesData || []);
            setWorkspaces(workspacesData || []);

            // Auto-select first board if none selected and boards exist
            if (filteredBoards.length > 0 && !selectedBoardId) {
                // Only auto-select if user has specific permissions or simply ALWAYS?
                // User said "auto-load it everytime we click on board" (meaning Tab?)
                // Yes, auto-select first board is good UX.
                setSelectedBoardId(filteredBoards[0].id);
            }

            // Do NOT auto-select workspace. Allow "Main Workspace" (null) or preserve user selection.
            /*
            if (workspacesData && workspacesData.length > 0) {
                setSelectedWorkspaceId(workspacesData[0].id);
            }
            */

            // --- REAL-TIME OVERVIEW STATS FETCH ---
            setOverviewLoading(true);

            // 1. Identify Target Folders
            // "Clients" or "Active Clients"
            // "Workspace" or "Editors" or "Team"
            const allFetchedBoards = boardsData || [];



            // 1. Identify Target Boards Strategy

            // A) Client/Project Data Source: "Fulfillment Board"
            const fulfillmentBoard = allFetchedBoards.find((b: any) =>
                b.name.toLowerCase().includes('fulfillment') ||
                b.name.toLowerCase().includes('fullfillment')
            );

            // B) Editor Data Source: Boards with "Workspace" in name
            const editorBoards = allFetchedBoards.filter((b: any) => {
                const name = b.name.toLowerCase();
                return name.includes('workspace') &&
                    !name.includes('subitem') &&
                    !name.includes('template');
            });
            const editorBoardIds = editorBoards.map((b: any) => String(b.id));




            // 3. Fetch Data
            const idsToFetch = [];
            if (fulfillmentBoard) idsToFetch.push(String(fulfillmentBoard.id));
            editorBoardIds.forEach((id: string) => idsToFetch.push(id)); // Keep fetching items just in case



            // Activity Logs Timeframe (Last 30 Days)
            const oneMonthAgo = new Date();
            oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

            const [allFetchedItemsData] = await Promise.all([
                getMultipleBoardItems(idsToFetch)
            ]);

            // Separate Data
            // Note: getMultipleBoardItems usually returns array of boards with items.
            // We need to map back to our board objects.

            const fulfillmentBoardData = fulfillmentBoard ? allFetchedItemsData.find((b: any) => String(b.id) === String(fulfillmentBoard.id)) : null;
            const editorBoardsData = allFetchedItemsData.filter((b: any) => editorBoardIds.includes(String(b.id)));

            // 4. Calculate Metrics

            // A) Active Clients & Projects (From Fulfillment Board)
            let activeClientsCount = 0;
            let totalActiveProjects = 0;
            const clientProjectDistribution: { name: string, count: number }[] = [];

            if (fulfillmentBoardData) {
                // Active Clients = Groups (assuming each group is a client)
                // Note: 'fulfillmentBoard' from 'allFetchedBoards' (getAllBoards) likely has 'groups' metadata. 
                // 'fulfillmentBoardData' from 'getMultipleBoardItems' has 'items'.

                const groups = fulfillmentBoard.groups || [];
                const validGroups = groups.filter((g: any) => g.title.toLowerCase() !== 'hidden');

                activeClientsCount = validGroups.length;

                // Count Active Items (excluding Done?)
                // User said "Active Projects"... typically means not Done.
                const activeItems = fulfillmentBoardData.items.filter((i: any) => {
                    const isDone = i.column_values.some((v: any) => (v.title === 'Status' || v.type === 'status' || v.type === 'color') && (v.text === 'Done' || v.text === 'Completed'));
                    return !isDone;
                });
                totalActiveProjects = activeItems.length;

                // Distribution: Items per Group
                const groupMap = new Map();
                groups.forEach((g: any) => groupMap.set(g.id, g.title));

                // Count items per group
                const groupCounts = new Map();
                activeItems.forEach((item: any) => {
                    const gId = item.group?.id; // items have group { id }
                    if (gId) {
                        const current = groupCounts.get(gId) || 0;
                        groupCounts.set(gId, current + 1);
                    }
                });

                groupCounts.forEach((count, gId) => {
                    const name = groupMap.get(gId) || 'Unknown Group';
                    if (name.toLowerCase() !== 'hidden' && count > 0) {
                        clientProjectDistribution.push({ name, count });
                    }
                });
            }

            // Sort Distribution by Count
            clientProjectDistribution.sort((a, b) => b.count - a.count);


            // C) Active Editors & Performance (From Workspace Boards)
            // C) Active Editors & Performance (From Activity Logs)
            const activeEditorsCount = editorBoards.length;
            const editorPerformance: { name: string, count: number }[] = [];

            let maxDoneCount = 0;
            let topEditorName = 'None';

            // DEBUG: Verify Boards and Logs
            console.log('Found Editor Boards:', editorBoards.map((b: any) => b.name));
            if (fulfillmentBoard) console.log('Fulfillment Board:', fulfillmentBoard.name, fulfillmentBoard.id);
            console.log('Total Boards with Logs:', editorBoardsData.length);

            if (fulfillmentBoardData && fulfillmentBoardData.items.length > 0) {
                const sampleItem = fulfillmentBoardData.items[0];
                console.log('Fulfillment Item Columns:', sampleItem.column_values.map((c: any) => `${c.title} (${c.id})`));
            }

            // Iterate over boards to calculate performance based on ITEMS (Snapshot)
            editorBoards.forEach((b: any) => {
                const boardData = editorBoardsData.find((bd: any) => String(bd.id) === String(b.id));
                const items = boardData ? boardData.items : [];

                // DEBUG: Inspect Board Data
                console.log(`Checking Board: ${b.name}`);
                console.log(`Found ${items.length} items`);

                // METRIC: Total Projects in Workspace (No Date/Status Filter)
                const approvedCount = items.length;

                // Clean Name
                // 1. Remove text in parentheses and beyond (e.g. "Name (C-W-3)" -> "Name")
                let cleanName = b.name.split('(')[0];

                // 2. Remove "Workspace", "Editor", and dashes
                cleanName = cleanName.replace(/workspace/gi, '')
                    .replace(/editor/gi, '')
                    .replace(/-/g, '')
                    .trim();
                if (!cleanName || cleanName.length < 2) cleanName = b.name;

                if (approvedCount > 0) {
                    editorPerformance.push({ name: cleanName, count: approvedCount });
                } else {
                    editorPerformance.push({ name: cleanName, count: 0 });
                }

                if (approvedCount > maxDoneCount) {
                    maxDoneCount = approvedCount;
                    topEditorName = cleanName;
                }
            });

            // Fallback for Top Editor (if no done items found but boards exist)
            if (maxDoneCount === 0 && editorBoardsData.length > 0) {
                // Maybe pick one with most items overall?
                const busiestBoard = editorBoardsData.sort((a: any, b: any) => b.items.length - a.items.length)[0];
                if (busiestBoard) {
                    let cleanName = busiestBoard.name.replace(/workspace/gi, '').replace(/editor/gi, '').replace(/-/g, '').trim();
                    if (!cleanName) cleanName = busiestBoard.name;
                    // Still 0 done, but we can set name
                    // topEditorName = cleanName; 
                }
            }

            // Sort Editors
            editorPerformance.sort((a, b) => b.count - a.count);

            setOverviewStats({
                activeClientsCount,
                activeProjectsCount: totalActiveProjects,
                activeEditorsCount,
                topEditor: { name: topEditorName, count: maxDoneCount },
                systemStatus: 'Stable',
                clientProjectDistribution,
                editorPerformance
            });

        } catch (error) {
            console.error("Failed to load initial data", error);
        } finally {
            setLoading(false);
            setOverviewLoading(false);
        }
    };

    useEffect(() => {
        if (selectedBoardId) {
            setFulfillmentMonthFilter('All'); // Reset Filter
            refreshBoardItems();
            refreshBoardsAndFolders(true); // Background Refresh Global Data
        }
    }, [selectedBoardId]);



    const toggleGroup = (groupId: string) => {
        const newCollapsed = new Set(collapsedGroups);
        if (newCollapsed.has(groupId)) {
            newCollapsed.delete(groupId);
        } else {
            newCollapsed.add(groupId);
        }
        setCollapsedGroups(newCollapsed);
    };

    return (
        <BackgroundLayout>
            <CinematicOverlay />

            <div className="relative min-h-screen w-full flex bg-transparent overflow-hidden">
                {/* Main Sidebar */}
                <aside className="hidden lg:flex w-64 h-screen flex-col border-r border-white/5 bg-[#0e0e1a] relative z-30 flex-shrink-0">
                    {/* Workspace Header and Active Workspace Card REMOVED per client request */}
                    {/*
                    <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Workspaces</span>
                        </div>
                         ...
                    </div>
                    */}

                    {/* Active Workspaces / Clients List */}
                    <div className="flex-1 overflow-y-auto py-4">
                        {/* 
                        <div className="px-4 mb-6">
                            ... (Creative Vision Card)
                        </div>
                        */}

                        <div className="px-4 mb-4 flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Projects</span>
                        </div>

                        <div className="space-y-0.5">
                            {/* Overview tab removed for cleaner client experience */}
                            {/* Example Board Item matching screenshot style */}
                            {boards.map((board: any) => (
                                <SidebarItem
                                    key={board.id}
                                    label={board.name}
                                    active={selectedBoardId === board.id}
                                    onClick={() => {
                                        setSelectedBoardId(board.id);
                                        setActiveTab('Boards');
                                    }}
                                    isClientItem={true}
                                />
                            ))}
                            {boards.length === 0 && (
                                <div className="px-8 py-2 text-xs text-gray-600 italic">No active boards</div>
                            )}
                        </div>
                    </div>

                    {/* Minimal User Profile at Bottom (Optional, kept minimal) */}
                    <div className="p-4 border-t border-white/5 bg-black/20">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-xs">
                                {currentUserName ? currentUserName.charAt(0) : 'U'}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="text-white text-xs font-bold truncate">{currentUserName || 'User'}</div>
                                <button onClick={handleLogout} className="text-[10px] text-gray-500 hover:text-white transition-colors">Log Out</button>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 h-screen flex flex-col relative z-20 overflow-hidden">
                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden flex flex-col relative z-20">

                        {/* Tab Content */}
                        {/* Overview tab content REMOVED - clients now go directly to Boards */}





                        {activeTab === 'Boards' && (
                            <>
                                {/* Tree Sidebar REMOVED per client request for cleaner full-width view */}

                                {/* Board Content */}
                                <div className="flex-1 overflow-y-auto bg-[#050511] p-6 relative">
                                    {selectedBoardId ? (
                                        <>
                                            {loading && !boardData ? (
                                                <div className="flex flex-col items-center justify-center h-full">
                                                    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
                                                    <p className="text-gray-400 text-sm">Loading board...</p>
                                                </div>
                                            ) : boardData ? (
                                                <div className="space-y-8 animate-in fade-in zoom-in duration-300">

                                                    {/* Board Controls */}
                                                    <div className="flex justify-between items-center mb-6">
                                                        <div className="flex items-center gap-2">
                                                            <h2 className="text-2xl font-bold text-white">{boardData.name}</h2>
                                                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-gray-400">{boardData.items_count || 0} items</span>
                                                        </div>
                                                        <div />
                                                    </div>

                                                    {/* FULFILLMENT DASHBOARD (Top Level) */}
                                                    {(boardData.name.toLowerCase().includes('fulfillment') || boardData.name.toLowerCase().includes('fullfillment')) ? (() => {
                                                        const allItems = boardData.groups?.flatMap((g: any) => boardData.items?.filter((i: any) => i.group.id === g.id)) || [];

                                                        // --- Date Filter Logic ---
                                                        const months = new Set<string>();
                                                        allItems.forEach((item: any) => {
                                                            if (item.created_at) {
                                                                const date = new Date(item.created_at);
                                                                if (!isNaN(date.getTime())) {
                                                                    const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' }); // e.g., "Oct 2023"
                                                                    months.add(monthStr);
                                                                }
                                                            }
                                                        });
                                                        const sortedMonths = Array.from(months).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

                                                        // Apply Filter
                                                        const filteredItems = fulfillmentMonthFilter === 'All'
                                                            ? allItems
                                                            : allItems.filter((item: any) => {
                                                                if (!item.created_at) return false;
                                                                const date = new Date(item.created_at);
                                                                const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
                                                                return monthStr === fulfillmentMonthFilter;
                                                            });

                                                        const totalProjects = filteredItems.length;

                                                        // Sort by Recency (ID Descending)
                                                        const sortedItems = [...filteredItems].sort((a: any, b: any) => Number(b.id) - Number(a.id));

                                                        // Detect Status Column for Graph
                                                        const statusCol = boardData.columns?.find((c: any) => c.type === 'status' || c.title.toLowerCase().includes('status'));
                                                        const statusCounts: Record<string, number> = {};

                                                        filteredItems.forEach((item: any) => { // Use filteredItems for stats
                                                            let label = "Unassigned";
                                                            if (statusCol) {
                                                                const valObj = item.column_values?.find((v: any) => v.id === statusCol.id);
                                                                if (valObj) {
                                                                    if (valObj.text) label = valObj.text;
                                                                    else if (valObj.display_value) label = valObj.display_value;
                                                                }
                                                            }
                                                            statusCounts[label] = (statusCounts[label] || 0) + 1;
                                                        });

                                                        const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
                                                        const maxCount = Math.max(...Object.values(statusCounts), 1);

                                                        return (
                                                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

                                                                {/* View Toggle Header & Filter */}
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-1 bg-[#0e0e1a] p-1 rounded-xl border border-white/5">
                                                                        <button
                                                                            onClick={() => setFulfillmentViewMode('overview')}
                                                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${fulfillmentViewMode === 'overview' ? 'bg-[#0073ea] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                                                        >
                                                                            <LayoutGrid className="w-3.5 h-3.5" /> Whole Overview
                                                                        </button>
                                                                        <div className="w-[1px] h-4 bg-white/10 mx-1" />
                                                                        <button
                                                                            onClick={() => setFulfillmentViewMode('recent')}
                                                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${fulfillmentViewMode === 'recent' ? 'bg-[#0073ea] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                                                        >
                                                                            <Clock className="w-3.5 h-3.5" /> Most Recent Project
                                                                        </button>
                                                                    </div>

                                                                    {/* Month Filter Dropdown */}
                                                                    {sortedMonths.length > 0 && (
                                                                        <div className="relative z-30">
                                                                            <div
                                                                                className="flex items-center gap-2 px-3 py-2 bg-[#0e0e1a] border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                                                                                onClick={() => setIsMonthFilterOpen(!isMonthFilterOpen)}
                                                                            >
                                                                                <div className="p-1 rounded bg-white/5 text-gray-400"><FileText className="w-3 h-3" /></div>
                                                                                <span className="text-xs font-bold text-white min-w-[60px]">{fulfillmentMonthFilter}</span>
                                                                                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isMonthFilterOpen ? 'rotate-180' : ''}`} />
                                                                            </div>

                                                                            {/* Backdrop for Click Outside */}
                                                                            {isMonthFilterOpen && (
                                                                                <div className="fixed inset-0 z-40" onClick={() => setIsMonthFilterOpen(false)} />
                                                                            )}

                                                                            {/* Dropdown Options */}
                                                                            {isMonthFilterOpen && (
                                                                                <div className="absolute top-full right-0 mt-2 w-40 bg-[#0A0A16] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 z-50">
                                                                                    <div
                                                                                        onClick={() => {
                                                                                            setFulfillmentMonthFilter('All');
                                                                                            setIsMonthFilterOpen(false);
                                                                                        }}
                                                                                        className={`px-4 py-3 text-xs font-bold cursor-pointer transition-colors ${fulfillmentMonthFilter === 'All' ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                                                                    >
                                                                                        All Time
                                                                                    </div>
                                                                                    {sortedMonths.map(month => (
                                                                                        <div
                                                                                            key={month}
                                                                                            onClick={() => {
                                                                                                setFulfillmentMonthFilter(month);
                                                                                                setIsMonthFilterOpen(false);
                                                                                            }}
                                                                                            className={`px-4 py-3 text-xs font-bold cursor-pointer transition-colors ${fulfillmentMonthFilter === month ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                                                                        >
                                                                                            {month}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* --- RECENT PROJECT VIEW --- */}
                                                                {fulfillmentViewMode === 'recent' && (() => {
                                                                    const currentItem = sortedItems[fulfillmentRecentIndex];
                                                                    const hasNext = fulfillmentRecentIndex < sortedItems.length - 1;
                                                                    const hasPrev = fulfillmentRecentIndex > 0;

                                                                    if (!currentItem) return <div className="text-center text-gray-500 italic py-12">No projects found</div>;

                                                                    return (
                                                                        <div className="space-y-6">
                                                                            {/* Navigation */}
                                                                            <div className="flex items-center justify-between bg-[#0e0e1a] p-3 rounded-2xl border border-white/5">
                                                                                <button
                                                                                    disabled={!hasPrev}
                                                                                    onClick={() => setFulfillmentRecentIndex(prev => Math.max(0, prev - 1))}
                                                                                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 flex items-center gap-2 transition-all text-xs font-bold"
                                                                                >
                                                                                    <ChevronDown className="w-4 h-4 rotate-90" /> Newer
                                                                                </button>

                                                                                <div className="flex flex-col items-center">
                                                                                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">Viewing Project</span>
                                                                                    <div className="text-sm font-mono text-white">
                                                                                        <span className="text-emerald-400 font-bold">{fulfillmentRecentIndex + 1}</span> <span className="text-gray-600">/</span> {sortedItems.length}
                                                                                    </div>
                                                                                </div>

                                                                                <button
                                                                                    disabled={!hasNext}
                                                                                    onClick={() => setFulfillmentRecentIndex(prev => Math.min(sortedItems.length - 1, prev + 1))}
                                                                                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 flex items-center gap-2 transition-all text-xs font-bold"
                                                                                >
                                                                                    Older <ChevronDown className="w-4 h-4 -rotate-90" />
                                                                                </button>
                                                                            </div>

                                                                            {/* Single Card Display */}
                                                                            <motion.div
                                                                                key={currentItem.id} // Key ensures animation on switch
                                                                                initial={{ opacity: 0, x: 20 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                exit={{ opacity: 0, x: -20 }}
                                                                                className="relative p-8 rounded-3xl bg-[#0e0e1a] border border-white/5 shadow-2xl overflow-hidden"
                                                                            >
                                                                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                                                                    <Briefcase className="w-32 h-32 text-emerald-400" />
                                                                                </div>

                                                                                <div className="relative z-10 w-full max-w-3xl mx-auto">
                                                                                    <div className="flex flex-col gap-6 mb-8 text-center">
                                                                                        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 mx-auto">
                                                                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Active Project</span>
                                                                                        </div>
                                                                                        <h2 className="text-4xl font-black text-white leading-tight">{currentItem.name}</h2>
                                                                                    </div>

                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                                        {boardData.columns?.filter((col: any) => col.type !== 'name').map((col: any) => (
                                                                                            <div key={col.id} className="group p-4 rounded-2xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
                                                                                                <div className="flex items-center gap-2 mb-2">
                                                                                                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">{col.title}</span>
                                                                                                </div>
                                                                                                <div className="min-h-[32px] flex items-center">
                                                                                                    <BoardCell
                                                                                                        item={currentItem}
                                                                                                        column={col}
                                                                                                        boardId={selectedBoardId}
                                                                                                        onUpdate={() => refreshBoardItems(true)}
                                                                                                        onPreview={(url, name, assetId) => setPreviewFile({ url, name, assetId })}
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </motion.div>
                                                                        </div>
                                                                    );
                                                                })()}

                                                                {/* --- OVERVIEW DASHBOARD VIEW --- */}
                                                                {fulfillmentViewMode === 'overview' && (
                                                                    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                                                                        {/* Metrics Header */}
                                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                            <div className="bg-[#0e0e1a] border border-white/5 p-4 rounded-2xl shadow-lg relative overflow-hidden group">
                                                                                <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                                                                                <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 px-1">Total Projects</h4>
                                                                                <div className="text-3xl font-bold text-white max-md:text-2xl px-1">{totalProjects}</div>
                                                                            </div>
                                                                            <div className="bg-[#0e0e1a] border border-white/5 p-4 rounded-2xl shadow-lg relative overflow-hidden group">
                                                                                <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                                                                                <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 px-1">Active</h4>
                                                                                <div className="text-3xl font-bold text-[#a25ddc] max-md:text-2xl px-1">
                                                                                    {totalProjects - (statusCounts['Completed'] || statusCounts['Approved (CV)'] || 0)}
                                                                                </div>
                                                                            </div>
                                                                            <div className="bg-[#0e0e1a] border border-white/5 p-4 rounded-2xl shadow-lg relative overflow-hidden group">
                                                                                <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" />
                                                                                <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 px-1">Completed</h4>
                                                                                <div className="text-3xl font-bold text-[#00c875] max-md:text-2xl px-1">
                                                                                    {statusCounts['Approved (CV)'] || statusCounts['Done'] || 0}
                                                                                </div>
                                                                            </div>
                                                                            <div className="bg-[#0e0e1a] border border-white/5 p-4 rounded-2xl shadow-lg relative overflow-hidden group">
                                                                                <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors" />
                                                                                <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 px-1">In Progress</h4>
                                                                                <div className="text-3xl font-bold text-[#fdab3d] max-md:text-2xl px-1">
                                                                                    {(statusCounts['Working on it (CV)'] || 0) + (statusCounts['In Progress'] || 0)}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Graph Section */}
                                                                        <div className="bg-[#0e0e1a] border border-white/5 p-6 rounded-3xl shadow-xl">
                                                                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                                                                <div className="p-1.5 bg-emerald-500/10 rounded-lg"><LayoutDashboard className="w-4 h-4 text-emerald-400" /></div>
                                                                                Project Status Overview
                                                                            </h3>
                                                                            <div className="space-y-4">
                                                                                {sortedStatuses.length > 0 ? sortedStatuses.map(([label, count], idx) => (
                                                                                    <div key={label} className="flex items-center gap-4 group">
                                                                                        <div className="w-36 text-right text-xs text-gray-400 font-medium truncate shrink-0 group-hover:text-white transition-colors">{label}</div>
                                                                                        <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                                                                                            <motion.div
                                                                                                initial={{ width: 0 }}
                                                                                                animate={{ width: `${(count / maxCount) * 100}%` }}
                                                                                                transition={{ duration: 1, delay: idx * 0.1, type: "spring" }}
                                                                                                className="h-full rounded-full relative"
                                                                                                style={{
                                                                                                    backgroundColor: label.includes('Approved') ? '#00c875' :
                                                                                                        label.includes('Working') ? '#fdab3d' :
                                                                                                            label.includes('Break') ? '#ff158a' :
                                                                                                                label.includes('Stuck') || label.includes('Error') ? '#df2f4a' :
                                                                                                                    '#579bfc'
                                                                                                }}
                                                                                            >
                                                                                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                                            </motion.div>
                                                                                        </div>
                                                                                        <div className="w-8 text-xs text-white font-bold">{count}</div>
                                                                                    </div>
                                                                                )) : (
                                                                                    <div className="text-center text-gray-500 italic py-8">No status data available</div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Whole Overview Grid */}
                                                                        <div>
                                                                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                                                                <span className="w-1 h-6 bg-emerald-500 rounded-full" />
                                                                                Project Gallery
                                                                            </h3>
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                                                {boardData.groups?.map((group: any) => {
                                                                                    const gItems = boardData.items?.filter((i: any) => i.group.id === group.id) || [];
                                                                                    return gItems.map((item: any) => (
                                                                                        <motion.div
                                                                                            key={item.id}
                                                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                                                            animate={{ opacity: 1, scale: 1 }}
                                                                                            whileHover={{ y: -5 }}
                                                                                            className="group relative"
                                                                                        >
                                                                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                                                            <div className="relative p-5 rounded-2xl bg-[#0e0e1a] border border-white/5 shadow-xl hover:border-white/10 hover:bg-[#131322] transition-all h-full flex flex-col gap-4">
                                                                                                <div className="flex items-start justify-between gap-4">
                                                                                                    <h4 className="text-base font-bold text-white leading-snug line-clamp-2">{item.name}</h4>
                                                                                                    <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-gray-500 font-mono border border-white/5 whitespace-nowrap" style={{ color: group.color }}>{group.title}</span>
                                                                                                </div>
                                                                                                <div className="w-full h-[1px] bg-white/5" />
                                                                                                <div className="space-y-4">
                                                                                                    {boardData.columns?.map((col: any) => (
                                                                                                        <div key={col.id} className="flex flex-col gap-1.5">
                                                                                                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{col.title}</span>
                                                                                                            <div className="min-h-[28px] flex items-center">
                                                                                                                <BoardCell
                                                                                                                    item={item}
                                                                                                                    column={col}
                                                                                                                    boardId={selectedBoardId}
                                                                                                                    onUpdate={() => refreshBoardItems(true)}
                                                                                                                    onPreview={(url, name, assetId) => setPreviewFile({ url, name, assetId })}
                                                                                                                />
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            </div>
                                                                                        </motion.div>
                                                                                    ));
                                                                                })}
                                                                            </div>
                                                                            {allItems.length === 0 && <div className="text-center text-gray-500 italic py-12 bg-[#0e0e1a] rounded-3xl border border-white/5 mt-4">No projects found to display</div>}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })() : (
                                                        <div className="space-y-6">
                                                            {boardData.groups?.map((group: any) => {
                                                                const groupItems = boardData.items?.filter((item: any) => item.group?.id === group.id) || [];
                                                                const isCollapsed = collapsedGroups.has(group.id);

                                                                return (
                                                                    <motion.div key={group.id} className="rounded-[2rem] bg-black/20 border border-white/5 backdrop-blur-xl overflow-hidden">
                                                                        <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => toggleGroup(group.id)}>
                                                                            <div className={`transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}><div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]`} style={{ borderTopColor: group.color || '#fff' }} /></div>
                                                                            <h3 className="text-lg font-bold text-white tracking-wide" style={{ color: group.color || '#fff' }}>{group.title}</h3>
                                                                        </div>
                                                                        {!isCollapsed && (
                                                                            <div className="p-6">
                                                                                {boardData.name.toLowerCase().includes('form') || boardData.name.toLowerCase().includes('board') ? (() => {
                                                                                    const currentIndex = groupCarouselIndices[group.id] || 0;
                                                                                    const currentItem = groupItems[currentIndex];
                                                                                    const hasNext = currentIndex < groupItems.length - 1;
                                                                                    const hasPrev = currentIndex > 0;
                                                                                    if (groupItems.length === 0) return <div className="text-center text-gray-500 italic py-8">No items in this group</div>;
                                                                                    return (
                                                                                        <div className="space-y-4">
                                                                                            <div className="flex items-center justify-between mb-4 px-4">
                                                                                                <button disabled={!hasPrev} onClick={() => setGroupCarouselIndices(prev => ({ ...prev, [group.id]: currentIndex - 1 }))} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 flex items-center gap-2 transition-all"><ChevronDown className="w-4 h-4 rotate-90" /> Previous</button>
                                                                                                <span className="text-sm font-mono text-gray-400 bg-black/40 px-3 py-1 rounded-full border border-white/5"><span className="text-white font-bold">{currentIndex + 1}</span> / {groupItems.length}</span>
                                                                                                <button disabled={!hasNext} onClick={() => setGroupCarouselIndices(prev => ({ ...prev, [group.id]: currentIndex + 1 }))} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 flex items-center gap-2 transition-all">Next <ChevronDown className="w-4 h-4 -rotate-90" /></button>
                                                                                            </div>
                                                                                            <div className="flex flex-col items-center mb-6"><h3 className="text-2xl font-black text-white mb-2 text-center">{currentItem.name}</h3><span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{boardData.name.toLowerCase().includes('form') ? 'Application Entry' : 'Project Details'}</span></div>
                                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                                                                                                {boardData.columns?.filter((col: any) => col.type !== 'name').map((col: any) => (
                                                                                                    <div key={col.id} className="p-4 rounded-2xl bg-[#0e0e1a] border border-white/5"><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-2">{col.title}</span><BoardCell item={currentItem} column={col} boardId={selectedBoardId} onUpdate={() => refreshBoardItems(true)} onPreview={(url, name, assetId) => setPreviewFile({ url, name, assetId })} /></div>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })() : boardData.name.toLowerCase().includes('workspace') ? (() => {
                                                                                    // Cycle Grouping Logic for Editor Workspaces
                                                                                    const getCycleKey = (item: any) => {
                                                                                        if (!item.created_at) return 'Unknown';
                                                                                        const date = new Date(item.created_at);
                                                                                        if (isNaN(date.getTime())) return 'Unknown';

                                                                                        const year = date.getFullYear();
                                                                                        const month = date.toLocaleString('default', { month: 'long' });
                                                                                        const day = date.getDate();
                                                                                        const cycle = day <= 15 ? 1 : 2;

                                                                                        return `${month} ${year} - Cycle ${cycle}`;
                                                                                    };

                                                                                    const getCycleSortKey = (cycleKey: string) => {
                                                                                        if (cycleKey === 'Unknown') return 0;
                                                                                        const match = cycleKey.match(/(\w+) (\d+) - Cycle (\d)/);
                                                                                        if (!match) return 0;
                                                                                        const [, month, year, cycle] = match;
                                                                                        const monthNum = new Date(`${month} 1, ${year}`).getMonth();
                                                                                        return parseInt(year) * 100 + monthNum * 10 + parseInt(cycle);
                                                                                    };

                                                                                    // Group items by cycle
                                                                                    const cycleGroups: Record<string, any[]> = {};
                                                                                    groupItems.forEach((item: any) => {
                                                                                        const cycleKey = getCycleKey(item);
                                                                                        if (!cycleGroups[cycleKey]) cycleGroups[cycleKey] = [];
                                                                                        cycleGroups[cycleKey].push(item);
                                                                                    });

                                                                                    // Sort cycles in descending order (newest first)
                                                                                    const sortedCycles = Object.keys(cycleGroups).sort((a, b) =>
                                                                                        getCycleSortKey(b) - getCycleSortKey(a)
                                                                                    );

                                                                                    return (
                                                                                        <div className="space-y-8">
                                                                                            {sortedCycles.map((cycleKey) => (
                                                                                                <div key={cycleKey} className="space-y-4">
                                                                                                    {/* Cycle Header */}
                                                                                                    <div className="flex items-center gap-3">
                                                                                                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                                                                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                                                                            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                                                                                                                {cycleKey}
                                                                                                            </h3>
                                                                                                        </div>
                                                                                                        <div className="flex-1 h-[1px] bg-white/5" />
                                                                                                        <span className="text-xs text-gray-500 font-mono">
                                                                                                            {cycleGroups[cycleKey].length} {cycleGroups[cycleKey].length === 1 ? 'item' : 'items'}
                                                                                                        </span>
                                                                                                    </div>

                                                                                                    {/* Card Grid for this Cycle */}
                                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                                                                        {cycleGroups[cycleKey].map((item: any, idx: number) => (
                                                                                                            <motion.div
                                                                                                                key={item.id}
                                                                                                                initial={{ opacity: 0, y: 20 }}
                                                                                                                animate={{ opacity: 1, y: 0 }}
                                                                                                                transition={{ delay: idx * 0.05, duration: 0.3 }}
                                                                                                                className="group relative"
                                                                                                            >
                                                                                                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                                                                                <div className="relative p-6 rounded-2xl bg-[#0e0e1a] border border-white/5 shadow-xl hover:border-white/10 hover:bg-[#131322] transition-all h-full flex flex-col gap-5">
                                                                                                                    {/* Item Name Header */}
                                                                                                                    <div className="flex items-start justify-between gap-3">
                                                                                                                        <h4 className="text-lg font-bold text-white leading-snug flex-1">{item.name}</h4>
                                                                                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0 mt-2" />
                                                                                                                    </div>

                                                                                                                    <div className="w-full h-[1px] bg-white/5" />

                                                                                                                    {/* Column Values */}
                                                                                                                    <div className="space-y-4 flex-1">
                                                                                                                        {boardData.columns?.filter((col: any) => col.type !== 'name').map((col: any) => (
                                                                                                                            <div key={col.id} className="flex flex-col gap-1.5">
                                                                                                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{col.title}</span>
                                                                                                                                <div className="min-h-[28px] flex items-center">
                                                                                                                                    <BoardCell
                                                                                                                                        item={item}
                                                                                                                                        column={col}
                                                                                                                                        boardId={selectedBoardId}
                                                                                                                                        onUpdate={() => refreshBoardItems(true)}
                                                                                                                                        onPreview={(url, name, assetId) => setPreviewFile({ url, name, assetId })}
                                                                                                                                    />
                                                                                                                                </div>
                                                                                                                            </div>
                                                                                                                        ))}
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </motion.div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                            {groupItems.length === 0 && (
                                                                                                <div className="text-center text-gray-500 italic py-8">No items in this group</div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })() : (
                                                                                    // Default Table View
                                                                                    <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20">
                                                                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                                                                            <thead><tr className="border-b border-white/10 bg-white/5"><th className="px-4 py-3 text-xs font-bold text-white uppercase tracking-wider w-[240px]">Name</th>{boardData.columns?.filter((c: any) => c.type !== 'name').map((col: any) => (<th key={col.id} className="px-4 py-3 text-xs font-bold text-gray-300 uppercase tracking-wider min-w-[150px]">{col.title}</th>))}</tr></thead>
                                                                                            <tbody>
                                                                                                {groupItems.map((item: any) => (
                                                                                                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                                                                        <td className="px-4 py-3 font-medium text-white group-hover:text-emerald-400 transition-colors sticky left-0 bg-[#0e0e1a] group-hover:bg-[#151525] z-10 border-r border-white/5">{item.name}</td>
                                                                                                        {boardData.columns?.filter((c: any) => c.type !== 'name').map((col: any) => (<td key={col.id} className="px-4 py-3 text-gray-400"><BoardCell item={item} column={col} boardId={selectedBoardId} onUpdate={() => refreshBoardItems(true)} onPreview={(url, name, assetId) => setPreviewFile({ url, name, assetId })} /></td>))}
                                                                                                    </tr>
                                                                                                ))}
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </motion.div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                                <LayoutDashboard className="w-10 h-10 text-gray-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2">Select a Board</h2>
                                            <p className="text-gray-400 max-w-md">Choose a board from the sidebar to view and manage tasks.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                    </div>
                </main >

                {/* Modals remain mostly the same */}

                {/* File Preview Modal */}
                {
                    previewFile && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                            <button onClick={() => setPreviewFile(null)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"><X className="w-8 h-8" /></button>

                            <div className="w-full max-w-5xl h-[85vh] flex flex-col bg-[#0A0A16] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                {/* Modal Header */}
                                <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                            <FileText className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <h3 className="text-white font-bold text-lg truncate max-w-md">{previewFile?.name}</h3>
                                    </div>
                                    <a
                                        href={previewFile?.url}
                                        target="_blank"
                                        download
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:brightness-110 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        <Download className="w-4 h-4" /> Download Original
                                    </a>
                                </div>

                                {/* Modal Content */}
                                <div className="flex-1 bg-black/50 relative flex items-center justify-center p-4 overflow-hidden">
                                    <FilePreviewer url={previewFile?.url || ''} name={previewFile?.name || ''} isLoading={!!previewFile?.assetId} />
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </BackgroundLayout >
    );
}
