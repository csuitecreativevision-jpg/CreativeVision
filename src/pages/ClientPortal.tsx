import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Crown,
    Briefcase,
    Loader2,
    ArrowLeft,
    Sparkles,
    LogOut,
    Menu,
    Calendar
} from 'lucide-react';
import { PortalLayout } from '../components/shared/PortalLayout';
import { PortalBoardCard } from '../components/shared/PortalBoardCard';
import { ProjectSelectionView } from '../components/views/ProjectSelectionView';
import { PortalOnboarding } from '../components/shared/PortalOnboarding';
import { getAllBoards, getBoardItems, getAllFolders } from '../services/mondayService';
import { supabase } from '../lib/supabaseClient';
import { FilePreviewModal, useProtectedPreview } from '../components/ui/FilePreviewModal';
import { useNavigate } from 'react-router-dom';
import { RefreshProvider, useRefresh } from '../contexts/RefreshContext';
import { NotificationBell } from '../components/shared/NotificationBell';
import { PortalCalendar } from '../components/views/PortalCalendar';

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

    useEffect(() => {
        setCurrentUserName(localStorage.getItem('portal_user_name'));
    }, []);

    const onboardingSteps = [
        {
            title: "Welcome to Your Portal",
            description: "Manage your projects, track progress, and view submissions all in one place.",
            icon: <Sparkles className="w-10 h-10 text-emerald-400" />
        },
        {
            title: "Project Experience",
            description: "Select a project workspace to enter your exclusive project space and track deliverables.",
            icon: <Crown className="w-10 h-10 text-blue-400" />
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
        } catch (error) {
            console.error("Failed to load client data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [refreshKey]);

    const handleLogout = () => {
        localStorage.clear();
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
                <div className="space-y-1">
                    <button
                        onClick={() => {
                            setSelectedBoard(null);
                            setInitialItemId(undefined);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${!selectedBoard ? 'bg-white/10 text-white shadow-lg shadow-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <LayoutDashboard className={`w-5 h-5 transition-transform duration-300 ${!selectedBoard ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="text-sm font-bold tracking-tight">Experience</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedBoard('calendar' as any);
                            setInitialItemId(undefined);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${selectedBoard === 'calendar' ? 'bg-white/10 text-white shadow-lg shadow-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Calendar className={`w-5 h-5 transition-transform duration-300 ${selectedBoard === 'calendar' ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="text-sm font-bold tracking-tight">Calendar</span>
                    </button>

                    {boards.map((board) => (
                        <button
                            key={board.id}
                            onClick={async () => {
                                setLoading(true);
                                setInitialItemId(undefined);
                                try {
                                    const fullBoardData = await getBoardItems(board.id);
                                    setSelectedBoard(fullBoardData);
                                } catch (e) {
                                    setSelectedBoard(board);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${selectedBoard?.id === board.id ? 'bg-white/10 text-white shadow-lg shadow-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Briefcase className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                            <span className="text-xs font-medium truncate">{board.name.replace(/fulfillment board/i, '').trim()}</span>
                        </button>
                    ))}
                </div>
            }
            sidebarFooter={
                <div className="pt-4 border-t border-white/5">
                    {currentUserName && (
                        <div className="px-2 py-2 mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs ring-1 ring-blue-500/20">
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
                <div className="flex-1 flex flex-col h-full bg-[#050511] overflow-hidden relative">

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
                            className="p-2 rounded-lg bg-[#13141f] border border-white/10 text-white hover:bg-white/10 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Notification Bell - Top Right */}
                    <div className="absolute top-4 right-4 z-50">
                        <NotificationBell />
                    </div>

                    {/* Background Texture */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

                    <PortalOnboarding
                        isOpen={false}
                        onClose={() => { }}
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
                                className="flex-1 overflow-y-auto custom-scrollbar p-8 z-10"
                            >
                                <div className="max-w-7xl mx-auto space-y-12 pb-20">
                                    {/* Header */}
                                    <div className="text-center space-y-4 pt-12 mb-16">
                                        <motion.div
                                            initial={{ y: -20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20"
                                        >
                                            <Crown className="w-4 h-4 text-blue-400" />
                                            <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Elite Clients</span>
                                        </motion.div>
                                        <motion.h1
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className="text-5xl md:text-6xl font-black text-white tracking-tight uppercase"
                                        >
                                            Client Experience
                                        </motion.h1>
                                        <motion.p
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-gray-500 max-w-lg mx-auto font-medium"
                                        >
                                            Select a project to enter your exclusive workspace.
                                        </motion.p>
                                    </div>

                                    {/* Grid */}
                                    {loading ? (
                                        <div className="flex justify-center py-20">
                                            <Loader2 className="w-10 h-10 animate-spin text-blue-500/50" />
                                        </div>
                                    ) : boards.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {boards.map((board, index) => (
                                                <PortalBoardCard
                                                    key={board.id}
                                                    index={index}
                                                    name={board.name}
                                                    itemCount={board.items_count || 0}
                                                    color={[
                                                        '#3b82f6', // Blue
                                                        '#06b6d4', // Cyan
                                                        '#6366f1', // Indigo
                                                        '#8b5cf6', // Violet
                                                        '#14b8a6', // Teal
                                                    ][index % 5]}
                                                    onClick={async () => {
                                                        setLoading(true);
                                                        setInitialItemId(undefined);
                                                        try {
                                                            const fullBoardData = await getBoardItems(board.id, true);
                                                            setSelectedBoard(fullBoardData);
                                                        } catch (e) {
                                                            setSelectedBoard(board);
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-32 text-gray-500 border border-white/5 rounded-[2.5rem] bg-white/5 mx-auto max-w-md border-dashed">
                                            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                            <p className="font-medium text-sm">No active project workspaces found.</p>
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
                                <div className="h-24 px-8 flex items-center gap-6 border-b border-white/5 bg-[#0a0a16] flex-shrink-0">
                                    <button
                                        onClick={() => {
                                            setSelectedBoard(null);
                                            setInitialItemId(undefined);
                                        }}
                                        className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all group"
                                    >
                                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                                    </button>
                                    <div>
                                        <h1 className="text-3xl font-black text-white tracking-tight leading-tight uppercase">
                                            {selectedBoard.name.replace(/fulfillment board/i, '').trim()}
                                        </h1>
                                        <div className="text-xs text-blue-400 font-bold flex items-center gap-2 mt-0.5 uppercase tracking-widest">
                                            <Crown className="w-3.5 h-3.5" />
                                            Exclusive Project Space
                                        </div>
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
