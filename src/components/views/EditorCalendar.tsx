import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { getAllBoards, getBoardItems } from '../../services/mondayService';
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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, ArrowLeft, Briefcase, UserX } from 'lucide-react';
import { motion } from 'framer-motion';

interface EditorCalendarProps {
    onBack: () => void;
    boards: any[]; // Kept for backwards compat, but we also fetch independently
}

export function EditorCalendar({ onBack, boards: parentBoards }: EditorCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCalendarData();
    }, [currentDate]);

    const fetchCalendarData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Approved Leave Requests
            const { data: leavesData } = await supabase
                .from('leave_requests')
                .select('*')
                .eq('status', 'approved');
            
            if (leavesData) setLeaveRequests(leavesData);

            // 2. Determine which boards to scan for deadlines
            // Get editor's allowed board IDs
            const email = localStorage.getItem('portal_user_email');
            let allowedBoardIds: string[] = [];
            if (email) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('allowed_board_ids')
                    .eq('email', email)
                    .single();
                if (userData?.allowed_board_ids) {
                    allowedBoardIds = userData.allowed_board_ids;
                }
            }

            // 3. Fetch ALL boards from Monday.com
            const allBoards = await getAllBoards();
            
            // Include workspace boards the editor has access to
            const workspaceBoards = (allBoards || []).filter((b: any) => {
                const name = b.name.toLowerCase();
                const isWorkspace = name.includes('- workspace');
                const isSubitem = b.type === 'sub_items_board' || name.includes('subitems');
                const hasPermission = allowedBoardIds.length > 0 ? allowedBoardIds.includes(b.id) : false;
                return isWorkspace && !isSubitem && hasPermission;
            });

            // Also include management/VE project boards that the editor might be on
            const managementBoards = (allBoards || []).filter((b: any) => {
                const name = b.name.toLowerCase();
                return (
                    name.includes('ve project') ||
                    name.includes('video editing project') ||
                    name.includes('management')
                ) && !name.includes('subitems') && b.type !== 'sub_items_board';
            });

            // Combine and deduplicate
            const boardMap = new Map<string, any>();
            [...workspaceBoards, ...managementBoards].forEach(b => boardMap.set(b.id, b));
            // Also add any parent-passed boards
            parentBoards.forEach(b => boardMap.set(b.id, b));
            const boardsToScan = Array.from(boardMap.values());

            console.log(`[EditorCalendar] Scanning ${boardsToScan.length} boards for deadlines:`, boardsToScan.map((b: any) => b.name));

            // 4. Extract deadlines from all boards
            const allProjects: any[] = [];
            
            for (const board of boardsToScan) {
                try {
                    const fullBoardData = await getBoardItems(board.id);
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

                    items.forEach((item: any) => {
                        const dlVal = item.column_values?.find((v: any) => v.id === deadlineCol.id);
                        if (!dlVal) return;

                        let dateObj: Date | null = null;

                        // Try JSON parsing first (date columns store {date: "2024-01-15"})
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
                            // For management boards, extract editor name via people/editor column
                            let editorName = '';
                            if (!board.name.toLowerCase().includes('- workspace')) {
                                const editorCol = fullBoardData.columns.find((c: any) =>
                                    c.title.toLowerCase().includes('editor') || c.type === 'people'
                                );
                                if (editorCol) {
                                    const editorVal = item.column_values?.find((v: any) => v.id === editorCol.id);
                                    editorName = editorVal?.text || editorVal?.display_value || '';
                                }

                                // If this is from a management board, only include items assigned to this editor
                                const userName = localStorage.getItem('portal_user_name') || '';
                                if (editorName && userName) {
                                    const normalizedEditor = editorName.toLowerCase().trim();
                                    const normalizedUser = userName.toLowerCase().trim();
                                    if (!normalizedEditor.includes(normalizedUser) && !normalizedUser.includes(normalizedEditor)) {
                                        return; // Skip — not this editor's project
                                    }
                                }
                            }

                            allProjects.push({
                                id: item.id,
                                name: item.name,
                                client: board.name.replace(/- Workspace/i, '').replace(/\s*\(.*?\)\s*/g, '').trim(),
                                deadline: dateObj
                            });
                        }
                    });
                } catch (err) {
                    console.warn(`[EditorCalendar] Failed to fetch board ${board.id}`, err);
                }
            }

            console.log(`[EditorCalendar] Found ${allProjects.length} projects with deadlines`);
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
            
            start.setHours(0,0,0,0);
            end.setHours(23,59,59,999);
            const check = new Date(day);
            return check >= start && check <= end;
        });

        const dayDeadlines = projects.filter(p => !isNaN(p.deadline.getTime()) && isSameDay(p.deadline, day));

        return { dayLeaves, dayDeadlines };
    };

    return (
        <motion.div
            key="calendar-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col h-full z-10 w-full"
        >
            {/* Detail Header */}
            <div className="h-24 px-8 flex items-center gap-6 border-b border-white/5 bg-[#0a0a16] flex-shrink-0">
                <button
                    onClick={onBack}
                    className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all group"
                >
                    <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 duration-300" />
                </button>
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                        <CalendarIcon className="w-8 h-8 text-emerald-400" />
                        My Calendar
                    </h2>
                    <p className="text-sm text-gray-400 font-medium">Track assigned project deadlines and team availability</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header Controls */}
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
                        <div className="flex items-center gap-4 text-xs font-medium">
                            <div className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-full">
                                <UserX className="w-3.5 h-3.5" /> Team Leave
                            </div>
                            <div className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full">
                                <Briefcase className="w-3.5 h-3.5" /> My Deadline
                            </div>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="bg-[#11111c] rounded-2xl border border-white/5 overflow-hidden">
                        {/* Days of Week */}
                        <div className="grid grid-cols-7 border-b border-white/5 bg-[#07070b]">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 min-h-[500px] auto-rows-fr">
                            {isLoading ? (
                                <div className="col-span-7 flex flex-col items-center justify-center p-20 text-gray-500">
                                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                                    <p>Syncing deadlines...</p>
                                </div>
                            ) : (
                                days.map((day, idx) => {
                                    const { dayLeaves, dayDeadlines } = getDayEvents(day);
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
                                                {/* Deadlines */}
                                                {dayDeadlines.map((p, i) => (
                                                    <div key={`dl-${i}`} className="text-[10px] font-bold px-2 py-1 rounded border bg-rose-500/10 border-rose-500/20 text-rose-400 truncate w-full" title={`${p.name} (${p.client})`}>
                                                        🎯 {p.name}
                                                    </div>
                                                ))}

                                                {/* Leaves */}
                                                {dayLeaves.map((l, i) => (
                                                    <div key={`lv-${i}`} className="text-[10px] font-bold px-2 py-1 rounded border bg-orange-500/10 border-orange-500/20 text-orange-400 truncate w-full" title={`${l.user_name} - ${l.leave_type}`}>
                                                        🏖️ {l.user_name.split(' ')[0]}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
