import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PortalLayout } from '../components/shared/PortalLayout';
import { BoardCell } from '../components/shared/BoardCell';
import { SidebarItem } from '../components/shared/SidebarItem';

import { FilePreviewer } from '../components/ui/FilePreviewModal';
import {
    Loader2,
    X,
    LayoutDashboard,

    Briefcase,
    Table,
    ChevronDown,
    FileText,
    Download,
    LayoutGrid,
    Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    getAllBoards, getAllFolders, getBoardItems, getAllWorkspaces,
    getAssetPublicUrl,
    prefetchBoardItems
} from '../services/mondayService';
import { supabase } from '../services/boardsService';
import { useVisibilityPolling } from '../hooks/useMondayData';
import { GlobalCycleView } from '../components/views/GlobalCycleView';
// User management Removed

// --- Helpers ---
// (Updated)
const getBoardIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('dashboard')) return LayoutDashboard;
    if (n.includes('form')) return FileText;
    return Table;
};


export default function EditorPortal() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'Boards' | 'Projects' | 'Analytics'>('Boards');

    // Current logged-in user info (from localStorage)
    const currentUserRole = localStorage.getItem('portal_user_role') || 'client';
    const currentUserName = localStorage.getItem('portal_user_name') || '';

    // Strict Role Check
    useEffect(() => {
        const role = localStorage.getItem('portal_user_role');
        if (role !== 'editor') {
            // Allow admins to view client portal? Maybe not for strict separation.
            // If I am admin I should be in admin portal.
            navigate('/portal');
        }
    }, []);

    // Data State
    const [boards, setBoards] = useState<any[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
    const [boardData, setBoardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState<{ url: string, name: string, assetId?: string } | null>(null);
    // User Permissions State
    const [currentUserAllowedBoards, setCurrentUserAllowedBoards] = useState<string[]>([]);
    const [currentUserWorkspaceId, setCurrentUserWorkspaceId] = useState<string | null>(null);



    // Create Modal State REMOVED

    // Overview Stats State
    // Fulfillment View Toggle State
    const [fulfillmentViewMode, setFulfillmentViewMode] = useState<'recent' | 'overview'>('recent');

    // Carousel Index for "Recent" view in Fulfillment (iterating sorted list)
    const [fulfillmentRecentIndex, setFulfillmentRecentIndex] = useState(0);
    const [fulfillmentMonthFilter, setFulfillmentMonthFilter] = useState<string>('All');
    const [isMonthFilterOpen, setIsMonthFilterOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('portal_user_email');
        localStorage.removeItem('portal_user_role');
        localStorage.removeItem('portal_user_name');
        localStorage.removeItem('portal_user_workspace');
        navigate('/portal');
    };



    const [checkingPermissions, setCheckingPermissions] = useState(true);

    useEffect(() => {
        const fetchPermissions = async () => {
            // Fetch User Permissions on Mount
            const email = localStorage.getItem('portal_user_email');
            if (email) {
                try {
                    const { data } = await supabase
                        .from('users')
                        .select('allowed_board_ids, workspace_id')
                        .eq('email', email)
                        .single();

                    if (data) {
                        setCurrentUserAllowedBoards(data.allowed_board_ids || []);
                        setCurrentUserWorkspaceId(data.workspace_id || null);
                    }
                } catch {
                    // Ignore errors
                }
            }
            setCheckingPermissions(false);
        };
        fetchPermissions();
    }, []);

    // Memoized refresh function for visibility-based polling
    const stableAllowedBoards = useMemo(() => currentUserAllowedBoards, [JSON.stringify(currentUserAllowedBoards)]);




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
            const [boardsData] = await Promise.all([
                getAllBoards(),
                getAllFolders(),
                getAllWorkspaces()
            ]);
            // Apply role-based
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
            setFulfillmentMonthFilter('All'); // Reset Filter
            refreshBoardDetails(selectedBoardId);
            refreshBoardsAndFolders(true); // Background Refresh Global Data
        } else {
            setBoardData(null);
        }
    }, [selectedBoardId]);





    return (
        <PortalLayout
            userProfile={
                <div className="text-[9px] text-custom-bright font-bold uppercase tracking-widest pl-11 -mt-6">
                    Editor Portal
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
                                    isClientItem={true}
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
                <div className="p-4 border-t border-white/5">
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
            }
            mainContent={
                <>
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
                                                                                        {boardData.columns?.filter((col: any) => col.type !== 'name' && !col.title.startsWith('C-F-')).map((col: any) => (
                                                                                            <div key={col.id} className="group p-4 rounded-2xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
                                                                                                <div className="flex items-center gap-2 mb-2">
                                                                                                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">{col.title}</span>
                                                                                                </div>
                                                                                                <div className="min-h-[32px] flex items-center">
                                                                                                    <BoardCell
                                                                                                        item={currentItem}
                                                                                                        column={col}
                                                                                                        boardId={selectedBoardId}
                                                                                                        onUpdate={() => refreshBoardDetails(selectedBoardId!, true)}
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
                                                                                                    {boardData.columns?.filter((col: any) => col.type !== 'name' && !col.title.startsWith('C-F-')).map((col: any) => (
                                                                                                        <div key={col.id} className="flex flex-col gap-1.5">
                                                                                                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{col.title}</span>
                                                                                                            <div className="min-h-[28px] flex items-center">
                                                                                                                <BoardCell
                                                                                                                    item={item}
                                                                                                                    column={col}
                                                                                                                    boardId={selectedBoardId}
                                                                                                                    onUpdate={() => refreshBoardDetails(selectedBoardId!, true)}
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
                                                        <GlobalCycleView
                                                            boardData={boardData}
                                                            selectedBoardId={selectedBoardId}
                                                            refreshBoardDetails={refreshBoardDetails}
                                                            setPreviewFile={setPreviewFile}
                                                        />
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
                </>
            }
        />
    );
}
