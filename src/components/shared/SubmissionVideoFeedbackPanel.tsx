import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Clock, Loader2, MessageSquare, Send, CheckCircle } from 'lucide-react';
import {
    addSubmissionVideoFeedback,
    formatTimestampLabel,
    listSubmissionVideoFeedback,
    resolveSubmissionVideoFeedback,
    SubmissionVideoFeedbackRow,
} from '../../services/submissionVideoFeedbackService';
import type { SubmissionVideoPlayerHandle } from './SubmissionVideoPlayer';

interface SubmissionVideoFeedbackPanelProps {
    boardId: string;
    itemId: string;
    projectName: string;
    mode: 'admin' | 'editor' | 'client';
    /** Imperative player handle (seek works while video is still loading). */
    videoRef: React.RefObject<SubmissionVideoPlayerHandle | null>;
    editorNameHint?: string;
    /** Admin: only true when Monday status is For Approval. Client: only when Waiting for Client. */
    canCompose?: boolean;
}

const TIMESTAMP_LINK_CLASS =
    'text-sky-400 hover:text-sky-300 underline underline-offset-[3px] decoration-sky-400/70 hover:decoration-sky-300 font-mono font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/45 rounded-sm';

function seekVideo(ref: React.RefObject<SubmissionVideoPlayerHandle | null>, rawSeconds: number | string | null | undefined) {
    const sec = rawSeconds == null || rawSeconds === '' ? NaN : Number(rawSeconds);
    if (!Number.isFinite(sec)) return;
    ref.current?.seek(sec);
}

/** Parse H:MM:SS or M:SS into seconds; null if invalid (e.g. minute > 59). */
function matchGroupsToSeconds(g1: string, g2: string, g3: string | undefined): number | null {
    const a = parseInt(g1, 10);
    const b = parseInt(g2, 10);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    if (g3 !== undefined) {
        const c = parseInt(g3, 10);
        if (Number.isNaN(c) || b > 59 || c > 59) return null;
        return a * 3600 + b * 60 + c;
    }
    if (b > 59) return null;
    return a * 60 + b;
}

/** Turn patterns like 0:28 or 1:05:30 in the message into clickable “hyperlinks”. */
function renderMessageWithTimestampLinks(
    text: string,
    videoRef: React.RefObject<SubmissionVideoPlayerHandle | null>
): ReactNode {
    const re = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/g;
    const parts: ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        const sec = matchGroupsToSeconds(m[1], m[2], m[3]);
        if (m.index > last) parts.push(text.slice(last, m.index));
        if (sec == null) {
            parts.push(m[0]);
        } else {
            const label = m[0];
            const idx = m.index;
            parts.push(
                <a
                    key={`ts-${idx}-${label}`}
                    href="#"
                    className={TIMESTAMP_LINK_CLASS}
                    aria-label={`Jump to ${label} in the video`}
                    onClick={e => {
                        e.preventDefault();
                        seekVideo(videoRef, sec);
                    }}
                >
                    {label}
                </a>
            );
        }
        last = m.index + m[0].length;
    }
    if (parts.length === 0) return text;
    if (last < text.length) parts.push(text.slice(last));
    return <>{parts}</>;
}

export function SubmissionVideoFeedbackPanel({
    boardId,
    itemId,
    projectName,
    mode,
    videoRef,
    editorNameHint,
    canCompose = true,
}: SubmissionVideoFeedbackPanelProps) {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<SubmissionVideoFeedbackRow[]>([]);
    const [draft, setDraft] = useState('');
    const [pendingSeconds, setPendingSeconds] = useState<number | null>(null);
    const [sending, setSending] = useState(false);
    const [resolveId, setResolveId] = useState<string | null>(null);
    const [sendError, setSendError] = useState<string | null>(null);

    const meEmail = localStorage.getItem('portal_user_email') || '';
    const meName = localStorage.getItem('portal_user_name') || meEmail || (mode === 'client' ? 'Client' : 'Admin');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const activeOnly = mode === 'editor' || mode === 'client';
            const list = await listSubmissionVideoFeedback(boardId, itemId, activeOnly);
            setRows(list);
        } catch (e) {
            console.error('[Video feedback] load failed', e);
        } finally {
            setLoading(false);
        }
    }, [boardId, itemId, mode]);

    useEffect(() => {
        void load();
    }, [load]);

    const { active, resolved } = useMemo(() => {
        const a: SubmissionVideoFeedbackRow[] = [];
        const r: SubmissionVideoFeedbackRow[] = [];
        for (const row of rows) {
            if (row.resolved_at) r.push(row);
            else a.push(row);
        }
        return { active: a, resolved: r };
    }, [rows]);

    const captureTime = () => {
        const t = videoRef.current?.getCurrentTime();
        if (t == null || Number.isNaN(t)) return;
        setPendingSeconds(t);
    };

    const clearTime = () => setPendingSeconds(null);

    const send = async () => {
        if (!meEmail || !draft.trim()) return;
        if (mode === 'editor') return;
        if (!canCompose) return;
        setSendError(null);
        setSending(true);
        const text = draft.trim();
        const ts = pendingSeconds;
        setDraft('');
        setPendingSeconds(null);
        try {
            await addSubmissionVideoFeedback({
                boardId,
                itemId,
                projectName,
                message: text,
                timestampSeconds: ts,
                authorEmail: meEmail,
                authorName: meName,
                editorNameHint,
                authorRole: mode === 'client' ? 'client' : 'admin',
            });
            await load();
        } catch (e) {
            console.error('[Video feedback] send failed', e);
            setDraft(text);
            setPendingSeconds(ts);
            setSendError(e instanceof Error ? e.message : 'Could not send feedback. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const onResolve = async (id: string) => {
        if (!meEmail || mode !== 'admin') return;
        setResolveId(id);
        try {
            await resolveSubmissionVideoFeedback(id, meEmail);
            await load();
        } catch (e) {
            console.error('[Video feedback] resolve failed', e);
        } finally {
            setResolveId(null);
        }
    };

    const renderRow = (row: SubmissionVideoFeedbackRow, showResolve: boolean) => {
        const tsLabel = formatTimestampLabel(row.timestamp_seconds);
        const isResolved = !!row.resolved_at;
        return (
            <div
                key={row.id}
                className={`rounded-xl border px-3 py-2.5 text-[12px] leading-snug space-y-1.5 ${
                    isResolved
                        ? 'border-white/[0.06] bg-white/[0.02] text-white/40'
                        : 'border-violet-500/25 bg-violet-500/[0.06] text-white/90'
                }`}
            >
                <div className="flex flex-wrap items-center gap-2 justify-between gap-y-1">
                    <span className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/45 font-bold">
                        <span
                            className={`px-1.5 py-0.5 rounded-md border text-[9px] font-extrabold ${
                                row.author_role === 'client'
                                    ? 'border-emerald-500/35 text-emerald-200/90 bg-emerald-500/10'
                                    : 'border-violet-500/35 text-violet-200/90 bg-violet-500/10'
                            }`}
                        >
                            {row.author_role === 'client' ? 'Client' : 'CV'}
                        </span>
                        <span>{row.author_name || row.author_email}</span>
                    </span>
                    <span className="text-[10px] text-white/35">
                        {new Date(row.created_at).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                </div>
                {tsLabel && (
                    <a
                        href="#"
                        className={`relative z-10 inline-flex items-center gap-1 text-[12px] ${TIMESTAMP_LINK_CLASS}`}
                        aria-label={`Jump to ${tsLabel} in the video`}
                        onClick={e => {
                            e.preventDefault();
                            seekVideo(videoRef, row.timestamp_seconds);
                        }}
                    >
                        <Clock className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden />
                        {tsLabel}
                    </a>
                )}
                <p className="text-[12px] text-white/85 whitespace-pre-wrap break-words">
                    {renderMessageWithTimestampLinks(row.message, videoRef)}
                </p>
                {isResolved && (
                    <p className="text-[10px] text-emerald-500/80">
                        Resolved{row.resolved_by_email ? ` · ${row.resolved_by_email}` : ''}
                    </p>
                )}
                {showResolve && !isResolved && (
                    <button
                        type="button"
                        disabled={resolveId === row.id}
                        onClick={() => void onResolve(row.id)}
                        className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 hover:text-emerald-300 flex items-center gap-1 disabled:opacity-40"
                    >
                        {resolveId === row.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <CheckCircle className="w-3 h-3" />
                        )}
                        Mark resolved
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full min-h-0 bg-[#0c0c14] border-l border-white/[0.08]">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08] shrink-0">
                <MessageSquare className="w-4 h-4 text-violet-400" />
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">Video feedback</p>
                    <p className="text-[10px] text-white/40">
                        {mode === 'client'
                            ? 'Same tools as CV — timestamps jump the video for your editor.'
                            : 'Pinned to this project — survives new uploads'}
                    </p>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 py-3 space-y-2">
                {loading ? (
                    <p className="text-[11px] text-white/40 px-1">Loading…</p>
                ) : active.length === 0 && resolved.length === 0 ? (
                    <p className="text-[11px] text-white/40 px-1">
                        {mode === 'admin'
                            ? 'No notes yet. Add feedback with optional timestamps.'
                            : mode === 'client'
                              ? 'No open feedback from you or CV yet.'
                              : 'No open feedback.'}
                    </p>
                ) : (
                    <>
                        {active.map(r => renderRow(r, mode === 'admin'))}
                        {mode === 'admin' && resolved.length > 0 && (
                            <div className="pt-2 space-y-2">
                                <p className="text-[10px] uppercase tracking-wider text-white/35 font-bold px-1">Resolved</p>
                                {resolved.map(r => renderRow(r, false))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {(mode === 'admin' || mode === 'client') && (
                <div className="shrink-0 border-t border-white/[0.08] p-3 space-y-2 bg-[#08080f]">
                    {!canCompose ? (
                        <p className="text-[11px] text-white/45 leading-relaxed">
                            {mode === 'admin' ? (
                                <>
                                    Adding feedback is available only when the project status is{' '}
                                    <span className="text-white/75 font-semibold">For Approval</span>.
                                </>
                            ) : (
                                <>
                                    Adding feedback is available only when the status is{' '}
                                    <span className="text-white/75 font-semibold">Waiting for Client</span> or{' '}
                                    <span className="text-white/75 font-semibold">Approved (CV)</span>.
                                </>
                            )}
                        </p>
                    ) : (
                        <>
                            <div className="flex flex-wrap gap-2 items-center">
                                <button
                                    type="button"
                                    onClick={captureTime}
                                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-200 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                                >
                                    Use video time
                                </button>
                                {pendingSeconds != null && (
                                    <>
                                        <span className="text-[11px] font-mono text-amber-200/90">
                                            @ {formatTimestampLabel(pendingSeconds)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={clearTime}
                                            className="text-[10px] text-white/40 hover:text-white/70"
                                        >
                                            Clear
                                        </button>
                                    </>
                                )}
                            </div>
                            <textarea
                                value={draft}
                                onChange={e => setDraft(e.target.value)}
                                placeholder="Note for the editor…"
                                rows={3}
                                className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2 text-[12px] text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 resize-none"
                            />
                            <button
                                type="button"
                                disabled={!draft.trim() || !meEmail || sending}
                                onClick={() => void send()}
                                className={`w-full flex items-center justify-center gap-2 rounded-xl disabled:opacity-40 disabled:pointer-events-none text-white text-[12px] font-bold py-2.5 transition-colors ${
                                    mode === 'client'
                                        ? 'bg-emerald-600 hover:bg-emerald-500'
                                        : 'bg-violet-600 hover:bg-violet-500'
                                }`}
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send feedback
                            </button>
                            {!meEmail && (
                                <p className="text-[11px] text-amber-300/85">
                                    Missing account email in this session. Re-login to send feedback.
                                </p>
                            )}
                            {sendError && <p className="text-[11px] text-red-300/90">{sendError}</p>}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
