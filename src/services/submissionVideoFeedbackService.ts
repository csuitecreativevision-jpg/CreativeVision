import { supabase } from '../lib/supabaseClient';
import { createNotification } from './notificationService';

export interface SubmissionVideoFeedbackRow {
    id: string;
    created_at: string;
    board_id: string;
    item_id: string;
    author_email: string;
    author_name: string;
    message: string;
    /** Supabase may return numeric columns as number or string in JSON. */
    timestamp_seconds: number | string | null;
    resolved_at: string | null;
    resolved_by_email: string | null;
    author_role?: 'admin' | 'client' | null;
}

export interface SubmissionVideoFeedbackAttachment {
    id: string;
    name: string;
    mimeType: string;
    dataUrl: string;
}

export interface ParsedSubmissionVideoFeedbackMessage {
    text: string;
    attachments: SubmissionVideoFeedbackAttachment[];
}

const FEEDBACK_RICH_PREFIX = '[cv-feedback-v1]';

/** Parse `boardId:itemId` from notification source_id. */
export function parseSubmissionVideoFeedbackSourceId(sourceId?: string): { boardId: string; itemId: string } | null {
    if (!sourceId) return null;
    const i = sourceId.indexOf(':');
    if (i <= 0) return null;
    const boardId = sourceId.slice(0, i);
    const itemId = sourceId.slice(i + 1);
    if (!boardId || !itemId) return null;
    return { boardId, itemId };
}

function norm(s: string) {
    return String(s || '')
        .toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/[^a-z0-9]+/g, '')
        .trim();
}

async function resolveEditorEmails(editorName: string | null | undefined): Promise<string[]> {
    const clean = norm(editorName || '');
    if (!clean) return [];
    const { data, error } = await supabase.from('users').select('email, name').eq('role', 'editor');
    if (error || !data) return [];
    return data
        .filter(u => norm(u.name || '') === clean)
        .map(u => u.email)
        .filter(Boolean);
}

/** True when Monday status label indicates Creative Vision approved the output (clears all video notes). */
export function isCvApprovedMondayStatus(label: string): boolean {
    const t = label.toLowerCase();
    if (!t.includes('approved')) return false;
    if (t.includes('not approved') || t.includes('unapproved')) return false;
    return t.includes('cv') || t.includes('creative vision');
}

export function formatTimestampLabel(seconds: number | string | null | undefined): string | null {
    if (seconds == null || seconds === '') return null;
    const n = typeof seconds === 'number' ? seconds : Number(seconds);
    if (!Number.isFinite(n)) return null;
    const s = Math.max(0, n);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
}

function sanitizeAttachment(input: SubmissionVideoFeedbackAttachment): SubmissionVideoFeedbackAttachment | null {
    const id = String(input.id || '').trim();
    const name = String(input.name || 'attachment').trim().slice(0, 120);
    const mimeType = String(input.mimeType || '').trim().toLowerCase();
    const dataUrl = String(input.dataUrl || '');
    if (!id || !name || !mimeType || !dataUrl) return null;
    if (!mimeType.startsWith('image/')) return null;
    if (!dataUrl.startsWith('data:image/')) return null;
    return { id, name, mimeType, dataUrl };
}

export function parseSubmissionVideoFeedbackMessage(raw: string): ParsedSubmissionVideoFeedbackMessage {
    const s = String(raw || '');
    if (!s.startsWith(FEEDBACK_RICH_PREFIX)) return { text: s, attachments: [] };
    const json = s.slice(FEEDBACK_RICH_PREFIX.length);
    try {
        const parsed = JSON.parse(json) as {
            text?: string;
            attachments?: SubmissionVideoFeedbackAttachment[];
        };
        const text = typeof parsed.text === 'string' ? parsed.text : '';
        const attachments = Array.isArray(parsed.attachments)
            ? parsed.attachments.map(sanitizeAttachment).filter((x): x is SubmissionVideoFeedbackAttachment => !!x)
            : [];
        return { text, attachments };
    } catch {
        return { text: s, attachments: [] };
    }
}

/** @param activeOnly When true (default), omit resolved notes (editor view). Admins should pass false. */
export async function listSubmissionVideoFeedback(
    boardId: string,
    itemId: string,
    activeOnly = true
): Promise<SubmissionVideoFeedbackRow[]> {
    let qb = supabase
        .from('submission_video_feedback')
        .select('*')
        .eq('board_id', boardId)
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });
    if (activeOnly) qb = qb.is('resolved_at', null);
    const { data, error } = await qb;
    if (error) throw new Error(error.message);
    return (data || []) as SubmissionVideoFeedbackRow[];
}

export async function addSubmissionVideoFeedback(params: {
    boardId: string;
    itemId: string;
    projectName: string;
    message: string;
    timestampSeconds?: number | null;
    authorEmail: string;
    authorName: string;
    editorNameHint?: string;
    authorRole: 'admin' | 'client';
    attachments?: SubmissionVideoFeedbackAttachment[];
}): Promise<SubmissionVideoFeedbackRow> {
    const cleanText = params.message.trim();
    const cleanAttachments = Array.isArray(params.attachments)
        ? params.attachments.map(sanitizeAttachment).filter((x): x is SubmissionVideoFeedbackAttachment => !!x)
        : [];
    const storedMessage =
        cleanAttachments.length > 0
            ? `${FEEDBACK_RICH_PREFIX}${JSON.stringify({ text: cleanText, attachments: cleanAttachments })}`
            : cleanText;
    const payload = {
        board_id: params.boardId,
        item_id: params.itemId,
        author_email: params.authorEmail,
        author_name: params.authorName || params.authorEmail,
        message: storedMessage,
        timestamp_seconds:
            params.timestampSeconds != null && !Number.isNaN(params.timestampSeconds)
                ? params.timestampSeconds
                : null,
        author_role: params.authorRole,
    };
    let data: unknown = null;
    let error: { message?: string } | null = null;
    ({ data, error } = await supabase.from('submission_video_feedback').insert([payload]).select().single());
    if (error && /author_role/i.test(String(error.message || ''))) {
        // Backward-compatible fallback for environments where the column migration has not landed yet.
        const { author_role, ...legacyPayload } = payload;
        ({ data, error } = await supabase.from('submission_video_feedback').insert([legacyPayload]).select().single());
    }
    if (error) throw new Error(error.message || 'Could not send video feedback.');
    const row = data as SubmissionVideoFeedbackRow;

    const ts = formatTimestampLabel(params.timestampSeconds ?? null);
    const preview = `${cleanText.slice(0, 120)}${cleanText.length > 120 ? '…' : ''}`;
    const editorEmails = await resolveEditorEmails(params.editorNameHint);
    const title = params.authorRole === 'client' ? 'Client video feedback' : 'Admin video feedback';
    await Promise.all(
        editorEmails.map(email =>
            createNotification({
                user_email: email,
                type: 'warning',
                title,
                message: `${params.projectName}${ts ? ` @ ${ts}` : ''}: ${preview}`,
                source_type: 'submission_video_feedback',
                source_id: `${params.boardId}:${params.itemId}`,
            })
        )
    );

    return row;
}

export async function resolveSubmissionVideoFeedback(
    id: string,
    resolvedByEmail: string
): Promise<void> {
    const { error } = await supabase
        .from('submission_video_feedback')
        .update({
            resolved_at: new Date().toISOString(),
            resolved_by_email: resolvedByEmail,
        })
        .eq('id', id);
    if (error) throw new Error(error.message);
}

export async function deleteAllSubmissionVideoFeedback(boardId: string, itemId: string): Promise<void> {
    const { error } = await supabase
        .from('submission_video_feedback')
        .delete()
        .eq('board_id', boardId)
        .eq('item_id', itemId);
    if (error) throw new Error(error.message);
}

/** Call after a Monday status change; clears all notes when status is CV-approved. */
export function maybeClearSubmissionVideoFeedback(
    boardId: string | null | undefined,
    itemId: string | null | undefined,
    newStatusLabel: string
): void {
    if (!boardId || !itemId) return;
    if (!isCvApprovedMondayStatus(newStatusLabel)) return;
    void deleteAllSubmissionVideoFeedback(boardId, itemId).catch(err =>
        console.error('[submission_video_feedback] clear on CV approve failed', err)
    );
}
