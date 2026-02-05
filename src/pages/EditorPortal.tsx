import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Briefcase,
    Loader2,
    ArrowLeft,
    Sparkles,
    LogOut
} from 'lucide-react';
import { PortalLayout } from '../components/shared/PortalLayout';
import { PortalWorkspaceCard } from '../components/shared/PortalWorkspaceCard';
import { ProjectSelectionView } from '../components/views/ProjectSelectionView';
import { getAllBoards, getBoardItems } from '../services/mondayService';
import { supabase } from '../services/boardsService';
import { FilePreviewModal, useProtectedPreview } from '../components/ui/FilePreviewModal';
import { useNavigate } from 'react-router-dom';

export default function EditorPortal() {
    const navigate = useNavigate();
    const { previewFile, isLoading: isPreviewLoading, setPreviewFile, closePreview } = useProtectedPreview();

    // State
    const [loading, setLoading] = useState(true);
    const [boards, setBoards] = useState<any[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<any | null>(null);
    const [sortOption, setSortOption] = useState<'name' | 'count'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
    }, [navigate]);

    const loadEditorBoards = async () => {
        setLoading(true);
        try {
            // 1. Get User Permissions
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

            // 2. Fetch All Boards
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
            sidebarContent={
                <div className="space-y-1">
                    <button
                        onClick={() => setSelectedBoard(null)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${!selectedBoard ? 'bg-white/10 text-white shadow-lg shadow-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <LayoutDashboard className={`w-5 h-5 transition-transform duration-300 ${!selectedBoard ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="text-sm font-bold tracking-tight">Experience</span>
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
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-gray-400 transition-colors group">
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Log Out</span>
                    </button>
                </div>
            }
            mainContent={
                <div className="flex-1 flex flex-col h-full bg-[#050511] overflow-hidden relative">
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
                                            <span className="text-xs font-bold text-emerald-200 uppercase tracking-widest">Team Experience</span>
                                        </motion.div>
                                        <motion.h1
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className="text-5xl md:text-6xl font-black text-white tracking-tight uppercase"
                                        >
                                            Team Portal
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
                                                            const fullBoardData = await getBoardItems(board.id);
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
                                <div className="h-24 px-8 flex items-center gap-6 border-b border-white/5 bg-black/20 backdrop-blur-xl flex-shrink-0">
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
                                        <ProjectSelectionView
                                            boardData={selectedBoard}
                                            selectedBoardId={selectedBoard.id}
                                            refreshBoardDetails={handleRefresh}
                                            setPreviewFile={setPreviewFile}
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
