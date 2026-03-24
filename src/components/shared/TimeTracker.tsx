import { useState, useEffect } from 'react';
import { Play, Square, Loader2, Clock } from 'lucide-react';
import { supabase } from '../../services/boardsService';

export const TimeTracker = () => {
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeLogId, setActiveLogId] = useState<string | null>(null);
    const [timeIn, setTimeIn] = useState<Date | null>(null);
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
        if (timeIn) {
            interval = setInterval(() => {
                const now = new Date();
                const diff = now.getTime() - timeIn.getTime();
                
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                
                setElapsedTime(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timeIn]);

    const checkActiveSession = async () => {
        try {
            const { data, error } = await supabase
                .from('time_logs')
                .select('*')
                .eq('user_email', userEmail)
                .eq('status', 'active')
                .limit(1)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setActiveLogId(data.id);
                setTimeIn(new Date(data.time_in));
            } else {
                setActiveLogId(null);
                setTimeIn(null);
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
            }
        } catch (error) {
            console.error('Error clocking in:', error);
            alert('Failed to Time In. Please ensure the actual database table is created.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleTimeOut = async () => {
        if (!activeLogId) return;
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('time_logs')
                .update({
                    time_out: new Date().toISOString(),
                    status: 'completed'
                })
                .eq('id', activeLogId);

            if (error) throw error;
            
            setActiveLogId(null);
            setTimeIn(null);
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
                        <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono font-bold animate-pulse">
                            ACTIVE
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-1">
                    <div className={`font-mono text-lg font-bold ${activeLogId ? 'text-white tracking-wider' : 'text-gray-600'}`}>
                        {elapsedTime}
                    </div>

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
                        <button
                            onClick={handleTimeOut}
                            disabled={actionLoading}
                            className="bg-red-500/20 border border-red-500/30 hover:bg-red-500 hover:text-white text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                        >
                            {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3 fill-current" />}
                            TIME OUT
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
