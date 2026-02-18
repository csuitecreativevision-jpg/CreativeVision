import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Crown } from 'lucide-react';
import { WorkspaceCard } from '../../components/shared/WorkspaceCard';
import { ProjectSelectionView } from '../../components/views/ProjectSelectionView';
import { getAllBoards, getBoardItems, getAllFolders } from '../../services/mondayService';
import { supabase } from '../../lib/supabaseClient';
import { FilePreviewModal, useProtectedPreview } from '../../components/ui/FilePreviewModal';
import { useRefresh } from '../../contexts/RefreshContext';

export default function AdminClients() {
    // State
    const [loading, setLoading] = useState(true);
    const [boards, setBoards] = useState<any[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<any | null>(null);
    const [showInactive, setShowInactive] = useState(false); // Reverted to Toggle
    const { previewFile, isLoading: isPreviewLoading, setPreviewFile, closePreview } = useProtectedPreview();
    const { refreshKey, triggerRefresh } = useRefresh();

    // Fetch Data on mount and when refreshKey changes
    useEffect(() => {
        loadData();
    }, [refreshKey]);

    const loadData = async () => {
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

            // 2. Fetch Data in Parallel
            const [allBoards, allFolders] = await Promise.all([
                getAllBoards(),
                getAllFolders()
            ]);

            // 3. Process Folders to find Active/Inactive Sets
            const activeFolder = allFolders?.find((f: any) => f.name.toLowerCase().trim() === 'active clients');
            const inactiveFolder = allFolders?.find((f: any) => f.name.toLowerCase().trim() === 'inactive clients');

            // Get IDs of boards directly inside these folders
            const activeBoardIds = new Set(activeFolder?.children?.map((c: any) => c.id) || []);
            const inactiveBoardIds = new Set(inactiveFolder?.children?.map((c: any) => c.id) || []);

            // 4. Filter Boards
            const clientBoards = (allBoards || []).filter((b: any) => {
                const name = b.name.toLowerCase();

                // Name Check: Must contain "fulfillment board" (or typo)
                const isFulfillment = name.includes('fulfillment board') || name.includes('fullfilment board');

                // Exclude Subitems
                const isSubitem = b.type === 'sub_items_board' || name.includes('subitems');

                // Permission Check
                const hasPermission = allowedBoardIds.length > 0 ? allowedBoardIds.includes(b.id) : true;

                // Folder Check: Must be in Active OR Inactive folder
                // NOTE: If a board matches the name but IS NOT in either folder, we exclude it to be safe 
                // (as per "this is where we determine on who is active and not")
                const isInClientFolder = activeBoardIds.has(b.id) || inactiveBoardIds.has(b.id);

                return isFulfillment && !isSubitem && hasPermission && isInClientFolder;
            }).map((b: any) => ({
                ...b,
                // Tag the board with its status status based on the folder it was found in
                isInactive: inactiveBoardIds.has(b.id)
            }));

            setBoards(clientBoards);

        } catch (error) {
            console.error("Failed to load client data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async (_: string, silent: boolean) => {
        if (!silent) setLoading(true);
        await loadData();
        if (!silent) setLoading(false);
    };

    // Filter & Sort for Rendering
    const visibleBoards = boards
        .filter(b => showInactive ? true : !b.isInactive)
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    const cleanBoardName = (name: string) => {
        return name
            .replace(/fulfillment board/i, '')
            .replace(/fullfilment board/i, '')
            .replace(/\(inactive\)/i, '')
            .replace(/\(CF.*?\)/i, '') // Remove (CF...)
            .replace(/\(C-F.*?\)/i, '') // Remove (C-F...)
            .replace(/-/g, '')
            .trim();
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#050511] overflow-hidden relative">

            {/* Background Texture - Removed for performance */}

            <AnimatePresence mode="wait">
                {!selectedBoard ? (
                    /* --- CLIENT SELECTION (EXPERIENCE) --- */
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
                                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20"
                                >
                                    <Crown className="w-4 h-4 text-blue-400" />
                                    <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Elite Clients</span>
                                </motion.div>
                                <motion.h1
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-4xl md:text-5xl font-black text-white tracking-tight"
                                >
                                    CLIENT EXPERIENCE
                                </motion.h1>
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-gray-400 max-w-lg mx-auto"
                                >
                                    Select a client to enter their exclusive project space.
                                </motion.p>

                                {/* Controls Toolbar */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex flex-wrap items-center justify-center gap-4 pt-4"
                                >
                                    {/* Sort Controls removed as requested */}

                                    {/* Inactive Toggle (Reverted) */}
                                    <button
                                        onClick={() => setShowInactive(!showInactive)}
                                        className={`group px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${showInactive ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full transition-colors ${showInactive ? 'bg-red-500' : 'bg-gray-600 group-hover:bg-gray-400'}`} />
                                        {showInactive ? 'Hiding Inactive' : 'Show Inactive'}
                                    </button>
                                </motion.div>
                            </div>

                            {/* Client Grid */}
                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                                </div>
                            ) : visibleBoards.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
                                    {visibleBoards.map((board, index) => (
                                        <WorkspaceCard
                                            key={board.id}
                                            index={index}
                                            name={cleanBoardName(board.name)}
                                            itemCount={board.items_count || 0}
                                            color={[
                                                '#3b82f6', // Blue
                                                '#06b6d4', // Cyan
                                                '#6366f1', // Indigo
                                                '#8b5cf6', // Violet
                                                '#14b8a6', // Teal
                                            ][index % 5]}
                                            onClick={async () => {
                                                try {
                                                    const fullBoardData = await getBoardItems(board.id);
                                                    setSelectedBoard(fullBoardData);
                                                } catch (e) {
                                                    console.error("Failed to fetch board items", e);
                                                    setSelectedBoard(board);
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-500 border border-white/5 rounded-3xl bg-white/5 mx-auto max-w-md">
                                    <p>No {showInactive ? '' : 'active'} clients found.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    /* --- CLIENT DETAIL EXPERIENCE --- */
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.4 }}
                        className="flex-1 flex flex-col h-full bg-[#050511]"
                    >
                        {/* Detail Header */}
                        <div className="h-24 px-8 flex items-center gap-6 border-b border-white/5 bg-[#0a0a16] flex-shrink-0 z-20">
                            <button
                                onClick={() => setSelectedBoard(null)}
                                className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all group"
                            >
                                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tight">{selectedBoard.name}</h1>
                                <div className="text-sm text-blue-400 font-bold flex items-center gap-2 mt-1">
                                    <Crown className="w-3.5 h-3.5" />
                                    VIP Client Workspace
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
        </div>
    );
}
