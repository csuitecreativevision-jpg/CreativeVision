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
    getAllBoards, getMultipleBoardItems
} from '../../services/mondayService';

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
        editorPerformance: [] as { name: string, count: number }[]
    });
    const [overviewLoading, setOverviewLoading] = useState(true);

    useEffect(() => {
        fetchOverviewData();
    }, []);

    const fetchOverviewData = async () => {
        setOverviewLoading(true);
        try {
            const boardsData = await getAllBoards();
            const allFetchedBoards = boardsData || [];

            // A) Client/Project Data Source: "Fulfillment Board"
            const fulfillmentBoard = allFetchedBoards.find((b: any) =>
                b.name.toLowerCase().includes('fulfillment') ||
                b.name.toLowerCase().includes('fullfillment')
            );

            // B) Editor Data Source: Boards with "Workspace" in name
            const editorBoards = allFetchedBoards.filter((b: any) => {
                const name = b.name.toLowerCase();
                return name.includes('workspace') &&
                    !name.includes('subitem') &&
                    !name.includes('template');
            });
            const editorBoardIds = editorBoards.map((b: any) => String(b.id));

            // 3. Fetch Data
            const idsToFetch = [];
            if (fulfillmentBoard) idsToFetch.push(String(fulfillmentBoard.id));
            editorBoardIds.forEach((id: string) => idsToFetch.push(id));

            const [allFetchedItemsData] = await Promise.all([
                getMultipleBoardItems(idsToFetch)
            ]);

            const fulfillmentBoardData = fulfillmentBoard ? allFetchedItemsData.find((b: any) => String(b.id) === String(fulfillmentBoard.id)) : null;
            const editorBoardsData = allFetchedItemsData.filter((b: any) => editorBoardIds.includes(String(b.id)));

            // 4. Calculate Metrics

            // A) Active Clients & Projects (From Fulfillment Board)
            let activeClientsCount = 0;
            let totalActiveProjects = 0;
            const clientProjectDistribution: { name: string, count: number }[] = [];

            if (fulfillmentBoardData) {
                const groups = fulfillmentBoard.groups || [];
                const validGroups = groups.filter((g: any) => g.title.toLowerCase() !== 'hidden');

                activeClientsCount = validGroups.length;

                const activeItems = fulfillmentBoardData.items.filter((i: any) => {
                    const isDone = i.column_values.some((v: any) => (v.title === 'Status' || v.type === 'status' || v.type === 'color') && (v.text === 'Done' || v.text === 'Completed'));
                    return !isDone;
                });
                totalActiveProjects = activeItems.length;

                // Distribution: Items per Group
                const groupMap = new Map();
                groups.forEach((g: any) => groupMap.set(g.id, g.title));

                const groupCounts = new Map();
                activeItems.forEach((item: any) => {
                    const gId = item.group?.id;
                    if (gId) {
                        const current = groupCounts.get(gId) || 0;
                        groupCounts.set(gId, current + 1);
                    }
                });

                groupCounts.forEach((count, gId) => {
                    const name = groupMap.get(gId) || 'Unknown Group';
                    if (name.toLowerCase() !== 'hidden' && count > 0) {
                        clientProjectDistribution.push({ name, count });
                    }
                });
            }

            clientProjectDistribution.sort((a, b) => b.count - a.count);

            // C) Active Editors & Performance
            const activeEditorsCount = editorBoards.length;
            const editorPerformance: { name: string, count: number }[] = [];

            let maxDoneCount = 0;
            let topEditorName = 'None';

            editorBoards.forEach((b: any) => {
                const boardData = editorBoardsData.find((bd: any) => String(bd.id) === String(b.id));
                const items = boardData ? boardData.items : [];

                const approvedCount = items.length;

                let cleanName = b.name.split('(')[0];
                cleanName = cleanName.replace(/workspace/gi, '')
                    .replace(/editor/gi, '')
                    .replace(/-/g, '')
                    .trim();
                if (!cleanName || cleanName.length < 2) cleanName = b.name;

                if (approvedCount > 0) {
                    editorPerformance.push({ name: cleanName, count: approvedCount });
                } else {
                    editorPerformance.push({ name: cleanName, count: 0 });
                }

                if (approvedCount > maxDoneCount) {
                    maxDoneCount = approvedCount;
                    topEditorName = cleanName;
                }
            });

            if (maxDoneCount === 0 && editorBoardsData.length > 0) {
                const busiestBoard = editorBoardsData.sort((a: any, b: any) => b.items.length - a.items.length)[0];
                if (busiestBoard) {
                    // let cleanName = busiestBoard.name.replace(/workspace/gi, '').replace(/editor/gi, '').replace(/-/g, '').trim();
                }
            }

            editorPerformance.sort((a, b) => b.count - a.count);

            setOverviewStats({
                activeClientsCount,
                activeProjectsCount: totalActiveProjects,
                activeEditorsCount,
                topEditor: { name: topEditorName, count: maxDoneCount },
                systemStatus: 'Stable',
                clientProjectDistribution,
                editorPerformance
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
                <div className="bg-[#0E0E1A]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
                    {/* Glossy Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-600/20 transition-all duration-700" />

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
                                                className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
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
                <div className="bg-[#0E0E1A]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
                    {/* Glossy Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-600/20 transition-all duration-700" />

                    <h3 className="text-white font-bold mb-6 flex items-center gap-2 relative z-10">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                        Editor Workload
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
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
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
