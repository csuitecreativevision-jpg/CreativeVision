import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { addProjectFeedback, listProjectFeedback, ProjectFeedbackMessage } from '../../services/projectFeedbackService';

interface ProjectFeedbackPanelProps {
    boardId: string;
    itemId: string;
    projectName: string;
    editorNameHint?: string;
}

function rolePill(role: string) {
    if (role === 'client') return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
    if (role === 'editor') return 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30';
    return 'text-violet-300 bg-violet-500/15 border-violet-500/30';
}

export function ProjectFeedbackPanel({ boardId, itemId, projectName, editorNameHint }: ProjectFeedbackPanelProps) {
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ProjectFeedbackMessage[]>([]);
    const [draft, setDraft] = useState('');
    const meRole = (localStorage.getItem('portal_user_role') || 'client') as 'client' | 'editor' | 'admin';
    const meEmail = localStorage.getItem('portal_user_email') || '';
    const meName = localStorage.getItem('portal_user_name') || meEmail || 'User';

    const canSend = useMemo(() => draft.trim().length > 0 && !!meEmail, [draft, meEmail]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const rows = await listProjectFeedback(boardId, itemId);
                if (mounted) setMessages(rows);
            } catch (e) {
                console.error('[Feedback] load failed', e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [boardId, itemId]);

    const send = async () => {
        if (!canSend) return;
        const text = draft.trim();
        setDraft('');
        try {
            const row = await addProjectFeedback({
                boardId,
                itemId,
                projectName,
                message: text,
                senderEmail: meEmail,
                senderName: meName,
                senderRole: meRole,
                editorNameHint,
            });
            setMessages(prev => [...prev, row]);
        } catch (e) {
            console.error('[Feedback] send failed', e);
            setDraft(text);
        }
    };

    return (
        <div className="rounded-2xl border border-white/[0.08] bg-[#13131f] p-4 space-y-3">
            <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-violet-300" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Client / Editor Feedback</p>
            </div>
            <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {loading ? (
                    <p className="text-[11px] text-white/35">Loading messages…</p>
                ) : messages.length === 0 ? (
                    <p className="text-[11px] text-white/35">No feedback yet.</p>
                ) : (
                    messages.map(m => (
                        <div key={m.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase ${rolePill(m.sender_role)}`}>
                                    {m.sender_role}
                                </span>
                                <span className="text-[10px] text-white/50 truncate">{m.sender_name || m.sender_email}</span>
                                <span className="text-[10px] text-white/30 ml-auto">
                                    {new Date(m.created_at).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-[11px] text-white/85 whitespace-pre-wrap break-words">{m.message}</p>
                        </div>
                    ))
                )}
            </div>
            <div className="flex gap-2">
                <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder={meRole === 'client' ? 'Send feedback to editor and admin…' : 'Reply to client (admin can see)…'}
                    className="flex-1 min-h-[2.5rem] max-h-28 bg-black/25 border border-white/[0.08] rounded-xl px-3 py-2 text-[11px] text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40 resize-y"
                />
                <button
                    type="button"
                    onClick={() => void send()}
                    disabled={!canSend}
                    className="self-end px-3 py-2 rounded-xl text-[11px] font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white flex items-center gap-1"
                >
                    <Send className="w-3.5 h-3.5" /> Send
                </button>
            </div>
        </div>
    );
}

