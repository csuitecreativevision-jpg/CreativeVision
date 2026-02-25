import { useState, useEffect, useMemo } from 'react';
import { StatCard } from '../../components/shared/StatCard';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import {
    Activity,
    TrendingUp,
    Briefcase,
    Users,
    ChevronDown,
    Check,
    Calendar
} from 'lucide-react';
import {
    getAllBoards, getMultipleBoardItems, getWorkspaceAnalytics, getAllFolders
} from '../../services/mondayService';
import { getCycleDates, isDateInCycle } from '../../features/performance-dashboard/utils/dateUtils';
import { getCache, setCache } from '../../services/cacheService';

const OVERVIEW_CACHE_KEY = 'admin_overview_stats';

// --- Admin Overview Component ---
export default function AdminOverview() {
    // Raw data state (fetched once)
    const [rawData, setRawData] = useState<any>(() => {
        const cached = getCache<any>(OVERVIEW_CACHE_KEY);
        return cached?.data || null;
    });
    const [overviewLoading, setOverviewLoading] = useState(() => !getCache(OVERVIEW_CACHE_KEY));

    // Cycle selection state
    const [selectedCycles, setSelectedCycles] = useState<Set<string>>(new Set());
    const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);

    useEffect(() => {
        fetchOverviewData();
    }, []);

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

            // Find Active Clients folder
            const activeClientsFolder = allFolders.find((f: any) => f.name.toLowerCase() === 'active clients');
            let clientBoardItems: any[] = [];

            if (activeClientsFolder) {
                const clientBoardIds = activeClientsFolder.children.map((c: any) => String(c.id));
                const clientBoards = allFetchedBoards.filter((b: any) => clientBoardIds.includes(String(b.id)));
                const clientBoardMap = new Map(clientBoards.map((b: any) => [String(b.id), b.name]));

                if (clientBoardIds.length > 0) {
                    const [clientItemsData] = await Promise.all([
                        getMultipleBoardItems(clientBoardIds)
                    ]);
                    clientBoardItems = clientItemsData.map((board: any) => ({
                        ...board,
                        boardName: clientBoardMap.get(String(board.id)) || board.name
                    }));
                }
            }

            const newData = {
                cycles,
                cycleData,
                clientBoardItems
            };

            setRawData(newData);
            setCache(OVERVIEW_CACHE_KEY, newData);

            // Default to latest cycle selected
            if (cycles.length > 0 && selectedCycles.size === 0) {
                setSelectedCycles(new Set([cycles[0]]));
            }

        } catch (error) {
            console.error("Failed to load overview data", error);
        } finally {
            setOverviewLoading(false);
        }
    };

    // --- Derived stats based on selected cycles ---
    const overviewStats = useMemo(() => {
        if (!rawData || !rawData.cycles) return {
            activeClientsCount: 0,
            activeProjectsCount: 0,
            activeEditorsCount: 0,
            topEditor: { name: 'N/A', count: 0 },
            clientProjectDistribution: [] as { name: string, count: number }[],
            editorPerformance: [] as { name: string, count: number }[],
        };

        const { cycles, cycleData, clientBoardItems } = rawData;
        const cyclesToUse = selectedCycles.size > 0 ? Array.from(selectedCycles) : (cycles.length > 0 ? [cycles[0]] : []);

        // --- Editor Stats (aggregated across selected cycles) ---
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

        const activeEditorsCount = editorPerformance.length;
        const topEditor = editorPerformance.length > 0
            ? { name: editorPerformance[0].name, count: editorPerformance[0].count }
            : { name: 'None', count: 0 };

        // --- Client/Project Stats (aggregated across selected cycles) ---
        const clientCounts: Record<string, number> = {};
        let totalActiveProjects = 0;

        cyclesToUse.forEach((cycleKey: string) => {
            // Parse cycle key to get date range
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
                    const createdDate = new Date(i.created_at);
                    return isDateInCycle(createdDate, cycleInfo);
                });

                const count = validItems.length;
                if (count > 0) {
                    clientCounts[board.boardName] = (clientCounts[board.boardName] || 0) + count;
                }
            });
        });

        const clientProjectDistribution = Object.entries(clientCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        totalActiveProjects = clientProjectDistribution.reduce((sum, c) => sum + c.count, 0);
        const activeClientsCount = clientProjectDistribution.length;

        return {
            activeClientsCount,
            activeProjectsCount: totalActiveProjects,
            activeEditorsCount,
            topEditor,
            clientProjectDistribution,
            editorPerformance,
        };
    }, [rawData, selectedCycles]);

    // --- Cycle selector helpers ---
    const availableCycles: string[] = rawData?.cycles || [];

    const toggleCycle = (cycle: string) => {
        setSelectedCycles(prev => {
            const next = new Set(prev);
            if (next.has(cycle)) {
                next.delete(cycle);
            } else {
                next.add(cycle);
            }
            return next;
        });
    };

    const selectAll = () => {
        setSelectedCycles(new Set(availableCycles));
    };

    const clearAll = () => {
        setSelectedCycles(new Set());
    };

    const cycleLabel = selectedCycles.size === 0
        ? 'Select Cycles'
        : selectedCycles.size === 1
            ? Array.from(selectedCycles)[0]
            : `${selectedCycles.size} Cycles Selected`;

    return (
        <AdminPageLayout
            title="Overview"
            subtitle="Platform activity at a glance. Real-time metrics and performance tracking."
            action={
                <div className="relative">
                    <button
                        onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#0e0e1a] border border-white/10 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition-all"
                    >
                        <Calendar className="w-4 h-4 text-violet-400" />
                        <span className="truncate max-w-[200px]">{cycleLabel}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCycleDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Backdrop */}
                    {isCycleDropdownOpen && (
                        <div className="fixed inset-0 z-40" onClick={() => setIsCycleDropdownOpen(false)} />
                    )}

                    {/* Dropdown */}
                    {isCycleDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-[#0A0A16] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 z-50">
                            {/* Header with Select All / Clear */}
                            <div className="p-3 border-b border-white/5 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filter by Cycle</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={selectAll}
                                        className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors"
                                    >
                                        All
                                    </button>
                                    <span className="text-gray-600">|</span>
                                    <button
                                        onClick={clearAll}
                                        className="text-[10px] font-bold text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Cycle List */}
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                                {availableCycles.map(cycle => {
                                    const isSelected = selectedCycles.has(cycle);
                                    return (
                                        <button
                                            key={cycle}
                                            onClick={() => toggleCycle(cycle)}
                                            className={`w-full text-left px-4 py-3 rounded-xl transition-all mb-1 flex items-center justify-between group ${isSelected
                                                ? 'bg-violet-500/10 text-violet-400 font-bold'
                                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            <span className="text-xs">{cycle}</span>
                                            {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                                        </button>
                                    );
                                })}
                                {availableCycles.length === 0 && (
                                    <div className="p-4 text-center text-gray-500 text-xs italic">
                                        No cycles available.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Clients"
                    value={overviewLoading ? "..." : String(overviewStats.activeClientsCount)}
                    change="Boards"
                    icon={<Briefcase className="w-5 h-5 text-blue-400" />}
                    delay={0.1}
                />
                <StatCard
                    title="Active Projects"
                    value={overviewLoading ? "..." : String(overviewStats.activeProjectsCount)}
                    change="In Progress"
                    icon={<Activity className="w-5 h-5 text-purple-400" />}
                    delay={0.2}
                />
                <StatCard
                    title="Top Editor"
                    value={overviewLoading ? "..." : overviewStats.topEditor.name}
                    change={`${overviewStats.topEditor.count} Videos`}
                    icon={<TrendingUp className="w-5 h-5 text-green-400" />}
                    delay={0.3}
                />
                <StatCard
                    title="Active Editors"
                    value={overviewLoading ? "..." : String(overviewStats.activeEditorsCount)}
                    change="In Workspace"
                    icon={<Users className="w-5 h-5 text-emerald-400" />}
                    delay={0.4}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Client Distribution */}
                <div className="bg-[#13141f] border border-white/5 rounded-2xl p-8 relative overflow-hidden">
                    <h3 className="text-white font-bold mb-6 flex items-center gap-2 relative z-10">
                        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                            <Activity className="w-4 h-4" />
                        </div>
                        Active Projects
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                        {overviewStats.clientProjectDistribution.length > 0 ? (
                            overviewStats.clientProjectDistribution.map((client: { name: string, count: number }, i: number) => (
                                <div key={i} className="flex items-center gap-4 group/item">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-xs font-bold text-gray-400 group-hover/item:border-purple-500/30 group-hover/item:text-purple-400 transition-colors">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-300 font-medium group-hover/item:text-white transition-colors">{client.name}</span>
                                            <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">{client.count} Active</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-600 rounded-full"
                                                style={{ width: `${(client.count / Math.max(1, overviewStats.activeProjectsCount)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-10 border border-dashed border-white/5 rounded-2xl">
                                No active projects found
                            </div>
                        )}
                    </div>
                </div>

                {/* Editor Performance */}
                <div className="bg-[#13141f] border border-white/5 rounded-2xl p-8 relative overflow-hidden">
                    <h3 className="text-white font-bold mb-6 flex items-center gap-2 relative z-10 w-full justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            Editor Workload
                        </div>
                        {selectedCycles.size > 0 && (
                            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full truncate max-w-[200px]">
                                {selectedCycles.size === 1 ? Array.from(selectedCycles)[0] : `${selectedCycles.size} Cycles`}
                            </span>
                        )}
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                        {overviewStats.editorPerformance.length > 0 ? (
                            overviewStats.editorPerformance.map((editor: { name: string, count: number }, i: number) => (
                                <div key={i} className="flex items-center gap-4 group/item">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-xs font-bold text-gray-400 group-hover/item:border-emerald-500/30 group-hover/item:text-emerald-400 transition-colors shadow-lg">
                                        {editor.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-300 font-medium group-hover/item:text-white transition-colors">{editor.name}</span>
                                            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">{editor.count} Projects</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full"
                                                style={{ width: `${(editor.count / Math.max(1, overviewStats.topEditor.count || 10)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-10 border border-dashed border-white/5 rounded-2xl">
                                No active editors found
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminPageLayout>
    );
}
