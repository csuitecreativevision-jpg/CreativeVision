import { useState, useEffect } from 'react';
import { getApprovalItems, getBoardItems } from '../../services/mondayService';
import { Video, RefreshCw, CheckCircle2, Layers, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminApprovalModal } from '../../components/views/AdminApprovalModal';
import { FilePreviewModal } from '../../components/ui/FilePreviewModal';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';

export default function AdminApprovalCenter() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedApprovalItem, setSelectedApprovalItem] = useState<any | null>(null);
    const [approvalBoardData, setApprovalBoardData] = useState<any | null>(null);
    const [loadingBoard, setLoadingBoard] = useState(false);
    const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<{ url: string, name: string, assetId?: string } | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async (forceRefresh: boolean = false) => {
        setLoading(true);
        try {
            const data = await getApprovalItems(forceRefresh);
            setItems(data);
        } catch (error) {
            console.error('Failed to load approvals', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReviewProject = async (item: any) => {
        setLoadingBoard(true);
        setLoadingItemId(item.id);
        try {
            const boardData = await getBoardItems(item.boardId);
            setApprovalBoardData(boardData);
            setSelectedApprovalItem(item);
        } catch (error) {
            console.error('Failed to load project details', error);
        } finally {
            setLoadingBoard(false);
            setLoadingItemId(null);
        }
    };

    const closeReview = () => {
        setSelectedApprovalItem(null);
        setApprovalBoardData(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-5 h-5 text-violet-400/50 animate-spin" />
            </div>
        );
    }

    return (
        <AdminPageLayout
            label="Admin"
            title="Pending Approvals"
            subtitle={`${items.length} project${items.length !== 1 ? 's' : ''} awaiting review`}
            action={
                <button
                    onClick={() => loadData(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.07] text-white/60 hover:text-white text-xs font-semibold transition-all duration-150"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                </button>
            }
        >
            <div className="space-y-2">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 border border-white/[0.05] rounded-2xl text-white/20">
                        <CheckCircle2 className="w-8 h-8 mb-3 opacity-40" />
                        <p className="text-sm font-medium text-white/30">All caught up — no pending approvals</p>
                    </div>
                ) : (
                    items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="group flex items-center gap-5 px-6 py-5 bg-white/[0.02] hover:bg-white/[0.045] border border-white/[0.06] hover:border-violet-500/20 rounded-2xl transition-all duration-200">

                                {/* Left accent bar */}
                                <div className="w-1 h-11 rounded-full flex-shrink-0 bg-gradient-to-b from-violet-500/60 to-violet-500/10" />

                                {/* Editor avatar */}
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/25 to-fuchsia-600/15 border border-violet-500/20 flex items-center justify-center text-violet-300 font-bold text-sm flex-shrink-0">
                                    {item.editor?.charAt(0)?.toUpperCase() || '?'}
                                </div>

                                {/* Main info */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-[15px] font-semibold text-white/85 group-hover:text-white truncate leading-tight transition-colors duration-150">
                                        {item.name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Layers className="w-3 h-3 text-violet-400/50 flex-shrink-0" />
                                        <span className="text-[11px] text-white/30 font-medium truncate">
                                            {item.boardName?.replace(/- Workspace|\(c-w-[\w-]+\)/gi, '').trim()}
                                        </span>
                                        <span className="text-white/10">·</span>
                                        <span className="text-[11px] text-white/30 font-medium">{item.editor}</span>
                                    </div>
                                </div>

                                {/* Status badge */}
                                <div className="flex-shrink-0">
                                    <div className="px-3 py-1.5 rounded-lg bg-amber-500/8 border border-amber-500/15 text-[11px] font-bold tracking-widest uppercase text-amber-400/70">
                                        Pending
                                    </div>
                                </div>

                                {/* Review button */}
                                <button
                                    onClick={() => handleReviewProject(item)}
                                    disabled={loadingBoard}
                                    className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600/80 hover:bg-violet-500 text-white text-sm font-semibold transition-all duration-150 hover:shadow-[0_0_20px_rgba(139,92,246,0.35)] disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {loadingItemId === item.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Video className="w-4 h-4" />
                                    )}
                                    Review
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {selectedApprovalItem && approvalBoardData && (
                    <AdminApprovalModal
                        approvalItems={items}
                        currentApprovalItem={selectedApprovalItem}
                        boardData={approvalBoardData}
                        onClose={closeReview}
                        onNext={() => {
                            const idx = items.findIndex(i => i.id === selectedApprovalItem.id);
                            if (idx < items.length - 1) handleReviewProject(items[idx + 1]);
                        }}
                        onPrev={() => {
                            const idx = items.findIndex(i => i.id === selectedApprovalItem.id);
                            if (idx > 0) handleReviewProject(items[idx - 1]);
                        }}
                        refreshBoardDetails={async () => { await loadData(true); }}
                        setPreviewFile={setPreviewFile}
                    />
                )}
            </AnimatePresence>

            <FilePreviewModal
                previewFile={previewFile}
                isLoading={!!previewFile?.assetId}
                onClose={() => setPreviewFile(null)}
            />
        </AdminPageLayout>
    );
}
