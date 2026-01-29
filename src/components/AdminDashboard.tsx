import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundLayout } from './layout/BackgroundLayout';
import { CinematicOverlay } from './ui/CinematicOverlay';
import { SpotlightCard } from './ui/SpotlightCard';
import {
    LayoutDashboard,
    Users,
    Settings,
    Activity,
    Search,
    Menu,
    TrendingUp,
    Eye,
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
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllBoards, getAllFolders, getBoardItems, createNewBoard, createNewGroup, updateItemValue, getAllWorkspaces } from '../services/mondayService';

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

    // Helper for Icon
    const getBoardIcon = (name: string) => {
        if (name.toLowerCase().includes('dashboard')) return LayoutDashboard;
        if (name.toLowerCase().includes('form')) return FileText;
        return Table;
    };

    // Auto-expand if selected board is inside
    useEffect(() => {
        if (childBoards.some((b: any) => b.id === selectedBoardId)) {
            setIsOpen(true);
        }
    }, [selectedBoardId, childBoards]);

    const hasChildren = childFolders.length > 0 || childBoards.length > 0;

    return (
        <div className="select-none text-sm font-sans">
            <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors mb-0.5 group ${isOpen ? '' : 'hover:bg-white/5'}`}
                style={{ paddingLeft: `${depth * 16 + 12}px` }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                    {hasChildren ? (
                        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} style={{ color: folder.color || '#a1a1aa' }}>
                            <svg width="6" height="8" viewBox="0 0 6 8" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 0L6 4L0 8V0Z" />
                            </svg>
                        </div>
                    ) : <div className="w-4 h-4 flex-shrink-0" />}
                </div>
                {/* Folder Name - Colored */}
                <span className="font-medium truncate transition-colors" style={{ color: folder.color || '#e4e4e7' }}>
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
                            return (
                                <div
                                    key={board.id}
                                    onClick={() => onSelectBoard(board.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md cursor-pointer transition-all mb-0.5 ${selectedBoardId === board.id
                                        ? 'bg-[#0073ea] text-white shadow-lg shadow-blue-900/20 font-medium'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-[#1C212E]'
                                        }`}
                                    style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }}
                                >
                                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${selectedBoardId === board.id ? 'text-white' : 'text-gray-500'}`} />
                                    <span className="text-sm truncate">{board.name}</span>
                                </div>
                            );
                        })}
                        {childFolders.length === 0 && childBoards.length === 0 && (
                            <div className="pl-4 py-1 text-gray-600 text-[11px] italic" style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }}>Empty</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- File Preview Component ---
const FilePreviewer = ({ url, name }: { url: string, name: string }) => {
    const [error, setError] = useState(false);

    if (error) {
        return (
            <div className="text-center text-gray-400">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 opacity-50 text-red-400" />
                </div>
                <p className="text-lg font-medium text-white mb-2">Preview Unavailable</p>
                <p className="text-sm max-w-xs mx-auto mb-6">This file type ({url.split('.').pop()}) cannot be played in the browser.</p>
                <a href={url} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-2 bg-custom-bright hover:brightness-110 rounded-lg text-white text-sm font-bold transition-all shadow-lg shadow-custom-bright/20">
                    <Download className="w-4 h-4" /> Download to View
                </a>
            </div>
        );
    }

    if (url.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?|$)/i)) {
        return <img src={url} onError={() => setError(true)} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Preview" />;
    }
    if (url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) {
        return <video src={url} controls autoPlay onError={() => setError(true)} className="max-w-full max-h-full rounded-lg shadow-2xl outline-none" />;
    }
    if (url.match(/\.pdf(\?|$)/i)) {
        return <iframe src={url} className="w-full h-full rounded-lg shadow-2xl bg-white" title="PDF Preview" onError={() => setError(true)} />;
    }

    // Default Fallback
    return (
        <div className="text-center text-gray-400">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <FileText className="w-10 h-10 opacity-50" />
            </div>
            <p className="text-lg font-medium text-white mb-2">No Preview Available</p>
            <p className="text-sm mb-6">Please download the file to view it.</p>
            <a href={url} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors">
                <Download className="w-4 h-4" /> Download
            </a>
        </div>
    );
};

// --- Board Cell Component ---
const BoardCell = ({ item, column, boardId, onUpdate, onPreview }: { item: any, column: any, boardId: string, onUpdate: () => void, onPreview: (url: string, name: string) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Find value for this column
    const colValueObj = item.column_values.find((v: any) => v.id === column.id);
    let displayValue = colValueObj ? (colValueObj.text || '') : '';

    // Robust Parsing for Complex Types
    let linkUrl = null;
    let fileName = null;

    if (colValueObj && colValueObj.value) {
        try {
            const val = JSON.parse(colValueObj.value);
            // Link
            if (column.type === 'link') {
                linkUrl = val.url;
                displayValue = val.text || val.url || displayValue;
            }
            // Date
            if (column.type === 'date') {
                displayValue = val.date || displayValue;
            }
            // Email
            if (column.type === 'email') {
                displayValue = val.email || displayValue;
            }
            // File
            if (column.type === 'file') {
                if (val.files && val.files.length > 0) {
                    linkUrl = val.files[0].public_url || val.files[0].url || val.files[0].urlThumbnail;
                    fileName = val.files[0].name;
                }
            }
        } catch (e) {
            // value might not be JSON, ignore
        }
    }

    // Special handling if displayValue (text) is actually a raw URL for files (User Screenshot Case)
    if (column.type === 'file' && !linkUrl && displayValue.startsWith('http')) {
        linkUrl = displayValue;
        // Try to extract filename from URL
        try {
            fileName = decodeURIComponent(displayValue.split('/').pop() || 'File');
        } catch (e) {
            fileName = "Attachment";
        }
    }
    if (fileName) displayValue = fileName; // Override ugly URL text with filename


    // Parse column settings for Status/Dropdown
    let options = [];
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

        setIsLoading(true);
        try {
            await updateItemValue(boardId, item.id, column.id, newValue);
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

    // Status / Dropdown Rendering
    if (column.type === 'color' || column.type === 'status') {
        const currentOption = options.find(o => o.label === displayValue);

        if (isEditing) {
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
                onClick={() => setIsEditing(true)}
                className="px-4 py-1.5 rounded-full text-white text-[11px] font-bold text-center min-w-[90px] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-black/20"
                style={currentOption && currentOption.label ? { backgroundColor: currentOption.color || '#7c3aed' } : { backgroundColor: '#2d2d3d', color: '#9ca3af' }}
            >
                {displayValue || '-'}
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

    // File Rendering
    if (column.type === 'file' && linkUrl) {
        return (
            <button
                onClick={() => onPreview(linkUrl!, displayValue)}
                className="flex items-center gap-2 py-1 px-2 rounded-lg bg-[#0073ea]/10 border border-[#0073ea]/20 hover:bg-[#0073ea]/20 text-[#0073ea] transition-all group max-w-full text-left"
                title={displayValue}
            >
                <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-[11px] font-medium truncate group-hover:underline decoration-current">
                    {displayValue}
                </span>
            </button>
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

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');

    // Data State
    const [boards, setBoards] = useState<any[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null); // null = Main Workspace
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
    const [boardData, setBoardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // File Preview State
    const [previewFile, setPreviewFile] = useState<{ url: string, name: string } | null>(null);

    // Create Modal State
    const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    // Collapsed Groups State
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const handleLogout = () => {
        navigate('/');
    };

    useEffect(() => {
        refreshBoardsAndFolders();
    }, []);

    const refreshBoardsAndFolders = async () => {
        setLoading(true);
        try {
            const [boardsData, foldersData, workspacesData] = await Promise.all([
                getAllBoards(),
                getAllFolders(),
                getAllWorkspaces()
            ]);
            setBoards(boardsData || []);
            setFolders(foldersData || []);
            setWorkspaces(workspacesData || []);
            // Auto-select first workspace to ensure data visibility
            if (workspacesData && workspacesData.length > 0) {
                setSelectedWorkspaceId(workspacesData[0].id);
            }
        } catch (error) {
            console.error("Failed to load initial data", error);
        } finally {
            setLoading(false);
        }
    };

    const refreshBoardDetails = (id: string, silent = false) => {
        if (!silent) setLoading(true);
        getBoardItems(id).then(data => {
            setBoardData(data);
            if (!silent) setLoading(false);
        }).catch(err => { console.error(err); if (!silent) setLoading(false); });
    };

    useEffect(() => {
        if (selectedBoardId) {
            refreshBoardDetails(selectedBoardId);
        } else {
            setBoardData(null);
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
            refreshBoardDetails(selectedBoardId);
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
                            <div className="text-[9px] text-custom-bright font-bold uppercase tracking-widest">Admin Console</div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-1">
                        <SidebarItem icon={<LayoutDashboard className="w-5 h-5" />} label="Overview" active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
                        <SidebarItem icon={<AlignLeft className="w-5 h-5" />} label="Boards" active={activeTab === 'Boards'} onClick={() => setActiveTab('Boards')} />
                        <SidebarItem icon={<Briefcase className="w-5 h-5" />} label="Projects" active={activeTab === 'Projects'} onClick={() => setActiveTab('Projects')} />
                        <SidebarItem icon={<Activity className="w-5 h-5" />} label="Analytics" active={activeTab === 'Analytics'} onClick={() => setActiveTab('Analytics')} />
                        <SidebarItem icon={<Users className="w-5 h-5" />} label="Team" active={activeTab === 'Team'} onClick={() => setActiveTab('Team')} />
                        <SidebarItem icon={<Settings className="w-5 h-5" />} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
                    </div>

                    <div className="pt-6 border-t border-white/5">
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
                                    <StatCard title="Total Views" value="124.5K" change="+12.5%" icon={<Eye className="w-5 h-5 text-blue-400" />} delay={0.1} />
                                    <StatCard title="Active Projects" value="14" change="+4" icon={<Briefcase className="w-5 h-5 text-purple-400" />} delay={0.2} />
                                    <StatCard title="Conversion Rate" value="3.2%" change="+0.8%" icon={<TrendingUp className="w-5 h-5 text-green-400" />} delay={0.3} />
                                    <StatCard title="System Status" value="99.9%" change="Stable" icon={<Activity className="w-5 h-5 text-custom-bright" />} delay={0.4} />
                                </div>
                                {/* ... other overview content ... */}
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

                                            // Identify Root Items (Robust String Matching)
                                            const childIds = new Set();
                                            visibleFolders.forEach(f => {
                                                if (f.children) {
                                                    f.children.forEach((c: any) => childIds.add(String(c.id)));
                                                }
                                            });

                                            // Custom Sort Logic based on Screenshot
                                            const FOLDER_ORDER = ["Hiring and Onboarding", "Management", "Editors", "Clients", "Old"];
                                            const getSortWeight = (name: string) => {
                                                const index = FOLDER_ORDER.findIndex(n => name.includes(n));
                                                return index === -1 ? 999 : index;
                                            };

                                            const rootFolders = visibleFolders
                                                .filter(f => !childIds.has(String(f.id)))
                                                .sort((a, b) => getSortWeight(a.name) - getSortWeight(b.name));

                                            // Boards A-Z fallback or manual logic if needed
                                            const rootBoards = visibleBoards
                                                .filter(b => !childIds.has(String(b.id)))
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
                                                    {rootBoards.map(board => (
                                                        <div
                                                            key={board.id}
                                                            onClick={() => setSelectedBoardId(board.id)}
                                                            className={`flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md cursor-pointer transition-all mb-0.5 ${selectedBoardId === board.id
                                                                ? 'bg-[#0073ea] text-white shadow-lg shadow-blue-900/20 font-medium'
                                                                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1C212E]'
                                                                }`}
                                                        >
                                                            <Table className={`w-3.5 h-3.5 flex-shrink-0 ${selectedBoardId === board.id ? 'text-white' : 'text-gray-500'}`} />
                                                            <span className="text-[13px] truncate">{board.name}</span>
                                                        </div>
                                                    ))}

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

                                                    {/* Groups */}
                                                    {boardData.groups?.map((group: any) => {
                                                        const groupItems = boardData.items?.filter((item: any) => item.group?.id === group.id) || [];
                                                        const isCollapsed = collapsedGroups.has(group.id);

                                                        return (
                                                            <motion.div
                                                                key={group.id}
                                                                className="rounded-[2rem] bg-black/20 border border-white/5 backdrop-blur-xl overflow-hidden"
                                                            >
                                                                <div
                                                                    className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-colors"
                                                                    onClick={() => toggleGroup(group.id)}
                                                                >
                                                                    <div className={`transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                                                                        <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]`} style={{ borderTopColor: group.color || '#fff' }} />
                                                                    </div>
                                                                    <h3 className="text-lg font-bold text-white tracking-wide" style={{ color: group.color || '#fff' }}>{group.title}</h3>
                                                                </div>

                                                                {!isCollapsed && (
                                                                    <div className="p-6 grid grid-cols-1 gap-4">
                                                                        {groupItems.map((item: any) => (
                                                                            <motion.div
                                                                                key={item.id}
                                                                                initial={{ opacity: 0, y: 10 }}
                                                                                animate={{ opacity: 1, y: 0 }}
                                                                                className="group relative"
                                                                            >
                                                                                <div className="absolute inset-0 bg-gradient-to-r from-custom-blue/10 to-custom-purple/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                                                <div className="relative p-6 rounded-2xl bg-[#0A0A16] border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all w-full">
                                                                                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/5">
                                                                                        <div className={`w-1.5 h-12 rounded-full`} style={{ backgroundColor: group.color || '#7c3aed' }} />
                                                                                        <div>
                                                                                            <h4 className="text-lg font-bold text-white tracking-tight">{item.name}</h4>
                                                                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mt-1">ID: {item.id}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                                                        {boardData.columns?.map((col: any) => (
                                                                                            <div key={col.id} className="flex flex-col gap-2">
                                                                                                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{col.title}</span>
                                                                                                <div className="bg-black/20 rounded-lg p-2 border border-white/5 min-h-[40px] flex items-center">
                                                                                                    <BoardCell
                                                                                                        item={item}
                                                                                                        column={col}
                                                                                                        boardId={selectedBoardId}
                                                                                                        onUpdate={() => refreshBoardDetails(selectedBoardId!, true)}
                                                                                                        onPreview={(url, name) => setPreviewFile({ url, name })}
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </motion.div>
                                                                        ))}
                                                                        {groupItems.length === 0 && <div className="text-center text-gray-500 italic py-8">No items in this group</div>}
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        );
                                                    })}
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
                                    <h3 className="text-white font-bold text-lg truncate max-w-md">{previewFile.name}</h3>
                                </div>
                                <a
                                    href={previewFile.url}
                                    target="_blank"
                                    download
                                    className="flex items-center gap-2 px-4 py-2 bg-custom-bright text-white rounded-lg hover:brightness-110 font-bold text-sm transition-all shadow-lg shadow-custom-bright/20"
                                >
                                    <Download className="w-4 h-4" /> Download Original
                                </a>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 bg-black/50 relative flex items-center justify-center p-4 overflow-hidden">
                                <FilePreviewer url={previewFile.url} name={previewFile.name} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </BackgroundLayout>
    );
}
