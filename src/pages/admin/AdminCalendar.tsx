import { useState, useEffect, useMemo } from 'react';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { supabase } from '../../lib/supabaseClient';
import { getWorkspaceBoards, getMultipleBoardItems } from '../../services/mondayService';
import { 
    format, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameMonth, 
    isSameDay, 
    isToday 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, Clock, Briefcase, UserX } from 'lucide-react';

export default function AdminCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [timeLogs, setTimeLogs] = useState<any[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCalendarData();
    }, [currentDate]);

    const fetchCalendarData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Time Logs for the month
            const startStr = startOfWeek(startOfMonth(currentDate)).toISOString();
            const endStr = endOfWeek(endOfMonth(currentDate)).toISOString();

            const { data: logsData } = await supabase
                .from('time_logs')
                .select('*')
                .gte('time_in', startStr)
                .lte('time_in', endStr);
            
            if (logsData) setTimeLogs(logsData);

            // 2. Fetch Approved Leave Requests
            const { data: leavesData } = await supabase
                .from('leave_requests')
                .select('*')
                .eq('status', 'approved');
            
            if (leavesData) setLeaveRequests(leavesData);

            // 3. Fetch Monday Projects & Extract Deadlines
            const boards = await getWorkspaceBoards();
            const boardIds = boards.map((b: any) => b.id);
            const boardsWithItems = await getMultipleBoardItems(boardIds);
            
            const allProjects: any[] = [];
            
            boardsWithItems.forEach((board: any) => {
                const deadlineCol = board.columns?.find((c: any) => 
                    c.title.toLowerCase().includes('deadline') || 
                    c.title.toLowerCase() === 'date' || 
                    c.title.toLowerCase().includes('timeline')
                );

                if (!deadlineCol) return;

                const items = board.groups?.flatMap((g: any) => 
                    board.items?.filter((i: any) => i.group.id === g.id).map((i: any) => ({ ...i, groupName: g.title }))
                ) || [];

                items.forEach((item: any) => {
                    const dlVal = item.column_values?.find((v: any) => v.id === deadlineCol.id);
                    if (dlVal && dlVal.value) {
                        try {
                            const parsed = JSON.parse(dlVal.value);
                            // handle timeline (from, to) or date
                            const dateStr = parsed.date || parsed.to || parsed.from;
                            if (dateStr) {
                                const parseDate = new Date(dateStr);
                                if (!isNaN(parseDate.getTime())) {
                                    allProjects.push({
                                        id: item.id,
                                        name: item.name,
                                        client: item.groupName,
                                        deadline: parseDate
                                    });
                                }
                            }
                        } catch (e) {
                            // ignore parsing errors
                        }
                    }
                });
            });

            setProjects(allProjects);

        } catch (error) {
            console.error('Failed to fetch calendar data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    // Generate Days Grid
    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate));
        const end = endOfWeek(endOfMonth(currentDate));
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const getDayEvents = (day: Date) => {
        const dayLogs = timeLogs.filter(log => {
            if (!log.time_in) return false;
            const logDate = new Date(log.time_in);
            return !isNaN(logDate.getTime()) && isSameDay(logDate, day);
        });
        
        // Unique users who logged time today
        const activeUsers = Array.from(new Set(dayLogs.map(l => l.user_name || l.user_email?.split('@')[0])));

        const dayLeaves = leaveRequests.filter(leave => {
            if (!leave.start_date || !leave.end_date) return false;
            const start = new Date(leave.start_date);
            const end = new Date(leave.end_date);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
            
            // zero out times for comparison
            start.setHours(0,0,0,0);
            end.setHours(23,59,59,999);
            const check = new Date(day);
            return check >= start && check <= end;
        });

        const dayDeadlines = projects.filter(p => !isNaN(p.deadline.getTime()) && isSameDay(p.deadline, day));

        return { activeUsers, dayLeaves, dayDeadlines };
    };

    return (
        <AdminPageLayout
            title="Team Calendar"
            subtitle="Overview of schedules, availability, and upcoming deadlines"
        >
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#151525] p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-[#0E0E1A] rounded-xl border border-white/5 p-1">
                            <button onClick={handlePrevMonth} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={handleToday} className="px-4 py-2 font-bold text-sm text-gray-300 hover:text-white transition-colors">
                                Today
                            </button>
                            <button onClick={handleNextMonth} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                            <CalendarIcon className="w-6 h-6 text-violet-400" />
                            {format(currentDate, 'MMMM yyyy')}
                        </h2>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" /> Working
                        </div>
                        <div className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-full">
                            <UserX className="w-3.5 h-3.5" /> On Leave
                        </div>
                        <div className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full">
                            <Briefcase className="w-3.5 h-3.5" /> Deadline
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="bg-[#151525] rounded-2xl border border-white/10 overflow-hidden">
                    {/* Days of Week */}
                    <div className="grid grid-cols-7 border-b border-white/10 bg-[#0E0E1A]">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 min-h-[600px] auto-rows-fr">
                        {isLoading ? (
                            <div className="col-span-7 flex flex-col items-center justify-center p-20 text-gray-500">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-violet-500" />
                                <p>Syncing team schedules & boards...</p>
                            </div>
                        ) : (
                            days.map((day, idx) => {
                                const { activeUsers, dayLeaves, dayDeadlines } = getDayEvents(day);
                                const isCurrentMonth = isSameMonth(day, currentDate);
                                const today = isToday(day);

                                return (
                                    <div 
                                        key={day.toString()} 
                                        className={`
                                            min-h-[120px] p-2 border-r border-b border-white/5 transition-colors
                                            ${!isCurrentMonth ? 'bg-[#0E0E1A]/50 opacity-50' : 'hover:bg-white/[0.02]'}
                                            ${idx % 7 === 6 ? 'border-r-0' : ''}
                                        `}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`
                                                w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold
                                                ${today ? 'bg-violet-600 text-white' : (isCurrentMonth ? 'text-gray-300' : 'text-gray-600')}
                                            `}>
                                                {format(day, 'd')}
                                            </span>
                                        </div>

                                        <div className="space-y-1.5 overflow-y-auto max-h-[100px] no-scrollbar">
                                            {/* Deadlines */}
                                            {dayDeadlines.map((p, i) => (
                                                <div key={`dl-${i}`} className="text-[10px] font-bold px-2 py-1 rounded border bg-rose-500/10 border-rose-500/20 text-rose-400 truncate w-full" title={`${p.name} (${p.client})`}>
                                                    🎯 {p.name}
                                                </div>
                                            ))}

                                            {/* Leaves */}
                                            {dayLeaves.map((l, i) => (
                                                <div key={`lv-${i}`} className="text-[10px] font-bold px-2 py-1 rounded border bg-orange-500/10 border-orange-500/20 text-orange-400 truncate w-full" title={`${l.user_name} - ${l.leave_type}`}>
                                                    🏖️ {l.user_name.split(' ')[0]} ({l.leave_type})
                                                </div>
                                            ))}

                                            {/* Active Users (Time Logs) */}
                                            {activeUsers.length > 0 && (
                                                <div className="text-[10px] font-bold px-2 py-1 rounded border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 truncate w-full" title={activeUsers.join(', ')}>
                                                    💻 {activeUsers.length} active
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </AdminPageLayout>
    );
}
