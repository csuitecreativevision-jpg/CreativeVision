import { supabase } from '../lib/supabaseClient';
import { createNotification } from './notificationService';

export interface ProjectFeedbackMessage {
    id: string;
    created_at: string;
    board_id: string;
    item_id: string;
    project_name: string;
    sender_email: string;
    sender_name: string;
    sender_role: 'client' | 'editor' | 'admin';
    message: string;
}

function norm(s: string) {
    return String(s || '')
        .toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/[^a-z0-9]+/g, '')
        .trim();
}

export function feedbackSourceId(boardId: string, itemId: string): string {
    return `feedback:${boardId}:${itemId}`;
}

export function parseFeedbackSourceId(sourceId?: string): { boardId: string; itemId: string } | null {
    if (!sourceId || !sourceId.startsWith('feedback:')) return null;
    const parts = sourceId.split(':');
    if (parts.length < 3) return null;
    return { boardId: parts[1], itemId: parts[2] };
}

export async function listProjectFeedback(boardId: string, itemId: string): Promise<ProjectFeedbackMessage[]> {
    const { data, error } = await supabase
        .from('project_feedback_messages')
        .select('*')
        .eq('board_id', boardId)
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as ProjectFeedbackMessage[];
}

async function resolveEditorEmails(editorName: string | null | undefined): Promise<string[]> {
    const clean = norm(editorName || '');
    if (!clean) return [];
    const { data, error } = await supabase
        .from('users')
        .select('email, name')
        .eq('role', 'editor');
    if (error || !data) return [];
    return data
        .filter(u => norm(u.name || '') === clean)
        .map(u => u.email)
        .filter(Boolean);
}

async function resolveAdminEmails(): Promise<string[]> {
    const { data, error } = await supabase.from('users').select('email').eq('role', 'admin');
    if (error || !data) return [];
    return data.map(u => u.email).filter(Boolean);
}

async function resolveClientEmailsByBoard(boardId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('users')
        .select('email, allowed_board_ids')
        .eq('role', 'client')
        .contains('allowed_board_ids', [boardId]);
    if (error || !data) return [];
    return data.map(u => u.email).filter(Boolean);
}

export async function addProjectFeedback(params: {
    boardId: string;
    itemId: string;
    projectName: string;
    message: string;
    senderEmail: string;
    senderName: string;
    senderRole: 'client' | 'editor' | 'admin';
    editorNameHint?: string;
}): Promise<ProjectFeedbackMessage> {
    const payload = {
        board_id: params.boardId,
        item_id: params.itemId,
        project_name: params.projectName || '',
        message: params.message.trim(),
        sender_email: params.senderEmail,
        sender_name: params.senderName || params.senderEmail,
        sender_role: params.senderRole,
    };

    const { data, error } = await supabase.from('project_feedback_messages').insert([payload]).select().single();
    if (error) throw new Error(error.message);
    const row = data as ProjectFeedbackMessage;

    const sourceId = feedbackSourceId(params.boardId, params.itemId);
    const title =
        params.senderRole === 'client'
            ? 'Client feedback received'
            : params.senderRole === 'editor'
              ? 'Editor message received'
              : 'Admin message received';
    const baseMsg = `${params.senderName || 'Someone'}: ${params.message.slice(0, 180)}`;

    const recipients = new Set<string>();
    const adminEmails = await resolveAdminEmails();
    adminEmails.forEach(e => recipients.add(e));

    if (params.senderRole === 'client') {
        const editorEmails = await resolveEditorEmails(params.editorNameHint);
        editorEmails.forEach(e => recipients.add(e));
    } else {
        const clientEmails = await resolveClientEmailsByBoard(params.boardId);
        clientEmails.forEach(e => recipients.add(e));
    }

    recipients.delete(params.senderEmail);
    await Promise.all(
        [...recipients].map(email =>
            createNotification({
                user_email: email,
                type: 'info',
                title,
                message: `${params.projectName}: ${baseMsg}`,
                source_type: 'project_feedback',
                source_id: sourceId,
            })
        )
    );

    return row;
}

