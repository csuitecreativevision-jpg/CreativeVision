import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { getBoardItems } from '../../services/mondayService';
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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, ArrowLeft, Briefcase, UserX, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface PortalCalendarProps {
    onBack?: () => void;
    /** Board IDs to scan for deadlines — only these are fetched from Monday.com */
    boardIds: string[];
    /** Portal type — controls leave visibility and title */
    portalType: 'admin' | 'editor' | 'client';
    /** Show time logs (admin only) */
    showTimeLogs?: boolean;
    /** When true, renders without header/back button (for embedding in AdminPageLayout) */
    embedded?: boolean;
}

export function PortalCalendar({ onBack, boardIds, portalType, showTimeLogs = false, embedded = false }: PortalCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [timeLogs, setTimeLogs] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const boardIdsKey = useMemo(() => [...new Set(boardIds)].sort().join(','), [boardIds]);

    useEffect(() => {
        fetchCalendarData();
    }, [currentDate, boardIdsKey]);

    const fetchCalendarData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Approved Leave Requests (editors/admins see team leaves)
            if (portalType !== 'client') {
                const { data: leavesData } = await supabase
                    .from('leave_requests')
                    .select('*')
                    .eq('status', 'approved');
                if (leavesData) setLeaveRequests(leavesData);
            }

            // 2. Fetch Time Logs (admin only)
            if (showTimeLogs) {
                const startStr = startOfWeek(startOfMonth(currentDate)).toISOString();
                const endStr = endOfWeek(endOfMonth(currentDate)).toISOString();
                const { data: logsData } = await supabase
                    .from('time_logs')
                    .select('*')
                    .gte('time_in', startStr)
                    .lte('time_in', endStr);
                if (logsData) setTimeLogs(logsData);
            }

            // 3. Fetch deadlines ONLY from the provided board IDs
            const allProjects: any[] = [];
            const uniqueIds = [...new Set(boardIds)];

            console.log(`[Calendar] Scanning ${uniqueIds.length} boards for deadlines`);

            for (const bid of uniqueIds) {
                try {
                    const fullBoardData = await getBoardItems(bid, false, (freshData) => {
                        // Background refresh completed — re-run calendar fetch to pick up new deadlines
                        fetchCalendarData();
                    });
                    if (!fullBoardData?.columns) continue;

                    // Find date/deadline/timeline column
                    const deadlineCol = fullBoardData.columns.find((c: any) =>
                        c.title.toLowerCase().includes('deadline') ||
                        c.title.toLowerCase() === 'date' ||
                        c.title.toLowerCase().includes('timeline') ||
                        c.type === 'date'
                    );

                    if (!deadlineCol) continue;

                    const items = fullBoardData.groups?.flatMap((g: any) =>
                        fullBoardData.items?.filter((i: any) => i.group.id === g.id).map((i: any) => ({ ...i, groupName: g.title }))
                    ) || [];

                    // For editor portal on management boards, filter to only their items
                    const userName = localStorage.getItem('portal_user_name') || '';
                    const editorCol = portalType === 'editor'
                        ? fullBoardData.columns.find((c: any) => c.title.toLowerCase().includes('editor') || c.type === 'people')
                        : null;

                    items.forEach((item: any) => {
                        // If we have an editor column and this is an editor portal, filter by name
                        if (editorCol && userName) {
                            const editorVal = item.column_values?.find((v: any) => v.id === editorCol.id);
                            const assignedEditor = (editorVal?.text || editorVal?.display_value || '').toLowerCase().trim();
                            const normalUser = userName.toLowerCase().trim();
                            if (assignedEditor && !assignedEditor.includes(normalUser) && !normalUser.includes(assignedEditor)) {
                                return; // Skip — not this editor's project
                            }
                        }

                        const dlVal = item.column_values?.find((v: any) => v.id === deadlineCol.id);
                        if (!dlVal) return;

                        let dateObj: Date | null = null;

                        // Try JSON parsing (date columns: {date: "2024-01-15"}, timeline: {from, to})
                        if (dlVal.value) {
                            try {
                                const parsed = JSON.parse(dlVal.value);
                                const dateStr = parsed.date || parsed.to || parsed.from;
                                if (dateStr) {
                                    const d = new Date(dateStr);
                                    if (!isNaN(d.getTime())) dateObj = d;
                                }
                            } catch (e) { /* not JSON */ }
                        }

                        // Fallback: text or display_value
                        if (!dateObj) {
                            const textVal = dlVal.text || dlVal.display_value;
                            if (textVal) {
                                const d = new Date(textVal);
                                if (!isNaN(d.getTime())) dateObj = d;
                            }
                        }

                        if (dateObj) {
                            allProjects.push({
                                id: item.id,
                                name: item.name,
                                client: fullBoardData.name
                                    .replace(/- Workspace/i, '')
                                    .replace(/fulfillment board/i, '')
                                    .replace(/\s*\(.*?\)\s*/g, '')
                                    .trim(),
                                deadline: dateObj
                            });
                        }
                    });
                } catch (err) {
                    console.warn(`[Calendar] Failed to fetch board ${bid}`, err);
                }
            }

            const seen = new Set<string>();
            const dedupedProjects = allProjects.filter(p => {
                if (seen.has(p.id)) return false;
                seen.add(p.id);
                return true;
            });
            console.log(`[Calendar] Found ${dedupedProjects.length} projects with deadlines (deduped from ${allProjects.length})`);
            setProjects(dedupedProjects);

        } catch (error) {
            console.error('Failed to fetch calendar data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate));
        const end = endOfWeek(endOfMonth(currentDate));
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const getDayEvents = (day: Date) => {
        const dayLeaves = leaveRequests.filter(leave => {
            if (!leave.start_date || !leave.end_date) return false;
            const start = new Date(leave.start_date);
            const end = new Date(leave.end_date);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            const check = new Date(day);
            return check >= start && check <= end;
        });

        const dayDeadlines = projects.filter(p => !isNaN(p.deadline.getTime()) && isSameDay(p.deadline, day));

        const dayLogs = timeLogs.filter(log => {
            if (!log.time_in) return false;
            const logDate = new Date(log.time_in);
            return !isNaN(logDate.getTime()) && isSameDay(logDate, day);
        });
        const activeUsers = Array.from(new Set(dayLogs.map(l => l.user_name || l.user_email?.split('@')[0])));

        return { dayLeaves, dayDeadlines, activeUsers };
    };

    const titleMap = {
        admin: 'Team Calendar',
        editor: 'My Calendar',
        client: 'Project Calendar'
    };

    const subtitleMap = {
        admin: 'Overview of schedules, availability, and upcoming deadlines',
        editor: 'Track assigned project deadlines and team availability',
        client: 'Track your project deadlines and delivery schedule'
    };

    const accentColor = {
        admin: 'emerald',
        editor: 'emerald',
        client: 'blue'
    }[portalType];

    const calendarContent = (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#11111c] p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-[#07070b] rounded-xl border border-white/5 p-1">
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
                    <h3 className="text-xl font-bold text-white">
                        {format(currentDate, 'MMMM yyyy')}
                    </h3>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-xs font-medium flex-wrap">
                    <div className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full">
                        <Briefcase className="w-3.5 h-3.5" /> Deadline
                    </div>
                    {portalType !== 'client' && (
                        <div className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-full">
                            <UserX className="w-3.5 h-3.5" /> On Leave
                        </div>
                    )}
                    {showTimeLogs && (
                        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" /> Working
                        </div>
                    )}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-[#11111c] rounded-2xl border border-white/5 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-white/5 bg-[#07070b]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 min-h-[500px] auto-rows-fr">
                    {isLoading ? (
                        <div className="col-span-7 flex flex-col items-center justify-center p-20 text-gray-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                            <p>Syncing deadlines...</p>
                        </div>
                    ) : (
                        days.map((day, idx) => {
                            const { dayLeaves, dayDeadlines, activeUsers } = getDayEvents(day);
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const today = isToday(day);

                            return (
                                <div
                                    key={day.toString()}
                                    className={`
                                        min-h-[100px] p-2 border-r border-b border-white/5 transition-colors
                                        ${!isCurrentMonth ? 'bg-[#07070b]/50 opacity-50' : 'hover:bg-white/[0.02]'}
                                        ${idx % 7 === 6 ? 'border-r-0' : ''}
                                    `}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`
                                            w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold
                                            ${today ? 'bg-emerald-600 text-white' : (isCurrentMonth ? 'text-gray-300' : 'text-gray-600')}
                                        `}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 overflow-y-auto max-h-[80px] no-scrollbar">
                                        {dayDeadlines.map((p, i) => (
                                            <div key={`dl-${i}`} className="text-[10px] font-bold px-2 py-1 rounded border bg-rose-500/10 border-rose-500/20 text-rose-400 truncate w-full" title={`${p.name} (${p.client})`}>
                                                🎯 {p.name}
                                            </div>
                                        ))}

                                        {dayLeaves.map((l, i) => (
                                            <div key={`lv-${i}`} className="text-[10px] font-bold px-2 py-1 rounded border bg-orange-500/10 border-orange-500/20 text-orange-400 truncate w-full" title={`${l.user_name} - ${l.leave_type}`}>
                                                🏖️ {l.user_name.split(' ')[0]}
                                            </div>
                                        ))}

                                        {showTimeLogs && activeUsers.length > 0 && (
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
    );

    // Embedded mode: return just the calendar content (for use inside AdminPageLayout)
    if (embedded) {
        return calendarContent;
    }

    // Standalone mode: wrap with header and motion animation
    return (
        <motion.div
            key="calendar-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col h-full z-10 w-full"
        >
            {/* Header */}
            <div className="h-24 px-8 flex items-center gap-6 border-b border-white/5 bg-[#0a0a16] flex-shrink-0">
                <button
                    onClick={onBack}
                    className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all group"
                >
                    <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 duration-300" />
                </button>
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                        <CalendarIcon className={`w-8 h-8 text-${accentColor}-400`} />
                        {titleMap[portalType]}
                    </h2>
                    <p className="text-sm text-gray-400 font-medium">{subtitleMap[portalType]}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {calendarContent}
            </div>
        </motion.div>
    );
}

