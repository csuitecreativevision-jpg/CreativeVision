import { useState, useEffect, useMemo } from 'react';
import { getApprovalItems, getBoardItems, getDueTodayItems, getDueYesterdayItems } from '../../services/mondayService';
import { Video, RefreshCw, CheckCircle2, Layers, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminApprovalModal } from '../../components/views/AdminApprovalModal';
import { FilePreviewModal } from '../../components/ui/FilePreviewModal';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { ThreeLogoLoader } from '../../components/ui/ThreeLogoLoader';
import { fireCvSwal } from '../../lib/swalTheme';
import { sendFollowUpRequest } from '../../services/projectFollowUpService';

export default function AdminApprovalCenter() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dueTodayItems, setDueTodayItems] = useState<any[]>([]);
    const [dueYesterdayItems, setDueYesterdayItems] = useState<any[]>([]);

    const [selectedApprovalItem, setSelectedApprovalItem] = useState<any | null>(null);
    const [approvalBoardData, setApprovalBoardData] = useState<any | null>(null);
    const [loadingBoard, setLoadingBoard] = useState(false);
    const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
    const [followUpLoadingId, setFollowUpLoadingId] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<{ url: string, name: string, assetId?: string } | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async (forceRefresh: boolean = false) => {
        if (forceRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        try {
            const [data, dueToday, dueYesterday] = await Promise.all([
                getApprovalItems(forceRefresh),
                getDueTodayItems(forceRefresh),
                getDueYesterdayItems(forceRefresh),
            ]);
            setItems(data);
            setDueTodayItems(dueToday);
            setDueYesterdayItems(dueYesterday);
        } catch (error) {
            console.error('Failed to load approvals', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
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

    const dueTodayCountLabel = useMemo(() => dueTodayItems.length, [dueTodayItems]);
    const dueYesterdayCountLabel = useMemo(() => dueYesterdayItems.length, [dueYesterdayItems]);

    const handleFollowUp = async (item: any) => {
        const adminName = localStorage.getItem('portal_user_name') || 'Admin';
        const dueText = String(item.dueText || item.dueAt || 'today').trim();
        const autoPrompt = `Hi ${item.editor || 'Editor'}, quick follow-up on "${item.name}" (due ${dueText}). Please share the current project status and report progress at https://creativevision.dev .`;
        const first = await fireCvSwal({
            icon: 'question',
            title: 'Send Follow-up Request?',
            html: `
                <div class="text-left">
                    <div class="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-[10px] uppercase tracking-[0.14em] text-white/45 font-bold">Project</span>
                            <span class="text-[10px] uppercase tracking-[0.14em] text-violet-300/80 font-bold">Follow-up</span>
                        </div>
                        <p class="text-sm font-semibold text-white leading-snug">${item.name}</p>
                        <div class="grid grid-cols-1 gap-2">
                            <div class="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                                <p class="text-[10px] uppercase tracking-[0.14em] text-white/40 font-bold mb-1">Editor</p>
                                <p class="text-[12px] text-white/85 font-semibold">${item.editor || 'Unknown'}</p>
                            </div>
                            <div class="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2">
                                <p class="text-[10px] uppercase tracking-[0.14em] text-amber-200/70 font-bold mb-1">Due</p>
                                <p class="text-[12px] text-amber-200 font-semibold">${dueText}</p>
                            </div>
                        </div>
                    </div>
                    <p class="text-[11px] text-white/55 mt-3 leading-relaxed">
                        The editor will receive an automatic popup asking for a progress update.
                    </p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Yes, Send Follow-up',
            cancelButtonText: 'Cancel',
            customClass: {
                popup: 'rounded-3xl border border-white/10 shadow-2xl max-w-[35rem]',
                title: '!text-white !font-black !tracking-tight',
                htmlContainer: '!text-white/80 !text-left',
                actions: '!gap-2 !pt-2',
                confirmButton:
                    '!rounded-xl !px-5 !py-2.5 !font-semibold !text-white !bg-violet-600 hover:!bg-violet-500 focus:!outline-none',
                cancelButton:
                    '!rounded-xl !px-5 !py-2.5 !font-semibold !text-white !bg-white/10 hover:!bg-white/15 focus:!outline-none',
            },
        });
        if (!first.isConfirmed) return;
        setFollowUpLoadingId(item.id);
        try {
            await sendFollowUpRequest({
                boardId: item.boardId,
                itemId: item.id,
                projectName: item.name,
                editorName: item.editor || '',
                adminName,
                promptMessage: autoPrompt,
            });

            await fireCvSwal({
                icon: 'success',
                title: 'Follow-up sent',
                text: `${item.editor || 'Editor'} will receive a popup to reply with progress.`,
                timer: 1300,
                showConfirmButton: false,
            });
        } catch (error) {
            await fireCvSwal({
                icon: 'error',
                title: 'Failed to send follow-up',
                text: error instanceof Error ? error.message : 'Could not send follow-up.',
            });
        } finally {
            setFollowUpLoadingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-5 h-5 text-violet-400/50 animate-spin" />
            </div>
        );
    }
    if (refreshing) {
        return <ThreeLogoLoader />;
    }

    return (
        <AdminPageLayout
            label="Admin"
            title="Pending Approvals"
            subtitle={`${items.length} project${items.length !== 1 ? 's' : ''} awaiting review`}
            action={
                <button
                    onClick={() => loadData(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.07] disabled:opacity-60 disabled:cursor-not-allowed text-white/60 hover:text-white text-xs font-semibold transition-all duration-150"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            }
        >
            <div className="space-y-6">
                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-violet-300/90">Due Today</p>
                            <p className="text-xs text-white/45 mt-1">
                                Projects due today that need editor progress follow-up.
                            </p>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[11px] font-bold">
                            {dueTodayCountLabel}
                        </div>
                    </div>
                    {dueTodayCountLabel === 0 ? (
                        <p className="text-xs text-white/35">No approval items due today.</p>
                    ) : (
                        <div className="space-y-2">
                            {dueTodayItems.map((item: any) => (
                                <div key={`due-${item.id}`} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-white/10 bg-black/20">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                                        <p className="text-[11px] text-white/45 truncate">{item.editor} · {item.dueText || 'Due today'}</p>
                                        {item.clientName ? (
                                            <p className="text-[11px] text-white/40 truncate">Client: {item.clientName}</p>
                                        ) : null}
                                        <p className="text-[11px] text-violet-300/85 truncate">Progress: {item.progressStatus || 'No status'}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => void handleFollowUp(item)}
                                        disabled={followUpLoadingId === item.id}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-[11px] font-bold uppercase tracking-wider"
                                    >
                                        {followUpLoadingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                        Follow Up
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-200/90">Due Yesterday</p>
                            <p className="text-xs text-white/45 mt-1">
                                Deadline was yesterday on the calendar — quick follow-up with the editor.
                            </p>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] font-bold">
                            {dueYesterdayCountLabel}
                        </div>
                    </div>
                    {dueYesterdayCountLabel === 0 ? (
                        <p className="text-xs text-white/35">Nothing due yesterday.</p>
                    ) : (
                        <div className="space-y-2">
                            {dueYesterdayItems.map((item: any) => (
                                <div key={`yest-${item.boardId}-${item.id}`} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-white/10 bg-black/20">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                                        <p className="text-[11px] text-white/45 truncate">{item.editor} · {item.dueText || 'Due yesterday'}</p>
                                        {item.clientName ? (
                                            <p className="text-[11px] text-white/40 truncate">Client: {item.clientName}</p>
                                        ) : null}
                                        <p className="text-[11px] text-amber-200/85 truncate">Progress: {item.progressStatus || 'No status'}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => void handleFollowUp(item)}
                                        disabled={followUpLoadingId === item.id}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-[11px] font-bold uppercase tracking-wider"
                                    >
                                        {followUpLoadingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                        Follow Up
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

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
                                        {item.clientName ? (
                                            <>
                                                <span className="text-white/10">·</span>
                                                <span className="text-[11px] text-white/30 font-medium truncate">Client: {item.clientName}</span>
                                            </>
                                        ) : null}
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
