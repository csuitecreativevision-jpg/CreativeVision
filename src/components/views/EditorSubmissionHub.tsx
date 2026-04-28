import { useState, useMemo, useRef, useEffect } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle, Link2 } from 'lucide-react';
import { getBoardColumns, updateSourceColumn, uploadFileToItemColumn } from '../../services/mondayService';
import { getMondayFileUploadTarget } from '../shared/BoardCell';
import { fireCvSwal } from '../../lib/swalTheme';

export interface SubmissionRow {
    boardId: string;
    boardLabel: string;
    item: any;
    submissionColumn: any;
    uploadTarget: { itemId: string; columnId: string };
    hasFile: boolean;
    statusColumn: any | null;
}

function getSubmissionUpdateTarget(row: SubmissionRow): { boardId: string; itemId: string; columnId: string } | null {
    const col = row.submissionColumn;
    if (!col) return null;
    if (col.type === 'file' || col.type === 'link' || col.type === 'text') {
        return { boardId: row.boardId, itemId: row.item.id, columnId: col.id };
    }
    if ((col.type === 'mirror' || col.type === 'lookup') && col.settings_str) {
        let sourceBoardId = '';
        let sourceColumnId = '';
        let relationColId = '';
        try {
            const settings = JSON.parse(col.settings_str);
            if (settings.displayed_linked_columns) {
                const boardIds = Object.keys(settings.displayed_linked_columns);
                if (boardIds.length > 0) {
                    sourceBoardId = boardIds[0];
                    const linkedCols = settings.displayed_linked_columns[boardIds[0]];
                    if (linkedCols && linkedCols.length > 0) {
                        sourceColumnId = linkedCols[0];
                    }
                }
            }
            if (settings.relation_column) {
                const relKeys = Object.keys(settings.relation_column);
                if (relKeys.length > 0) {
                    relationColId = relKeys[0];
                }
            }
        } catch {
            return null;
        }
        if (!relationColId || !sourceColumnId || !sourceBoardId) return null;
        const relationColValue = row.item.column_values?.find((c: any) => c.id === relationColId);
        if (!relationColValue) return null;
        let sourceItemId = '';
        const rawLinked = (relationColValue as { linked_item_ids?: string[] }).linked_item_ids;
        if (rawLinked && Array.isArray(rawLinked) && rawLinked.length > 0) {
            sourceItemId = String(rawLinked[0]);
        } else if (relationColValue.value) {
            try {
                const parsedRel = JSON.parse(relationColValue.value);
                if (parsedRel?.linkedPulseIds?.length > 0) {
                    sourceItemId = String(parsedRel.linkedPulseIds[0].linkedPulseId);
                }
            } catch {
                return null;
            }
        }
        if (!sourceItemId) return null;
        return { boardId: sourceBoardId, itemId: sourceItemId, columnId: sourceColumnId };
    }
    return null;
}

function getSubmissionDisplayValue(row: SubmissionRow): string {
    const val = row.item?.column_values?.find((v: any) => v.id === row.submissionColumn?.id);
    if (!val) return '';
    if (val.value) {
        try {
            const parsed = JSON.parse(val.value);
            if (parsed?.url) return String(parsed.url).trim();
            if (parsed?.files?.length > 0) return String(parsed.files[0]?.name || '').trim();
        } catch {
            /* ignore */
        }
    }
    const dv = String(val.display_value || '').trim();
    if (dv) return dv;
    return String(val.text || '').trim();
}

function displayWorkspaceName(raw: string): string {
    return raw.replace(/- Workspace/i, '').replace(/\(c-w-[\w-]+\)/gi, '').trim();
}

function findSubmissionColumn(columns: any[] | undefined): any | null {
    if (!columns) return null;
    return columns.find((c: any) => c.title?.toLowerCase().includes('submission')) || null;
}

function findStatusColumn(columns: any[] | undefined): any | null {
    if (!columns) return null;
    const norm = (s: string) => String(s || '').trim().toLowerCase();
    const cols = columns;
    const exactProjectStatus =
        cols.find((c: any) => norm(c.title) === 'project status') ||
        cols.find((c: any) => norm(c.title) === 'status (project)') ||
        cols.find((c: any) => norm(c.title) === 'project status (cv)');
    if (exactProjectStatus) return exactProjectStatus;
    const containsProjectStatus = cols.find((c: any) => norm(c.title).includes('project status'));
    if (containsProjectStatus) return containsProjectStatus;
    return cols.find(
        (c: any) =>
            norm(c.title).includes('status') &&
            (c.type === 'status' || c.type === 'color' || c.type === 'mirror' || c.type === 'lookup')
    ) || null;
}

function getStatusText(item: any, statusColumn: any | null): string {
    if (!statusColumn) return '';
    const val = item?.column_values?.find((v: any) => v.id === statusColumn.id);
    return String(val?.text || val?.display_value || '').trim();
}

function getStatusUpdateTarget(row: SubmissionRow): { boardId: string; itemId: string; columnId: string } | null {
    const col = row.statusColumn;
    if (!col) return null;
    if (col.type === 'status' || col.type === 'color') {
        return { boardId: row.boardId, itemId: row.item.id, columnId: col.id };
    }
    if ((col.type === 'mirror' || col.type === 'lookup') && col.settings_str) {
        let sourceBoardId = '';
        let sourceColumnId = '';
        let relationColId = '';
        try {
            const settings = JSON.parse(col.settings_str);
            if (settings.displayed_linked_columns) {
                const boardIds = Object.keys(settings.displayed_linked_columns);
                if (boardIds.length > 0) {
                    sourceBoardId = boardIds[0];
                    const linkedCols = settings.displayed_linked_columns[boardIds[0]];
                    if (linkedCols && linkedCols.length > 0) sourceColumnId = linkedCols[0];
                }
            }
            if (settings.relation_column) {
                const relKeys = Object.keys(settings.relation_column);
                if (relKeys.length > 0) relationColId = relKeys[0];
            }
        } catch {
            return null;
        }
        if (!relationColId || !sourceColumnId || !sourceBoardId) return null;
        const relationColValue = row.item.column_values?.find((c: any) => c.id === relationColId);
        if (!relationColValue) return null;
        let sourceItemId = '';
        const rawLinked = (relationColValue as { linked_item_ids?: string[] }).linked_item_ids;
        if (rawLinked && Array.isArray(rawLinked) && rawLinked.length > 0) {
            sourceItemId = String(rawLinked[0]);
        } else if (relationColValue.value) {
            try {
                const parsedRel = JSON.parse(relationColValue.value);
                if (parsedRel?.linkedPulseIds?.length > 0) {
                    sourceItemId = String(parsedRel.linkedPulseIds[0].linkedPulseId);
                }
            } catch {
                return null;
            }
        }
        if (!sourceItemId) return null;
        return { boardId: sourceBoardId, itemId: sourceItemId, columnId: sourceColumnId };
    }
    return null;
}

function getStatusOptions(statusColumn: any | null, rows: SubmissionRow[]): string[] {
    const fromSettings: string[] = [];
    if (statusColumn?.settings_str) {
        try {
            const parsed = JSON.parse(statusColumn.settings_str);
            const labelsObj = parsed?.labels || {};
            const labels = Array.isArray(labelsObj)
                ? labelsObj.map((x: any) => String(x?.name || x || '').trim()).filter(Boolean)
                : Object.values(labelsObj).map((x: any) => String(x?.name || x || '').trim()).filter(Boolean);
            fromSettings.push(...labels);
        } catch {
            /* ignore */
        }
    }
    const fromRows = rows
        .map(r => getStatusText(r.item, r.statusColumn))
        .filter(Boolean);
    return Array.from(new Set([...fromSettings, ...fromRows]));
}

function flattenBoardItems(boardData: any): any[] {
    if (!boardData?.groups || !boardData?.items) return [];
    return boardData.groups.flatMap((g: any) =>
        boardData.items.filter((i: any) => i.group?.id === g.id).map((i: any) => ({ ...i, groupTitle: g.title }))
    );
}

function itemHasSubmissionFile(item: any, submissionCol: any): boolean {
    if (!submissionCol || !item.column_values) return false;
    const val = item.column_values.find((v: any) => v.id === submissionCol.id);
    if (!val) return false;
    if (val.value) {
        try {
            const j = JSON.parse(val.value);
            if (j.files?.length > 0) return true;
            if (j.url) return true;
        } catch {
            /* ignore */
        }
    }
    const dv = val.display_value;
    if (dv && String(dv).startsWith('http')) return true;
    const text = val.text || '';
    if (/\.(mp4|mov|webm|pdf)/i.test(text)) return true;
    return false;
}

export function isItemAssignedToEditor(item: any, columns: any[] | undefined, userNameRaw: string): boolean {
    if (!columns?.length || !userNameRaw) return true;
    const editorCol = columns.find(
        (c: any) => c.title?.toLowerCase().includes('editor') || c.type === 'people'
    );
    if (!editorCol) return true;
    const editorVal = item.column_values?.find((v: any) => v.id === editorCol.id);
    const editorName = (editorVal?.text || editorVal?.display_value || '').toLowerCase().trim();
    if (!editorName) return true;
    const normalizedUser = userNameRaw.toLowerCase().trim();
    return (
        editorName.includes(normalizedUser) ||
        normalizedUser.includes(editorName) ||
        editorName.split(/\s+/).some((w: string) => w.length > 2 && normalizedUser.includes(w))
    );
}

/** Build upload rows for one board (uses in-memory `boardData`; no extra Monday fetch). */
export function buildSubmissionRowsForBoard(boardData: any, boardId: string, boardName: string): SubmissionRow[] {
    const editorFilterName =
        typeof localStorage !== 'undefined' ? localStorage.getItem('portal_user_name') || '' : '';
    const submissionCol = findSubmissionColumn(boardData?.columns);
    const statusCol = findStatusColumn(boardData?.columns);
    if (!submissionCol) return [];
    const items = flattenBoardItems(boardData);
    const boardLabel = displayWorkspaceName(boardName || '');
    const next: SubmissionRow[] = [];
    for (const item of items) {
        if (!isItemAssignedToEditor(item, boardData.columns, editorFilterName)) continue;
        const uploadTarget = getMondayFileUploadTarget(item, submissionCol);
        if (!uploadTarget) continue;
        const hasFile = itemHasSubmissionFile(item, submissionCol);
        next.push({
            boardId,
            boardLabel,
            item,
            submissionColumn: submissionCol,
            uploadTarget,
            hasFile,
            statusColumn: statusCol,
        });
    }
    next.sort((a, b) => (a.item.name || '').localeCompare(b.item.name || ''));
    return next;
}

const FILE_ACCEPT = 'video/*,image/*,.pdf,.mp4,.mov,.webm';
const EDITOR_ALLOWED_STATUS_LABELS = [
    'Downloading',
    'Working on it',
    'Exporting & Uploading',
    'Taking a break (cv)',
    'For Approval',
];
const EDITOR_STATUS_LOCKED_LABELS = [
    'Approved (CV)',
    'Waiting for Client',
    'Approved (Client)',
];

function normalizeStatusLabel(label: string): string {
    return String(label || '')
        .toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/[^a-z0-9]+/g, '');
}

function getAllowedStatusMatchKeys(label: string): string[] {
    const n = normalizeStatusLabel(label);
    if (n === normalizeStatusLabel('Exporting & Uploading')) {
        return [n, normalizeStatusLabel('Exporting and Uploading')];
    }
    if (n === normalizeStatusLabel('For Approval')) {
        return [n, normalizeStatusLabel('For Approval (CV)')];
    }
    if (n === normalizeStatusLabel('Working on it')) {
        return [n, normalizeStatusLabel('Working on it (CV)')];
    }
    if (n === normalizeStatusLabel('Taking a break (cv)')) {
        return [n, normalizeStatusLabel('Taking a break')];
    }
    return [n];
}

function isEditorStatusLocked(currentStatus: string): boolean {
    const n = normalizeStatusLabel(currentStatus);
    return EDITOR_STATUS_LOCKED_LABELS.some((s) => normalizeStatusLabel(s) === n);
}

function extractStatusLabelsFromColumn(statusColumn: any | null): string[] {
    if (!statusColumn?.settings_str) return [];
    try {
        const parsed = JSON.parse(String(statusColumn.settings_str || '{}'));
        const labelsObj = parsed?.labels || {};
        return (Array.isArray(labelsObj)
            ? labelsObj.map((x: any) => String(x?.name || x || '').trim())
            : Object.values(labelsObj).map((x: any) => String(x?.name || x || '').trim())
        ).filter(Boolean);
    } catch {
        return [];
    }
}

function getAllowedEditorStatusOptionsFromLabels(mondayLabels: string[]): string[] {
        const mondayByNorm = new Map(mondayLabels.map((s: string) => [normalizeStatusLabel(s), s]));
        return EDITOR_ALLOWED_STATUS_LABELS
            .map((allowed) => {
                const keys = getAllowedStatusMatchKeys(allowed);
                for (const k of keys) {
                    const hit = mondayByNorm.get(k);
                    if (hit) return hit;
                }
                return '';
            })
            .filter(Boolean);
}

export interface EditorSubmissionBoardPanelProps {
    boardData: any;
    boardId: string;
    onRefresh: () => void | Promise<void>;
    onOpenItem: (item: any) => void;
    /** Pre-filtered rows (e.g. search + status). If omitted, derived from `boardData`. */
    rows?: SubmissionRow[];
}

/** Inline submission uploads for the current workspace (no collapsible chrome). */
export function EditorSubmissionBoardPanel({
    boardData,
    boardId,
    onRefresh,
    onOpenItem,
    rows: rowsProp
}: EditorSubmissionBoardPanelProps) {
    const [uploadingKey, setUploadingKey] = useState<string | null>(null);
    const [savingLinkKey, setSavingLinkKey] = useState<string | null>(null);
    const [deletingLinkKey, setDeletingLinkKey] = useState<string | null>(null);
    const [savingStatusKey, setSavingStatusKey] = useState<string | null>(null);
    const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
    const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
    const [statusOptions, setStatusOptions] = useState<string[]>([]);
    const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

    const rows = useMemo(() => {
        if (rowsProp) return rowsProp;
        if (!boardData) return [];
        return buildSubmissionRowsForBoard(boardData, boardId, boardData.name || '');
    }, [rowsProp, boardData, boardId]);
    useEffect(() => {
        let cancelled = false;
        const resolveStatusOptions = async () => {
            const col = rows[0]?.statusColumn || findStatusColumn(boardData?.columns);
            if (!col) {
                if (!cancelled) setStatusOptions([]);
                return;
            }
            const directLabels = extractStatusLabelsFromColumn(col);
            if (directLabels.length > 0) {
                if (!cancelled) setStatusOptions(getAllowedEditorStatusOptionsFromLabels(directLabels));
                return;
            }
            if ((col.type === 'mirror' || col.type === 'lookup') && col.settings_str) {
                try {
                    const settings = JSON.parse(String(col.settings_str || '{}'));
                    const boardIds = settings?.displayed_linked_columns ? Object.keys(settings.displayed_linked_columns) : [];
                    const sourceBoardId = boardIds[0];
                    const sourceColId = sourceBoardId ? settings.displayed_linked_columns[sourceBoardId]?.[0] : null;
                    if (sourceBoardId && sourceColId) {
                        const sourceCols = await getBoardColumns(sourceBoardId);
                        const sourceCol = sourceCols?.find((c: any) => c.id === sourceColId);
                        const sourceLabels = extractStatusLabelsFromColumn(sourceCol);
                        if (!cancelled) {
                            setStatusOptions(getAllowedEditorStatusOptionsFromLabels(sourceLabels));
                        }
                        return;
                    }
                } catch {
                    /* ignore */
                }
            }
            if (!cancelled) setStatusOptions([]);
        };
        void resolveStatusOptions();
        return () => {
            cancelled = true;
        };
    }, [rows, boardData?.columns]);

    const handleFile = async (row: SubmissionRow, files: FileList | null) => {
        const file = files?.[0];
        if (!file) return;
        const key = `${row.boardId}-${row.item.id}`;
        setUploadingKey(key);
        try {
            await uploadFileToItemColumn(row.uploadTarget.itemId, row.uploadTarget.columnId, file);
            await onRefresh();
        } catch (err) {
            console.error(err);
            await fireCvSwal({
                icon: 'error',
                title: 'Upload failed',
                text: err instanceof Error ? err.message : 'Upload failed',
            });
        } finally {
            setUploadingKey(null);
            const inp = fileInputsRef.current[key];
            if (inp) inp.value = '';
        }
    };

    const handleSaveLink = async (row: SubmissionRow) => {
        const key = `${row.boardId}-${row.item.id}`;
        const url = String(linkDrafts[key] || '').trim();
        if (!url) return;
        const isHttp = /^https?:\/\//i.test(url);
        if (!isHttp) {
            await fireCvSwal({
                icon: 'warning',
                title: 'Invalid link',
                text: 'Please enter a valid URL that starts with http:// or https://',
            });
            return;
        }
        if (row.submissionColumn?.type === 'file') {
            await fireCvSwal({
                icon: 'info',
                title: 'This Submission column is file-only',
                text: 'Use Upload for this project, or ask admin to map Submission to a Link column for Drive links.',
            });
            return;
        }
        const target = getSubmissionUpdateTarget(row);
        if (!target) {
            await fireCvSwal({
                icon: 'error',
                title: 'Cannot save link',
                text: 'Submission column is not linked to an editable source column.',
            });
            return;
        }
        setSavingLinkKey(key);
        try {
            const linkPayload = JSON.stringify({ url, text: row.item.name || 'Submission Link' });
            await updateSourceColumn(target.boardId, target.itemId, target.columnId, linkPayload);
            await onRefresh();
            setLinkDrafts((prev) => ({ ...prev, [key]: '' }));
            await fireCvSwal({
                icon: 'success',
                title: 'Submission link saved',
                text: 'The link was synced to Monday Submission.',
                timer: 1300,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error(err);
            await fireCvSwal({
                icon: 'error',
                title: 'Failed to save link',
                text: err instanceof Error ? err.message : 'Could not update Monday submission link.',
            });
        } finally {
            setSavingLinkKey(null);
        }
    };

    const handleDeleteLink = async (row: SubmissionRow) => {
        const key = `${row.boardId}-${row.item.id}`;
        const target = getSubmissionUpdateTarget(row);
        if (!target) {
            await fireCvSwal({
                icon: 'error',
                title: 'Cannot delete link',
                text: 'Submission column is not linked to an editable source column.',
            });
            return;
        }
        if (row.submissionColumn?.type === 'file') {
            await fireCvSwal({
                icon: 'info',
                title: 'File submission detected',
                text: 'This row is using a file submission column. Use Monday file controls to remove uploaded files.',
            });
            return;
        }
        const confirm = await fireCvSwal({
            icon: 'warning',
            title: 'Delete submission link?',
            text: 'This will remove the link from CreativeVision and Monday.',
            showCancelButton: true,
            confirmButtonText: 'Delete Link',
            cancelButtonText: 'Cancel',
            customClass: {
                confirmButton:
                    '!rounded-xl !px-5 !py-2.5 !font-semibold !text-white !bg-red-600 hover:!bg-red-500 focus:!outline-none',
            },
        });
        if (!confirm.isConfirmed) return;

        setDeletingLinkKey(key);
        try {
            await updateSourceColumn(target.boardId, target.itemId, target.columnId, JSON.stringify({ url: '', text: '' }));
            await onRefresh();
            setLinkDrafts((prev) => ({ ...prev, [key]: '' }));
            await fireCvSwal({
                icon: 'success',
                title: 'Submission link deleted',
                timer: 1200,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error(err);
            await fireCvSwal({
                icon: 'error',
                title: 'Failed to delete link',
                text: err instanceof Error ? err.message : 'Could not remove link from Monday.',
            });
        } finally {
            setDeletingLinkKey(null);
        }
    };

    const handleSaveStatus = async (row: SubmissionRow, explicitStatus?: string) => {
        const key = `${row.boardId}-${row.item.id}`;
        const currentStatus = getStatusText(row.item, row.statusColumn);
        if (isEditorStatusLocked(currentStatus)) {
            await fireCvSwal({
                icon: 'info',
                title: 'Status is locked',
                text: 'This project is already Approved (CV), Waiting for Client, or Approved (Client). Editors can no longer change its status.',
            });
            return;
        }
        const nextStatus = String(explicitStatus ?? statusDrafts[key] ?? '').trim();
        if (!nextStatus) return;
        const allowedNorm = new Set(statusOptions.map(normalizeStatusLabel));
        if (!allowedNorm.has(normalizeStatusLabel(nextStatus))) {
            await fireCvSwal({
                icon: 'warning',
                title: 'Status not allowed',
                text: 'Editors can only use: Downloading, Working on it, Exporting & Uploading, Taking a break (cv), and For Approval.',
            });
            return;
        }
        const target = getStatusUpdateTarget(row);
        if (!target) {
            await fireCvSwal({
                icon: 'error',
                title: 'Cannot update status',
                text: 'Status column is not linked to an editable source column.',
            });
            return;
        }
        setSavingStatusKey(key);
        try {
            await updateSourceColumn(target.boardId, target.itemId, target.columnId, JSON.stringify({ label: nextStatus }));
            await onRefresh();
            await fireCvSwal({
                icon: 'success',
                title: 'Status updated',
                timer: 1100,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error(err);
            await fireCvSwal({
                icon: 'error',
                title: 'Failed to update status',
                text: err instanceof Error ? err.message : 'Could not update status in Monday.',
            });
        } finally {
            setSavingStatusKey(null);
        }
    };

    if (!boardData) return null;

    if (!findSubmissionColumn(boardData.columns)) {
        return (
            <div className="flex items-start gap-3 py-8 px-2 text-amber-200/90 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-semibold text-amber-100/95">No Submission column on this board</p>
                    <p className="text-amber-200/70 mt-1 text-xs leading-relaxed">
                        Add a Monday column with &quot;Submission&quot; in the title (file column, or mirror of one).
                    </p>
                </div>
            </div>
        );
    }

    if (rows.length === 0) {
        return (
            <div className="flex items-start gap-3 py-8 px-2 text-gray-400 rounded-2xl border border-white/10 bg-white/[0.02]">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-70" />
                <div className="text-sm">
                    <p className="font-medium text-gray-300">No projects ready for submission upload</p>
                    <p className="text-gray-500 mt-1 text-xs leading-relaxed">
                        Rows must resolve to a Monday file column (or a linked Submission mirror). If you use an Editor
                        column, your name must match.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ul className="space-y-2">
            {rows.map((row) => {
                const key = `${row.boardId}-${row.item.id}`;
                const busy = uploadingKey === key;
                const submissionValue = getSubmissionDisplayValue(row);
                const hasHttpLink = /^https?:\/\//i.test(submissionValue);
                const currentStatus = getStatusText(row.item, row.statusColumn);
                const selectedStatus = statusDrafts[key] ?? '';
                const statusLocked = isEditorStatusLocked(currentStatus);
                return (
                    <li
                        key={key}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/20 transition-colors"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{row.item.name}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                {row.hasFile ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/90">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Has preview
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                                        Needs upload
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
                            <input
                                ref={(el) => {
                                    fileInputsRef.current[key] = el;
                                }}
                                type="file"
                                className="hidden"
                                accept={FILE_ACCEPT}
                                onChange={(e) => handleFile(row, e.target.files)}
                            />
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => fileInputsRef.current[key]?.click()}
                                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-[11px] font-bold uppercase tracking-wider"
                            >
                                {busy ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Upload className="w-3.5 h-3.5" />
                                )}
                                {busy ? 'Uploading…' : 'Upload'}
                            </button>
                            <div className="flex items-center gap-2">
                                {statusOptions.length > 0 ? (
                                    <>
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => {
                                                const next = e.target.value;
                                                setStatusDrafts((prev) => ({ ...prev, [key]: next }));
                                                if (!next || statusLocked || next === currentStatus || savingStatusKey === key) return;
                                                void handleSaveStatus(row, next);
                                            }}
                                            disabled={statusLocked || savingStatusKey === key}
                                            className="w-64 sm:w-72 bg-[#0e0e1a] border border-white/10 rounded-lg px-2 py-2 text-[11px] text-white focus:outline-none focus:border-violet-500/50"
                                        >
                                            <option value="" className="bg-zinc-900 text-white/70">
                                                {currentStatus ? `Current: ${currentStatus}` : 'Select status...'}
                                            </option>
                                            {statusOptions.map((s) => (
                                                <option key={s} value={s} className="bg-zinc-900 text-white">
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                        {savingStatusKey === key && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />}
                                        {statusLocked && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/85">
                                                Status locked
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/85">
                                        Status options missing in Monday
                                    </span>
                                )}
                                <input
                                    type="url"
                                    placeholder="Paste Drive/link URL"
                                    value={linkDrafts[key] || ''}
                                    onChange={(e) => setLinkDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                                    className="w-52 sm:w-64 bg-[#0e0e1a] border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50"
                                />
                                <button
                                    type="button"
                                    disabled={busy || savingLinkKey === key || deletingLinkKey === key || !String(linkDrafts[key] || '').trim()}
                                    onClick={() => void handleSaveLink(row)}
                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-violet-500/35 text-violet-200 hover:bg-violet-500/15 disabled:opacity-50 text-[11px] font-bold uppercase tracking-wider"
                                >
                                    {savingLinkKey === key ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Link2 className="w-3.5 h-3.5" />
                                    )}
                                    {savingLinkKey === key ? 'Saving…' : 'Save Link'}
                                </button>
                                <button
                                    type="button"
                                    disabled={busy || savingLinkKey === key || deletingLinkKey === key || !hasHttpLink}
                                    onClick={() => void handleDeleteLink(row)}
                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-500/35 text-red-200 hover:bg-red-500/15 disabled:opacity-50 text-[11px] font-bold uppercase tracking-wider"
                                >
                                    {deletingLinkKey === key ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        'Delete Link'
                                    )}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => onOpenItem(row.item)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-[11px] font-bold uppercase tracking-wider"
                            >
                                Open
                            </button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
