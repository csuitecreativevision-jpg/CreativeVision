import { useState, useEffect } from 'react';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { supabase } from '../../lib/supabaseClient';
import { Clock, Loader2, Calendar } from 'lucide-react';

export default function AdminTimeLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('time_logs')
                .select('*')
                .order('time_in', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Failed to fetch time logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (start: string, end: string | null) => {
        if (!end) return 'Active';
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hrs}h ${mins}m`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, { 
            month: 'short', day: 'numeric', year: 'numeric' 
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString(undefined, {
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <AdminPageLayout
            title="Time Tracking"
            subtitle="Monitor editor hours, active sessions, and historical time logs."
        >
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0E0E1A]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl flex items-center gap-4">
                        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {logs.filter(l => l.status === 'active').length}
                            </div>
                            <div className="text-sm font-medium text-gray-500">Active Sessions</div>
                        </div>
                    </div>
                    <div className="bg-[#0E0E1A]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl flex items-center gap-4">
                        <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {logs.length}
                            </div>
                            <div className="text-sm font-medium text-gray-500">Total Logs Recorded</div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-[#0E0E1A]/80 backdrop-blur-md border border-white/5 rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white">Employee Work Sessions</h2>
                        <button 
                            onClick={fetchLogs} 
                            disabled={isLoading}
                            className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#131322]">
                                <tr>
                                    {['Employee', 'Date', 'Time In', 'Time Out', 'Duration', 'Status'].map(h => (
                                        <th key={h} className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading && logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Retrieving logs...
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">
                                            No time logs found in the database.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="p-4 py-5">
                                                <div className="font-bold text-white text-sm">{log.user_name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{log.user_email}</div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-300">
                                                {formatDate(log.time_in)}
                                            </td>
                                            <td className="p-4 text-sm font-mono text-gray-400">
                                                {formatTime(log.time_in)}
                                            </td>
                                            <td className="p-4 text-sm font-mono text-gray-400">
                                                {log.time_out ? formatTime(log.time_out) : '-'}
                                            </td>
                                            <td className="p-4">
                                                <span className={`font-mono text-sm font-bold ${!log.time_out ? 'text-emerald-400' : 'text-gray-300'}`}>
                                                    {formatDuration(log.time_in, log.time_out)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {log.status === 'active' ? (
                                                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-white/5 border border-white/10 text-gray-400 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit block">
                                                        Completed
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminPageLayout>
    );
}
