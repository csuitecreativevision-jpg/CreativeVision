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
        <div className="w-full bg-[#13141f] rounded-xl border border-white/5 mb-4 overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-1 h-full ${activeLogId ? 'bg-emerald-500' : 'bg-gray-600'}`} />
            
            <div className="p-3 pl-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${activeLogId ? 'text-emerald-400' : 'text-gray-400'}`} />
                        <span className="text-xs font-bold text-gray-300">Time Tracking</span>
                    </div>
                    {activeLogId && (
                        <div className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold animate-pulse ${
                            status === 'paused' 
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                            {status === 'paused' ? 'PAUSED' : 'ACTIVE'}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-1">
                    <div className={`font-mono text-lg font-bold ${activeLogId ? 'text-white tracking-wider' : 'text-gray-600'} ${status === 'paused' && 'opacity-50'}`}>
                        {elapsedTime}
                    </div>

                    <div className="flex gap-1.5">
                        {!activeLogId ? (
                            <button
                                onClick={handleTimeIn}
                                disabled={actionLoading}
                                className="bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                                TIME IN
                            </button>
                        ) : (
                            <>
                                {status === 'active' ? (
                                    <button
                                        onClick={handlePause}
                                        disabled={actionLoading}
                                        className="bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500 hover:text-white text-amber-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pause className="w-3 h-3 fill-current" />}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleResume}
                                        disabled={actionLoading}
                                        className="bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                    </button>
                                )}
                                <button
                                    onClick={handleTimeOut}
                                    disabled={actionLoading}
                                    className="bg-red-500/20 border border-red-500/30 hover:bg-red-500 hover:text-white text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3 fill-current" />}
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
