import { useState, useEffect, useMemo } from 'react';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { supabase } from '../../lib/supabaseClient';
import { Clock, Loader2, Calendar, Filter, Users, PauseCircle } from 'lucide-react';

export default function AdminTimeLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEditor, setSelectedEditor] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

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

    const formatDuration = (start: string, end: string | null, totalPausedSecs: number = 0) => {
        if (!end) return '-';
        const diff = Math.max(0, new Date(end).getTime() - new Date(start).getTime() - (totalPausedSecs * 1000));
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

    // Filter calculations
    const uniqueEditors = useMemo(() => {
        const editors = new Map<string, string>();
        logs.forEach(log => {
            if (log.user_email && log.user_name) {
                editors.set(log.user_email, log.user_name);
            }
        });
        return Array.from(editors.entries()).map(([email, name]) => ({ email, name }));
    }, [logs]);

    const uniqueMonths = useMemo(() => {
        const months = new Set<string>();
        logs.forEach(log => {
            const date = new Date(log.time_in);
            const monthStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; // YYYY-MM
            months.add(monthStr);
        });
        return Array.from(months).sort().reverse();
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            let matches = true;
            
            if (selectedEditor !== 'all' && log.user_email !== selectedEditor) matches = false;
            
            if (selectedMonth !== 'all') {
                const date = new Date(log.time_in);
                const monthStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                if (monthStr !== selectedMonth) matches = false;
            }

            if (selectedStatus !== 'all' && log.status !== selectedStatus) matches = false;

            return matches;
        });
    }, [logs, selectedEditor, selectedMonth, selectedStatus]);

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
                        <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <PauseCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {logs.filter(l => l.status === 'paused').length}
                            </div>
                            <div className="text-sm font-medium text-gray-500">Currently Paused</div>
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

                {/* Filters */}
                <div className="bg-[#0E0E1A]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-bold uppercase tracking-wider">Filters</span>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                        {/* Editor Filter */}
                        <div className="relative min-w-[150px]">
                            <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <select
                                value={selectedEditor}
                                onChange={(e) => setSelectedEditor(e.target.value)}
                                className="w-full bg-[#131322] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 appearance-none"
                            >
                                <option value="all">All Editors</option>
                                {uniqueEditors.map(ed => (
                                    <option key={ed.email} value={ed.email}>{ed.name}</option>
                                ))}
                            </select>
                        </div>
                        {/* Month Filter */}
                        <div className="relative min-w-[140px]">
                            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full bg-[#131322] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 appearance-none"
                            >
                                <option value="all">All Months</option>
                                {uniqueMonths.map(m => {
                                    const [y, mm] = m.split('-');
                                    const monthName = new Date(parseInt(y), parseInt(mm)-1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                                    return <option key={m} value={m}>{monthName}</option>;
                                })}
                            </select>
                        </div>
                        {/* Status Filter */}
                        <div className="relative min-w-[130px]">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full bg-[#131322] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 appearance-none"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-[#0E0E1A]/80 backdrop-blur-md border border-white/5 rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-white">Employee Work Sessions</h2>
                            <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 text-xs font-mono">{filteredLogs.length}</span>
                        </div>
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
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">
                                            No time logs match your current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
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
                                                    {formatDuration(log.time_in, log.time_out, log.total_paused_seconds || 0)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {log.status === 'active' && (
                                                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                        Active
                                                    </span>
                                                )}
                                                {log.status === 'paused' && (
                                                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                        Paused
                                                    </span>
                                                )}
                                                {log.status === 'completed' && (
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
