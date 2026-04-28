import { useState, useEffect, useMemo } from 'react';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { motion } from 'framer-motion';
import {
    Activity,
    TrendingUp,
    Briefcase,
    Users,
    ChevronDown,
    Check,
    Calendar,
    Loader2,
    Crown,
    Sparkles,
    ArrowUpRight,
} from 'lucide-react';
import {
    getAllBoards, getMultipleBoardItems, getWorkspaceAnalytics, getAllFolders
} from '../../services/mondayService';
import { getCycleDates, isDateInCycle } from '../../features/performance-dashboard/utils/dateUtils';
import { getCache, setCache } from '../../services/cacheService';

const OVERVIEW_CACHE_KEY = 'admin_overview_stats';

const ACCENT_COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];
const EDITOR_COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

// ── Stat card ───────────────────────────────────────────────────────────────
function StatCard({
    title,
    value,
    sub,
    icon,
    color,
    delay = 0,
    loading = false,
}: {
    title: string;
    value: string;
    sub: string;
    icon: React.ReactNode;
    color: string;
    delay?: number;
    loading?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col justify-between p-4 sm:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden min-w-0"
        >
            {/* Top accent line */}
            <div className="absolute top-0 left-6 right-6 h-[1px]" style={{ background: `linear-gradient(to right, transparent, ${color}66, transparent)` }} />

            {/* Icon */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-5" style={{ background: `${color}14`, border: `1px solid ${color}25` }}>
                <span style={{ color }}>{icon}</span>
            </div>

            {/* Value */}
            <div>
                {loading ? (
                    <div className="h-9 w-16 bg-white/5 rounded-lg animate-pulse mb-2" />
                ) : (
                    <div className="text-[26px] sm:text-[30px] lg:text-[32px] font-black text-white leading-none tracking-tight mb-1.5 min-w-0 truncate" title={value}>
                        {value}
                    </div>
                )}
                <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: `${color}80` }}>{title}</div>
                <div className="text-[11px] text-white/25 mt-0.5 font-medium">{sub}</div>
            </div>
        </motion.div>
    );
}

// ── Bar row ─────────────────────────────────────────────────────────────────
function BarRow({
    rank,
    name,
    count,
    max,
    color,
    label,
    isTop,
}: {
    rank: number;
    name: string;
    count: number;
    max: number;
    color: string;
    label: string;
    isTop?: boolean;
}) {
    const pct = max > 0 ? (count / max) * 100 : 0;
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="flex items-center gap-3 group py-2">
            {/* Avatar / rank */}
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 relative"
                style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}
            >
                {initials || rank}
                {isTop && (
                    <Crown className="w-2.5 h-2.5 absolute -top-1 -right-1" style={{ color: '#f59e0b' }} />
                )}
            </div>

            {/* Name + bar */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-semibold text-white/65 group-hover:text-white/90 truncate transition-colors leading-none">{name}</span>
                    <span className="text-[10px] font-bold ml-2 flex-shrink-0 px-2 py-0.5 rounded-md" style={{ color, background: `${color}14`, border: `1px solid ${color}22` }}>
                        {count} {label}
                    </span>
                </div>
                <div className="h-[3px] w-full rounded-full overflow-hidden" style={{ background: `${color}12` }}>
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(to right, ${color}, ${color}99)` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    />
                </div>
            </div>
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AdminOverview() {
    const [rawData, setRawData] = useState<any>(() => {
        const cached = getCache<any>(OVERVIEW_CACHE_KEY);
        return cached?.data || null;
    });
    const [overviewLoading, setOverviewLoading] = useState(() => !getCache(OVERVIEW_CACHE_KEY));
    const [selectedCycles, setSelectedCycles] = useState<Set<string>>(new Set());
    const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);

    useEffect(() => { fetchOverviewData(); }, []);

    const fetchOverviewData = async () => {
        const hasCachedData = !!getCache(OVERVIEW_CACHE_KEY);
        if (!hasCachedData) setOverviewLoading(true);
        try {
            const [boardsData, analyticsData, allFolders] = await Promise.all([
                getAllBoards(),
                getWorkspaceAnalytics(),
                getAllFolders()
            ]);

            const allFetchedBoards = boardsData || [];
            const { cycles, data: cycleData } = analyticsData;

            const activeClientsFolder = allFolders.find((f: any) => f.name.toLowerCase() === 'active clients');
            let clientBoardItems: any[] = [];

            if (activeClientsFolder) {
                const clientBoardIds = activeClientsFolder.children.map((c: any) => String(c.id));
                const clientBoards = allFetchedBoards.filter((b: any) => clientBoardIds.includes(String(b.id)));
                const clientBoardMap = new Map(clientBoards.map((b: any) => [String(b.id), b.name]));
                if (clientBoardIds.length > 0) {
                    const [clientItemsData] = await Promise.all([getMultipleBoardItems(clientBoardIds)]);
                    clientBoardItems = clientItemsData.map((board: any) => ({
                        ...board,
                        boardName: clientBoardMap.get(String(board.id)) || board.name
                    }));
                }
            }

            const newData = { cycles, cycleData, clientBoardItems };
            setRawData(newData);
            setCache(OVERVIEW_CACHE_KEY, newData);

            if (cycles.length > 0 && selectedCycles.size === 0) {
                setSelectedCycles(new Set([cycles[0]]));
            }
        } catch (error) {
            console.error('Failed to load overview data', error);
        } finally {
            setOverviewLoading(false);
        }
    };

    const overviewStats = useMemo(() => {
        const empty = {
            activeClientsCount: 0, activeProjectsCount: 0, activeEditorsCount: 0,
            topEditor: { name: 'N/A', count: 0 },
            clientProjectDistribution: [] as { name: string; count: number }[],
            editorPerformance: [] as { name: string; count: number }[],
        };
        if (!rawData?.cycles) return empty;

        const { cycles, cycleData, clientBoardItems } = rawData;
        const cyclesToUse = selectedCycles.size > 0 ? Array.from(selectedCycles) : (cycles.length > 0 ? [cycles[0]] : []);

        // Editor stats
        const editorTotals: Record<string, number> = {};
        cyclesToUse.forEach((cycleKey: string) => {
            if (cycleData[cycleKey]) {
                Object.entries(cycleData[cycleKey]).forEach(([name, count]) => {
                    editorTotals[name] = (editorTotals[name] || 0) + (count as number);
                });
            }
        });
        const editorPerformance = Object.entries(editorTotals)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // Client stats
        const clientCounts: Record<string, number> = {};
        cyclesToUse.forEach((cycleKey: string) => {
            const match = cycleKey.match(/(\w+) (\d+) - Cycle (\d)/);
            if (!match) return;
            const [, monthStr, yearStr, cycleNumStr] = match;
            const year = parseInt(yearStr);
            const cycle = parseInt(cycleNumStr) as 1 | 2;
            const month = new Date(`${monthStr} 1, ${year}`).getMonth() + 1;
            const cycleInfo = getCycleDates(cycle, month, year);
            (clientBoardItems || []).forEach((board: any) => {
                const validItems = (board.items || []).filter((i: any) => {
                    if (!i.created_at) return false;
                    return isDateInCycle(new Date(i.created_at), cycleInfo);
                });
                if (validItems.length > 0) {
                    clientCounts[board.boardName] = (clientCounts[board.boardName] || 0) + validItems.length;
                }
            });
        });

        const clientProjectDistribution = Object.entries(clientCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
        const totalActiveProjects = clientProjectDistribution.reduce((s, c) => s + c.count, 0);

        return {
            activeClientsCount: clientProjectDistribution.length,
            activeProjectsCount: totalActiveProjects,
            activeEditorsCount: editorPerformance.length,
            topEditor: editorPerformance[0] ?? { name: 'None', count: 0 },
            clientProjectDistribution,
            editorPerformance,
        };
    }, [rawData, selectedCycles]);

    const availableCycles: string[] = rawData?.cycles || [];
    const toggleCycle = (cycle: string) => setSelectedCycles(prev => {
        const next = new Set(prev);
        next.has(cycle) ? next.delete(cycle) : next.add(cycle);
        return next;
    });
    const cycleLabel = selectedCycles.size === 0 ? 'All Cycles'
        : selectedCycles.size === 1 ? Array.from(selectedCycles)[0]
        : `${selectedCycles.size} Cycles`;

    return (
        <AdminPageLayout
            label="Admin"
            title="Overview"
            subtitle="Platform activity at a glance"
            action={
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)}
                        className="flex items-center gap-2 px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.07] rounded-xl text-xs font-semibold text-white/70 hover:text-white transition-all duration-150 w-full md:w-auto justify-between md:justify-start"
                    >
                        <Calendar className="w-3.5 h-3.5 text-violet-400" />
                        <span className="truncate min-w-0 flex-1 md:flex-none md:max-w-[180px] text-left">{cycleLabel}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform duration-200 ${isCycleDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isCycleDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsCycleDropdownOpen(false)} />}

                    {isCycleDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 md:left-auto md:right-0 mt-2 w-full md:w-72 bg-[#06060a]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-50">
                            <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Filter by Cycle</span>
                                <div className="flex gap-3">
                                    <button onClick={() => setSelectedCycles(new Set(availableCycles))} className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors">All</button>
                                    <span className="text-white/10">·</span>
                                    <button onClick={() => setSelectedCycles(new Set())} className="text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors">Clear</button>
                                </div>
                            </div>
                            <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
                                {availableCycles.map(cycle => {
                                    const sel = selectedCycles.has(cycle);
                                    return (
                                        <button
                                            key={cycle}
                                            onClick={() => toggleCycle(cycle)}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all mb-0.5 flex items-center justify-between ${sel ? 'bg-violet-500/10 text-violet-300' : 'text-white/40 hover:bg-white/[0.04] hover:text-white/80'}`}
                                        >
                                            <span className="text-xs font-medium">{cycle}</span>
                                            {sel && <Check className="w-3 h-3 flex-shrink-0" />}
                                        </button>
                                    );
                                })}
                                {availableCycles.length === 0 && (
                                    <div className="p-4 text-center text-white/20 text-xs">No cycles available.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            {/* ── Stat cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    title="Active Clients"
                    value={overviewLoading ? '—' : String(overviewStats.activeClientsCount)}
                    sub="With active projects"
                    icon={<Briefcase className="w-4 h-4" />}
                    color="#3b82f6"
                    delay={0.05}
                    loading={overviewLoading}
                />
                <StatCard
                    title="Active Projects"
                    value={overviewLoading ? '—' : String(overviewStats.activeProjectsCount)}
                    sub="In selected cycle(s)"
                    icon={<Activity className="w-4 h-4" />}
                    color="#8b5cf6"
                    delay={0.1}
                    loading={overviewLoading}
                />
                <StatCard
                    title="Active Editors"
                    value={overviewLoading ? '—' : String(overviewStats.activeEditorsCount)}
                    sub="With submitted work"
                    icon={<Users className="w-4 h-4" />}
                    color="#10b981"
                    delay={0.15}
                    loading={overviewLoading}
                />
                <StatCard
                    title="Top Editor"
                    value={overviewLoading ? '—' : overviewStats.topEditor.name.split(' ')[0]}
                    sub={`${overviewStats.topEditor.count} projects`}
                    icon={<Crown className="w-4 h-4" />}
                    color="#f59e0b"
                    delay={0.2}
                    loading={overviewLoading}
                />
            </div>

            {/* ── Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-5">

                {/* Client Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white/[0.018] border border-white/[0.06] rounded-2xl overflow-hidden"
                >
                    {/* Panel header */}
                    <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 border-b border-white/[0.05] gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#8b5cf614', border: '1px solid #8b5cf622' }}>
                                <Activity className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-[13px] font-bold text-white/80">Active Projects</h3>
                                <p className="text-[10px] text-white/25 font-medium mt-0.5">By client</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-lg" style={{ color: '#8b5cf6', background: '#8b5cf610', border: '1px solid #8b5cf620' }}>
                            {overviewStats.activeClientsCount} clients
                        </span>
                    </div>

                    <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-1 max-h-[280px] sm:max-h-[320px] overflow-y-auto custom-scrollbar">
                        {overviewLoading ? (
                            <div className="flex items-center justify-center py-12 sm:py-16">
                                <Loader2 className="w-4 h-4 animate-spin text-violet-400/40" />
                            </div>
                        ) : overviewStats.clientProjectDistribution.length > 0 ? (
                            overviewStats.clientProjectDistribution.map((client, i) => (
                                <BarRow
                                    key={i}
                                    rank={i + 1}
                                    name={client.name.replace(/- Fulfillment Board.*|Board.*/i, '').trim()}
                                    count={client.count}
                                    max={overviewStats.activeProjectsCount}
                                    color={ACCENT_COLORS[i % ACCENT_COLORS.length]}
                                    label="projects"
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-white/15">
                                <Sparkles className="w-6 h-6 mb-2" />
                                <p className="text-xs font-medium">No active projects found</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Editor Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white/[0.018] border border-white/[0.06] rounded-2xl overflow-hidden"
                >
                    {/* Panel header */}
                    <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 border-b border-white/[0.05] gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#10b98114', border: '1px solid #10b98122' }}>
                                <TrendingUp className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-[13px] font-bold text-white/80">Editor Workload</h3>
                                <p className="text-[10px] text-white/25 font-medium mt-0.5">By project count</p>
                            </div>
                        </div>
                        {selectedCycles.size > 0 && (
                            <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-lg" style={{ color: '#10b981', background: '#10b98110', border: '1px solid #10b98120' }}>
                                {cycleLabel}
                            </span>
                        )}
                    </div>

                    <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-1 max-h-[280px] sm:max-h-[320px] overflow-y-auto custom-scrollbar">
                        {overviewLoading ? (
                            <div className="flex items-center justify-center py-12 sm:py-16">
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-400/40" />
                            </div>
                        ) : overviewStats.editorPerformance.length > 0 ? (
                            overviewStats.editorPerformance.map((editor, i) => (
                                <BarRow
                                    key={i}
                                    rank={i + 1}
                                    name={editor.name}
                                    count={editor.count}
                                    max={overviewStats.topEditor.count || 1}
                                    color={EDITOR_COLORS[i % EDITOR_COLORS.length]}
                                    label="projects"
                                    isTop={i === 0}
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-white/15">
                                <ArrowUpRight className="w-6 h-6 mb-2" />
                                <p className="text-xs font-medium">No editor data found</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AdminPageLayout>
    );
}
