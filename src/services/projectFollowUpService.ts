import { supabase } from '../lib/supabaseClient';
import { createNotification } from './notificationService';

function norm(s: string) {
    return String(s || '')
        .toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/[^a-z0-9]+/g, '')
        .trim();
}

export function followUpRequestSourceId(boardId: string, itemId: string): string {
    return `followup_request:${boardId}:${itemId}`;
}

export function followUpReplySourceId(boardId: string, itemId: string): string {
    return `followup_reply:${boardId}:${itemId}`;
}

export function parseFollowUpSourceId(sourceId?: string): { boardId: string; itemId: string } | null {
    if (!sourceId) return null;
    const parts = sourceId.split(':');
    if (parts.length < 3) return null;
    if (parts[0] !== 'followup_request' && parts[0] !== 'followup_reply') return null;
    return { boardId: parts[1], itemId: parts[2] };
}

async function resolveEditorEmails(editorName: string): Promise<string[]> {
    const clean = norm(editorName);
    if (!clean) return [];
    const { data, error } = await supabase
        .from('users')
        .select('email, name')
        .eq('role', 'editor');
    if (error || !data) return [];
    return data
        .filter((u) => norm(u.name || '') === clean)
        .map((u) => u.email)
        .filter(Boolean);
}

async function resolveAdminEmails(): Promise<string[]> {
    const { data, error } = await supabase.from('users').select('email').eq('role', 'admin');
    if (error || !data) return [];
    return data.map((u) => u.email).filter(Boolean);
}

export async function sendFollowUpRequest(params: {
    boardId: string;
    itemId: string;
    projectName: string;
    editorName: string;
    adminName: string;
    promptMessage?: string;
}) {
    const editorEmails = await resolveEditorEmails(params.editorName);
    if (!editorEmails.length) throw new Error(`No editor account found for "${params.editorName}".`);
    const prompt = (params.promptMessage || '').trim();
    const sourceId = followUpRequestSourceId(params.boardId, params.itemId);
    const results = await Promise.all(
        editorEmails.map(async (email) => {
            const { error } = await supabase.from('project_follow_up_messages').insert({
                board_id: params.boardId,
                item_id: params.itemId,
                project_name: params.projectName || '',
                sender_role: 'admin',
                sender_name: params.adminName || 'Admin',
                sender_email: '',
                recipient_email: email,
                message: `${params.projectName} — ${prompt || `${params.adminName || 'Admin'} is asking for progress update.`}`,
                progress_percent: null,
            });
            if (!error) {
                await createNotification({
                    user_email: email,
                    type: 'info',
                    title: 'Admin follow-up request',
                    message: `${params.projectName} — Follow-up requested. Click to open.`,
                    source_type: 'follow_up_request',
                    source_id: sourceId,
                });
            }
            return { email, error };
        })
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
        throw new Error(
            `Follow-up delivery failed (${failed.error.message}). Run create_project_follow_up_messages_table.sql and enable Realtime for project_follow_up_messages.`
        );
    }
}

export async function sendFollowUpReply(params: {
    boardId: string;
    itemId: string;
    projectName: string;
    editorName: string;
    replyMessage: string;
}) {
    const adminEmails = await resolveAdminEmails();
    if (!adminEmails.length) throw new Error('No admin accounts found.');
    const editorEmail = localStorage.getItem('portal_user_email') || '';
    const progressMatch = params.replyMessage.match(/^\s*(\d{1,3})%\s*complete/i);
    const pct = progressMatch ? Math.max(0, Math.min(100, Number(progressMatch[1]))) : null;
    const sourceId = followUpReplySourceId(params.boardId, params.itemId);
    const results = await Promise.all(
        adminEmails.map(async (email) => {
            const { error } = await supabase.from('project_follow_up_messages').insert({
                board_id: params.boardId,
                item_id: params.itemId,
                project_name: params.projectName || '',
                sender_role: 'editor',
                sender_name: params.editorName || 'Editor',
                sender_email: editorEmail,
                recipient_email: email,
                message: `${params.projectName} — ${params.editorName || 'Editor'}: ${params.replyMessage}`,
                progress_percent: pct,
            });
            if (!error) {
                await createNotification({
                    user_email: email,
                    type: 'info',
                    title: 'Editor progress update',
                    message: `${params.projectName} — Progress update received. Click to open.`,
                    source_type: 'follow_up_reply',
                    source_id: sourceId,
                });
            }
            return { email, error };
        })
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
        throw new Error(
            `Progress update delivery failed (${failed.error.message}). Ensure project_follow_up_messages table exists and policies are applied.`
        );
    }
}

export interface FollowUpRealtimeMessage {
    id: string;
    board_id: string;
    item_id: string;
    project_name: string;
    sender_role: 'admin' | 'editor';
    sender_name: string;
    sender_email: string;
    recipient_email: string;
    message: string;
    progress_percent: number | null;
    created_at: string;
}

export function subscribeToFollowUpMessages(
    recipientEmail: string,
    onInsert: (msg: FollowUpRealtimeMessage) => void
) {
    const channel = supabase
        .channel(`followup:${recipientEmail}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'project_follow_up_messages',
                filter: `recipient_email=eq.${recipientEmail}`
            },
            (payload) => {
                onInsert(payload.new as FollowUpRealtimeMessage);
            }
        )
        .subscribe();
    return () => supabase.removeChannel(channel);
}

export async function fetchRecentFollowUpMessages(
    recipientEmail: string,
    sinceIso: string
): Promise<FollowUpRealtimeMessage[]> {
    const { data, error } = await supabase
        .from('project_follow_up_messages')
        .select('*')
        .eq('recipient_email', recipientEmail)
        .gt('created_at', sinceIso)
        .order('created_at', { ascending: true })
        .limit(20);
    if (error) {
        throw new Error(error.message);
    }
    return (data || []) as FollowUpRealtimeMessage[];
}

export async function fetchLatestFollowUpMessage(params: {
    recipientEmail: string;
    boardId: string;
    itemId: string;
    senderRole?: 'admin' | 'editor';
}): Promise<FollowUpRealtimeMessage | null> {
    let query = supabase
        .from('project_follow_up_messages')
        .select('*')
        .eq('recipient_email', params.recipientEmail)
        .eq('board_id', params.boardId)
        .eq('item_id', params.itemId)
        .order('created_at', { ascending: false })
        .limit(1);
    if (params.senderRole) {
        query = query.eq('sender_role', params.senderRole);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data?.[0] as FollowUpRealtimeMessage) || null;
}

