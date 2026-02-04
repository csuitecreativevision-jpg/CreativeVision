import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundLayout } from './layout/BackgroundLayout';
import { CinematicOverlay } from './ui/CinematicOverlay';
import { SpotlightCard } from './ui/SpotlightCard';
import { FilePreviewer } from './ui/FilePreviewModal';
import {
    LayoutDashboard,
    Users,
    UserPlus,
    Settings,
    Activity,
    Search,
    Menu,
    TrendingUp,
    Eye,
    EyeOff,
    Wand2,
    Pencil,
    Briefcase,
    LogOut,
    AlignLeft,
    Table,
    Loader2,
    Plus,
    X,
    ChevronDown,
    MoreHorizontal,
    FileText,
    Download,
    Trash2,
    AlertCircle,
    LayoutGrid,
    Clock,
    PlayCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    getAllBoards, getAllFolders, getBoardItems, createNewBoard, createNewGroup, updateItemValue, getAllWorkspaces,
    getMultipleBoardItems,
    getAssetPublicUrl,
    prefetchBoardItems
} from '../services/mondayService';
import { createUser, getAllUsers, updateUser, deleteUser, supabase } from '../services/boardsService';
import { useVisibilityPolling, useBoardItems, useUpdateItemValue } from '../hooks/useMondayData';

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
        const thisFolder = allFolders.find(f => String(f.id) === String(fId));
        if (!thisFolder || !thisFolder.children) return false;

        return thisFolder.children.some((child: any) => {
            // Is child a folder?
            const isFolder = allFolders.find(f => String(f.id) === String(child.id));
            if (isFolder) return hasVisibleBoards(isFolder.id);
            // Is child a board? (Already filtered list)
            const isBoard = allBoards.find(b => String(b.id) === String(child.id));
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
                                            ? 'bg-custom-bright/10 text-white font-semibold'
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 font-medium'}`}
                                    style={{ paddingLeft: `${(depth + 1) * 12 + 12}px` }}
                                    title={board.name} // Show full name on hover
                                >
                                    {/* Active Indicator Bar */}
                                    {isSelected && (
                                        <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-custom-bright rounded-r-full shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
                                    )}

                                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${isSelected ? 'text-custom-bright' : 'text-gray-500 group-hover/item:text-gray-400'}`} />
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
const SidebarItem = ({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${active ? 'bg-custom-bright/10 border border-custom-bright/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
    >
        <div className={`p-1 rounded-lg ${active ? 'text-custom-bright' : 'text-gray-500 group-hover:text-white transition-colors'}`}>
            {icon}
        </div>
        <span className="text-sm font-medium tracking-wide">{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-custom-bright shadow-[0_0_8px_rgba(124,58,237,0.5)]" />}
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

export default function AdminPortal() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'Overview' | 'Boards' | 'Projects' | 'Analytics' | 'Team' | 'Users' | 'Settings'>('Overview');

    // Strict Role Check
    useEffect(() => {
        const role = localStorage.getItem('portal_user_role');
        if (role !== 'admin') {
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
    // User Permissions State
    const [currentUserAllowedBoards, setCurrentUserAllowedBoards] = useState<string[]>([]);
    const [currentUserWorkspaceId, setCurrentUserWorkspaceId] = useState<string | null>(null);

    // Carousel State for Form Groups
    const [groupCarouselIndices, setGroupCarouselIndices] = useState<Record<string, number>>({});

    // Create Modal State
    const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    // Board Items Hook (React Query)
    const { boardData, isLoading: isBoardItemsLoading, refreshBoardItems } = useBoardItems(selectedBoardId);

    // Derived loading state (combines manual + hook loading)
    const loading = manualLoading || isBoardItemsLoading;
    const setLoading = setManualLoading;

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

    // User Management State
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserRole, setNewUserRole] = useState<'admin' | 'editor' | 'client'>('editor');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [selectedUserWorkspace, setSelectedUserWorkspace] = useState(''); // Workspace ID for user
    const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([]); // Specific boards for user
    const [boardSearchQuery, setBoardSearchQuery] = useState(''); // Filter for boards list
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [userSuccess, setUserSuccess] = useState<string | null>(null);
    const [isUserListOpen, setIsUserListOpen] = useState(false);

    // --- Data Fetching ---
    const [userError, setUserError] = useState<string | null>(null);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let pass = '';
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewUserPassword(pass);
        setShowPassword(true);
    };

    // User List State & Logic
    const [userList, setUserList] = useState<any[]>([]);
    const [userListLoading, setUserListLoading] = useState(false);

    const fetchUsers = async () => {
        setUserListLoading(true);
        const users = await getAllUsers();
        setUserList(users);
        setUserListLoading(false);
    };

    useEffect(() => {
        if (activeTab === 'Users') {
            fetchUsers();
        }
    }, [activeTab]);

    const handleDeleteUser = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete user "${name}"?`)) {
            const result = await deleteUser(id);
            if (result.success) {
                fetchUsers();
            } else {
                alert('Failed to delete user: ' + result.error);
            }
        }
    };

    // Current logged-in user info (from localStorage)
    const currentUserRole = localStorage.getItem('portal_user_role') || 'admin';
    const currentUserName = localStorage.getItem('portal_user_name') || '';

    // Auto-generate email based on role
    useEffect(() => {
        if (!editingUserId) {
            if (newUserRole === 'admin') {
                setNewUserEmail(newUserName.toLowerCase().replace(/\s+/g, '') + '@admin.cv');
            } else if (newUserRole === 'editor') {
                setNewUserEmail(newUserName.toLowerCase().replace(/\s+/g, '') + '@editors.cv');
            } else if (newUserRole === 'client') {
                setNewUserEmail(newUserName.toLowerCase().replace(/\s+/g, '') + '@clients.cv');
            }
        }
    }, [newUserRole, newUserName, editingUserId]);

    const handleEditUser = (user: any) => {
        setEditingUserId(user.id);
        setNewUserName(user.name);
        setNewUserRole(user.role);
        setNewUserEmail(user.email); // Keep existing email
        setSelectedUserWorkspace(user.workspace_id || '');
        setSelectedBoardIds(user.allowed_board_ids || []);
        setNewUserPassword(''); // Password not retrieved
        setIsUserListOpen(false); // Close modal to show form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setNewUserName('');
        setNewUserPassword('');
        setNewUserRole('editor');
        setSelectedUserWorkspace('');
        setSelectedBoardIds([]);
        setUserError(null);
        setUserSuccess(null);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserError(null);
        setUserSuccess(null);

        if (!editingUserId) {
            if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
                setUserError('Name, email, and password are required');
                return;
            }
            if (newUserPassword.length < 4) {
                setUserError('Password must be at least 4 characters');
                return;
            }
        } else {
            if (!newUserName.trim()) {
                setUserError('Name is required');
                return;
            }
        }

        setIsCreatingUser(true);
        const cleanEmail = newUserEmail.trim().toLowerCase();

        if (editingUserId) {
            const result = await updateUser(editingUserId, {
                role: newUserRole,
                workspace_id: selectedUserWorkspace,
                allowed_board_ids: selectedBoardIds,
                name: newUserName.trim()
            });
            setIsCreatingUser(false);
            if (result.success) {
                setUserSuccess(`User "${newUserName}" updated successfully!`);
                setEditingUserId(null);
                setNewUserName('');
                setNewUserPassword('');
                setNewUserRole('editor');
                setSelectedUserWorkspace('');
                setSelectedBoardIds([]);
                fetchUsers();
            } else {
                setUserError(result.error || 'Failed to update user');
            }
        } else {
            const result = await createUser(
                newUserName.trim(),
                cleanEmail,
                newUserPassword,
                newUserRole,
                selectedUserWorkspace || undefined,
                selectedBoardIds
            );

            setIsCreatingUser(false);

            if (result.success) {
                setUserSuccess(`User "${result.user?.name}" created successfully!`);
                setNewUserName('');
                setNewUserPassword('');
                setNewUserRole('editor');
                setSelectedUserWorkspace('');
                setSelectedBoardIds([]);
                fetchUsers();
            } else {
                setUserError(result.error || 'Failed to create user');
            }
        }
    };

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
            prefetchBoardItems(boardIds).catch(err => console.error("Prefetch failed", err));
        }
    }, [boards, checkingPermissions, prefetchStarted]);

    // Effect to fetch public URL for preview if assetId is available
    useEffect(() => {
        if (previewFile?.assetId && previewFile.url && !previewFile.url.includes('public_url_fetched')) {
            const fetchPublicUrl = async () => {
                try {
                    const publicUrl = await getAssetPublicUrl(previewFile.assetId!);
                    if (publicUrl) {
                        setPreviewFile(prev => prev ? { ...prev, url: publicUrl, assetId: undefined } : null); // assetId undefined to prevent loop
                    }
                } catch (err) {
                    console.error("Failed to fetch public URL", err);
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
            refreshBoardItems(); // Fetch via hook
            refreshBoardsAndFolders(true); // Background Refresh Global Data
        }
    }, [selectedBoardId]);

    const handleCreateBoard = async () => {
        if (!newBoardName.trim()) return;
        setLoading(true);
        try {
            await createNewBoard(newBoardName);
            setNewBoardName('');
            setIsCreateBoardOpen(false);
            refreshBoardsAndFolders();
        } catch (error) {
            console.error("Failed to create board", error);
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || !selectedBoardId) return;
        setLoading(true);
        try {
            await createNewGroup(selectedBoardId, newGroupName);
            setNewGroupName('');
            setIsCreateGroupOpen(false);
            refreshBoardItems();
        } catch (error) {
            console.error("Failed to create group", error);
            setLoading(false);
        }
    };

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
                <aside className="hidden lg:flex w-64 h-screen flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl p-4 relative z-30 flex-shrink-0">
                    {/* Logo Area */}
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-custom-border to-custom-violet p-[1px]">
                            <div className="w-full h-full rounded-lg bg-black flex items-center justify-center">
                                <img src="/Untitled design (3).png" alt="Logo" className="w-5 h-5 object-contain" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-sm tracking-tight">CreativeVision</h2>
                            <div className="text-[9px] text-custom-bright font-bold uppercase tracking-widest">
                                {currentUserRole === 'admin' ? 'Admin Console' : currentUserRole === 'editor' ? 'Editor Portal' : 'Client Portal'}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-1">
                        <SidebarItem icon={<LayoutDashboard className="w-5 h-5" />} label="Overview" active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
                        <SidebarItem icon={<AlignLeft className="w-5 h-5" />} label="Boards" active={activeTab === 'Boards'} onClick={() => setActiveTab('Boards')} />
                        {currentUserRole === 'admin' && (
                            <>
                                <SidebarItem icon={<Briefcase className="w-5 h-5" />} label="Projects" active={activeTab === 'Projects'} onClick={() => setActiveTab('Projects')} />
                                <SidebarItem icon={<Activity className="w-5 h-5" />} label="Analytics" active={activeTab === 'Analytics'} onClick={() => setActiveTab('Analytics')} />
                                <SidebarItem icon={<Users className="w-5 h-5" />} label="Team" active={activeTab === 'Team'} onClick={() => setActiveTab('Team')} />
                                <SidebarItem icon={<UserPlus className="w-5 h-5" />} label="Users" active={activeTab === 'Users'} onClick={() => setActiveTab('Users')} />
                                <SidebarItem icon={<Settings className="w-5 h-5" />} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
                            </>
                        )}
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        {currentUserName && (
                            <div className="px-4 py-2 mb-2">
                                <div className="text-white text-sm font-medium truncate">{currentUserName}</div>
                                <div className={`text-xs capitalize ${currentUserRole === 'admin' ? 'text-purple-400' : currentUserRole === 'editor' ? 'text-blue-400' : 'text-green-400'}`}>
                                    {currentUserRole}
                                </div>
                            </div>
                        )}
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-gray-400 transition-colors group">
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm font-medium">Log Out</span>
                        </button>
                    </div>
                </aside>

                <main className="flex-1 h-screen flex flex-col relative z-20 overflow-hidden">
                    {/* Header */}
                    <header className="h-16 px-8 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-xl flex-shrink-0">
                        <div className="flex items-center gap-4 lg:hidden">
                            <button className="text-white"><Menu className="w-6 h-6" /></button>
                        </div>

                        <div className="hidden lg:block">
                            <h1 className="text-lg font-bold text-white tracking-tight">
                                {activeTab === 'Boards' && selectedBoardId && boardData ? boardData.name : activeTab}
                            </h1>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Debug Info */}
                            <div className="text-[10px] text-gray-500 font-mono hidden xl:block">
                                Boards: {boards.length} | Folders: {folders.length}
                            </div>

                            <div className="relative hidden md:block group">
                                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-custom-bright transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-custom-bright/50 focus:bg-white/10 transition-all w-64"
                                />
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-custom-blue to-custom-purple p-[1px]">
                                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop" alt="Admin" className="w-full h-full rounded-full object-cover" />
                            </div>
                        </div>
                    </header>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden flex">

                        {/* Tab Content */}
                        {activeTab === 'Overview' && (
                            <div className="p-8 overflow-y-auto w-full">
                                {/* Debug Area */}
                                <div className="mb-8 p-4 bg-red-900/20 border border-red-500/20 rounded-xl text-xs font-mono text-red-200">
                                    <h4 className="font-bold mb-2">Debug Data Dump</h4>
                                    <div>Boards Count: {boards.length}</div>
                                    <div>Folders Count: {folders.length}</div>
                                    <pre className="mt-2 text-[10px] opacity-50 overflow-hidden text-ellipsis whitespace-nowrap">
                                        Last Error: {loading ? 'Loading...' : 'None'}
                                    </pre>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <StatCard
                                        title="Active Clients"
                                        value={overviewLoading ? "..." : String(overviewStats.activeClientsCount)}
                                        change="Boards"
                                        icon={<Briefcase className="w-5 h-5 text-blue-400" />}
                                        delay={0.1}
                                    />
                                    <StatCard
                                        title="Active Projects"
                                        value={overviewLoading ? "..." : String(overviewStats.activeProjectsCount)}
                                        change="In Progress"
                                        icon={<Activity className="w-5 h-5 text-purple-400" />}
                                        delay={0.2}
                                    />
                                    <StatCard
                                        title="Top Editor"
                                        value={overviewLoading ? "..." : overviewStats.topEditor.name}
                                        change={`${overviewStats.topEditor.count} Videos`}
                                        icon={<TrendingUp className="w-5 h-5 text-green-400" />}
                                        delay={0.3}
                                    />
                                    <StatCard
                                        title="Active Editors"
                                        value={overviewLoading ? "..." : String(overviewStats.activeEditorsCount)}
                                        change="In Workspace"
                                        icon={<Users className="w-5 h-5 text-custom-bright" />}
                                        delay={0.4}
                                    />
                                </div>

                                {/* --- REAL GRAPH & LEADERBOARD --- */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">

                                    {/* Editor Productivity Graph */}
                                    <div className="lg:col-span-2 p-6 rounded-3xl bg-black/20 border border-white/5 backdrop-blur-xl">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-white font-bold text-lg">Editor Productivity</h3>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Projects</div>
                                        </div>

                                        <div className="h-64 flex items-end gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                            {overviewLoading ? (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Loading data...</div>
                                            ) : overviewStats.editorPerformance.length === 0 ? (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs italic">No active editor data found</div>
                                            ) : (
                                                overviewStats.editorPerformance.map((editor, idx) => {
                                                    const maxVal = Math.max(...overviewStats.editorPerformance.map(c => c.count), 5); // scale max
                                                    const heightPct = (editor.count / maxVal) * 100;
                                                    const isTop3 = idx < 3;

                                                    return (
                                                        <div key={idx} className="flex flex-col items-center gap-2 group min-w-[60px] flex-1">
                                                            <div className="relative w-full flex justify-center">
                                                                <div
                                                                    className={`w-full max-w-[40px] rounded-t-lg bg-gradient-to-t ${isTop3 ? 'from-green-500/80 to-green-400' : 'from-green-900/40 to-green-800/60'} group-hover:to-green-300 transition-all duration-300 relative`}
                                                                    style={{ height: `${Math.max(heightPct, 5)}px`, minHeight: '24px' }}
                                                                >
                                                                    {/* Persistent Label for Top items, Hover for others */}
                                                                    <div className={`absolute -top-6 left-1/2 -translate-x-1/2 ${isTop3 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity text-[10px] font-bold text-white bg-black/80 px-2 py-0.5 rounded pointer-events-none whitespace-nowrap z-10 border border-white/10`}>
                                                                        {editor.count}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className={`text-[10px] text-center truncate w-full max-w-[80px] ${isTop3 ? 'text-white font-bold' : 'text-gray-500'}`} title={editor.name}>
                                                                {editor.name}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Client Portfolio Graph */}
                                    <div className="lg:col-span-2 p-6 rounded-3xl bg-black/20 border border-white/5 backdrop-blur-xl">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-white font-bold text-lg">Client Portfolio</h3>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Active Projects Distribution</div>
                                        </div>

                                        <div className="h-64 flex items-end gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                            {overviewLoading ? (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Loading data...</div>
                                            ) : overviewStats.clientProjectDistribution.length === 0 ? (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs italic">No active client data found</div>
                                            ) : (
                                                overviewStats.clientProjectDistribution.map((client, idx) => {
                                                    const maxVal = Math.max(...overviewStats.clientProjectDistribution.map(c => c.count), 5); // scale max
                                                    const heightPct = (client.count / maxVal) * 100;

                                                    return (
                                                        <div key={idx} className="flex flex-col items-center gap-2 group min-w-[60px] flex-1">
                                                            <div className="relative w-full flex justify-center">
                                                                <div
                                                                    className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-blue-600/20 to-blue-500/80 group-hover:to-blue-400 transition-all duration-300 relative"
                                                                    style={{ height: `${Math.max(heightPct, 5)}px`, minHeight: '4px' }}
                                                                >
                                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-white bg-black/80 px-2 py-0.5 rounded pointer-events-none whitespace-nowrap">
                                                                        {client.count} Projects
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-[10px] text-gray-400 text-center truncate w-full max-w-[80px]" title={client.name}>
                                                                {client.name}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Editor Performance Leaderboard */}
                                    <div className="p-6 rounded-3xl bg-black/20 border border-white/5 backdrop-blur-xl flex flex-col">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-white font-bold text-lg">Top Editors</h3>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Videos Done</div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                                            {overviewLoading ? (
                                                <div className="text-center text-gray-500 text-xs py-10">Loading...</div>
                                            ) : overviewStats.editorPerformance.length === 0 ? (
                                                <div className="text-center text-gray-500 text-xs italic py-10">No editor data available</div>
                                            ) : (
                                                overviewStats.editorPerformance.slice(0, 3).map((editor, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-gray-700/30 text-gray-400'}`}>
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className={`text-xs font-bold ${idx === 0 ? 'text-white' : 'text-gray-300'}`}>{editor.name}</span>
                                                                {idx === 0 && <span className="text-[9px] text-yellow-500 uppercase tracking-wider">Top Performer</span>}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-black text-white px-2 py-1 rounded bg-black/20">
                                                            {editor.count}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                </div>
                                {/* End Real Data Section */}
                            </div>
                        )}

                        {activeTab === 'Users' && (
                            <div className="p-8 w-full max-w-7xl mx-auto">
                                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400 mb-10 tracking-tight">User Management</h1>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    {/* Left Column Wrapper (Form + Roles) - Wider */}
                                    <div className="space-y-6 lg:col-span-8">
                                        {/* Create User Form */}
                                        <div className="bg-[#0A0A16] border border-white/10 rounded-2xl p-6">
                                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                                {editingUserId ? <Pencil className="w-5 h-5 text-custom-bright" /> : <UserPlus className="w-5 h-5 text-custom-bright" />}
                                                {editingUserId ? 'Edit User' : 'Create New User'}
                                            </h2>

                                            <form onSubmit={handleCreateUser} className="space-y-4">
                                                {/* Role Selection */}
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Role</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {(['admin', 'editor', 'client'] as const).map(role => (
                                                            <button
                                                                key={role}
                                                                type="button"
                                                                onClick={() => setNewUserRole(role)}
                                                                className={`py-2 rounded-lg text-sm font-bold capitalize transition-all ${newUserRole === role
                                                                    ? 'bg-custom-bright text-white shadow-lg shadow-custom-bright/20'
                                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 py-2 border border-transparent'
                                                                    }`}
                                                            >
                                                                {role}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Name Input */}
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={newUserName}
                                                        onChange={(e) => setNewUserName(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-custom-bright transition-colors"
                                                        placeholder="e.g. John Doe"
                                                    />
                                                </div>

                                                {/* Workspace Selection (For Editors/Clients) */}
                                                {(newUserRole === 'editor' || newUserRole === 'client') && (
                                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Assigned Workspace</label>
                                                        <div className="relative">
                                                            <select
                                                                value={selectedUserWorkspace}
                                                                onChange={(e) => setSelectedUserWorkspace(e.target.value)}
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-custom-bright appearance-none cursor-pointer"
                                                            >
                                                                <option value="" className="bg-[#0A0A16] text-gray-400">Select a Workspace...</option>
                                                                {workspaces.map(ws => (
                                                                    <option key={ws.id} value={ws.id} className="bg-[#0A0A16]">{ws.name}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 mt-1">
                                                            Associates this user with a specific Monday.com workspace
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Board Selection (Dependent on Workspace) */}
                                                {(selectedUserWorkspace && (newUserRole === 'editor' || newUserRole === 'client')) && (
                                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                                            Allowed Boards <span className="text-gray-600 normal-case ml-1">(Optional - Select none for all)</span>
                                                        </label>

                                                        {/* Board Search Input */}
                                                        <div className="relative mb-2">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                                                            <input
                                                                type="text"
                                                                placeholder="Filter boards..."
                                                                value={boardSearchQuery}
                                                                onChange={(e) => setBoardSearchQuery(e.target.value)}
                                                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-custom-bright transition-colors"
                                                            />
                                                        </div>

                                                        <div className="bg-white/5 border border-white/10 rounded-xl p-2 max-h-48 overflow-y-auto custom-scrollbar">
                                                            {boards.filter(b =>
                                                                b.workspace_id === selectedUserWorkspace &&
                                                                b.name.toLowerCase().includes(boardSearchQuery.toLowerCase()) &&
                                                                (newUserRole === 'editor' ? b.name.toLowerCase().includes('workspace') : newUserRole === 'client' ? b.name.toLowerCase().includes('fulfillment') : true)
                                                            ).length === 0 ? (
                                                                <p className="text-sm text-gray-500 p-2">No boards found.</p>
                                                            ) : (
                                                                <div className="space-y-1">
                                                                    {boards
                                                                        .filter(b =>
                                                                            b.workspace_id === selectedUserWorkspace &&
                                                                            b.name.toLowerCase().includes(boardSearchQuery.toLowerCase()) &&
                                                                            (newUserRole === 'editor' ? b.name.toLowerCase().includes('workspace') : newUserRole === 'client' ? b.name.toLowerCase().includes('fulfillment') : true)
                                                                        )
                                                                        .map(board => (
                                                                            <label key={board.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
                                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedBoardIds.includes(board.id)
                                                                                    ? 'bg-custom-bright border-custom-bright'
                                                                                    : 'border-gray-600 group-hover:border-gray-400'
                                                                                    }`}>
                                                                                    {selectedBoardIds.includes(board.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                                                                </div>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    className="hidden"
                                                                                    checked={selectedBoardIds.includes(board.id)}
                                                                                    onChange={(e) => {
                                                                                        if (e.target.checked) {
                                                                                            setSelectedBoardIds([...selectedBoardIds, board.id]);
                                                                                        } else {
                                                                                            setSelectedBoardIds(selectedBoardIds.filter(id => id !== board.id));
                                                                                        }
                                                                                    }}
                                                                                />
                                                                                <span className={`text-sm ${selectedBoardIds.includes(board.id) ? 'text-white' : 'text-gray-400'}`}>
                                                                                    {board.name}
                                                                                </span>
                                                                            </label>
                                                                        ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex justify-end mt-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const wsBoards = boards.filter(b => b.workspace_id === selectedUserWorkspace).map(b => b.id);
                                                                    if (selectedBoardIds.length === wsBoards.length) {
                                                                        setSelectedBoardIds([]);
                                                                    } else {
                                                                        setSelectedBoardIds(wsBoards);
                                                                    }
                                                                }}
                                                                className="text-[10px] text-custom-bright hover:text-white transition-colors uppercase font-bold tracking-wider"
                                                            >
                                                                {boards.filter(b => b.workspace_id === selectedUserWorkspace).every(b => selectedBoardIds.includes(b.id)) && boards.filter(b => b.workspace_id === selectedUserWorkspace).length > 0
                                                                    ? 'Deselect All'
                                                                    : 'Select All'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Auto-Generated Email */}
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email (Auto-Generated)</label>
                                                    <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-400 font-mono text-sm flex items-center gap-2">
                                                        <span className="truncate">{newUserEmail || 'Start typing name...'}</span>
                                                    </div>
                                                </div>

                                                {/* Password Input */}
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password {editingUserId && <span className="text-custom-bright normal-case ml-1">(Optional)</span>}</label>
                                                    <div className="relative flex gap-2">
                                                        <div className="relative flex-1">
                                                            <input
                                                                type={showPassword ? "text" : "password"}
                                                                value={newUserPassword}
                                                                onChange={(e) => setNewUserPassword(e.target.value)}
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-custom-bright transition-colors pr-10"
                                                                placeholder="Enter password"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                                            >
                                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={generatePassword}
                                                            className="px-4 py-2 bg-custom-bright/10 border border-custom-bright/20 rounded-xl text-custom-bright hover:bg-custom-bright/20 transition-all flex items-center gap-2"
                                                            title="Auto-generate secure password"
                                                        >
                                                            <Wand2 className="w-4 h-4" />
                                                            <span className="text-xs font-bold hidden sm:inline">Generate</span>
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 mt-1">Min. 4 characters</p>
                                                </div>

                                                {/* Status Messages */}
                                                {userError && (
                                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                                        {userError}
                                                    </div>
                                                )}
                                                {userSuccess && (
                                                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                                                        {userSuccess}
                                                    </div>
                                                )}

                                                <div className="flex gap-3">
                                                    {editingUserId && (
                                                        <button
                                                            type="button"
                                                            onClick={handleCancelEdit}
                                                            className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all border border-white/10"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    <button
                                                        type="submit"
                                                        disabled={isCreatingUser}
                                                        className="flex-1 py-3 rounded-xl bg-custom-bright text-white font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-custom-bright/20"
                                                    >
                                                        {isCreatingUser
                                                            ? (editingUserId ? 'Updating...' : 'Creating...')
                                                            : (editingUserId ? 'Update User' : 'Create User')}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>

                                        {/* Role Permissions Info */}
                                        <div className="bg-[#0A0A16]/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                                            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider opacity-80">Role Permissions</h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-1">
                                                    <span className="self-start px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase">Admin</span>
                                                    <span className="text-xs text-gray-400 leading-relaxed">Full access to all boards, settings, and user management.</span>
                                                </div>
                                                <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-1">
                                                    <span className="self-start px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase">Editor</span>
                                                    <span className="text-xs text-gray-400 leading-relaxed">Access to "Editor Portal". Sees only assigned workspace boards.</span>
                                                </div>
                                                <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-1">
                                                    <span className="self-start px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold uppercase">Client</span>
                                                    <span className="text-xs text-gray-400 leading-relaxed">Access to "Client Portal". Sees only fulfillment deliverable boards.</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* User List Launcher (Right Column) */}
                                    <div className="flex flex-col gap-6 lg:col-span-4">
                                        {/* Launcher Card - Compact */}
                                        <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0A16] to-[#0F0F1A] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-custom-bright/30 transition-all group cursor-pointer shadow-2xl shadow-black/50"
                                            onClick={() => setIsUserListOpen(true)}>

                                            {/* Glow Effect */}
                                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                            <div className="absolute inset-0 bg-gradient-to-b from-custom-bright/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                            <div className="relative z-10 w-16 h-16 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl group-hover:shadow-custom-bright/20 ring-1 ring-white/5 group-hover:ring-custom-bright/40">
                                                <Users className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors" />
                                            </div>

                                            <h2 className="relative z-10 text-2xl font-bold text-white mb-2">User Directory</h2>
                                            <p className="relative z-10 text-gray-400 mb-8 max-w-[200px] text-xs leading-relaxed">
                                                Manage all registered users in a centralized table view.
                                            </p>

                                            <button
                                                className="relative z-10 w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 group-hover:bg-custom-bright group-hover:shadow-lg group-hover:shadow-custom-bright/30 border border-white/10 group-hover:border-custom-bright/50"
                                            >
                                                <Table className="w-4 h-4" />
                                                Open Directory
                                            </button>

                                            <div className="relative z-10 mt-6 flex items-center gap-2 text-[10px] font-mono text-gray-500 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                {userList.length} Active Users
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* User List Modal */}
                                <AnimatePresence>
                                    {isUserListOpen && (
                                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                onClick={() => setIsUserListOpen(false)}
                                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                                className="bg-[#0A0A16] border border-white/10 rounded-2xl shadow-2xl w-full max-w-6xl max-h-full flex flex-col relative z-10 overflow-hidden"
                                            >
                                                {/* Modal Header */}
                                                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0A0A16]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-custom-bright/20">
                                                            <Users className="w-6 h-6 text-custom-bright" />
                                                        </div>
                                                        <div>
                                                            <h2 className="text-xl font-bold text-white">User Directory</h2>
                                                            <p className="text-sm text-gray-400">{userList.length} active users</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setIsUserListOpen(false)}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                    >
                                                        <X className="w-6 h-6" />
                                                    </button>
                                                </div>

                                                {/* Modal Content (Table) */}
                                                <div className="flex-1 overflow-auto p-6 bg-[#080816]">
                                                    <div className="bg-[#0A0A16] border border-white/5 rounded-xl overflow-hidden">
                                                        <table className="w-full text-left border-collapse relative">
                                                            <thead className="sticky top-0 bg-[#0A0A16] z-10 shadow-sm shadow-black/50">
                                                                <tr className="border-b border-white/5 bg-white/5">
                                                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Name</th>
                                                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Role</th>
                                                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Workspace</th>
                                                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-white/5">
                                                                {userListLoading ? (
                                                                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading users...</td></tr>
                                                                ) : userList.length === 0 ? (
                                                                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">No users found</td></tr>
                                                                ) : (
                                                                    userList.map(user => (
                                                                        <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                                                            <td className="p-4">
                                                                                <div className="text-sm text-white font-medium">{user.name}</div>
                                                                                <div className="text-xs text-gray-500 font-mono mt-0.5">{user.email}</div>
                                                                            </td>
                                                                            <td className="p-4">
                                                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                                                                                    user.role === 'editor' ? 'bg-blue-500/20 text-blue-400' :
                                                                                        'bg-green-500/20 text-green-400'
                                                                                    }`}>
                                                                                    {user.role}
                                                                                </span>
                                                                            </td>
                                                                            <td className="p-4 text-xs text-gray-400">
                                                                                {user.workspace_id ? (
                                                                                    workspaces.find(w => w.id.toString() === user.workspace_id)?.name || 'Unknown WS'
                                                                                ) : (
                                                                                    <span className="text-gray-600">-</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="p-4 text-right">
                                                                                <div className="flex items-center justify-end gap-1">
                                                                                    <button
                                                                                        onClick={() => handleEditUser(user)}
                                                                                        className="p-1.5 hover:bg-blue-500/20 rounded-lg text-gray-500 hover:text-blue-400 transition-colors"
                                                                                        title="Edit User"
                                                                                    >
                                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleDeleteUser(user.id, user.name)}
                                                                                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                                                                                        title="Delete User"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}


                        {activeTab === 'Boards' && (
                            <>
                                {/* Tree Sidebar */}
                                <div className="w-72 border-r border-white/5 bg-[#080816] flex flex-col flex-shrink-0">
                                    <div className="pt-4 pb-2 px-4">
                                        <div className="flex items-center justify-between text-gray-400 mb-2">
                                            <h3 className="text-[13px] font-bold text-gray-300">Workspaces</h3>
                                            <div className="flex items-center gap-2">
                                                <MoreHorizontal className="w-4 h-4 hover:text-white cursor-pointer" />
                                                <Search className="w-4 h-4 hover:text-white cursor-pointer" />
                                            </div>
                                        </div>

                                        {/* Workspace Dropdown */}
                                        <div className="relative mb-3 group z-20">
                                            <div
                                                className="flex items-center justify-between px-3 py-2 bg-[#1F2B47]/50 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                                                onClick={() => {
                                                    // Simple toggle for logic or just use a state for UI dropdown?
                                                    // For now, I'll validly cycle or just use a simple HTML select for robustness if complex UI isn't built
                                                    // But user wants "exactly like this".
                                                    // I'll implement a custom dropdown.
                                                    const el = document.getElementById('ws-dropdown');
                                                    if (el) el.classList.toggle('hidden');
                                                }}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-6 h-6 rounded flex items-center justify-center bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md flex-shrink-0">
                                                        <span className="font-bold text-xs">
                                                            {selectedWorkspaceId
                                                                ? workspaces.find(w => w.id === selectedWorkspaceId)?.name.charAt(0)
                                                                : 'M'}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-white font-medium truncate group-hover:text-custom-bright transition-colors">
                                                        {selectedWorkspaceId
                                                            ? workspaces.find(w => w.id === selectedWorkspaceId)?.name
                                                            : 'Main Workspace'}
                                                    </span>
                                                </div>
                                                <ChevronDown className="w-3 h-3 text-gray-500" />
                                            </div>

                                            {/* Dropdown Menu */}
                                            <div id="ws-dropdown" className="hidden absolute top-full left-0 w-full mt-1 bg-[#23263a] border border-white/10 rounded-lg shadow-xl overflow-hidden">
                                                <div
                                                    className="px-3 py-2 hover:bg-white/5 cursor-pointer flex items-center gap-2"
                                                    onClick={() => {
                                                        setSelectedWorkspaceId(null);
                                                        document.getElementById('ws-dropdown')?.classList.add('hidden');
                                                    }}
                                                >
                                                    <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[10px] text-white">M</div>
                                                    <span className="text-sm text-gray-300">Main Workspace</span>
                                                </div>
                                                {workspaces.map(ws => (
                                                    <div
                                                        key={ws.id}
                                                        className="px-3 py-2 hover:bg-white/5 cursor-pointer flex items-center gap-2"
                                                        onClick={() => {
                                                            setSelectedWorkspaceId(ws.id);
                                                            document.getElementById('ws-dropdown')?.classList.add('hidden');
                                                        }}
                                                    >
                                                        <div className="w-5 h-5 rounded bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-[10px] text-white">{ws.name.charAt(0)}</div>
                                                        <span className="text-sm text-gray-300 truncate">{ws.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Blue Plus Button */}
                                        <button
                                            onClick={() => setIsCreateBoardOpen(true)}
                                            className="w-8 h-8 flex items-center justify-center bg-[#0073ea] rounded-md hover:brightness-110 transition-all text-white shadow-lg shadow-blue-900/20 mb-2"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                                        {(() => {
                                            // Filter by Workspace
                                            // Main Workspace = item.workspace is null/undefined
                                            const visibleFolders = folders.filter(f => selectedWorkspaceId ? String(f.workspace?.id) === String(selectedWorkspaceId) : !f.workspace);
                                            // Filter by Workspace AND exclude Subitem Boards
                                            const visibleBoards = boards
                                                .filter(b => selectedWorkspaceId ? String(b.workspace?.id) === String(selectedWorkspaceId) : !b.workspace)
                                                .filter(b => b.type !== 'sub_items_board' && !b.name.startsWith("Subitems of"));

                                            // Custom Sort Logic based on Screenshot
                                            const FOLDER_ORDER = ["Hiring and Onboarding", "Management", "Editors", "Clients", "Old"];
                                            const getSortWeight = (name: string) => {
                                                const index = FOLDER_ORDER.findIndex(n => name.includes(n));
                                                return index === -1 ? 999 : index;
                                            };

                                            // VIRTUAL GROUPING: "Editor Workspaces" should be in "Editors" folder

                                            // 1. Find key folders
                                            const editorsFolder = visibleFolders.find(f => f.name.trim() === 'Editors');
                                            const workspacesFolder = visibleFolders.find(f => f.name.trim() === 'Workspaces');

                                            // 2. Identify "Workspace" boards
                                            const editorBoards = visibleBoards.filter(b => b.name.includes(' - Workspace'));

                                            // 3. Ensure "Editors" folder exists (Virtual or Real)
                                            let effectiveEditorsFolder = editorsFolder;
                                            if (!effectiveEditorsFolder && (workspacesFolder || editorBoards.length > 0)) {
                                                effectiveEditorsFolder = {
                                                    id: 'virtual-editors',
                                                    name: 'Editors',
                                                    color: '#ffcc00',
                                                    children: []
                                                };
                                            }

                                            // 4. Populate "Editors" folder children
                                            if (effectiveEditorsFolder) {
                                                if (!effectiveEditorsFolder.children) effectiveEditorsFolder.children = [];

                                                // Helper to check if child exists in our effective folder
                                                const hasChild = (id: string) => effectiveEditorsFolder!.children.some((c: any) => String(c.id) === String(id));

                                                // A) Nest "Workspaces" folder inside "Editors"
                                                if (workspacesFolder && !hasChild(workspacesFolder.id)) {
                                                    effectiveEditorsFolder.children.push({ id: workspacesFolder.id });
                                                }

                                                // B) Nest loose "Workspace" boards inside "Editors"
                                                editorBoards.forEach(b => {
                                                    if (!hasChild(b.id)) {
                                                        const isInWorkspaces = workspacesFolder && workspacesFolder.children && workspacesFolder.children.some((c: any) => String(c.id) === String(b.id));
                                                        if (!isInWorkspaces) {
                                                            effectiveEditorsFolder!.children.push({ id: b.id });
                                                        }
                                                    }
                                                });
                                            }

                                            // 5. Construct Final Folders List
                                            // Start with all visible folders
                                            let finalFolders = [...visibleFolders];

                                            // Remove "Workspaces" from root list (as it is now nested)
                                            if (workspacesFolder) {
                                                finalFolders = finalFolders.filter(f => f.id !== workspacesFolder.id);
                                            }

                                            // Ensure "Editors" is in the list (if virtual)
                                            if (effectiveEditorsFolder && !finalFolders.some(f => f.id === effectiveEditorsFolder!.id)) {
                                                finalFolders.push(effectiveEditorsFolder);
                                            }

                                            // 6. Calculate Root Items (Hiding nested children)
                                            const childIds = new Set();
                                            finalFolders.forEach(f => {
                                                if (f.children) {
                                                    f.children.forEach((c: any) => childIds.add(String(c.id)));
                                                }
                                            });

                                            // Also exclude items that are children of the hidden "Workspaces" folder from root
                                            // (Recursion in FolderTreeItem handles display, we just need to hide from root here)
                                            if (workspacesFolder && workspacesFolder.children) {
                                                workspacesFolder.children.forEach((c: any) => childIds.add(String(c.id)));
                                            }

                                            const rootFolders = finalFolders
                                                .filter(f => !childIds.has(String(f.id)))
                                                .sort((a, b) => getSortWeight(a.name) - getSortWeight(b.name));

                                            // Boards A-Z fallback
                                            const rootBoards = visibleBoards
                                                .filter(b => !childIds.has(String(b.id)))
                                                // Functionally, this removes 'editorBoards' because we added their IDs to 'editorsFolder' children
                                                .sort((a, b) => a.name.localeCompare(b.name));

                                            return (
                                                <>
                                                    {/* Root Folders */}
                                                    {rootFolders.map(folder => (
                                                        <FolderTreeItem
                                                            key={folder.id}
                                                            folder={folder}
                                                            allFolders={visibleFolders}
                                                            allBoards={visibleBoards}
                                                            onSelectBoard={setSelectedBoardId}
                                                            selectedBoardId={selectedBoardId}
                                                        />
                                                    ))}
                                                    {/* Root Boards */}
                                                    {rootBoards.map(board => {
                                                        const Icon = getBoardIcon(board.name);
                                                        return (
                                                            <div
                                                                key={board.id}
                                                                onClick={() => setSelectedBoardId(board.id)}
                                                                className={`flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md cursor-pointer transition-all mb-0.5 ${selectedBoardId === board.id
                                                                    ? 'bg-[#0073ea] text-white shadow-lg shadow-blue-900/20 font-medium'
                                                                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1C212E]'
                                                                    }`}
                                                            >
                                                                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${selectedBoardId === board.id ? 'text-white' : 'text-gray-500'}`} />
                                                                <span className="text-[13px] truncate">{board.name}</span>
                                                            </div>
                                                        );
                                                    })}

                                                    {loading && (
                                                        <div className="p-4 text-center text-gray-500 text-xs animate-pulse">Loading workspace...</div>
                                                    )}
                                                    {!loading && visibleBoards.length === 0 && visibleFolders.length === 0 && (
                                                        <div className="p-4 text-center text-gray-500 text-xs opacity-50 flex flex-col gap-2">
                                                            <span>Empty Workspace</span>
                                                            <span className="text-[10px]">(or Main Workspace selected)</span>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Board Content */}
                                <div className="flex-1 overflow-y-auto bg-[#050511] p-6 relative">
                                    {selectedBoardId ? (
                                        <>
                                            {loading && !boardData ? (
                                                <div className="flex flex-col items-center justify-center h-full">
                                                    <Loader2 className="w-10 h-10 text-custom-bright animate-spin mb-4" />
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
                                                        <button
                                                            onClick={() => setIsCreateGroupOpen(true)}
                                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-custom-bright text-white text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-custom-bright/20"
                                                        >
                                                            <Plus className="w-4 h-4" /> Add Group
                                                        </button>
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
                                                                                        className={`px-4 py-3 text-xs font-bold cursor-pointer transition-colors ${fulfillmentMonthFilter === 'All' ? 'bg-custom-bright/10 text-custom-bright' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
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
                                                                                            className={`px-4 py-3 text-xs font-bold cursor-pointer transition-colors ${fulfillmentMonthFilter === month ? 'bg-custom-bright/10 text-custom-bright' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
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
                                                                                        <span className="text-custom-bright font-bold">{fulfillmentRecentIndex + 1}</span> <span className="text-gray-600">/</span> {sortedItems.length}
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
                                                                                    <Briefcase className="w-32 h-32 text-custom-bright" />
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
                                                                                                    <span className="text-[10px] uppercase tracking-wider text-custom-bright font-bold">{col.title}</span>
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
                                                                                <div className="p-1.5 bg-custom-bright/10 rounded-lg"><LayoutDashboard className="w-4 h-4 text-custom-bright" /></div>
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
                                                                                <span className="w-1 h-6 bg-custom-bright rounded-full" />
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
                                                                                                        <div className="flex items-center gap-2 px-4 py-2 bg-custom-bright/10 border border-custom-bright/20 rounded-xl">
                                                                                                            <div className="w-2 h-2 rounded-full bg-custom-bright" />
                                                                                                            <h3 className="text-sm font-bold text-custom-bright uppercase tracking-wider">
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
                                                                                                                <div className="absolute inset-0 bg-gradient-to-br from-custom-bright/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                                                                                <div className="relative p-6 rounded-2xl bg-[#0e0e1a] border border-white/5 shadow-xl hover:border-white/10 hover:bg-[#131322] transition-all h-full flex flex-col gap-5">
                                                                                                                    {/* Item Name Header */}
                                                                                                                    <div className="flex items-start justify-between gap-3">
                                                                                                                        <h4 className="text-lg font-bold text-white leading-snug flex-1">{item.name}</h4>
                                                                                                                        <div className="w-2 h-2 rounded-full bg-custom-bright animate-pulse flex-shrink-0 mt-2" />
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
                                                                                                        <td className="px-4 py-3 font-medium text-white group-hover:text-custom-bright transition-colors sticky left-0 bg-[#0e0e1a] group-hover:bg-[#151525] z-10 border-r border-white/5">{item.name}</td>
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
                </main>

                {/* Modals remain mostly the same */}
                {isCreateBoardOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <SpotlightCard className="w-full max-w-md p-8 rounded-3xl bg-[#0A0A16] border border-white/10 shadow-2xl relative">
                            <button onClick={() => setIsCreateBoardOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                            <h2 className="text-xl font-bold text-white mb-4">Create New Board</h2>
                            <input
                                value={newBoardName}
                                onChange={(e) => setNewBoardName(e.target.value)}
                                placeholder="Board Name"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-6 focus:outline-none focus:border-custom-bright"
                            />
                            <button onClick={handleCreateBoard} disabled={loading} className="w-full py-3 rounded-xl bg-custom-bright text-white font-bold hover:brightness-110">
                                {loading ? 'Creating...' : 'Create Board'}
                            </button>
                        </SpotlightCard>
                    </div>
                )}
                {isCreateGroupOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <SpotlightCard className="w-full max-w-md p-8 rounded-3xl bg-[#0A0A16] border border-white/10 shadow-2xl relative">
                            <button onClick={() => setIsCreateGroupOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                            <h2 className="text-xl font-bold text-white mb-4">Add New Group</h2>
                            <input
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="Group Name"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-6 focus:outline-none focus:border-custom-bright"
                            />
                            <button onClick={handleCreateGroup} disabled={loading} className="w-full py-3 rounded-xl bg-custom-bright text-white font-bold hover:brightness-110">
                                {loading ? 'Creating...' : 'Create Group'}
                            </button>
                        </SpotlightCard>
                    </div>
                )}
                {/* File Preview Modal */}
                {previewFile && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                        <button onClick={() => setPreviewFile(null)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"><X className="w-8 h-8" /></button>

                        <div className="w-full max-w-5xl h-[85vh] flex flex-col bg-[#0A0A16] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                            {/* Modal Header */}
                            <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-custom-bright/10 rounded-lg">
                                        <FileText className="w-5 h-5 text-custom-bright" />
                                    </div>
                                    <h3 className="text-white font-bold text-lg truncate max-w-md">{previewFile?.name}</h3>
                                </div>
                                <a
                                    href={previewFile?.url}
                                    target="_blank"
                                    download
                                    className="flex items-center gap-2 px-4 py-2 bg-custom-bright text-white rounded-lg hover:brightness-110 font-bold text-sm transition-all shadow-lg shadow-custom-bright/20"
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
                )}
            </div>
        </BackgroundLayout>
    );
}
