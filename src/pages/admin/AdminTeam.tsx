import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { WorkspaceCard } from '../../components/shared/WorkspaceCard';
import { ProjectSelectionView } from '../../components/views/ProjectSelectionView';
import { getAllBoards, getBoardItems } from '../../services/mondayService';
import { supabase } from '../../lib/supabaseClient';
import { FilePreviewModal, useProtectedPreview } from '../../components/ui/FilePreviewModal';

export default function AdminTeam() {
    // State
    const [loading, setLoading] = useState(true);
    const [boards, setBoards] = useState<any[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<any | null>(null);
    const [sortOption, setSortOption] = useState<'name' | 'count'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const { previewFile, isLoading: isPreviewLoading, setPreviewFile, closePreview } = useProtectedPreview();

    // Fetch Data
    useEffect(() => {
        loadTeamBoards();
    }, []);

    const loadTeamBoards = async () => {
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

                // Permission Check (if not admin/open) - assuming admin for now based on portal, 
                // but good to respect permissions if they exist.
                const hasPermission = allowedBoardIds.length > 0 ? allowedBoardIds.includes(b.id) : true;

                return isWorkspace && !isSubitem && hasPermission;
            });

            setBoards(workspaceBoards);

        } catch (error) {
            console.error("Failed to load team boards", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper for refresh (needed by GlobalCycleView prop, though mostly internal)
    const handleRefresh = async (_: string, silent: boolean) => {
        if (!silent) setLoading(true);
        await loadTeamBoards(); // Re-fetch list
        // If we firmly need to refresh specific board items, logic would go here
        // For now, re-fetching list is safe baseline
        if (!silent) setLoading(false);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#050511] overflow-hidden relative">

            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />

            <AnimatePresence mode="wait">
                {!selectedBoard ? (
                    /* --- GRID VIEW --- */
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="flex-1 overflow-y-auto custom-scrollbar p-8"
                    >
                        <div className="max-w-7xl mx-auto space-y-12">
                            {/* Header */}
                            <div className="text-center space-y-4 pt-8">
                                <motion.div
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10"
                                >
                                    <Sparkles className="w-4 h-4 text-custom-bright" />
                                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Team Overview</span>
                                </motion.div>
                                <motion.h1
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-4xl md:text-5xl font-black text-white tracking-tight"
                                >
                                    SELECT A WORKSPACE
                                </motion.h1>
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-gray-400 max-w-lg mx-auto"
                                >
                                    Choose a workspace to view active cycles and project status.
                                </motion.p>

                                {/* Sort Controls */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex items-center justify-center gap-4 pt-4"
                                >
                                    <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
                                        <button
                                            onClick={() => setSortOption('name')}
                                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${sortOption === 'name' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Name
                                        </button>
                                        <button
                                            onClick={() => setSortOption('count')}
                                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${sortOption === 'count' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Projects
                                        </button>
                                    </div>

                                    <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
                                        <button
                                            onClick={() => setSortDirection('asc')}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${sortDirection === 'asc' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            ↑
                                        </button>
                                        <button
                                            onClick={() => setSortDirection('desc')}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${sortDirection === 'desc' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            ↓
                                        </button>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Cards Grid */}
                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="w-10 h-10 animate-spin text-custom-bright" />
                                </div>
                            ) : boards.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
                                    {[...boards].sort((a, b) => {
                                        if (sortOption === 'name') {
                                            const cleanName = (name: string) => name.replace(/- Workspace/i, '').replace(/\(c-w-[\w-]+\)/i, '').trim().toLowerCase();
                                            const nameA = cleanName(a.name);
                                            const nameB = cleanName(b.name);
                                            return sortDirection === 'asc'
                                                ? nameA.localeCompare(nameB)
                                                : nameB.localeCompare(nameA);
                                        } else {
                                            const countA = a.items_count || 0;
                                            const countB = b.items_count || 0;
                                            return sortDirection === 'asc'
                                                ? countA - countB
                                                : countB - countA;
                                        }
                                    }).map((board, index) => (
                                        <WorkspaceCard
                                            key={board.id}
                                            index={index}
                                            name={board.name}
                                            itemCount={board.items_count || 0} // Use count from getAllBoards summary
                                            // Fallback colors for visual variety
                                            color={[
                                                '#8b5cf6', // Violet
                                                '#ec4899', // Pink
                                                '#3b82f6', // Blue
                                                '#10b981', // Emerald
                                                '#f59e0b', // Amber
                                            ][index % 5]}
                                            onClick={async () => {
                                                // Set selected board immediately to show loading state (if desired) or simple transition
                                                // Ideally, we fetch detailed items now
                                                try {
                                                    const fullBoardData = await getBoardItems(board.id);
                                                    setSelectedBoard(fullBoardData);
                                                } catch (e) {
                                                    console.error("Failed to fetch board items", e);
                                                    // Fallback to basic data or show error
                                                    setSelectedBoard(board);
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-500 border border-white/5 rounded-3xl bg-white/5 mx-auto max-w-md">
                                    <p>No Workspace boards found.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    /* --- DETAIL VIEW --- */
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.4 }}
                        className="flex-1 flex flex-col h-full bg-[#050511]"
                    >
                        {/* Detail Header */}
                        <div className="h-20 px-8 flex items-center gap-4 border-b border-white/5 bg-black/20 backdrop-blur-xl flex-shrink-0 z-20">
                            <button
                                onClick={() => setSelectedBoard(null)}
                                className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all group"
                            >
                                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{selectedBoard.name}</h1>
                                <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Live Data
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                            <div className="max-w-7xl mx-auto">
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
    );
}
