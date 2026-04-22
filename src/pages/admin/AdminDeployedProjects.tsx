import { useEffect, useMemo, useState } from 'react';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { Calendar, Loader2, RefreshCw, Save } from 'lucide-react';
import {
    getAllBoards,
    getBoardColumns,
    getBoardItems,
    getUsers,
    updateMondayItemColumns,
} from '../../services/mondayService';

type QuickRange = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom';

type Row = {
    id: string;
    name: string;
    status: string;
    editor: string;
    price: string;
    rawVideoLink: string;
    instructions: string;
    deadlineYmd: string | null;
};

function ymd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function inRange(dateYmd: string | null, from: string, to: string): boolean {
    if (!dateYmd) return false;
    return dateYmd >= from && dateYmd <= to;
}

function computeRange(kind: QuickRange, customFrom: string, customTo: string): { from: string; to: string } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
    if (kind === 'today') {
        const d = ymd(today);
        return { from: d, to: d };
    }
    if (kind === 'yesterday') {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        const d = ymd(y);
        return { from: d, to: d };
    }
    if (kind === 'this_week') {
        const start = new Date(today);
        const day = start.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diff);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { from: ymd(start), to: ymd(end) };
    }
    if (kind === 'this_month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0, 0);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 12, 0, 0, 0);
        return { from: ymd(start), to: ymd(end) };
    }
    return {
        from: customFrom || ymd(today),
        to: customTo || ymd(today),
    };
}

export default function AdminDeployedProjects() {
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

    const activeRange = useMemo(
        () => computeRange(quickRange, customFrom, customTo),
        [quickRange, customFrom, customTo]
    );

    const filteredRows = useMemo(
        () => rows.filter(r => inRange(r.deadlineYmd, activeRange.from, activeRange.to)),
        [rows, activeRange]
    );

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
            const instructionsId = getColId((t) => t.includes('instruction') || t.includes('notes'));
            const deadlineId = getColId((t) => t.includes('deadline') || t === 'date' || t.includes('due'));

            setColumnMap({
                statusId,
                editorId,
                priceId,
                linkId,
                instructionsId,
                deadlineId,
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
                return {
                    id: String(it.id),
                    name: String(it.name || ''),
                    status: String(getCv(statusId)?.text || getCv(statusId)?.display_value || ''),
                    editor: String(getCv(editorId)?.display_value || getCv(editorId)?.text || '').split(',')[0].trim(),
                    price: String(getCv(priceId)?.text || ''),
                    rawVideoLink: String(getCv(linkId)?.text || ''),
                    instructions: String(getCv(instructionsId)?.text || getCv(instructionsId)?.display_value || ''),
                    deadlineYmd: resolveDeadlineYmd(getCv(deadlineId)),
                };
            });

            const deployedOnly = allRows.filter(r => {
                const s = r.status.toLowerCase();
                return s.includes('deployed') || s.includes('done');
            });
            setRows(deployedOnly);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load(false);
    }, []);

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
            const { statusId, editorId, priceId, linkId, instructionsId } = columnMap;
            if (statusId) updates[statusId] = { label: row.status };
            if (priceId) updates[priceId] = row.price || '';
            if (linkId) updates[linkId] = row.rawVideoLink ? { url: row.rawVideoLink, text: 'Raw Video' } : '';
            if (instructionsId) updates[instructionsId] = { text: row.instructions || '' };
            if (editorId && row.editor) {
                const users = await getUsers();
                const match = (users || []).find((u: any) => String(u.name || '').toLowerCase() === row.editor.toLowerCase())
                    || (users || []).find((u: any) => String(u.name || '').toLowerCase().includes(row.editor.toLowerCase()));
                if (match) updates[editorId] = { personsAndTeams: [{ id: Number(match.id), kind: 'person' }] };
            }
            await updateMondayItemColumns(veBoardId, row.id, updates);
        } finally {
            setSavingRowId(null);
        }
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
                </div>

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
                                        <select
                                            value={row.editor}
                                            onChange={e => {
                                                void savePatch(row.id, { editor: e.target.value });
                                            }}
                                            className="mt-1 w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 py-2 text-xs text-white"
                                        >
                                            <option value="" className="bg-zinc-900 text-white">Unassigned</option>
                                            {editorOptions.map(s => (
                                                <option key={s} value={s} className="bg-zinc-900 text-white">
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="lg:col-span-1">
                                        <label className="text-[10px] text-white/40 uppercase tracking-wider">Price</label>
                                        <input
                                            value={row.price}
                                            onChange={e => setRow(row.id, { price: e.target.value })}
                                            onBlur={() => void saveRow(row)}
                                            className="mt-1 w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 py-2 text-xs text-white"
                                        />
                                    </div>
                                    <div className="lg:col-span-3">
                                        <label className="text-[10px] text-white/40 uppercase tracking-wider">Raw Video Link</label>
                                        <input
                                            value={row.rawVideoLink}
                                            onChange={e => setRow(row.id, { rawVideoLink: e.target.value })}
                                            onBlur={() => void saveRow(row)}
                                            className="mt-1 w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 py-2 text-xs text-white"
                                        />
                                    </div>
                                    <div className="lg:col-span-1 flex justify-end">
                                        <button
                                            onClick={() => void saveRow(row)}
                                            disabled={savingRowId === row.id}
                                            className="mt-5 inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-50"
                                        >
                                            {savingRowId === row.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                            Save
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label className="text-[10px] text-white/40 uppercase tracking-wider">Instructions</label>
                                    <textarea
                                        rows={3}
                                        value={row.instructions}
                                        onChange={e => setRow(row.id, { instructions: e.target.value })}
                                        onBlur={() => void saveRow(row)}
                                        className="mt-1 w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 py-2 text-xs text-white resize-y"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminPageLayout>
    );
}

