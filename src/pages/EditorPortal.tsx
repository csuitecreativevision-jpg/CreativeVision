import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase,
    Loader2,
    Sparkles,
    LogOut,
    Menu,
    Calendar
} from 'lucide-react';
import { PortalLayout } from '../components/shared/PortalLayout';
import { SidebarItem } from '../components/shared/SidebarItem';
import { EditorProjectSelectionView } from '../components/views/EditorProjectSelectionView';
import { PortalCalendar } from '../components/views/PortalCalendar';
import { getAllBoards, getBoardItems } from '../services/mondayService';
import { supabase } from '../services/boardsService';
import { FilePreviewModal, useProtectedPreview } from '../components/ui/FilePreviewModal';
import { LeaveRequestModal } from '../components/views/LeaveRequestModal';
import { PortalOnboarding } from '../components/shared/PortalOnboarding';
import { useNavigate } from 'react-router-dom';
import { RefreshProvider, useRefresh } from '../contexts/RefreshContext';
import { TimeTracker } from '../components/shared/TimeTracker';
import { NotificationBell } from '../components/shared/NotificationBell';

function EditorPortalContent() {
    const navigate = useNavigate();
    const { previewFile, isLoading: isPreviewLoading, setPreviewFile, closePreview } = useProtectedPreview();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const { refreshKey, triggerRefresh } = useRefresh();
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [initialItemId, setInitialItemId] = useState<string | undefined>(undefined);
    const [isProcessingNavigation, setIsProcessingNavigation] = useState(false);

    // State
    const [loading, setLoading] = useState(true);
    const [boards, setBoards] = useState<any[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<any | null>(null);
    const [sortOption, setSortOption] = useState<'name' | 'count'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [discordThreadId, setDiscordThreadId] = useState<string | null>(null);

    // User info
    const currentUserName = localStorage.getItem('portal_user_name') || 'Editor';

    // Format stored name into proper display name
    // Handles: "juanCruz" → "Juan Cruz", "juan_cruz" → "Juan Cruz", "Joshua Santos" → "Joshua Santos"
    // Note: all-lowercase merged names like "joshuasantos" can't be auto-split — fix the name in the DB.
    const formatDisplayName = (name: string) =>
        name
            .replace(/([a-z])([A-Z])/g, '$1 $2')   // camelCase → words
            .split(/[-_. ]+/)                         // split on separators
            .filter(Boolean)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');

    const displayName = formatDisplayName(currentUserName);
    const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })();

    const onboardingSteps = [
        {
            title: "Welcome to Mission Control",
            description: "Your centralized editorial dashboard. Access assigned projects, track critical deadlines, and download project assets without friction.",
            icon: <Sparkles className="w-10 h-10 text-violet-400" />
        },
        {
            title: "Sync & Track",
            description: "Clock in precisely using the time tracker and instantly tunnel into your private project Discord channels for direct team collaboration.",
            icon: <Briefcase className="w-10 h-10 text-emerald-400" />
        }
    ];

    // Strict Role Check & Initial Fetch
    useEffect(() => {
        const role = localStorage.getItem('portal_user_role');
        if (role !== 'editor') {
            navigate('/portal');
            return;
        }
        loadEditorBoards();
    }, [navigate, refreshKey]);

    const loadEditorBoards = async () => {
        setLoading(true);
        try {
            // 1. Get User Permissions
            const email = localStorage.getItem('portal_user_email');
            let allowedBoardIds: string[] = [];

            if (email) {
                const { data } = await supabase
                    .from('users')
                    .select('allowed_board_ids, discord_thread_id')
                    .eq('email', email)
                    .single();

                if (data?.allowed_board_ids) {
                    allowedBoardIds = data.allowed_board_ids;
                }
                if (data?.discord_thread_id) {
                    setDiscordThreadId(data.discord_thread_id);
                }
            }

            // 2. Fetch All Boards (uses cache, background refresh if stale)
            const allBoards = await getAllBoards();

            // 3. Filter for Workspace Boards
            const workspaceBoards = (allBoards || []).filter((b: any) => {
                const name = b.name.toLowerCase();
                // Check if it's a "Workspace" board
                const isWorkspace = name.includes('- workspace');
                // Exclude Subitems
                const isSubitem = b.type === 'sub_items_board' || name.includes('subitems');

                // Permission Check
                const hasPermission = allowedBoardIds.length > 0 ? allowedBoardIds.includes(b.id) : false;

                return isWorkspace && !isSubitem && hasPermission;
            });

            setBoards(workspaceBoards);

            // Auto-enter the first assigned workspace directly
            if (workspaceBoards.length > 0) {
                try {
                    const fullBoardData = await getBoardItems(workspaceBoards[0].id, true);
                    setSelectedBoard(fullBoardData);
                } catch {
                    setSelectedBoard(workspaceBoards[0]);
                }
            }

        } catch (error) {
            console.error("Failed to load editor boards", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        // Preserve per-account onboarding flags so they don't re-appear after re-login
        const onboardingKeys = Object.keys(localStorage).filter(k => k.includes('_onboarding_seen'));
        const preserved = onboardingKeys.map(k => [k, localStorage.getItem(k)] as [string, string]);
        localStorage.clear();
        preserved.forEach(([k, v]) => localStorage.setItem(k, v));
        navigate('/portal');
    };

    // Helper for refresh
    const handleRefresh = async (_: string, silent: boolean) => {
        if (!silent) setLoading(true);
        await loadEditorBoards();
        if (!silent) setLoading(false);
    };

    return (
        <PortalLayout
            isMobileSidebarOpen={isMobileSidebarOpen}
            onMobileSidebarClose={() => setIsMobileSidebarOpen(false)}
            sidebarContent={
                <div className="space-y-0.5">
                    {boards.map((board) => (
                        <SidebarItem
                            key={board.id}
                            icon={<Briefcase className="w-4 h-4" />}
                            label={boards.length === 1 ? 'Main' : board.name.replace(/- Workspace/i, '').replace(/\(c-w-[\w-]+\)/gi, '').trim()}
                            active={selectedBoard?.id === board.id}
                            onClick={async () => {
                                setInitialItemId(undefined);
                                try {
                                    const fullBoardData = await getBoardItems(board.id);
                                    setSelectedBoard(fullBoardData);
                                } catch (e) {
                                    setSelectedBoard(board);
                                }
                            }}
                        />
                    ))}
                    <div className="pt-2 mt-1 border-t border-white/[0.04]">
                        <SidebarItem
                            icon={<Calendar className="w-4 h-4" />}
                            label="My Calendar"
                            active={selectedBoard === 'calendar'}
                            onClick={() => { setSelectedBoard('calendar'); setInitialItemId(undefined); }}
                        />
                    </div>
                </div>
            }
            sidebarFooter={
                <div className="space-y-1">
                    <TimeTracker />
                    {currentUserName && (
                        <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1">
                            <div className="w-7 h-7 rounded-lg bg-violet-500/12 border border-violet-500/20 flex items-center justify-center text-violet-300 font-bold text-xs flex-shrink-0">
                                {currentUserName.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <div className="text-white/80 text-[12px] font-semibold truncate">{currentUserName}</div>
                                <div className="text-[9px] tracking-widest font-medium" style={{ color: 'rgba(139,92,246,0.5)' }}>EDITOR</div>
                            </div>
                        </div>
                    )}
                    <a
                        href={discordThreadId ? `https://discord.com/channels/1157004682905014292/${discordThreadId}` : `https://discord.com/channels/1157004682905014292`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all duration-200"
                    >
                        <svg viewBox="0 0 127.14 96.36" className="w-4 h-4 fill-current flex-shrink-0">
                            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.48,80.21a105.73,105.73,0,0,0,32.17,16.15,77.7,77.7,0,0,0,6.89-11.11,68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.72-27.42-4.59-51.1-19.34-72.14ZM42.45,65.69C36.18,65.69,31,60,31,53s5.07-12.73,11.41-12.73S54,46,53.86,53,48.79,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.07-12.73,11.44-12.73S96.23,46,96.12,53,91.06,65.69,84.71,65.69Z" />
                        </svg>
                        <span className="text-[13px] font-medium">Discord Workspace</span>
                    </a>
                    <button
                        onClick={() => setIsLeaveModalOpen(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-violet-400 hover:bg-violet-500/5 transition-all duration-200"
                    >
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="text-[13px] font-medium">Request Leave</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
                    >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        <span className="text-[13px] font-medium">Log Out</span>
                    </button>
                </div>
            }
            mainContent={
                <div className="flex-1 flex flex-col h-full bg-[#020204] overflow-hidden relative">

                    {/* Navigation Overlay */}
                    <AnimatePresence>
                        {isProcessingNavigation && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 bg-[#050511] flex flex-col items-center justify-center"
                            >
                                <Loader2 className="w-12 h-12 animate-spin text-custom-bright mb-4" />
                                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Accessing Project</h2>
                                <p className="text-sm font-medium text-gray-500 animate-pulse">Loading project data...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mobile Menu Trigger */}
                    <div className="absolute top-4 left-4 z-50 lg:hidden">
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="p-2 rounded-lg glass-panel text-white hover:bg-white/10 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Notification Bell - Top Right */}
                    <div className="absolute top-4 right-4 z-50">
                        <NotificationBell />
                    </div>

                    {/* Ambient orbs inside content area */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-500/[0.03] rounded-full blur-[160px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

                    <PortalOnboarding
                        steps={onboardingSteps}
                        storageKey="editor_portal_onboarding_seen"
                        autoShow={true}
                    />

                    <AnimatePresence mode="wait">
                        {!selectedBoard ? (
                            /* --- GRID VIEW --- */
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.5 }}
                                className="flex-1 flex flex-col items-center justify-center p-7 md:p-9 z-10"
                            >
                                <div className="w-full max-w-md text-center">
                                    {/* Greeting */}
                                    <div className="pt-2 pb-10">
                                        <motion.p
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, ease: 'easeOut' }}
                                            className="font-display text-2xl md:text-3xl font-light text-white/40 leading-tight mb-1"
                                        >
                                            {greeting},
                                        </motion.p>
                                        <motion.h1
                                            initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
                                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                            transition={{ delay: 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                            className="font-display text-4xl md:text-5xl font-medium tracking-tight text-white leading-[1.0] mb-5"
                                        >
                                            {displayName}<span className="italic text-violet-400">.</span>
                                        </motion.h1>
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.3, duration: 0.5 }}
                                            className="text-white/30 font-light text-sm"
                                        >
                                            Your workspace is loading…
                                        </motion.p>
                                    </div>

                                    {/* Cards Grid */}
                                    {loading ? (
                                        <div className="flex items-center justify-center py-20">
                                            <Loader2 className="w-5 h-5 text-violet-400/50 animate-spin" />
                                        </div>
                                    ) : boards.length > 0 ? (
                                        <div className="space-y-2 max-w-2xl">
                                            {boards.map((b: any, i: number) => (
                                                <PortalWorkspaceCard
                                                    key={b.id}
                                                    index={i}
                                                    name={b.name}
                                                    itemCount={b.items_count || 0}
                                                    color={[
                                                        '#8b5cf6', // Violet
                                                        '#ec4899', // Pink
                                                        '#3b82f6', // Blue
                                                        '#10b981', // Emerald
                                                        '#f59e0b', // Amber
                                                    ][i % 5]}
                                                    onClick={async () => {
                                                        setLoading(true);
                                                        setInitialItemId(undefined);
                                                        try {
                                                            const fullBoardData = await getBoardItems(b.id, true);
                                                            setSelectedBoard(fullBoardData);
                                                        } catch (e) {
                                                            setSelectedBoard(b);
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-20 text-center text-white/20 border border-white/[0.05] rounded-2xl">
                                            <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-30" />
                                            <p className="text-sm font-medium">No assigned workspaces found.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : selectedBoard === 'calendar' ? (
                            <PortalCalendar
                                key="calendar"
                                boardIds={boards.map((b: any) => b.id)}
                                portalType="editor"
                                onBack={() => {
                                    setSelectedBoard(null);
                                    setInitialItemId(undefined);
                                }}
                                onGoToItem={async (boardId, itemId) => {
                                    setIsProcessingNavigation(true);
                                    try {
                                        const fullBoardData = await getBoardItems(boardId, true);
                                        setInitialItemId(itemId);
                                        setSelectedBoard(fullBoardData);
                                    } catch (e) {
                                        console.error("Failed to load board for item", e);
                                    } finally {
                                        setIsProcessingNavigation(false);
                                    }
                                }}
                            />
                        ) : (
                            /* --- DETAIL VIEW --- */
                            <motion.div
                                key="detail"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4 }}
                                className="flex-1 flex flex-col h-full z-10"
                            >
                                {/* Detail Header */}
                                <div className="h-24 px-8 flex items-center gap-6 border-b border-white/5 bg-[#0a0a16] flex-shrink-0 z-20">
                                    <div>
                                        <h2 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                                            <Briefcase className="w-8 h-8 text-emerald-400" />
                                            {selectedBoard.name.replace(/- Workspace/i, '').replace(/\(c-w-[\w-]+\)/gi, '').trim()}
                                        </h2>
                                        <p className="text-sm text-gray-400 font-medium">Manage your active tasks and workspace deliverables</p>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                                    <div className="max-w-7xl mx-auto pb-20">
                                        <EditorProjectSelectionView
                                            boardData={selectedBoard}
                                            selectedBoardId={selectedBoard.id}
                                            refreshBoardDetails={handleRefresh}
                                            setPreviewFile={setPreviewFile}
                                            useYouTubeModal={true}
                                            initialItemId={initialItemId}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <FilePreviewModal
                        previewFile={previewFile}
                        isLoading={isPreviewLoading}
                        onClose={closePreview}
                    />

                    <LeaveRequestModal
                        isOpen={isLeaveModalOpen}
                        onClose={() => setIsLeaveModalOpen(false)}
                        userEmail={localStorage.getItem('portal_user_email') || ''}
                        userName={currentUserName}
                    />
                </div>
            }
        />
    );
}

export default function EditorPortal() {
    return (
        <RefreshProvider>
            <EditorPortalContent />
        </RefreshProvider>
    );
}
