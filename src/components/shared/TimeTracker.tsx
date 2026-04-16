import { useState, useEffect } from 'react';
import { Play, Square, Loader2, Clock, Pause, RefreshCw } from 'lucide-react';
import { supabase } from '../../services/boardsService';

export const TimeTracker = () => {
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeLogId, setActiveLogId] = useState<string | null>(null);
    const [timeIn, setTimeIn] = useState<Date | null>(null);
    const [status, setStatus] = useState<'active' | 'paused' | 'completed' | null>(null);
    const [lastPausedAt, setLastPausedAt] = useState<Date | null>(null);
    const [totalPausedSeconds, setTotalPausedSeconds] = useState(0);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');

    const userEmail = localStorage.getItem('portal_user_email') || '';
    const userName = localStorage.getItem('portal_user_name') || 'Unknown Editor';

    useEffect(() => {
        if (!userEmail) {
            setLoading(false);
            return;
        }
        checkActiveSession();
    }, [userEmail]);

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

    const checkActiveSession = async () => {
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
            } else {
                setActiveLogId(null);
                setTimeIn(null);
                setStatus(null);
                setLastPausedAt(null);
                setTotalPausedSeconds(0);
                setElapsedTime('00:00:00');
            }
        } catch (error) {
            console.error('Error fetching active time log:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTimeIn = async () => {
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

    const handlePause = async () => {
        if (!activeLogId || status === 'paused') return;
        setActionLoading(true);
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

    const handleResume = async () => {
        if (!activeLogId || status === 'active' || !lastPausedAt) return;
        setActionLoading(true);
        const now = new Date();
        const additionalSeconds = Math.floor((now.getTime() - lastPausedAt.getTime()) / 1000);
        const newTotal = totalPausedSeconds + additionalSeconds;
        try {
            const { error } = await supabase
                .from('time_logs')
                .update({ last_paused_at: null, total_paused_seconds: newTotal, status: 'active' })
                .eq('id', activeLogId);
            if (error) throw error;
            setStatus('active');
            setLastPausedAt(null);
            setTotalPausedSeconds(newTotal);
        } catch (error) {
            console.error('Error resuming:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleTimeOut = async () => {
        if (!activeLogId) return;
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
            
            setActiveLogId(null);
            setTimeIn(null);
            setStatus(null);
            setLastPausedAt(null);
            setTotalPausedSeconds(0);
            setElapsedTime('00:00:00');
        } catch (error) {
            console.error('Error clocking out:', error);
            alert('Failed to Time Out.');
        } finally {
            setActionLoading(false);
        }
    };

    if (!userEmail) return null;

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full bg-white/[0.02] rounded-xl border border-white/[0.05] mb-2 overflow-hidden relative group transition-all duration-300 hover:bg-white/[0.03]">
            <div className={`absolute left-0 top-0 w-1 h-full transition-colors duration-300 ${activeLogId ? (status === 'paused' ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-white/10'}`} />
            
            <div className="p-3.5 pl-5 flex flex-col gap-2.5">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className={`w-3.5 h-3.5 transition-colors duration-300 ${activeLogId ? (status === 'paused' ? 'text-amber-400' : 'text-emerald-400') : 'text-white/30'}`} />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white/50">
                            Time Tracker
                        </span>
                    </div>
                    {activeLogId && (
                        <div className={`px-2 py-0.5 rounded-md border text-[9px] font-black tracking-widest uppercase transition-all duration-300 ${
                            status === 'paused' 
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse'
                        }`}>
                            {status === 'paused' ? 'PAUSED' : 'ACTIVE'}
                        </div>
                    )}
                </div>

                {/* Timer and Action Buttons */}
                <div className="flex flex-col mt-2">
                    <div className={`font-mono text-xl font-bold text-center tabular-nums transition-all duration-300 ${activeLogId ? (status === 'paused' ? 'text-white/50' : 'text-white') : 'text-white/20'}`}>
                        {elapsedTime}
                    </div>

                    <div className="flex items-center gap-2 mt-3 w-full">
                        {!activeLogId ? (
                            <button
                                onClick={handleTimeIn}
                                disabled={actionLoading}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black px-3.5 py-2.5 h-10 rounded-xl text-[11px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                TIME IN
                            </button>
                        ) : (
                            <>
                                {status === 'active' ? (
                                    <button
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
                                        onClick={handleResume}
                                        disabled={actionLoading}
                                        className="flex-1 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white text-[11px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        title="Resume"
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                        RESUME
                                    </button>
                                )}
                                <button
                                    onClick={handleTimeOut}
                                    disabled={actionLoading}
                                    className="flex-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 px-3 py-2.5 h-10 rounded-xl text-[11px] font-bold tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4 fill-current" />}
                                    OUT
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
