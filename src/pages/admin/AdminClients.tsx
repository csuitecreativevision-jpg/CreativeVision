import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Crown, ArrowLeft, Sparkles, Users, Search, X, Briefcase } from 'lucide-react';
import { ProjectSelectionView } from '../../components/views/ProjectSelectionView';
import { getAllBoards, getBoardItems, getAllFolders } from '../../services/mondayService';
import { supabase } from '../../lib/supabaseClient';
import { FilePreviewModal, useProtectedPreview } from '../../components/ui/FilePreviewModal';
import { useRefresh } from '../../contexts/RefreshContext';
import { useLocation } from 'react-router-dom';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import Folder from '../../components/ui/Folder';

export default function AdminClients() {
    const [loading, setLoading] = useState(true);
    const [boards, setBoards] = useState<any[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<any | null>(null);
    const [showInactive, setShowInactive] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isProcessingNavigation, setIsProcessingNavigation] = useState(false);
    const { previewFile, isLoading: isPreviewLoading, setPreviewFile, closePreview } = useProtectedPreview();
    const { refreshKey } = useRefresh();
    const location = useLocation();
    const [initialItemId, setInitialItemId] = useState<string | undefined>(undefined);

    useEffect(() => { loadData(refreshKey > 0); }, [refreshKey]);

    useEffect(() => {
        if (location.state?.boardId && location.state?.itemId) {
            setIsProcessingNavigation(true);
            const { boardId, itemId } = location.state;
            getBoardItems(boardId, true).then(fullBoardData => {
                setSelectedBoard(fullBoardData);
                setInitialItemId(itemId);
            }).catch(e => {
                console.error('Failed to load navigated board', e);
            }).finally(() => {
                setIsProcessingNavigation(false);
            });
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const loadData = async (force: boolean = false) => {
        setLoading(true);
        try {
            const email = localStorage.getItem('portal_user_email');
            const [userPromise, boardsPromise, foldersPromise] = [
                email ? supabase.from('users').select('allowed_board_ids').eq('email', email).single()
                      : Promise.resolve({ data: null }),
                getAllBoards(force),
                getAllFolders(force)
            ];

            const [userData, allBoards, allFolders] = await Promise.all([userPromise, boardsPromise, foldersPromise]);

            let allowedBoardIds: string[] = [];
            if (userData.data?.allowed_board_ids) allowedBoardIds = userData.data.allowed_board_ids;

            const activeFolder = allFolders?.find((f: any) => f.name.toLowerCase().trim() === 'active clients');
            const inactiveFolder = allFolders?.find((f: any) => f.name.toLowerCase().trim() === 'inactive clients');
            const activeBoardIds = new Set(activeFolder?.children?.map((c: any) => c.id) || []);
            const inactiveBoardIds = new Set(inactiveFolder?.children?.map((c: any) => c.id) || []);

            const clientBoards = (allBoards || []).filter((b: any) => {
                const name = b.name.toLowerCase();
                const isFulfillment = name.includes('fulfillment board') || name.includes('fullfilment board');
                const isSubitem = b.type === 'sub_items_board' || name.includes('subitems');
                const hasPermission = allowedBoardIds.length > 0 ? allowedBoardIds.includes(b.id) : true;
                const isInClientFolder = activeBoardIds.has(b.id) || inactiveBoardIds.has(b.id);
                return isFulfillment && !isSubitem && hasPermission && isInClientFolder;
            }).map((b: any) => ({ ...b, isInactive: inactiveBoardIds.has(b.id) }));

            setBoards(clientBoards);
        } catch (error) {
            console.error('Failed to load client data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async (_: string, silent: boolean) => {
        if (!silent) setLoading(true);
        await loadData(true);
        if (!silent) setLoading(false);
    };

    const visibleBoards = boards
        .filter(b => showInactive ? true : !b.isInactive)
        .filter(b => !searchTerm || b.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    const cleanBoardName = (name: string) =>
        name
            .replace(/fulfillment board/i, '')
            .replace(/fullfilment board/i, '')
            .replace(/\(inactive\)/i, '')
            .replace(/\(CF.*?\)/i, '')
            .replace(/\(C-F.*?\)/i, '')
            .replace(/-/g, ' ')
            .trim();

    const accentColors = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

    // ── DETAIL VIEW ──────────────────────────────────────────────────────────
    if (selectedBoard) {
        return (
            <div className="flex-1 flex flex-col h-full bg-[#020204] overflow-hidden relative">
                <AnimatePresence>
                    {isProcessingNavigation && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-[#020204] flex flex-col items-center justify-center"
                        >
                            <Loader2 className="w-5 h-5 text-violet-400/50 animate-spin mb-3" />
                            <p className="text-sm text-white/30 font-light">Loading client data…</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Detail Header */}
                <div className="h-[68px] px-7 flex items-center gap-4 border-b border-white/[0.05] bg-[#06060a]/80 backdrop-blur-sm flex-shrink-0 z-20">
                    <button
                        onClick={() => { setSelectedBoard(null); setInitialItemId(undefined); }}
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-white/40 hover:text-violet-400 transition-all duration-150"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="h-5 w-px bg-white/[0.06]" />
                    <div>
                        <h1 className="text-base font-bold text-white leading-tight">
                            {cleanBoardName(selectedBoard.name)}
                        </h1>
                        <div className="text-[10px] tracking-widest font-bold uppercase flex items-center gap-1.5 mt-0.5" style={{ color: 'rgba(139,92,246,0.6)' }}>
                            <Crown className="w-3 h-3" />
                            Client Project Space
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="max-w-7xl mx-auto">
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

                <FilePreviewModal previewFile={previewFile} isLoading={isPreviewLoading} onClose={closePreview} />
            </div>
        );
    }

    // ── LIST VIEW ─────────────────────────────────────────────────────────────
    return (
        <AdminPageLayout
            label="Admin"
            title="Clients"
            subtitle={`${visibleBoards.length} active project space${visibleBoards.length !== 1 ? 's' : ''}`}
            action={
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search clients…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-44 pl-8 pr-8 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-xs text-white/80 placeholder-white/25 focus:outline-none focus:border-violet-500/40 transition-all duration-150"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    {/* Inactive toggle */}
                    <button
                        onClick={() => setShowInactive(!showInactive)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                            showInactive
                                ? 'bg-red-500/8 border-red-500/20 text-red-400'
                                : 'bg-white/[0.04] border-white/[0.07] text-white/50 hover:text-white'
                        }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${showInactive ? 'bg-red-400' : 'bg-white/20'}`} />
                        {showInactive ? 'Hide Inactive' : 'Show Inactive'}
                    </button>
                </div>
            }
        >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10 pt-2 pb-16">
                {loading ? (
                    <div className="col-span-full flex items-center justify-center py-24">
                        <Loader2 className="w-5 h-5 text-violet-400/50 animate-spin" />
                    </div>
                ) : visibleBoards.length > 0 ? (
                    visibleBoards.map((board, index) => (
                        <motion.div
                            key={board.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="flex flex-col items-center gap-3 group"
                        >
                            {/* Folder — clicking animates then navigates */}
                            <div
                                style={{ width: 100, height: 110, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'visible', flexShrink: 0 }}
                            >
                                <Folder
                                    color={accentColors[index % 5]}
                                    size={1}
                                    onOpen={() => {
                                        setTimeout(async () => {
                                            setInitialItemId(undefined);
                                            try {
                                                const fullBoardData = await getBoardItems(board.id, false);
                                                setSelectedBoard(fullBoardData);
                                                getBoardItems(board.id, true).then(updated => {
                                                    if (updated) setSelectedBoard(updated);
                                                }).catch(() => {});
                                            } catch (e) { setSelectedBoard(board); }
                                        }, 650);
                                    }}
                                />
                            </div>
                            {/* Name — clicking navigates immediately */}
                            <div className="flex flex-col items-center gap-0.5 cursor-pointer" onClick={async () => {
                                setInitialItemId(undefined);
                                try {
                                    const fullBoardData = await getBoardItems(board.id, false);
                                    setSelectedBoard(fullBoardData);
                                    getBoardItems(board.id, true).then(updated => {
                                        if (updated) setSelectedBoard(updated);
                                    }).catch(() => {});
                                } catch (e) { setSelectedBoard(board); }
                            }}>
                                <span className="text-[11px] font-semibold text-white/55 group-hover:text-white/90 text-center transition-colors duration-150 leading-tight line-clamp-2 max-w-[90px]">
                                    {cleanBoardName(board.name)}
                                </span>
                                {board.isInactive && (
                                    <span className="text-[9px] font-bold tracking-widest uppercase text-white/20">Inactive</span>
                                )}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-24 text-white/20">
                        <Briefcase className="w-8 h-8 mb-3 opacity-30" />
                        <p className="text-sm font-medium text-white/30">No {showInactive ? '' : 'active '}clients found.</p>
                    </div>
                )}
            </div>
        </AdminPageLayout>
    );
}
