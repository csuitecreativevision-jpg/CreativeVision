import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Briefcase,
    Loader2,
    ArrowLeft,
    Sparkles,
    LogOut,
    Menu,
    Calendar
} from 'lucide-react';
import { PortalLayout } from '../components/shared/PortalLayout';
import { PortalWorkspaceCard } from '../components/shared/PortalWorkspaceCard';
import { EditorProjectSelectionView } from '../components/views/EditorProjectSelectionView';
import { getAllBoards, getBoardItems } from '../services/mondayService';
import { supabase } from '../services/boardsService';
import { FilePreviewModal, useProtectedPreview } from '../components/ui/FilePreviewModal';
import { LeaveRequestModal } from '../components/views/LeaveRequestModal';
import { useNavigate } from 'react-router-dom';
import { RefreshProvider, useRefresh } from '../contexts/RefreshContext';
import { TimeTracker } from '../components/shared/TimeTracker';

function EditorPortalContent() {
    const navigate = useNavigate();
    const { previewFile, isLoading: isPreviewLoading, setPreviewFile, closePreview } = useProtectedPreview();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const { refreshKey, triggerRefresh } = useRefresh();
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

    // State
    const [loading, setLoading] = useState(true);
    const [boards, setBoards] = useState<any[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<any | null>(null);
    const [sortOption, setSortOption] = useState<'name' | 'count'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [discordThreadId, setDiscordThreadId] = useState<string | null>(null);

    // User info
    const currentUserName = localStorage.getItem('portal_user_name') || 'Editor';

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

        } catch (error) {
            console.error("Failed to load editor boards", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
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
                <div className="space-y-1">
                    <button
                        onClick={() => setSelectedBoard(null)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${!selectedBoard ? 'bg-white/10 text-white shadow-lg shadow-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <LayoutDashboard className={`w-5 h-5 transition-transform duration-300 ${!selectedBoard ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="text-sm font-bold tracking-tight">Main</span>
                    </button>

                    {boards.map((board) => (
                        <button
                            key={board.id}
                            onClick={async () => {
                                setLoading(true);
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
                            <span className="text-xs font-medium truncate">{board.name.replace(/- Workspace/i, '').trim()}</span>
                        </button>
                    ))}
                </div>
            }
            sidebarFooter={
                <div className="pt-4 border-t border-white/5">
                    <TimeTracker />
                    {currentUserName && (
                        <div className="px-2 py-2 mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-xs ring-1 ring-emerald-500/20">
                                    {currentUserName.charAt(0)}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="text-white text-xs font-bold truncate">{currentUserName}</div>
                                    <div className="text-[10px] text-gray-500 capitalize">Editor Account</div>
                                </div>
                            </div>
                        </div>
                    )}
                    {discordThreadId && (
                        <a
                            href={`https://discord.com/channels/1157004682905014292/${discordThreadId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 transition-all group mb-2"
                        >
                            <svg viewBox="0 0 127.14 96.36" className="w-5 h-5 fill-current">
                                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.48,80.21a105.73,105.73,0,0,0,32.17,16.15,77.7,77.7,0,0,0,6.89-11.11,68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.72-27.42-4.59-51.1-19.34-72.14ZM42.45,65.69C36.18,65.69,31,60,31,53s5.07-12.73,11.41-12.73S54,46,53.86,53,48.79,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.07-12.73,11.44-12.73S96.23,46,96.12,53,91.06,65.69,84.71,65.69Z" />
                            </svg>
                            <span className="text-sm font-bold">Discord Workspace</span>
                        </a>
                    )}
                    <button onClick={() => setIsLeaveModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 text-gray-400 transition-colors group mb-2 border border-transparent hover:border-emerald-500/20">
                        <Calendar className="w-5 h-5" />
                        <span className="text-sm font-medium">Request Leave</span>
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-gray-400 transition-colors group">
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Log Out</span>
                    </button>
                </div>
            }
            mainContent={
                <div className="flex-1 flex flex-col h-full bg-[#050511] overflow-hidden relative">
                    {/* Mobile Menu Trigger */}
                    <div className="absolute top-4 left-4 z-50 lg:hidden">
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="p-2 rounded-lg bg-[#13141f] border border-white/10 text-white hover:bg-white/10 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Background Texture */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

                    <AnimatePresence mode="wait">
                        {!selectedBoard ? (
                            /* --- GRID VIEW --- */
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
                                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                                        >
                                            <Sparkles className="w-4 h-4 text-emerald-400" />
                                            <span className="text-xs font-bold text-emerald-200 uppercase tracking-widest">Welcome, editor!</span>
                                        </motion.div>
                                        <motion.h1
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className="text-5xl md:text-6xl font-black text-white tracking-tight uppercase"
                                        >
                                            Your Portal
                                        </motion.h1>
                                        <motion.p
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-gray-500 max-w-lg mx-auto font-medium"
                                        >
                                            Choose your assigned workspace to manage cycles and fulfillment.
                                        </motion.p>
                                    </div>

                                    {/* Cards Grid */}
                                    {loading ? (
                                        <div className="flex justify-center py-20">
                                            <Loader2 className="w-10 h-10 animate-spin text-emerald-500/50" />
                                        </div>
                                    ) : boards.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {boards.map((board, index) => (
                                                <PortalWorkspaceCard
                                                    key={board.id}
                                                    index={index}
                                                    name={board.name}
                                                    itemCount={board.items_count || 0}
                                                    color={[
                                                        '#8b5cf6', // Violet
                                                        '#ec4899', // Pink
                                                        '#3b82f6', // Blue
                                                        '#10b981', // Emerald
                                                        '#f59e0b', // Amber
                                                    ][index % 5]}
                                                    onClick={async () => {
                                                        setLoading(true);
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
                                            <p className="font-medium text-sm">No assigned workspaces found.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
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
                                <div className="h-24 px-8 flex items-center gap-6 border-b border-white/5 bg-[#0a0a16] flex-shrink-0">
                                    <button
                                        onClick={() => setSelectedBoard(null)}
                                        className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all group"
                                    >
                                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                                    </button>
                                    <div>
                                        <h1 className="text-3xl font-black text-white tracking-tight leading-tight uppercase">
                                            {selectedBoard.name.replace(/- Workspace/i, '').trim()}
                                        </h1>
                                        <div className="text-xs text-emerald-400 font-bold flex items-center gap-2 mt-0.5 uppercase tracking-widest">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            Active Workspace View
                                        </div>
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
