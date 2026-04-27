import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { Calendar, Loader2, PlayCircle, RefreshCw, Save } from 'lucide-react';
import {
    getAllBoards,
    getBoardColumns,
    getBoardItems,
    getUsers,
    updateMondayItemColumns,
} from '../../services/mondayService';
import { parseYmdToNoonManila, todaysYmdManila, yesterdaysYmdManila, ymdInManila } from '../../lib/philippinesTime';
import { YouTubeModal } from '../../components/ui/YouTubeModal';
import { SubmissionVideoPlayer, type SubmissionVideoPlayerHandle } from '../../components/shared/SubmissionVideoPlayer';
import { SubmissionVideoFeedbackPanel } from '../../components/shared/SubmissionVideoFeedbackPanel';
import { isMondayStatusForApproval } from '../../lib/mondayItemStatus';
import { extractGoogleDriveFileId } from '../../services/googleDriveLinkService';
import { isCvApprovedMondayStatus, maybeClearSubmissionVideoFeedback } from '../../services/submissionVideoFeedbackService';

type QuickRange = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom';

type Row = {
    id: string;
    name: string;
    status: string;
    editor: string;
    price: string;
    rawVideoLink: string;
    submissionLink: string;
    instructions: string;
    deadlineYmd: string | null;
    /** Date used by quick filters (prefer deployed/deployment date, then deadline, then created_at). */
    filterDateYmd: string | null;
};

function extractLinkUrlFromColumnValue(cv: any): string {
    if (!cv) return '';
    const direct = String(cv?.url || '').trim();
    if (direct) return direct;
    if (cv?.value) {
        try {
            const parsed = JSON.parse(cv.value) as { url?: string };
            const u = String(parsed?.url || '').trim();
            if (u) return u;
        } catch {
            /* ignore */
        }
    }
    const text = String(cv?.text || cv?.display_value || '').trim();
    if (/^https?:\/\//i.test(text)) return text;
    const m = text.match(/https?:\/\/[^\s]+/i);
    return m?.[0] || '';
}

function extractSubmissionUrlFromColumnValue(cv: any): string {
    if (!cv) return '';
    if (cv?.value) {
        try {
            const parsed = JSON.parse(cv.value) as {
                url?: string;
                files?: Array<{ public_url?: string; url?: string; urlThumbnail?: string; thumbnail_url?: string }>;
            };
            if (parsed?.files?.length) {
                const f = parsed.files[0];
                const fileUrl = String(f.public_url || f.url || f.urlThumbnail || f.thumbnail_url || '').trim();
                if (fileUrl) return fileUrl;
            }
            const u = String(parsed?.url || '').trim();
            if (u) return u;
        } catch {
            /* ignore */
        }
    }
    const display = String(cv?.display_value || cv?.text || '').trim();
    if (/^https?:\/\//i.test(display)) return display;
    const match = display.match(/https?:\/\/[^\s]+/i);
    return match?.[0] || '';
}

function buildPreviewSource(url: string): { mode: 'video' | 'iframe'; src: string } {
    const u = String(url || '').trim();
    if (!u) return { mode: 'iframe', src: '' };
    const driveId = extractGoogleDriveFileId(u);
    if (driveId) {
        return { mode: 'iframe', src: `https://drive.google.com/file/d/${driveId}/preview` };
    }
    const cleanUrl = u.split('?')[0];
    const ext = cleanUrl.split('.').pop()?.toLowerCase() || '';
    const isVideo = ['mp4', 'mov', 'webm', 'ogg', 'avi', 'mkv', 'm4v'].includes(ext);
    return isVideo ? { mode: 'video', src: u } : { mode: 'iframe', src: u };
}

function isPreviewableMediaLink(url: string): boolean {
    const u = String(url || '').trim();
    if (!u) return false;
    if (/drive\.google\.com\/drive\/folders\//i.test(u)) return false;
    if (/\/folders\//i.test(u) && /drive\.google\.com/i.test(u)) return false;
    return /^https?:\/\//i.test(u);
}

function inRange(dateYmd: string | null, from: string, to: string): boolean {
    if (!dateYmd) return false;
    return dateYmd >= from && dateYmd <= to;
}

function computeRange(kind: QuickRange, customFrom: string, customTo: string): { from: string; to: string } {
    const todayYmd = todaysYmdManila();
    const today = parseYmdToNoonManila(todayYmd);
    if (kind === 'today') {
        const d = todayYmd;
        return { from: d, to: d };
    }
    if (kind === 'yesterday') {
        const d = yesterdaysYmdManila();
        return { from: d, to: d };
    }
    if (kind === 'this_week') {
        const start = new Date(today);
        const day = start.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diff);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { from: ymdInManila(start), to: ymdInManila(end) };
    }
    if (kind === 'this_month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0, 0);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 12, 0, 0, 0);
        return { from: ymdInManila(start), to: ymdInManila(end) };
    }
    return {
        from: customFrom || todayYmd,
        to: customTo || todayYmd,
    };
}

export default function AdminDeployedProjects() {
    const videoRef = useRef<SubmissionVideoPlayerHandle>(null);
    const [loading, setLoading] = useState(true);
    const [savingRowId, setSavingRowId] = useState<string | null>(null);
    const [veBoardId, setVeBoardId] = useState<string | null>(null);
    const [rows, setRows] = useState<Row[]>([]);
    const [editorOptions, setEditorOptions] = useState<string[]>([]);
    const [statusOptions, setStatusOptions] = useState<string[]>(['Working on it', 'Done', 'Deployed']);
    const [columnMap, setColumnMap] = useState<Record<string, string>>({});
    const [quickRange, setQuickRange] = useState<QuickRange>('this_week');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [previewRow, setPreviewRow] = useState<Row | null>(null);
    const [statusToast, setStatusToast] = useState<string | null>(null);

    const activeRange = useMemo(
        () => computeRange(quickRange, customFrom, customTo),
        [quickRange, customFrom, customTo]
    );

    const filteredRows = useMemo(() => {
        return rows.filter(r => {
            if (!inRange(r.filterDateYmd, activeRange.from, activeRange.to)) return false;
            if (statusFilter === 'all') return true;
            return String(r.status || '').toLowerCase() === statusFilter.toLowerCase();
        });
    }, [rows, activeRange, statusFilter]);

    const resolveDeadlineYmd = (cv: any): string | null => {
        const rawText = String(cv?.text || cv?.display_value || '');
        const iso = rawText.match(/\d{4}-\d{2}-\d{2}/)?.[0];
        if (iso) return iso;
        if (cv?.value) {
            try {
                const parsed = JSON.parse(cv.value) as { date?: string; from?: string };
                const d = parsed.date || parsed.from;
                if (d && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
            } catch {
                /* ignore */
            }
        }
        return null;
    };

    const load = async (force = false) => {
        setLoading(true);
        try {
            const boards = await getAllBoards(force);
            const projectBoard = boards.find(
                (b: any) =>
                    (b.name.toLowerCase().includes('ve project board') ||
                        b.name.toLowerCase().includes('video editing project')) &&
                    !b.name.toLowerCase().startsWith('subitems')
            );
            if (!projectBoard) {
                setRows([]);
                return;
            }
            setVeBoardId(projectBoard.id);

            const [cols, boardData, users] = await Promise.all([
                getBoardColumns(projectBoard.id),
                getBoardItems(projectBoard.id, force),
                getUsers(),
            ]);

            setEditorOptions((users || []).map((u: any) => String(u.name || '')).filter(Boolean).sort());

            const getColId = (matcher: (title: string, type: string) => boolean) =>
                cols.find((c: any) => matcher(String(c.title || '').toLowerCase(), String(c.type || '').toLowerCase()))?.id || '';

            const statusId =
                getColId((t, type) => t === 'project status' || (t === 'status' && type === 'color')) ||
                getColId((t) => t.includes('status'));
            const editorId = getColId((t, type) => type === 'people' && (t.includes('editor') || t.includes('owner')));
            const priceId = getColId((t) => t.includes('price') || t.includes('budget'));
            const linkId = getColId((t) => t.includes('raw video') || t.includes('video link') || t === 'link');
            const submissionId = getColId((t) => t.includes('submission'));
            const instructionsId = getColId((t) => t.includes('instruction') || t.includes('notes'));
            const deadlineId = getColId((t) => t.includes('deadline') || t === 'date' || t.includes('due'));
            const deployedDateId = getColId(
                (t) =>
                    (t.includes('deploy') && (t.includes('date') || t.includes('on'))) ||
                    t.includes('deployment date') ||
                    t === 'date deployed'
            );

            setColumnMap({
                statusId,
                editorId,
                priceId,
                linkId,
                submissionId,
                instructionsId,
                deadlineId,
                deployedDateId,
            });

            const statusCol = cols.find((c: any) => c.id === statusId);
            if (statusCol?.settings_str) {
                try {
                    const parsed = JSON.parse(statusCol.settings_str);
                    const labelsObj = parsed?.labels || {};
                    const labels = Array.isArray(labelsObj)
                        ? labelsObj.map((x: any) => String(x?.name || x || '')).filter(Boolean)
                        : Object.values(labelsObj).map((x: any) => String(x?.name || x || '')).filter(Boolean);
                    if (labels.length > 0) setStatusOptions(Array.from(new Set(labels)));
                } catch {
                    /* ignore */
                }
            }

            const allRows: Row[] = (boardData?.items || []).map((it: any) => {
                const getCv = (id: string) => it.column_values?.find((v: any) => v.id === id);
                const rawVideoCv = getCv(linkId);
                const submissionCv = getCv(submissionId);
                const submissionLink = extractSubmissionUrlFromColumnValue(submissionCv);
                const rawVideoLink = extractLinkUrlFromColumnValue(rawVideoCv);
                return {
                    id: String(it.id),
                    name: String(it.name || ''),
                    status: String(getCv(statusId)?.text || getCv(statusId)?.display_value || ''),
                    editor: String(getCv(editorId)?.display_value || getCv(editorId)?.text || '').split(',')[0].trim(),
                    price: String(getCv(priceId)?.text || ''),
                    rawVideoLink,
                    submissionLink,
                    instructions: String(getCv(instructionsId)?.text || getCv(instructionsId)?.display_value || ''),
                    deadlineYmd: resolveDeadlineYmd(getCv(deadlineId)),
                    filterDateYmd:
                        resolveDeadlineYmd(getCv(deployedDateId)) ||
                        resolveDeadlineYmd(getCv(deadlineId)) ||
                        (it?.created_at ? ymdInManila(new Date(it.created_at)) : null),
                };
            });

            // Show all statuses; this page should be filtered only by selected date range.
            setRows(allRows);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load(false);
    }, []);

    useEffect(() => {
        if (!statusToast) return;
        const t = window.setTimeout(() => setStatusToast(null), 2400);
        return () => window.clearTimeout(t);
    }, [statusToast]);

    const setRow = (rowId: string, patch: Partial<Row>) => {
        setRows(prev => prev.map(r => (r.id === rowId ? { ...r, ...patch } : r)));
    };

    const savePatch = async (rowId: string, patch: Partial<Row>) => {
        const target = rows.find(r => r.id === rowId);
        if (!target) return;
        const merged = { ...target, ...patch };
        setRow(rowId, patch);
        await saveRow(merged);
    };

    const saveRow = async (row: Row) => {
        if (!veBoardId) return;
        setSavingRowId(row.id);
        try {
            const updates: Record<string, unknown> = {};
            const { statusId, linkId } = columnMap;
            if (statusId) updates[statusId] = { label: row.status };
            if (linkId) updates[linkId] = row.rawVideoLink ? { url: row.rawVideoLink, text: 'Raw Video' } : '';
            await updateMondayItemColumns(veBoardId, row.id, updates);
            maybeClearSubmissionVideoFeedback(veBoardId, row.id, row.status);
            if (isCvApprovedMondayStatus(row.status)) {
                setStatusToast('Approved (CV): video feedback has been auto-cleared.');
            }
        } finally {
            setSavingRowId(null);
        }
    };

    const canComposeAdminFeedback = (status: string): boolean => {
        const s = String(status || '').toLowerCase();
        if (isMondayStatusForApproval(status)) return true;
        return s.includes('revision') || s.includes('review');
    };

    return (
        <AdminPageLayout
            label="Admin"
            title="Deployed Projects"
            subtitle="Manage deployed videos from Monday in real time"
            action={
                <button
                    onClick={() => void load(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.07] text-white/60 hover:text-white text-xs font-semibold transition-all duration-150"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            }
        >
            <div className="space-y-4">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 flex flex-wrap items-center gap-2">
                    {[
                        { id: 'today', label: 'Today' },
                        { id: 'yesterday', label: 'Yesterday' },
                        { id: 'this_week', label: 'This week' },
                        { id: 'this_month', label: 'This month' },
                        { id: 'custom', label: 'Custom range' },
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setQuickRange(opt.id as QuickRange)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                quickRange === opt.id
                                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-200'
                                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                    {quickRange === 'custom' && (
                        <div className="ml-auto flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-white/45" />
                            <input
                                type="date"
                                value={customFrom}
                                onChange={e => setCustomFrom(e.target.value)}
                                className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white"
                            />
                            <span className="text-white/35 text-xs">to</span>
                            <input
                                type="date"
                                value={customTo}
                                onChange={e => setCustomTo(e.target.value)}
                                className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white"
                            />
                        </div>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-[11px] text-white/45 uppercase tracking-wider">Status</span>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white"
                        >
                            <option value="all" className="bg-zinc-900 text-white">
                                All statuses
                            </option>
                            {statusOptions.map(s => (
                                <option key={s} value={s} className="bg-zinc-900 text-white">
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {statusToast && (
                    <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-200">
                        {statusToast}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-40 text-white/50">
                        <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                ) : filteredRows.length === 0 ? (
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center text-white/40">
                        No deployed projects in selected range.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredRows.map(row => (
                            <div key={row.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                                    <div className="lg:col-span-3">
                                        <p className="text-sm font-semibold text-white">{row.name}</p>
                                        <p className="text-[11px] text-white/40 mt-1">Deadline: {row.deadlineYmd || 'N/A'}</p>
                                    </div>
                                    <div className="lg:col-span-2">
                                        <label className="text-[10px] text-white/40 uppercase tracking-wider">Status</label>
                                        <select
                                            value={row.status}
                                            onChange={e => {
                                                void savePatch(row.id, { status: e.target.value });
                                            }}
                                            className="mt-1 w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 py-2 text-xs text-white"
                                        >
                                            {statusOptions.map(s => (
                                                <option key={s} value={s} className="bg-zinc-900 text-white">
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="lg:col-span-2">
                                        <label className="text-[10px] text-white/40 uppercase tracking-wider">Editor</label>
                                        <div className="mt-1 w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 py-2 text-xs text-white/90">
                                            {row.editor || 'Unassigned'}
                                        </div>
                                    </div>
                                    <div className="lg:col-span-1">
                                        <label className="text-[10px] text-white/40 uppercase tracking-wider">Price</label>
                                        <div className="mt-1 w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 py-2 text-xs text-white/90">
                                            {row.price || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="lg:col-span-3">
                                        <label className="text-[10px] text-white/40 uppercase tracking-wider">Raw Video Link</label>
                                        <div className="mt-1 w-full h-9 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 flex items-center text-xs text-white/90">
                                            {row.rawVideoLink ? (
                                                <a
                                                    href={row.rawVideoLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block text-sky-300 hover:underline truncate"
                                                >
                                                    {row.rawVideoLink}
                                                </a>
                                            ) : (
                                                'N/A'
                                            )}
                                        </div>
                                    </div>
                                    <div className="lg:col-span-2 flex items-end">
                                        <div className="w-full mt-1 lg:mt-0 flex items-center justify-start gap-2">
                                            <button
                                                onClick={() => void saveRow(row)}
                                                disabled={savingRowId === row.id}
                                                className="h-9 min-w-[88px] inline-flex items-center justify-center gap-1 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-50"
                                            >
                                                {savingRowId === row.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                Save
                                            </button>
                                            {isPreviewableMediaLink(row.submissionLink || row.rawVideoLink) && (
                                                <button
                                                    onClick={() => setPreviewRow(row)}
                                                    className="h-9 min-w-[96px] inline-flex items-center justify-center gap-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                                                >
                                                    <PlayCircle className="w-3.5 h-3.5" />
                                                    Preview
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Instructions hidden on this page</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <YouTubeModal
                isOpen={!!previewRow}
                onClose={() => setPreviewRow(null)}
                title={previewRow?.name || 'Preview'}
                mainContent={
                    previewRow?.submissionLink || previewRow?.rawVideoLink ? (
                        (() => {
                            const preview = buildPreviewSource(previewRow.submissionLink || previewRow.rawVideoLink);
                            if (preview.mode === 'video') {
                                return <SubmissionVideoPlayer ref={videoRef} url={preview.src} />;
                            }
                            return (
                                <iframe
                                    src={preview.src}
                                    className="w-full h-full border-0 min-h-[40vh]"
                                    title={previewRow.name}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            );
                        })()
                    ) : (
                        <div className="text-white/60 text-sm">No video link for this row.</div>
                    )
                }
                splitSidePanel={
                    previewRow && veBoardId && (previewRow.submissionLink || previewRow.rawVideoLink) ? (
                        <SubmissionVideoFeedbackPanel
                            boardId={veBoardId}
                            itemId={previewRow.id}
                            projectName={previewRow.name}
                            mode="admin"
                            videoRef={videoRef}
                            editorNameHint={previewRow.editor}
                            canCompose={canComposeAdminFeedback(previewRow.status)}
                        />
                    ) : undefined
                }
            />
        </AdminPageLayout>
    );
}

