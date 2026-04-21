import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown,
    Briefcase,
    Loader2,
    Sparkles,
    LogOut,
    Menu,
    Calendar
} from 'lucide-react';
import { PortalLayout } from '../components/shared/PortalLayout';
import { SidebarItem } from '../components/shared/SidebarItem';
import { ProjectSelectionView } from '../components/views/ProjectSelectionView';
import { PortalOnboarding } from '../components/shared/PortalOnboarding';
import { getAllBoards, getBoardItems, getAllFolders } from '../services/mondayService';
import { supabase } from '../lib/supabaseClient';
import { FilePreviewModal, useProtectedPreview } from '../components/ui/FilePreviewModal';
import { useNavigate } from 'react-router-dom';
import { RefreshProvider, useRefresh } from '../contexts/RefreshContext';
import { NotificationBell } from '../components/shared/NotificationBell';
import { PortalCalendar } from '../components/views/PortalCalendar';
import { createNotification } from '../services/notificationService';
import type { Notification } from '../services/notificationService';
import { parseFeedbackSourceId } from '../services/projectFeedbackService';

function getStatusColumnIds(board: any): string[] {
    if (!board?.columns) return [];
    return board.columns
        .filter((col: any) => {
            const title = String(col.title || '').toLowerCase();
            const type = String(col.type || '').toLowerCase();
            return title.includes('status') || title.includes('phase') || title.includes('stage') || type === 'status' || type === 'color';
        })
        .map((col: any) => col.id);
}

function getItemStatusText(item: any, statusColumnIds: string[]): string {
    if (!item?.column_values?.length || statusColumnIds.length === 0) return '';
    for (const colId of statusColumnIds) {
        const value = item.column_values.find((cv: any) => cv.id === colId);
        const text = String(value?.text || value?.display_value || '').trim();
        if (text) return text;
    }
    return '';
}

async function syncWaitingForClientNotifications(userEmail: string, boardsWithItems: any[]) {
    if (!userEmail || !boardsWithItems.length) return;

    const waitingItems: { sourceId: string; itemId: string; itemName: string; statusText: string }[] = [];

    for (const board of boardsWithItems) {
        const statusColumnIds = getStatusColumnIds(board);
        if (!statusColumnIds.length) continue;

        for (const item of board.items || []) {
            const statusText = getItemStatusText(item, statusColumnIds);
            if (!statusText) continue;

            const normalized = statusText.toLowerCase();
            if (!normalized.includes('waiting for client')) continue;

            waitingItems.push({
                sourceId: `waiting_client_${item.id}`,
                itemId: item.id,
                itemName: item.name,
                statusText
            });
        }
    }

    if (waitingItems.length === 0) return;

    const sourceIds = waitingItems.map((entry) => entry.sourceId);
    const { data: existing } = await supabase
        .from('notifications')
        .select('source_id')
        .eq('user_email', userEmail)
        .in('source_id', sourceIds);

    const existingIds = new Set((existing || []).map((row: { source_id: string }) => row.source_id));

    for (const entry of waitingItems) {
        if (existingIds.has(entry.sourceId)) continue;
        await createNotification({
            user_email: userEmail,
            type: 'info',
            title: 'Video Waiting For Your Review',
            message: `"${entry.itemName}" is now ${entry.statusText}.`,
            source_type: 'project',
            source_id: entry.sourceId
        });
    }
}

function ClientPortalContent() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [boards, setBoards] = useState<any[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<any | null>(null);
    const [currentUserName, setCurrentUserName] = useState<string | null>(null);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const { previewFile, isLoading: isPreviewLoading, setPreviewFile, closePreview } = useProtectedPreview();
    const { refreshKey, triggerRefresh } = useRefresh();
    const [initialItemId, setInitialItemId] = useState<string | undefined>(undefined);
    const [isProcessingNavigation, setIsProcessingNavigation] = useState(false);
    const [webhookSyncDone, setWebhookSyncDone] = useState(false);

    const extractItemIdFromNotificationSource = (sourceId?: string) => {
        if (!sourceId) return null;
        if (sourceId.startsWith('waiting_client_')) {
            return sourceId.replace('waiting_client_', '').trim() || null;
        }
        return sourceId.trim();
    };

    const openItemFromNotification = async (notification: Notification) => {
        let itemId: string | null = null;
        let boardIdHint: string | null = null;

        if (notification.source_type === 'project') {
            itemId = extractItemIdFromNotificationSource(notification.source_id);
        } else if (notification.source_type === 'project_feedback') {
            const parsed = parseFeedbackSourceId(notification.source_id);
            if (parsed) {
                itemId = parsed.itemId;
                boardIdHint = parsed.boardId;
            }
        } else {
            return;
        }
        if (!itemId) return;

        setIsProcessingNavigation(true);
        try {
            const sortedBoards = boardIdHint
                ? [...boards].sort((a: any, b: any) => (a.id === boardIdHint ? -1 : b.id === boardIdHint ? 1 : 0))
                : boards;
            for (const board of sortedBoards) {
                const fullBoardData = await getBoardItems(board.id, true);
                const hasItem = (fullBoardData?.items || []).some((item: any) => item.id === itemId);
                if (!hasItem) continue;

                setInitialItemId(itemId);
                setSelectedBoard(fullBoardData);
                return;
            }
        } catch (error) {
            console.error('Failed to open item from notification:', error);
        } finally {
            setIsProcessingNavigation(false);
        }
    };

    const ensureBoardWebhooks = async (boardIds: string[]) => {
        if (!boardIds.length) return;
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
            if (!supabaseUrl || !supabaseAnonKey) return;

            const endpoint = import.meta.env.DEV
                ? '/functions/v1/monday-webhook-sync'
                : `${supabaseUrl.replace(/\/$/, '')}/functions/v1/monday-webhook-sync`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${supabaseAnonKey}`,
                    apikey: supabaseAnonKey,
                },
                body: JSON.stringify({ board_ids: boardIds }),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('Failed to auto-sync Monday webhooks:', text);
            }
        } catch (error) {
            console.error('Failed to call monday-webhook-sync:', error);
        }
    };

    useEffect(() => {
        setCurrentUserName(localStorage.getItem('portal_user_name'));
    }, []);

    // Format stored name into proper display name
    // e.g. "juancruz" → "Juan Cruz", "juan_cruz" → "Juan Cruz", "juanCruz" → "Juan Cruz"
    const formatDisplayName = (name: string) =>
        name
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(/[-_. ]+/)
            .filter(Boolean)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');

    const displayName = formatDisplayName(currentUserName || 'Client');
    const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })();

    const onboardingSteps = [
        {
            title: "Welcome to CreativeVision!",
            description: "Your premium hub for cinematic content. Track milestones, review high-fidelity deliverables, and manage your assets asynchronously.",
            icon: <Crown className="w-10 h-10 text-emerald-400" />
        },
        {
            title: "Total Transparency",
            description: "View real-time status updates, active drafts, and final renders.",
            icon: <Sparkles className="w-10 h-10 text-blue-400" />
        }
    ];

    // Fetch Data Logic (Mirrored from AdminClients)
    const loadData = async () => {
        setLoading(true);
        try {
            const email = localStorage.getItem('portal_user_email');
            let allowedBoardIds: string[] = [];

            if (email) {
                const { data } = await supabase
                    .from('users')
                    .select('allowed_board_ids')
                    .eq('email', email)
                    .single();
                if (data?.allowed_board_ids) {
                    allowedBoardIds = data.allowed_board_ids;
                }
            }

            // Fetch Data in Parallel (uses cache, background refresh if stale)
            const [allBoards, allFolders] = await Promise.all([
                getAllBoards(),
                getAllFolders()
            ]);

            // Process Folders for Active/Inactive parity
            const activeFolder = allFolders?.find((f: any) => f.name.toLowerCase().trim() === 'active clients');
            const inactiveFolder = allFolders?.find((f: any) => f.name.toLowerCase().trim() === 'inactive clients');

            const activeBoardIds = new Set(activeFolder?.children?.map((c: any) => c.id) || []);
            const inactiveBoardIds = new Set(inactiveFolder?.children?.map((c: any) => c.id) || []);

            // Filter Boards
            const clientBoards = (allBoards || []).filter((b: any) => {
                const name = b.name.toLowerCase();
                const isFulfillment = name.includes('fulfillment board') || name.includes('fullfilment board');
                const isSubitem = b.type === 'sub_items_board' || name.includes('subitems');

                // For Client Portal, strictly respect the allowed_board_ids if preset
                const hasPermission = allowedBoardIds.length > 0 ? allowedBoardIds.includes(b.id) : false;

                // Folder Check: Must be in Active OR Inactive folder
                const isInClientFolder = activeBoardIds.has(b.id) || inactiveBoardIds.has(b.id);

                return isFulfillment && !isSubitem && hasPermission && isInClientFolder;
            }).map((b: any) => ({
                ...b,
                isInactive: inactiveBoardIds.has(b.id)
            }));

            setBoards(clientBoards);

            // Auto-enter the first assigned project space directly
            if (clientBoards.length > 0) {
                try {
                    const fullBoardData = await getBoardItems(clientBoards[0].id, true);
                    setSelectedBoard(fullBoardData);
                } catch {
                    setSelectedBoard(clientBoards[0]);
                }
            }

        } catch (error) {
            console.error("Failed to load client data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [refreshKey]);

    useEffect(() => {
        if (webhookSyncDone || boards.length === 0) return;
        const boardIds = boards.map((b) => b.id).filter(Boolean);
        if (boardIds.length === 0) return;
        ensureBoardWebhooks(boardIds).finally(() => setWebhookSyncDone(true));
    }, [boards, webhookSyncDone]);

    useEffect(() => {
        if (!selectedBoard || selectedBoard === ('calendar' as any) || !selectedBoard.id) return;
        let cancelled = false;
        const REFRESH_MS = 15000;
        const refreshSelectedBoard = async () => {
            try {
                const fresh = await getBoardItems(selectedBoard.id, true);
                if (!cancelled) setSelectedBoard(fresh);
            } catch (error) {
                console.error('Failed to refresh selected client board in real time:', error);
            }
        };
        const interval = setInterval(refreshSelectedBoard, REFRESH_MS);
        const onFocus = () => { void refreshSelectedBoard(); };
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                void refreshSelectedBoard();
            }
        };
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            cancelled = true;
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [selectedBoard?.id]);

    useEffect(() => {
        const userEmail = localStorage.getItem('portal_user_email') || '';
        if (!userEmail || boards.length === 0) return;

        let cancelled = false;
        const POLL_INTERVAL_MS = 5000;

        const pollMondayStatusForNotifications = async () => {
            try {
                const boardIds = boards.map((b) => b.id);
                const freshBoards = await Promise.all(
                    boardIds.map((boardId) => getBoardItems(boardId, true).catch(() => null))
                );
                const validBoards = freshBoards.filter(Boolean) as any[];

                if (cancelled || validBoards.length === 0) return;
                await syncWaitingForClientNotifications(userEmail, validBoards);
            } catch (error) {
                console.error('Failed to poll Monday statuses for client notifications:', error);
            }
        };

        pollMondayStatusForNotifications();
        const interval = setInterval(pollMondayStatusForNotifications, POLL_INTERVAL_MS);
        const handleWindowFocus = () => {
            pollMondayStatusForNotifications();
        };
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                pollMondayStatusForNotifications();
            }
        };
        window.addEventListener('focus', handleWindowFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            cancelled = true;
            clearInterval(interval);
            window.removeEventListener('focus', handleWindowFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [boards]);

    const handleLogout = () => {
        // Preserve per-account onboarding flags so they don't re-appear after re-login
        const onboardingKeys = Object.keys(localStorage).filter(k => k.includes('_onboarding_seen'));
        const preserved = onboardingKeys.map(k => [k, localStorage.getItem(k)] as [string, string]);
        localStorage.clear();
        preserved.forEach(([k, v]) => localStorage.setItem(k, v));
        navigate('/portal');
    };

    const handleRefresh = async (_: string, silent: boolean) => {
        if (!silent) setLoading(true);
        await loadData();
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
                            isClientItem
                            icon={<Briefcase className="w-4 h-4" />}
                            label={boards.length === 1 ? 'Main' : board.name.replace(/fulfillment board/i, '').replace(/fullfilment board/i, '').replace(/\(inactive\)/i, '').replace(/\(CF.*?\)/i, '').replace(/\(C-F.*?\)/i, '').replace(/\(c-w-[\w-]+\)/gi, '').replace(/-/g, ' ').trim()}
                            active={selectedBoard?.id === board.id}
                            onClick={async () => {
                                setInitialItemId(undefined);
                                try {
                                    const fullBoardData = await getBoardItems(board.id, true);
                                    setSelectedBoard(fullBoardData);
                                } catch (e) {
                                    setSelectedBoard(board);
                                }
                            }}
                        />
                    ))}
                    <div className="pt-2 mt-1 border-t border-white/[0.04]">
                        <SidebarItem
                            isClientItem
                            icon={<Calendar className="w-4 h-4" />}
                            label="Calendar"
                            active={selectedBoard === ('calendar' as any)}
                            onClick={() => { setSelectedBoard('calendar' as any); setInitialItemId(undefined); }}
                        />
                    </div>
                </div>
            }
            sidebarFooter={
                <div className="space-y-1">
                    {currentUserName && (
                        <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1">
                            <div className="w-7 h-7 rounded-lg bg-violet-500/12 border border-violet-500/20 flex items-center justify-center text-violet-300 font-bold text-xs flex-shrink-0">
                                {currentUserName.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <div className="text-white/80 text-[12px] font-semibold truncate">{currentUserName}</div>
                                <div className="text-[9px] tracking-widest font-medium" style={{ color: 'rgba(139,92,246,0.5)' }}>CLIENT</div>
                            </div>
                        </div>
                    )}
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
                        <NotificationBell onNotificationClick={openItemFromNotification} />
                    </div>

                    {/* Ambient orbs */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/[0.04] rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

                    <PortalOnboarding
                        steps={onboardingSteps}
                        storageKey="client_portal_onboarding_seen"
                        autoShow={true}
                    />

                    <AnimatePresence mode="wait">
                        {!selectedBoard ? (
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

                                    {/* Grid */}
                                    {loading ? (
                                        <div className="flex justify-center py-20">
                                            <Loader2 className="w-10 h-10 animate-spin text-blue-500/50" />
                                        </div>
                                    ) : boards.length > 0 ? (
                                        <div className="space-y-2 max-w-2xl">
                                            {boards.map((b: any, i: number) => (
                                                <PortalBoardCard
                                                    key={b.id}
                                                    name={b.name}
                                                    itemCount={b.items_count || 0}
                                                    index={i}
                                                    color={['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'][i % 5]}
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
                                            <p className="text-sm font-medium">No active project workspaces found.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : selectedBoard === 'calendar' ? (
                            <PortalCalendar
                                key="calendar"
                                boardIds={boards.map((b: any) => b.id)}
                                portalType="client"
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
                                            <Crown className="w-8 h-8 text-blue-400" />
                                            {selectedBoard.name.replace(/fulfillment board/i, '').replace(/fullfilment board/i, '').replace(/\(inactive\)/i, '').replace(/\(CF.*?\)/i, '').replace(/\(C-F.*?\)/i, '').replace(/\(c-w-[\w-]+\)/gi, '').replace(/-/g, ' ').trim()}
                                        </h2>
                                        <p className="text-sm text-gray-400 font-medium">Track your project's progress and deliverables</p>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                                    <div className="max-w-7xl mx-auto pb-20">
                                        <ProjectSelectionView
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
                </div>
            }
        />
    );
}

export default function ClientPortal() {
    return (
        <RefreshProvider>
            <ClientPortalContent />
        </RefreshProvider>
    );
}
