import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Play, Square, Loader2, Clock, Pause, Utensils, CookingPot } from 'lucide-react';
import { supabase, isMissingIsFullTimerSchemaError } from '../../services/boardsService';
import {
    isWithinFullTimerShift,
    isWithinDinnerWindow,
    canFullTimerClockOutNow,
    blockFullTimerClockIn,
    guardFullTimerClockOut,
    guardFullTimerDinner,
    swalDinnerOutEatwell,
    swalDinnerInResumeShift,
    swalClockOutGoodbye,
    swalActionError
} from '../../lib/fullTimerSwal';
import { usePortalThemeOptional } from '../../contexts/PortalThemeContext';

function dinnerBreakStorageKey(logId: string) {
    return `cv_dinner_break_${logId}`;
}

/** Full-timers: OUT is shown only after DINNER OUT → DINNER IN for this log (sessionStorage). */
function fullTimerDinnerDoneKey(logId: string) {
    return `cv_ft_dinner_done_${logId}`;
}

type TrackerGate = 'loading' | 'denied' | 'ready';

export const TimeTracker = () => {
    const isDark = usePortalThemeOptional()?.isDark ?? true;
    const [gate, setGate] = useState<TrackerGate>('loading');
    const [actionLoading, setActionLoading] = useState(false);
    const [activeLogId, setActiveLogId] = useState<string | null>(null);
    const [timeIn, setTimeIn] = useState<Date | null>(null);
    const [status, setStatus] = useState<'active' | 'paused' | 'completed' | null>(null);
    const [lastPausedAt, setLastPausedAt] = useState<Date | null>(null);
    const [totalPausedSeconds, setTotalPausedSeconds] = useState(0);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    /** Tracks pause started via "Dinner out" vs regular "Pause" (persisted in sessionStorage for refresh). */
    const [dinnerBreak, setDinnerBreak] = useState(false);
    const [clockTick, setClockTick] = useState(0);
    const [fullTimerDinnerCycleComplete, setFullTimerDinnerCycleComplete] = useState(false);

    const userEmail = localStorage.getItem('portal_user_email') || '';
    const userName = localStorage.getItem('portal_user_name') || 'Unknown Editor';

    /** Fresh read from DB before each guarded action (avoids stale localStorage / mount-only fetch). */
    const resolveFullTimer = useCallback(async (): Promise<boolean> => {
        if (!userEmail) return false;
        try {
            const { data, error } = await supabase
                .from('users')
                .select('is_full_timer')
                .eq('email', userEmail)
                .maybeSingle();
            if (error && isMissingIsFullTimerSchemaError(error.message)) {
                localStorage.removeItem('portal_editor_full_timer');
                return false;
            }
            if (error) {
                return localStorage.getItem('portal_editor_full_timer') === '1';
            }
            const ft = !!(data as { is_full_timer?: boolean } | null)?.is_full_timer;
            if (ft) localStorage.setItem('portal_editor_full_timer', '1');
            else localStorage.removeItem('portal_editor_full_timer');
            return ft;
        } catch {
            return localStorage.getItem('portal_editor_full_timer') === '1';
        }
    }, [userEmail]);

    const prevEmailRef = useRef<string | null>(null);

    const checkActiveSession = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('time_logs')
                .select('*')
                .eq('user_email', userEmail)
                .in('status', ['active', 'paused'])
                .limit(1)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setActiveLogId(data.id);
                setTimeIn(new Date(data.time_in));
                setStatus(data.status);
                setLastPausedAt(data.last_paused_at ? new Date(data.last_paused_at) : null);
                setTotalPausedSeconds(data.total_paused_seconds || 0);
                const onDinner =
                    data.status === 'paused' &&
                    typeof sessionStorage !== 'undefined' &&
                    sessionStorage.getItem(dinnerBreakStorageKey(data.id)) === '1';
                setDinnerBreak(!!onDinner);
                const dinnerDone =
                    typeof sessionStorage !== 'undefined' &&
                    sessionStorage.getItem(fullTimerDinnerDoneKey(data.id)) === '1';
                setFullTimerDinnerCycleComplete(!!dinnerDone);
            } else {
                setActiveLogId(null);
                setTimeIn(null);
                setStatus(null);
                setLastPausedAt(null);
                setTotalPausedSeconds(0);
                setElapsedTime('00:00:00');
                setDinnerBreak(false);
                setFullTimerDinnerCycleComplete(false);
            }
        } catch (error) {
            console.error('Error fetching active time log:', error);
        }
    }, [userEmail]);

    useEffect(() => {
        if (!userEmail) return;

        const emailChanged = prevEmailRef.current !== userEmail;
        prevEmailRef.current = userEmail;

        let cancelled = false;
        if (emailChanged) {
            setGate('loading');
        }

        (async () => {
            let nextGate: TrackerGate = 'ready';
            try {
                const ft = await resolveFullTimer();
                if (cancelled) return;
                if (!ft) {
                    nextGate = 'denied';
                    return;
                }
                await checkActiveSession();
            } catch (e) {
                console.error('TimeTracker bootstrap', e);
            } finally {
                if (!cancelled) {
                    setGate(nextGate);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [userEmail, resolveFullTimer, checkActiveSession]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timeIn && status) {
            // Immediate update once
            updateTimerDisplay();
            // Then interval
            interval = setInterval(updateTimerDisplay, 1000);
        }
        return () => clearInterval(interval);
    }, [timeIn, status, lastPausedAt, totalPausedSeconds]);

    // Re-render often enough that full-timer shift (4 PM) and dinner window gates match device time.
    // A 30s tick caused TIME IN to stay disabled for up to ~30s after 4:00 PM.
    useEffect(() => {
        const t = setInterval(() => setClockTick((n) => n + 1), 1_000);
        return () => clearInterval(t);
    }, []);

    const updateTimerDisplay = () => {
        if (!timeIn) return;
        let diff = 0;
        const now = new Date().getTime();
        
        if (status === 'active') {
            diff = now - timeIn.getTime() - (totalPausedSeconds * 1000);
        } else if (status === 'paused' && lastPausedAt) {
            diff = lastPausedAt.getTime() - timeIn.getTime() - (totalPausedSeconds * 1000);
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setElapsedTime(
            `${Math.max(0, hours).toString().padStart(2, '0')}:${Math.max(0, minutes).toString().padStart(2, '0')}:${Math.max(0, seconds).toString().padStart(2, '0')}`
        );
    };

    const handleTimeIn = async () => {
        const ft = await resolveFullTimer();
        const now = new Date();
        if (ft && !isWithinFullTimerShift(now)) {
            await blockFullTimerClockIn(now);
            return;
        }
        setActionLoading(true);
        try {
            const { data, error } = await supabase
                .from('time_logs')
                .insert([{
                    user_email: userEmail,
                    user_name: userName,
                    status: 'active'
                }])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setActiveLogId(data.id);
                setTimeIn(new Date(data.time_in));
                setStatus('active');
                setTotalPausedSeconds(0);
                setLastPausedAt(null);
            }
        } catch (error) {
            console.error('Error clocking in:', error);
            alert('Failed to Time In. Please ensure the actual database table is created.');
        } finally {
            setActionLoading(false);
        }
    };

    const clearDinnerFlag = useCallback((logId: string | null) => {
        if (!logId || typeof sessionStorage === 'undefined') return;
        sessionStorage.removeItem(dinnerBreakStorageKey(logId));
        setDinnerBreak(false);
    }, []);

    const setDinnerFlag = useCallback((logId: string) => {
        if (typeof sessionStorage === 'undefined') return;
        sessionStorage.setItem(dinnerBreakStorageKey(logId), '1');
        setDinnerBreak(true);
    }, []);

    const handlePause = async () => {
        if (!activeLogId || status === 'paused') return;
        setActionLoading(true);
        clearDinnerFlag(activeLogId);
        const now = new Date();
        try {
            const { error } = await supabase
                .from('time_logs')
                .update({ last_paused_at: now.toISOString(), status: 'paused' })
                .eq('id', activeLogId);
            if (error) throw error;
            setStatus('paused');
            setLastPausedAt(now);
        } catch (error) {
            console.error('Error pausing:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDinnerOut = async () => {
        if (!activeLogId || status !== 'active') return;
        const now = new Date();
        const okDinner = await guardFullTimerDinner(now, 'out');
        if (!okDinner) return;
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('time_logs')
                .update({ last_paused_at: now.toISOString(), status: 'paused' })
                .eq('id', activeLogId);
            if (error) throw error;
            setDinnerFlag(activeLogId);
            setStatus('paused');
            setLastPausedAt(now);
            await swalDinnerOutEatwell();
        } catch (error) {
            console.error('Error starting dinner break:', error);
            const msg =
                error && typeof error === 'object' && 'message' in error
                    ? String((error as { message: string }).message)
                    : 'Please check your connection and try again.';
            await swalActionError('Could not start dinner break', msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleResume = async () => {
        if (!activeLogId || status === 'active' || !lastPausedAt) return;
        const now = new Date();
        setActionLoading(true);
        const wasDinnerBreak = dinnerBreak;
        const additionalSeconds = Math.floor((now.getTime() - lastPausedAt.getTime()) / 1000);
        const newTotal = totalPausedSeconds + additionalSeconds;
        try {
            const { error } = await supabase
                .from('time_logs')
                .update({ last_paused_at: null, total_paused_seconds: newTotal, status: 'active' })
                .eq('id', activeLogId);
            if (error) throw error;
            clearDinnerFlag(activeLogId);
            if (wasDinnerBreak && activeLogId && typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem(fullTimerDinnerDoneKey(activeLogId), '1');
                setFullTimerDinnerCycleComplete(true);
            }
            setStatus('active');
            setLastPausedAt(null);
            setTotalPausedSeconds(newTotal);
            if (wasDinnerBreak) {
                await swalDinnerInResumeShift();
            }
        } catch (error) {
            console.error('Error resuming:', error);
            const msg =
                error && typeof error === 'object' && 'message' in error
                    ? String((error as { message: string }).message)
                    : 'Please try again.';
            await swalActionError('Could not resume', msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleTimeOut = async () => {
        if (!activeLogId) return;
        const ok = await guardFullTimerClockOut(new Date());
        if (!ok) return;
        setActionLoading(true);

        let finalTotalPausedSeconds = totalPausedSeconds;
        if (status === 'paused' && lastPausedAt) {
            finalTotalPausedSeconds += Math.floor((new Date().getTime() - lastPausedAt.getTime()) / 1000);
        }

        try {
            const { error } = await supabase
                .from('time_logs')
                .update({
                    time_out: new Date().toISOString(),
                    status: 'completed',
                    total_paused_seconds: finalTotalPausedSeconds
                })
                .eq('id', activeLogId);

            if (error) throw error;

            if (activeLogId) {
                clearDinnerFlag(activeLogId);
                if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.removeItem(fullTimerDinnerDoneKey(activeLogId));
                }
            }
            setActiveLogId(null);
            setTimeIn(null);
            setStatus(null);
            setLastPausedAt(null);
            setTotalPausedSeconds(0);
            setElapsedTime('00:00:00');

            await swalClockOutGoodbye(userName);
        } catch (error) {
            console.error('Error clocking out:', error);
            alert('Failed to Time Out.');
        } finally {
            setActionLoading(false);
        }
    };

    const showDinnerInFlow = !!activeLogId && status === 'paused' && dinnerBreak;

    const dinnerCountdownLabel = useMemo(() => {
        if (!showDinnerInFlow || !lastPausedAt) return null;
        const endMs = lastPausedAt.getTime() + 60 * 60 * 1000;
        const remSec = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
        const h = Math.floor(remSec / 3600);
        const m = Math.floor((remSec % 3600) / 60);
        const s = remSec % 60;
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, [showDinnerInFlow, lastPausedAt, clockTick]);

    const nowForUi = useMemo(() => new Date(), [clockTick]);
    const shiftTimeAllowsClockIn = isWithinFullTimerShift(nowForUi);
    const shiftAllowsClockOut = canFullTimerClockOutNow(nowForUi);
    const dinnerWindowOpen = useMemo(() => isWithinDinnerWindow(nowForUi), [clockTick]);

    if (!userEmail) return null;

    if (gate === 'denied') return null;

    if (gate !== 'ready') {
        return (
            <div className="w-full flex items-center justify-center p-4">
                <Loader2
                    className={`w-5 h-5 animate-spin ${isDark ? 'text-gray-500' : 'text-zinc-400'}`}
                />
            </div>
        );
    }

    const cardSurface = isDark
        ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.03]'
        : 'bg-zinc-50 border-zinc-200/90 shadow-sm hover:bg-zinc-100/90';
    const accentIdle = isDark ? 'bg-white/10' : 'bg-zinc-300';
    const labelMuted = isDark ? 'text-white/50' : 'text-zinc-600';
    const clockIdle = isDark ? 'text-white/30' : 'text-zinc-400';
    const timerInactive = isDark ? 'text-white/20' : 'text-zinc-400';
    const timerPaused = isDark ? 'text-white/50' : 'text-zinc-600';
    const timerActive = isDark ? 'text-white' : 'text-zinc-900';
    const dinnerFootnote = isDark ? 'text-white/40' : 'text-zinc-500';
    const dinnerPanel = isDark
        ? 'border-orange-500/20 bg-orange-500/5'
        : 'border-orange-500/30 bg-orange-500/[0.07]';

    return (
        <div
            className={`w-full rounded-xl border mb-2 overflow-hidden relative group transition-all duration-300 ${cardSurface}`}
        >
            <div
                className={`absolute left-0 top-0 w-1 h-full transition-colors duration-300 ${
                    activeLogId
                        ? status === 'paused'
                            ? showDinnerInFlow
                                ? 'bg-orange-500'
                                : 'bg-amber-500'
                            : 'bg-emerald-500'
                        : accentIdle
                }`}
            />
            
            <div className="p-3.5 pl-5 flex flex-col gap-2.5">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock
                            className={`w-3.5 h-3.5 transition-colors duration-300 ${
                                activeLogId
                                    ? status === 'paused'
                                        ? showDinnerInFlow
                                            ? 'text-orange-500'
                                            : 'text-amber-500'
                                        : 'text-emerald-500'
                                    : clockIdle
                            }`}
                        />
                        <span className={`text-[10px] font-bold tracking-widest uppercase ${labelMuted}`}>
                            Time Tracker
                        </span>
                    </div>
                    {activeLogId && (
                        <div
                            className={`px-2 py-0.5 rounded-md border text-[9px] font-black tracking-widest uppercase transition-all duration-300 ${
                                status === 'paused'
                                    ? showDinnerInFlow
                                        ? isDark
                                            ? 'bg-orange-500/10 border-orange-500/25 text-orange-400'
                                            : 'bg-orange-500/15 border-orange-500/35 text-orange-700'
                                        : isDark
                                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                          : 'bg-amber-500/15 border-amber-500/30 text-amber-800'
                                    : isDark
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse'
                                      : 'bg-emerald-500/12 border-emerald-500/30 text-emerald-700 animate-pulse'
                            }`}
                        >
                            {status === 'paused' ? (showDinnerInFlow ? 'DINNER' : 'PAUSED') : 'ACTIVE'}
                        </div>
                    )}
                </div>

                {/* Timer and Action Buttons */}
                <div className="flex flex-col mt-2">
                    <div
                        className={`font-mono text-xl font-bold text-center tabular-nums transition-all duration-300 ${
                            !activeLogId
                                ? timerInactive
                                : status === 'paused'
                                  ? timerPaused
                                  : timerActive
                        }`}
                    >
                        {elapsedTime}
                    </div>
                    {showDinnerInFlow && dinnerCountdownLabel !== null && (
                        <div className={`mt-2 rounded-lg border px-2 py-2 text-center ${dinnerPanel}`}>
                            <p
                                className={`text-[9px] font-bold uppercase tracking-widest ${
                                    isDark ? 'text-orange-400/90' : 'text-orange-700'
                                }`}
                            >
                                Dinner — 1 hour
                            </p>
                            <p
                                className={`font-mono text-lg font-bold tabular-nums mt-0.5 ${
                                    isDark ? 'text-orange-300' : 'text-orange-800'
                                }`}
                            >
                                {dinnerCountdownLabel}
                            </p>
                            <p className={`text-[9px] mt-0.5 ${dinnerFootnote}`}>Remaining from dinner out</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-2 mt-3 w-full">
                        {!activeLogId ? (
                            <button
                                type="button"
                                onClick={handleTimeIn}
                                disabled={actionLoading || !shiftTimeAllowsClockIn}
                                title={
                                    !shiftTimeAllowsClockIn
                                        ? 'Full-time shift: clock in only 4:00 PM – 12:00 AM (your device time)'
                                        : undefined
                                }
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black px-3.5 py-2.5 h-10 rounded-xl text-[11px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                TIME IN
                            </button>
                        ) : (
                            <>
                                {status === 'active' && !fullTimerDinnerCycleComplete ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <button
                                            type="button"
                                            onClick={handlePause}
                                            disabled={actionLoading}
                                            className="flex-1 min-w-0 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white text-[11px] font-bold tracking-widest uppercase transition-all inline-flex items-center justify-center gap-2 px-3 disabled:opacity-50"
                                            title="Pause"
                                        >
                                            {actionLoading ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <Pause className="w-4 h-4 shrink-0 fill-current" />}
                                            PAUSE
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDinnerOut}
                                            disabled={actionLoading}
                                            title={
                                                dinnerWindowOpen
                                                    ? 'Pause for dinner (1 hour countdown). Dinner window 6 PM – 9 PM. After DINNER IN, OUT will appear.'
                                                    : 'Dinner is only 6:00 PM – 9:00 PM. Tap to see a message if it’s too early or too late.'
                                            }
                                            className="flex-1 min-w-0 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white text-[11px] font-bold tracking-widest uppercase transition-all inline-flex items-center justify-center gap-2 px-3 disabled:opacity-50"
                                        >
                                            {actionLoading ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <Utensils className="w-4 h-4 shrink-0" />}
                                            <span className="text-center leading-tight">DINNER OUT</span>
                                        </button>
                                    </div>
                                ) : status === 'paused' && showDinnerInFlow ? (
                                    <button
                                        type="button"
                                        onClick={handleResume}
                                        disabled={actionLoading}
                                        className="w-full h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white text-[11px] font-bold tracking-widest uppercase transition-all inline-flex items-center justify-center gap-2 px-3 disabled:opacity-50"
                                        title="End dinner break and resume work"
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <CookingPot className="w-4 h-4 shrink-0" />}
                                        DINNER IN
                                    </button>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 w-full">
                                            {status === 'active' ? (
                                                <button
                                                    type="button"
                                                    onClick={handlePause}
                                                    disabled={actionLoading}
                                                    className="flex-1 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white text-[11px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                    title="Pause"
                                                >
                                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4 fill-current" />}
                                                    PAUSE
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleResume}
                                                    disabled={actionLoading}
                                                    className={`flex-1 h-10 rounded-xl border text-[11px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                                                        showDinnerInFlow
                                                            ? 'bg-orange-500/15 border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white'
                                                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                                                    }`}
                                                    title={showDinnerInFlow ? 'Dinner in' : 'Resume'}
                                                >
                                                    {actionLoading ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : showDinnerInFlow ? (
                                                        <CookingPot className="w-4 h-4 shrink-0" />
                                                    ) : (
                                                        <Play className="w-4 h-4 fill-current" />
                                                    )}
                                                    {showDinnerInFlow ? 'DINNER IN' : 'RESUME'}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={handleTimeOut}
                                                disabled={actionLoading || !shiftAllowsClockOut}
                                                title={
                                                    !shiftAllowsClockOut
                                                        ? 'Full-time: clock out only during 4 PM – 12 AM, or before 4 AM after midnight'
                                                        : undefined
                                                }
                                                className="flex-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 px-3 py-2.5 h-10 rounded-xl text-[11px] font-bold tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4 fill-current" />}
                                                OUT
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
