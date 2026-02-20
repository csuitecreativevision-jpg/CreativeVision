import { useState, useEffect } from 'react';
import { getApprovalItems, getBoardItems } from '../../services/mondayService';
import { GlassCard } from '../../components/ui/GlassCard';
import { Video, RefreshCw, Layers, ArrowLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectSelectionView } from '../../components/views/ProjectSelectionView';
import { FilePreviewModal } from '../../components/ui/FilePreviewModal';

export default function AdminApprovalCenter() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedApprovalItem, setSelectedApprovalItem] = useState<any | null>(null);
    const [approvalBoardData, setApprovalBoardData] = useState<any | null>(null);
    const [loadingBoard, setLoadingBoard] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string, name: string, assetId?: string } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getApprovalItems();
            setItems(data);
        } catch (error) {
            console.error("Failed to load approvals", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReviewProject = async (item: any) => {
        setLoadingBoard(true);
        try {
            // Fetch full board data for the selected item's board
            // We need this because ProjectSelectionView expects the full board context
            const boardData = await getBoardItems(item.boardId);
            setApprovalBoardData(boardData);
            setSelectedApprovalItem(item);
        } catch (error) {
            console.error("Failed to load project details", error);
            alert("Failed to load project details. Please try again.");
        } finally {
            setLoadingBoard(false);
        }
    };

    const closeReview = () => {
        setSelectedApprovalItem(null);
        setApprovalBoardData(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Pending Approvals</h2>
                    <p className="text-gray-400 text-sm">Projects waiting for review ({items.length})</p>
                </div>
                <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-bold transition-all"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                    <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Video className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white">No Pending Approvals</h3>
                    <p className="text-gray-400 mt-2">All caught up! Great work.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <GlassCard className="p-0 h-full overflow-hidden flex flex-col border border-white/10 group hover:border-violet-500/50 transition-colors">
                                {/* Header / Board Badge */}
                                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-start">
                                    <div className="flex items-center gap-2 text-violet-300 text-xs font-bold uppercase tracking-wider">
                                        <Layers className="w-3 h-3" />
                                        {item.boardName.replace(/- Workspace|\(c-w-[\w-]+\)/gi, '').trim()}
                                    </div>
                                    <div className="px-2 py-1 rounded bg-violet-500/20 text-violet-300 text-[10px] font-bold border border-violet-500/20">
                                        Active
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-violet-200 transition-colors">
                                        {item.name}
                                    </h3>

                                    <div className="mt-auto space-y-4">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white">
                                                {item.editor.charAt(0)}
                                            </div>
                                            {item.editor}
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={() => handleReviewProject(item)}
                                            disabled={loadingBoard}
                                            className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)]
                                                ${item.videoLink ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-white/10 hover:bg-white/20 text-gray-300'}
                                            `}
                                        >
                                            {loadingBoard && selectedApprovalItem?.id === item.id ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Video className="w-4 h-4" />
                                            )}
                                            Review Project
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Project Selection / Review Modal Overlay */}
            <AnimatePresence>
                {selectedApprovalItem && approvalBoardData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-[#0E0E1A] flex flex-col"
                    >
                        {/* Custom Header for Context */}
                        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0E0E1A] z-50 relative">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={closeReview}
                                    className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Reviewing: {selectedApprovalItem.name}</h2>
                                    <p className="text-xs text-gray-500">Board: {selectedApprovalItem.boardName}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeReview}
                                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Project View */}
                        <div className="flex-1 overflow-hidden relative">
                            <ProjectSelectionView
                                boardData={approvalBoardData}
                                selectedBoardId={selectedApprovalItem.boardId}
                                refreshBoardDetails={async () => { await loadData(); }} // Simple refresh
                                setPreviewFile={setPreviewFile}
                                useYouTubeModal={true}
                                initialItemId={selectedApprovalItem.id}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Independent File Preview Modal for sidebar files */}
            <FilePreviewModal
                previewFile={previewFile}
                isLoading={!!previewFile?.assetId}
                onClose={() => setPreviewFile(null)}
            />
        </div>
    );
}
