import { getBoardItems } from './mondayService';
import { getItemDeadlineDate, isDeadlineOverdueForBacklog } from '../lib/mondayItemDeadline';
import { isItemAssignedToEditor } from '../components/views/EditorSubmissionHub';

export type EditorBacklogCategory = 'assigned_overdue' | 'working_on_it' | 'sent_revisions';

export interface EditorBacklogEntry {
    boardId: string;
    boardName: string;
    itemId: string;
    itemName: string;
    statusLabel: string;
    category: EditorBacklogCategory;
    deadlineSummary: string | null;
    /** True when the item has a parsed deadline before today (any status). */
    deadlineOverdue: boolean;
}

function getStatusLabel(item: any, columns: any[]): string {
    const statusCol = columns?.find((c: any) => String(c?.title || '').toLowerCase().includes('status'));
    if (!statusCol) return '';
    const cv = item.column_values?.find((v: any) => v.id === statusCol.id);
    return String(cv?.text || cv?.display_value || '').trim();
}

/** Map Monday status to backlog category, or null if not in scope. */
export function editorBacklogCategory(statusLabel: string, due: Date | null): EditorBacklogCategory | null {
    const s = statusLabel.toLowerCase();
    if (s.includes('sent for revision') || s.includes('sent for review')) return 'sent_revisions';
    if (s.includes('working on it')) return 'working_on_it';
    if (s.includes('assigned') && isDeadlineOverdueForBacklog(due)) return 'assigned_overdue';
    return null;
}

function flattenItems(boardData: any): any[] {
    if (!boardData?.items?.length) return [];
    if (boardData.groups?.length) {
        return boardData.groups.flatMap((g: any) =>
            boardData.items.filter((i: any) => i.group?.id === g.id)
        );
    }
    return boardData.items;
}

export async function fetchEditorBacklogEntries(boardIds: string[], editorUserName: string): Promise<EditorBacklogEntry[]> {
    const out: EditorBacklogEntry[] = [];
    for (const boardId of boardIds) {
        try {
            const boardData = await getBoardItems(boardId, true);
            const columns = boardData?.columns || [];
            const items = flattenItems(boardData);
            for (const item of items) {
                if (!isItemAssignedToEditor(item, columns, editorUserName)) continue;
                const statusLabel = getStatusLabel(item, columns);
                const due = getItemDeadlineDate(item, columns);
                const category = editorBacklogCategory(statusLabel, due);
                if (!category) continue;
                const deadlineOverdue = isDeadlineOverdueForBacklog(due);
                let deadlineSummary: string | null = null;
                if (due && !Number.isNaN(due.getTime())) {
                    deadlineSummary = due.toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: due.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                    });
                    if (deadlineOverdue) {
                        deadlineSummary += ' (overdue)';
                    }
                }
                out.push({
                    boardId,
                    boardName: String(boardData?.name || '').replace(/\s*-\s*workspace/i, '').trim() || 'Board',
                    itemId: String(item.id),
                    itemName: String(item.name || 'Untitled'),
                    statusLabel,
                    category,
                    deadlineSummary,
                    deadlineOverdue,
                });
            }
        } catch (e) {
            console.warn('[editor backlog] board fetch failed', boardId, e);
        }
    }
    out.sort(
        (a, b) =>
            a.boardName.localeCompare(b.boardName) || a.itemName.localeCompare(b.itemName)
    );
    return out;
}

export function formatEditorBacklogForSwal(entries: EditorBacklogEntry[]): string {
    const esc = (t: string) =>
        t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const sortRows = (rows: EditorBacklogEntry[]) =>
        [...rows].sort(
            (a, b) => a.boardName.localeCompare(b.boardName) || a.itemName.localeCompare(b.itemName)
        );
    const rowLi = (e: EditorBacklogEntry) =>
        `<li class="cv-bl-item"><span class="cv-bl-name">${esc(e.itemName)}</span><span class="cv-bl-meta">${esc(e.boardName)}${
            e.deadlineSummary ? ` · ${esc(e.deadlineSummary)}` : ''
        } · <em>${esc(e.statusLabel)}</em></span></li>`;
    const section = (title: string, rows: EditorBacklogEntry[], overdueSection: boolean) => {
        if (!rows.length) return '';
        const lis = sortRows(rows).map(rowLi).join('');
        const secClass = overdueSection ? 'cv-bl-sec cv-bl-sec-overdue' : 'cv-bl-sec';
        return `<div class="${secClass}"><div class="cv-bl-h">${esc(title)}</div><ul class="cv-bl-ul">${lis}</ul></div>`;
    };

    /** Revision / review status only (includes overdue revisions — kept separate from generic overdue). */
    const sentForRevisions = entries.filter(e => e.category === 'sent_revisions');
    /** Past-due items that are not in a revision status (assigned overdue, working overdue, etc.). */
    const overdueRows = entries.filter(e => e.deadlineOverdue && e.category !== 'sent_revisions');
    const workingOnIt = entries.filter(e => e.category === 'working_on_it' && !e.deadlineOverdue);

    const blocks = [
        section('Sent for revisions', sentForRevisions, false),
        section('Overdue projects', overdueRows, true),
        section('Working on it', workingOnIt, false),
    ].join('');

    return `<div class="cv-bl-scroll">${blocks}</div>`;
}
