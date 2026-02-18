import { useState, useEffect } from 'react';
import { StatCard } from '../../components/shared/StatCard';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import {
    Activity,
    TrendingUp,
    Briefcase,
    Users
} from 'lucide-react';
import {
    getAllBoards, getMultipleBoardItems, getWorkspaceAnalytics, getAllFolders
} from '../../services/mondayService';
import { getCycleDates, isDateInCycle } from '../../features/performance-dashboard/utils/dateUtils';

// --- Admin Overview Component ---
export default function AdminOverview() {
    // Overview Stats State
    const [overviewStats, setOverviewStats] = useState({
        activeClientsCount: 0,
        activeProjectsCount: 0,
        activeEditorsCount: 0,
        topEditor: { name: 'N/A', count: 0 },
        systemStatus: 'Stable',
        clientProjectDistribution: [] as { name: string, count: number }[],
        editorPerformance: [] as { name: string, count: number }[],
        currentCycleName: ''
    });
    const [overviewLoading, setOverviewLoading] = useState(true);

    useEffect(() => {
        fetchOverviewData();
    }, []);

    const fetchOverviewData = async () => {
        setOverviewLoading(true);
        try {
            // 1. Fetch Board List, Analytics & Folders in Parallel
            const [boardsData, analyticsData, allFolders] = await Promise.all([
                getAllBoards(),
                getWorkspaceAnalytics(),
                getAllFolders()
            ]);

            const allFetchedBoards = boardsData || [];

            // ---------------------------------------------------------
            // C) Active Editors & Performance (Use getWorkspaceAnalytics)
            // ---------------------------------------------------------
            const { cycles, data: cycleData } = analyticsData;

            // Get Latest Cycle
            const currentCycleKey = cycles.length > 0 ? cycles[0] : null;

            // ---------------------------------------------------------
            // A) Client/Project Data Source: "Active Clients" Folder (Cycle Based)
            // ---------------------------------------------------------
            // Fetch Folders (already fetched above)
            const activeClientsFolder = allFolders.find((f: any) => f.name.toLowerCase() === 'active clients');

            let activeClientsCount = 0;
            let totalActiveProjects = 0;
            const clientProjectDistribution: { name: string, count: number }[] = [];

            if (activeClientsFolder && currentCycleKey) {
                // Parse Cycle Key to get Date Range
                // Key format: "MonthName Year - Cycle X" e.g. "February 2026 - Cycle 1"
                const match = currentCycleKey.match(/(\w+) (\d+) - Cycle (\d)/);
                let cycleInfo = null;

                if (match) {
                    const [, monthStr, yearStr, cycleNumStr] = match;
                    const year = parseInt(yearStr);
                    const cycle = parseInt(cycleNumStr) as 1 | 2;
                    const month = new Date(`${monthStr} 1, ${year}`).getMonth() + 1; // 1-indexed

                    cycleInfo = getCycleDates(cycle, month, year);
                }

                // 1. Identify Client Boards
                const clientBoardIds = activeClientsFolder.children.map((c: any) => String(c.id));
                const clientBoards = allFetchedBoards.filter((b: any) => clientBoardIds.includes(String(b.id)));
                const clientBoardMap = new Map(clientBoards.map((b: any) => [String(b.id), b.name]));

                // 2. Fetch Items
                if (clientBoardIds.length > 0 && cycleInfo) {
                    const [clientItemsData] = await Promise.all([
                        getMultipleBoardItems(clientBoardIds)
                    ]);

                    const activeClientIds = new Set();

                    clientItemsData.forEach((board: any) => {
                        const boardName = clientBoardMap.get(String(board.id)) || board.name;

                        // Count Projects Created in this Cycle
                        const validItems = (board.items || []).filter((i: any) => {
                            if (!i.created_at) return false;
                            const createdDate = new Date(i.created_at);
                            // Check if created within current cycle
                            return isDateInCycle(createdDate, cycleInfo!);
                        });

                        const count = validItems.length;
                        totalActiveProjects += count;

                        if (count > 0) {
                            activeClientIds.add(board.id);
                            clientProjectDistribution.push({ name: boardName, count });
                        }
                    });

                    activeClientsCount = activeClientIds.size;
                }
            } else {
                console.warn("Folder 'Active Clients' or Cycle Key not found.");
            }

            clientProjectDistribution.sort((a, b) => b.count - a.count);




            let activeEditorsCount = 0;
            let topEditorName = 'None';
            let maxDoneCount = 0;
            const editorPerformance: { name: string, count: number }[] = [];

            if (currentCycleKey && cycleData[currentCycleKey]) {
                const currentCycleStats = cycleData[currentCycleKey];

                // Active editors are those with > 0 videos in this cycle
                const editorsInCycle = Object.entries(currentCycleStats);
                activeEditorsCount = editorsInCycle.length;

                editorsInCycle.forEach(([name, count]) => {
                    editorPerformance.push({ name, count });

                    if (count > maxDoneCount) {
                        maxDoneCount = count;
                        topEditorName = name;
                    }
                });
            } else {
                // Fallback / Empty State
                activeEditorsCount = 0;
            }

            editorPerformance.sort((a, b) => b.count - a.count);

            setOverviewStats({
                activeClientsCount,
                activeProjectsCount: totalActiveProjects,
                activeEditorsCount,
                topEditor: { name: topEditorName, count: maxDoneCount },
                systemStatus: 'Stable',
                clientProjectDistribution,
                editorPerformance,
                currentCycleName: currentCycleKey || ''
            });

        } catch (error) {
            console.error("Failed to load overview data", error);
        } finally {
            setOverviewLoading(false);
        }
    };

    return (
        <AdminPageLayout
            title="Overview"
            subtitle="Platform activity at a glance. Real-time metrics and performance tracking."
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
                            overviewStats.clientProjectDistribution.map((client, i) => (
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
                        {overviewStats.currentCycleName && (
                            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                                {overviewStats.currentCycleName}
                            </span>
                        )}
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                        {overviewStats.editorPerformance.length > 0 ? (
                            overviewStats.editorPerformance.map((editor, i) => (
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
