import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PortalLayout } from '../components/shared/PortalLayout';
import { BoardCell } from '../components/shared/BoardCell';
import { SidebarItem } from '../components/shared/SidebarItem';
import { MondayMediaLoader } from '../components/shared/MondayMediaLoader';
import {
    Loader2,
    LayoutDashboard,
    Table,
    ChevronDown,
    FileText,
    LayoutGrid,
    Clock,
    PlayCircle,
    LogOut,
    Briefcase,
    X,
    Download,
    Link as LinkIcon,
    ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    getAllBoards, getAllFolders, getAllWorkspaces,
    prefetchBoardItems
} from '../services/mondayService';
import { supabase } from '../services/boardsService';
import { useVisibilityPolling, useBoardItems } from '../hooks/useMondayData';
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

function RecentProjectCard({
    item,
    boardData,
    selectedBoardId,
    refreshBoardItems,
    setPreviewFile,
    onNext,
    onPrev,
    hasNext,
    hasPrev,
    currentIndex,
    totalCount
}: {
    item: any,
    boardData: any,
    selectedBoardId: string | null,
    refreshBoardItems: (bg?: boolean) => void,
    setPreviewFile: (f: any) => void,
    onNext: () => void,
    onPrev: () => void,
    hasNext: boolean,
    hasPrev: boolean,
    currentIndex: number,
    totalCount: number
}) {
    const assetData = useMemo(() => {
        if (!item) return { coverAsset: null };

        let coverAsset = null;

        // 1. Try to find "Submission Preview" column first
        const submissionCol = boardData.columns?.find((c: any) => c.title.toLowerCase().includes('submission') && c.title.toLowerCase().includes('preview'));
        if (submissionCol) {
            const valObj = item.column_values?.find((v: any) => v.id === submissionCol.id);
            if (valObj) {
                // A. Try JSON Content (Link or File columns)
                if (valObj.value) {
                    try {
                        const val = JSON.parse(valObj.value);
                        // Link Column Type
                        if (val.url) {
                            const url = val.url;
                            const isVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url);
                            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);
                            let finalType = 'external_link';
                            if (isVideo) finalType = 'video';
                            else if (isImage) finalType = 'image';
                            coverAsset = { url, type: finalType, name: val.text };
                        }
                        // File Column Type
                        else if (val.files && val.files.length > 0) {
                            const f = val.files[0];
                            const url = f.public_url || f.url || f.thumbnail_url;
                            const isVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(f.name);
                            // Determine Asset ID (files often use 'id' or 'assetId')
                            const assetId = f.assetId || f.id;
                            if (url) {
                                coverAsset = { url, type: isVideo ? 'video' : 'image', name: f.name, assetId };
                                console.log("Found Submission Preview File:", { name: f.name, assetId, url });
                            }
                        }
                    } catch (e) { }
                }
                // B. Try Text Value (Raw Link) if JSON failed
                if (!coverAsset && (valObj.text || valObj.display_value)) {
                    const rawText = (valObj.text || valObj.display_value || '').trim();
                    if (rawText.startsWith('http')) {
                        const isVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(rawText);
                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(rawText);
                        let finalType = 'external_link';
                        if (isVideo) finalType = 'video';
                        else if (isImage) finalType = 'image';
                        coverAsset = { url: rawText, type: finalType, name: 'Submission' };
                    }
                }
            }
        }

        // 2. Fallback to any file column
        if (!coverAsset) {
            const fileCols = boardData.columns?.filter((c: any) => c.type === 'file' && c.id !== submissionCol?.id) || [];
            for (const col of fileCols) {
                const valObj = item.column_values?.find((v: any) => v.id === col.id);
                if (valObj && valObj.value) {
                    try {
                        const val = JSON.parse(valObj.value);
                        if (val.files && val.files.length > 0) {
                            const f = val.files[0];
                            const url = f.public_url || f.url || f.thumbnail_url;
                            const isVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(f.name);
                            const assetId = f.assetId || f.id;
                            if (url) {
                                coverAsset = { url, type: isVideo ? 'video' : 'image', name: f.name, assetId };
                                if (isVideo) break;
                            }
                        }
                    } catch (e) { }
                }
            }
        }

        // 3. Fallback: URL Regex Extraction (if we have a URL but no assetId)
        if (coverAsset && !coverAsset.assetId && coverAsset.url) {
            // Typical Monday Patterns: 
            // .../resources/12345/filename.mp4
            // .../assets/12345
            const resourceMatch = coverAsset.url.match(/\/resources\/(\d+)\//);
            const assetMatch = coverAsset.url.match(/\/assets\/(\d+)/);
            if (resourceMatch && resourceMatch[1]) {
                coverAsset.assetId = resourceMatch[1];
                console.log("Extracted ID from Resource URL:", coverAsset.assetId);
            } else if (assetMatch && assetMatch[1]) {
                coverAsset.assetId = assetMatch[1];
                console.log("Extracted ID from Asset URL:", coverAsset.assetId);
            }
        }
        return { coverAsset };
    }, [item, boardData]);

    const { coverAsset } = assetData || {};

    return (
        <div className="space-y-8">
            {/* Navigation Bar */}
            <div className="flex items-center justify-between bg-[#0e0e1a] p-4 rounded-2xl border border-white/5 shadow-lg">
                <button
                    disabled={!hasPrev}
                    onClick={onPrev}
                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/20 flex items-center gap-3 transition-all text-xs font-bold uppercase tracking-wider group"
                >
                    <ChevronDown className="w-4 h-4 rotate-90 group-hover:-translate-x-1 transition-transform" /> Newer Project
                </button>

                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1">Project Timeline</span>
                    <div className="text-sm font-mono text-white flex items-center gap-3 bg-black/20 px-4 py-1.5 rounded-full border border-white/5">
                        <span className="text-gray-500">#</span>
                        <span className="text-emerald-400 font-bold text-lg">{currentIndex + 1}</span>
                        <span className="text-gray-600 text-xs">of</span>
                        <span className="text-white font-bold">{totalCount}</span>
                    </div>
                </div>

                <button
                    disabled={!hasNext}
                    onClick={onNext}
                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/20 flex items-center gap-3 transition-all text-xs font-bold uppercase tracking-wider group"
                >
                    Older Project <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Featured Project Card (Split View) */}
            <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative rounded-[2.5rem] bg-[#0e0e1a] border border-white/5 shadow-2xl overflow-hidden"
            >
                <div className="grid grid-cols-1 xl:grid-cols-12 min-h-[600px]">
                    {/* Left: Media Preview Area (7 cols) */}
                    <div className="xl:col-span-7 bg-black/40 relative group overflow-hidden border-r border-white/5">
                        {coverAsset ? (
                            coverAsset.type === 'external_link' ? (
                                // External Link Card
                                <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-[#070710]">
                                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                                        <LinkIcon className="w-10 h-10 text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">External Submission Link</h3>
                                    <p className="text-gray-400 text-sm mb-8 max-w-sm">This project has a submission link that opens in a new tab.</p>
                                    <a
                                        href={coverAsset.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-3 transform hover:scale-105"
                                    >
                                        Open Submission <ArrowUpRight className="w-4 h-4" />
                                    </a>
                                </div>
                            ) : (
                                // Video / Image Loader
                                <div className="w-full h-full p-40">
                                    <MondayMediaLoader
                                        url={coverAsset.url}
                                        name={coverAsset.name}
                                        assetId={coverAsset.assetId}
                                        type={coverAsset.type as any}
                                        className=""
                                    />
                                </div>
                            )
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-12 text-gray-600 space-y-4">
                                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                                    <Briefcase className="w-10 h-10 opacity-20" />
                                </div>
                                <p className="text-sm font-medium uppercase tracking-widest text-gray-700">No Preview Available</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Details & Status (5 cols) */}
                    <div className="xl:col-span-5 p-8 flex flex-col h-full bg-[#0e0e1a]">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Active Project</span>
                            </div>
                            <h2 className="text-3xl font-black text-white leading-tight mb-2">{item.name}</h2>
                            <p className="text-sm text-gray-500 font-medium">Project ID: #{item.id}</p>
                        </div>

                        {/* Status Grid */}
                        <div className="flex-1 space-y-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <LayoutDashboard className="w-3 h-3" /> Project Details
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {boardData.columns?.filter((col: any) => col.type !== 'name' && !col.title.toLowerCase().includes('submission preview') && !col.title.startsWith('C-F-')).map((col: any) => (
                                    <div key={col.id} className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold group-hover:text-emerald-400 transition-colors">{col.title}</span>
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
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Footer */}
                        <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                                Last updated: <span className="text-gray-300">{new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}



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

    // Collapsed Groups State
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    // Fulfillment View Toggle State
    const [fulfillmentViewMode, setFulfillmentViewMode] = useState<'recent' | 'overview'>('recent');
    // Carousel Index for "Recent" view in Fulfillment (iterating sorted list)
    const [fulfillmentRecentIndex, setFulfillmentRecentIndex] = useState(0);
    const [fulfillmentMonthFilter, setFulfillmentMonthFilter] = useState<string>('All');
    const [isMonthFilterOpen, setIsMonthFilterOpen] = useState(false);

    const toggleGroup = (groupId: string) => {
        const newCollapsed = new Set(collapsedGroups);
        if (newCollapsed.has(groupId)) {
            newCollapsed.delete(groupId);
        } else {
            newCollapsed.add(groupId);
        }
        setCollapsedGroups(newCollapsed);
    };




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
                }, () => setCheckingPermissions(false));
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



    async function refreshBoardsAndFolders(background = false) {
        if (!background) setLoading(true);
        try {
            const [boardsData] = await Promise.all([
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
            setBoards(filteredBoards);
            // setFolders & setWorkspaces logic removed


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

        } catch (error) {
            console.error("Failed to load initial data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedBoardId) {
            setFulfillmentMonthFilter('All'); // Reset Filter
            refreshBoardItems();
            refreshBoardsAndFolders(true); // Background Refresh Global Data
        }
    }, [selectedBoardId]);





    return (
        <PortalLayout
            userProfile={
                <div className="text-[9px] text-custom-bright font-bold uppercase tracking-widest pl-11 -mt-6">
                    Client Portal
                </div>
            }
            sidebarContent={
                <>
                    <div className="px-4 mb-4 flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Projects</span>
                    </div>

                    <div className="space-y-0.5">
                        {boards.map((board: any) => {
                            const Icon = getBoardIcon(board.name);
                            return (
                                <SidebarItem
                                    key={board.id}
                                    label={board.name}
                                    active={selectedBoardId === board.id}
                                    onClick={() => {
                                        setSelectedBoardId(board.id);
                                        setActiveTab('Boards');
                                    }}
                                    icon={<Icon className="w-4 h-4" />}
                                />
                            );
                        })}
                        {boards.length === 0 && (
                            <div className="px-8 py-2 text-xs text-gray-600 italic">No active boards</div>
                        )}
                    </div>
                </>
            }
            sidebarFooter={
                <div className="pt-4 border-t border-white/5">
                    {currentUserName && (
                        <div className="px-2 py-2 mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-custom-bright/10 flex items-center justify-center text-custom-bright font-bold text-xs ring-1 ring-custom-bright/20">
                                    {currentUserName.charAt(0)}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="text-white text-xs font-bold truncate">{currentUserName}</div>
                                    <div className="text-[10px] text-gray-500 capitalize">Client Account</div>
                                </div>
                            </div>
                        </div>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-gray-400 transition-colors group">
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Log Out</span>
                    </button>
                </div>
            }
            mainContent={
                <>
                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden flex flex-col relative z-20">

                        {/* Tab Content */}
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
                                                                        <RecentProjectCard
                                                                            item={currentItem}
                                                                            boardData={boardData}
                                                                            selectedBoardId={selectedBoardId}
                                                                            refreshBoardItems={refreshBoardItems}
                                                                            setPreviewFile={setPreviewFile}
                                                                            onNext={() => setFulfillmentRecentIndex(prev => Math.min(sortedItems.length - 1, prev + 1))}
                                                                            onPrev={() => setFulfillmentRecentIndex(prev => Math.max(0, prev - 1))}
                                                                            hasNext={hasNext}
                                                                            hasPrev={hasPrev}
                                                                            currentIndex={fulfillmentRecentIndex}
                                                                            totalCount={sortedItems.length}
                                                                        />
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
                                                                            <div className="space-y-12">
                                                                                {(() => {
                                                                                    // Group items by Month
                                                                                    const monthGroups: Record<string, any[]> = {};
                                                                                    const allItems = boardData.items || [];

                                                                                    allItems.forEach((item: any) => {
                                                                                        if (!item.created_at) return;
                                                                                        const date = new Date(item.created_at);
                                                                                        if (isNaN(date.getTime())) return;
                                                                                        const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                                                                                        if (!monthGroups[monthKey]) monthGroups[monthKey] = [];
                                                                                        monthGroups[monthKey].push(item);
                                                                                    });

                                                                                    // Sort months (newest first)
                                                                                    const sortedMonths = Object.keys(monthGroups).sort((a, b) => {
                                                                                        const dateA = new Date(a);
                                                                                        const dateB = new Date(b);
                                                                                        return dateB.getTime() - dateA.getTime();
                                                                                    });

                                                                                    if (sortedMonths.length === 0) return <div className="text-center text-gray-500 italic py-12">No projects found</div>;

                                                                                    return sortedMonths.map((month) => (
                                                                                        <div key={month} className="relative">
                                                                                            <div className="flex items-center gap-4 mb-6 sticky top-0 bg-[#070710]/80 backdrop-blur-md py-4 z-20 border-b border-white/5">
                                                                                                <div className="h-8 w-1 bg-gradient-to-b from-emerald-500 to-emerald-700 rounded-full" />
                                                                                                <h3 className="text-2xl font-bold text-white tracking-tight">{month}</h3>
                                                                                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 font-mono">
                                                                                                    {monthGroups[month].length} {monthGroups[month].length === 1 ? 'Project' : 'Projects'}
                                                                                                </span>
                                                                                            </div>

                                                                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                                                                {monthGroups[month].map((item: any) => {
                                                                                                    const group = item.group; // Access group from item

                                                                                                    // Find cover for card
                                                                                                    let cardCover = null;

                                                                                                    // 1. Try "Submission Preview" first
                                                                                                    const submissionCol = boardData.columns?.find((c: any) => c.title.toLowerCase().includes('submission') && c.title.toLowerCase().includes('preview'));
                                                                                                    if (submissionCol) {
                                                                                                        const valObj = item.column_values?.find((v: any) => v.id === submissionCol.id);
                                                                                                        if (valObj) {
                                                                                                            if (valObj.value) {
                                                                                                                try {
                                                                                                                    const val = JSON.parse(valObj.value);
                                                                                                                    // Link Column Type
                                                                                                                    if (val.url) {
                                                                                                                        const url = val.url;
                                                                                                                        const isVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url);
                                                                                                                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);
                                                                                                                        let finalType = 'external_link';
                                                                                                                        if (isVideo) finalType = 'video';
                                                                                                                        else if (isImage) finalType = 'image';
                                                                                                                        cardCover = { url, type: finalType, name: val.text || 'Submission', assetId: undefined };
                                                                                                                    }
                                                                                                                    // File Column Type
                                                                                                                    else if (val.files && val.files.length > 0) {
                                                                                                                        const f = val.files[0];
                                                                                                                        const url = f.public_url || f.url || f.thumbnail_url;
                                                                                                                        const isVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(f.name);
                                                                                                                        const assetId = f.assetId || f.id;
                                                                                                                        if (url) cardCover = { url, type: isVideo ? 'video' : 'image', name: f.name, assetId };
                                                                                                                    }
                                                                                                                } catch (e) { }
                                                                                                            }
                                                                                                            // Text / Raw URL Fallback
                                                                                                            if (!cardCover && (valObj.text || valObj.display_value)) {
                                                                                                                const rawText = (valObj.text || valObj.display_value || '').trim();
                                                                                                                if (rawText.startsWith('http')) {
                                                                                                                    const isVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(rawText);
                                                                                                                    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(rawText);
                                                                                                                    let finalType = 'external_link';
                                                                                                                    if (isVideo) finalType = 'video';
                                                                                                                    else if (isImage) finalType = 'image';
                                                                                                                    cardCover = { url: rawText, type: finalType, name: 'Submission' };
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }

                                                                                                    // 2. Fallback to normal file columns
                                                                                                    if (!cardCover) {
                                                                                                        const fCols = boardData.columns?.filter((c: any) => c.type === 'file' && c.id !== submissionCol?.id) || [];
                                                                                                        for (const col of fCols) {
                                                                                                            const valObj = item.column_values?.find((v: any) => v.id === col.id);
                                                                                                            if (valObj && valObj.value) {
                                                                                                                try {
                                                                                                                    const val = JSON.parse(valObj.value);
                                                                                                                    if (val.files && val.files.length > 0) {
                                                                                                                        const f = val.files[0];
                                                                                                                        const url = f.public_url || f.url || f.thumbnail_url;
                                                                                                                        const isVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(f.name);
                                                                                                                        const assetId = f.assetId || f.id;
                                                                                                                        if (url) {
                                                                                                                            cardCover = { url, type: isVideo ? 'video' : 'image', name: f.name, assetId };
                                                                                                                            break; // Take first file found
                                                                                                                        }
                                                                                                                    }
                                                                                                                } catch (e) { }
                                                                                                            }
                                                                                                        }
                                                                                                    }

                                                                                                    // 3. Regex Fallback for Asset ID
                                                                                                    if (cardCover && !cardCover.assetId && cardCover.url) {
                                                                                                        const resourceMatch = cardCover.url.match(/\/resources\/(\d+)\//);
                                                                                                        const assetMatch = cardCover.url.match(/\/assets\/(\d+)/);
                                                                                                        if (resourceMatch && resourceMatch[1]) cardCover.assetId = resourceMatch[1];
                                                                                                        else if (assetMatch && assetMatch[1]) cardCover.assetId = assetMatch[1];
                                                                                                    }

                                                                                                    return (
                                                                                                        <motion.div
                                                                                                            key={item.id}
                                                                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                                                                            animate={{ opacity: 1, scale: 1 }}
                                                                                                            whileHover={{ y: -8 }}
                                                                                                            onClick={() => {
                                                                                                                if (cardCover?.url) {
                                                                                                                    setPreviewFile({
                                                                                                                        url: cardCover.url,
                                                                                                                        name: cardCover.name,
                                                                                                                        assetId: cardCover.assetId
                                                                                                                    });
                                                                                                                }
                                                                                                            }}
                                                                                                            className={`group relative flex flex-col h-full ${cardCover ? 'cursor-pointer' : ''}`}
                                                                                                        >
                                                                                                            <div className="absolute inset-0 bg-white/5 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

                                                                                                            <div className="relative flex flex-col h-full bg-[#0e0e1a] border border-white/5 rounded-[2rem] overflow-hidden hover:border-white/10 transition-all shadow-xl hover:shadow-2xl">
                                                                                                                {/* Card Preview Area */}
                                                                                                                <div className="aspect-video w-full bg-black/40 relative border-b border-white/5 group-hover:border-white/10 transition-colors overflow-hidden">
                                                                                                                    {cardCover ? (
                                                                                                                        cardCover.type === 'video' ? (
                                                                                                                            <div className="w-full h-full relative group/media">
                                                                                                                                <video
                                                                                                                                    src={cardCover.url}
                                                                                                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                                                                                                    muted
                                                                                                                                    playsInline
                                                                                                                                    onMouseOver={e => e.currentTarget.play().catch(() => { })}
                                                                                                                                    onMouseOut={e => {
                                                                                                                                        e.currentTarget.pause();
                                                                                                                                        e.currentTarget.currentTime = 0;
                                                                                                                                    }}
                                                                                                                                />
                                                                                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover/media:opacity-0 transition-opacity">
                                                                                                                                    <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center border border-white/20">
                                                                                                                                        <PlayCircle className="w-5 h-5 text-white" />
                                                                                                                                    </div>
                                                                                                                                </div>
                                                                                                                            </div>
                                                                                                                        ) : cardCover.type === 'image' ? (
                                                                                                                            <img src={cardCover.url} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                                                                                        ) : (
                                                                                                                            // Card External Link View
                                                                                                                            <div className="w-full h-full flex flex-col items-center justify-center bg-[#070710] group-hover:bg-[#0a0a16] transition-colors relative">
                                                                                                                                <LinkIcon className="w-8 h-8 text-emerald-400 mb-2" />
                                                                                                                                <span className="text-[10px] uppercase text-emerald-400/80 font-bold tracking-widest">External Link</span>
                                                                                                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm bg-black/20">
                                                                                                                                    <ArrowUpRight className="w-6 h-6 text-white" />
                                                                                                                                </div>
                                                                                                                            </div>
                                                                                                                        )
                                                                                                                    ) : (
                                                                                                                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#070710]">
                                                                                                                            <Briefcase className="w-8 h-8 text-gray-700 mb-2" />
                                                                                                                            <span className="text-[10px] uppercase text-gray-700 font-bold tracking-widest">No Preview</span>
                                                                                                                        </div>
                                                                                                                    )}

                                                                                                                    {/* Status Badge Overlay */}
                                                                                                                    {group && (
                                                                                                                        <div className="absolute top-4 right-4 z-10">
                                                                                                                            <span className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white shadow-lg" style={{ color: group.color }}>
                                                                                                                                {group.title}
                                                                                                                            </span>
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </div>

                                                                                                                {/* Card Content */}
                                                                                                                <div className="p-6 flex flex-col flex-1 gap-4">
                                                                                                                    <div className="flex justify-between items-start gap-3">
                                                                                                                        <h4 className="text-lg font-bold text-white leading-tight line-clamp-2 group-hover:text-emerald-400 transition-colors">{item.name}</h4>
                                                                                                                    </div>

                                                                                                                    <div className="w-full h-[1px] bg-white/5" />

                                                                                                                    <div className="space-y-3 mt-auto">
                                                                                                                        {boardData.columns?.filter((c: any) => (c.title.toLowerCase().includes('status') || c.type === 'file') && !c.title.toLowerCase().includes('submission preview')).map((col: any) => (
                                                                                                                            <div key={col.id} className="grid grid-cols-[80px_1fr] items-center gap-2">
                                                                                                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold truncate">{col.title}</span>
                                                                                                                                <div className="min-h-[24px]">
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
                                                                                                            </div>
                                                                                                        </motion.div>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                        </div>
                                                                                    ));
                                                                                })()}
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
                                        <MondayMediaLoader
                                            url={previewFile?.url || ''}
                                            name={previewFile?.name || ''}
                                            assetId={previewFile?.assetId}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </>
            }
        />
    );
}
