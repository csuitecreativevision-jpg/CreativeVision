import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid,
    Clock,
    Activity,
    FileText,
    ChevronDown,
} from 'lucide-react';
import { BoardCell } from '../shared/BoardCell';

interface GlobalCycleViewProps {
    boardData: any;
    selectedBoardId: string | null;
    refreshBoardDetails: (boardId: string, silent: boolean) => void;
    setPreviewFile: (file: { url: string, name: string, assetId?: string } | null) => void;
}

export const GlobalCycleView = ({ boardData, selectedBoardId, refreshBoardDetails, setPreviewFile }: GlobalCycleViewProps) => {
    // State
    const [fulfillmentMonthFilter, setFulfillmentMonthFilter] = useState<string>('All');
    const [isMonthFilterOpen, setIsMonthFilterOpen] = useState(false);
    const [cycleViewMode, setCycleViewMode] = useState<'overview' | 'cycles'>('cycles');
    const [expandedCycles, setExpandedCycles] = useState<Set<string>>(new Set());

    // --- LOGIC ---
    const allItems = boardData.groups?.flatMap((g: any) => boardData.items?.filter((i: any) => i.group.id === g.id)) || [];

    // 1. Date Filter Logic
    const months = new Set<string>();
    allItems.forEach((item: any) => {
        if (item.created_at) {
            const date = new Date(item.created_at);
            if (!isNaN(date.getTime())) {
                const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
                months.add(monthStr);
            }
        }
    });
    const sortedMonths = Array.from(months).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Apply Filter
    const filteredItems = fulfillmentMonthFilter === 'All'
        ? allItems
        : allItems.filter((item: any) => {
            if (!item.created_at) return false;
            const date = new Date(item.created_at);
            const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            return monthStr === fulfillmentMonthFilter;
        });

    // 2. Cycle Grouping Logic
    const getCycleKey = (item: any) => {
        if (!item.created_at) return 'Unknown Date';
        const date = new Date(item.created_at);
        if (isNaN(date.getTime())) return 'Unknown Date';

        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'long' });
        const day = date.getDate();
        const cycle = day <= 15 ? 1 : 2;

        return `${month} ${year} - Cycle ${cycle}`;
    };

    const getCycleSortKey = (cycleKey: string) => {
        if (cycleKey === 'Unknown Date') return 0;
        const match = cycleKey.match(new RegExp("(\\w+) (\\d+) - Cycle (\\d)"));
        if (!match) return 0;
        const [, month, year, cycle] = match;
        const monthNum = new Date(`${month} 1, ${year}`).getMonth();
        return parseInt(year) * 10000 + monthNum * 100 + parseInt(cycle);
    };

    // Group items by cycle
    const cycleGroups: Record<string, any[]> = {};
    filteredItems.forEach((item: any) => {
        const cycleKey = getCycleKey(item);
        if (!cycleGroups[cycleKey]) cycleGroups[cycleKey] = [];
        cycleGroups[cycleKey].push(item);
    });

    // Sort items within each cycle by date (newest first)
    Object.keys(cycleGroups).forEach(key => {
        cycleGroups[key].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });

    const sortedCycles = Object.keys(cycleGroups).sort((a, b) => getCycleSortKey(b) - getCycleSortKey(a));

    // Auto-expand first cycle on load if no cycles expanded yet
    useEffect(() => {
        if (sortedCycles.length > 0 && expandedCycles.size === 0) {
            setExpandedCycles(new Set([sortedCycles[0]]));
        }
    }, [sortedCycles.length]);

    const toggleCycle = (cycle: string) => {
        const newSet = new Set(expandedCycles);
        if (newSet.has(cycle)) {
            newSet.delete(cycle);
        } else {
            newSet.add(cycle);
        }
        setExpandedCycles(newSet);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

            {/* Header Controls: Toggle & Filter */}
            <div className="flex items-center justify-between mb-2">

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-[#0e0e1a] p-1 rounded-xl border border-white/5">
                    <button
                        onClick={() => setCycleViewMode('overview')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${cycleViewMode === 'overview' ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" /> Overview
                    </button>
                    <div className="w-[1px] h-4 bg-white/10 mx-1" />
                    <button
                        onClick={() => setCycleViewMode('cycles')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${cycleViewMode === 'cycles' ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Clock className="w-3.5 h-3.5" /> Cycles
                    </button>
                </div>

                {/* Month Filter */}
                <div className="flex justify-end">
                    {sortedMonths.length > 0 && (
                        <div className="relative z-30">
                            <div
                                className="flex items-center gap-2 px-3 py-2 bg-[#0e0e1a] border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => setIsMonthFilterOpen(!isMonthFilterOpen)}
                            >
                                <div className="p-1 rounded bg-white/5 text-gray-400"><FileText className="w-3 h-3" /></div>
                                <span className="text-xs font-bold text-white min-w-[60px]">{fulfillmentMonthFilter}</span>
                                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isMonthFilterOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {/* Backdrop */}
                            {isMonthFilterOpen && (
                                <div className="fixed inset-0 z-40" onClick={() => setIsMonthFilterOpen(false)} />
                            )}

                            {/* Dropdown */}
                            {isMonthFilterOpen && (
                                <div className="absolute top-full right-0 mt-2 w-40 bg-[#0A0A16] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 z-50">
                                    <div
                                        onClick={() => {
                                            setFulfillmentMonthFilter('All');
                                            setIsMonthFilterOpen(false);
                                        }}
                                        className={`px-4 py-3 text-xs font-bold cursor-pointer transition-colors ${fulfillmentMonthFilter === 'All' ? 'bg-violet-500/10 text-violet-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        All Time
                                    </div>
                                    {sortedMonths.map(month => (
                                        <div
                                            key={month}
                                            onClick={() => {
                                                setFulfillmentMonthFilter(month);
                                                setIsMonthFilterOpen(false);
                                            }}
                                            className={`px-4 py-3 text-xs font-bold cursor-pointer transition-colors ${fulfillmentMonthFilter === month ? 'bg-violet-500/10 text-violet-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                        >
                                            {month}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- OVERVIEW MODE --- */}
            {cycleViewMode === 'overview' && (
                <div className="space-y-8">
                    {/* Activity Graph Section */}
                    {filteredItems.length > 0 && (
                        <div className="p-6 rounded-3xl bg-[#0e0e1a] border border-white/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent opacity-50" />

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-violet-400" />
                                        Project Activity
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Real-time status distribution</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-white">{filteredItems.length}</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Projects</div>
                                </div>
                            </div>

                            {/* Graph Bars */}
                            <div className="space-y-4 relative z-10">
                                {(() => {
                                    // Calculate Stats
                                    const statusCounts: Record<string, number> = {};
                                    const statusColors: Record<string, string> = {};

                                    // Find primary status column
                                    const statusCol = boardData.columns?.find((c: any) => c.title.toLowerCase().includes('status'));

                                    if (!statusCol) return <div className="text-xs text-gray-500 italic">No status data available</div>;

                                    // Parse Settings for Colors
                                    let labelColors: Record<string, string> = {};
                                    try {
                                        const settings = JSON.parse(statusCol.settings_str || '{}');
                                        if (settings.labels && settings.labels_colors) {
                                            Object.keys(settings.labels).forEach(key => {
                                                const label = settings.labels[key];
                                                const color = settings.labels_colors[key]?.color;
                                                labelColors[label] = color;
                                            });
                                        }
                                    } catch (e) { }

                                    // Aggregate
                                    filteredItems.forEach((item: any) => {
                                        const val = item.column_values.find((v: any) => v.id === statusCol.id)?.text;
                                        if (val) {
                                            statusCounts[val] = (statusCounts[val] || 0) + 1;
                                            if (labelColors[val]) statusColors[val] = labelColors[val];
                                        }
                                    });

                                    // Sort by count desc
                                    const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);

                                    return sortedStatuses.length > 0 ? sortedStatuses.map(([status, count], idx) => {
                                        const color = statusColors[status] || '#a855f7'; // fallback violet
                                        const percentage = Math.round((count / filteredItems.length) * 100);

                                        return (
                                            <div key={status} className="relative">
                                                <div className="flex justify-between text-xs mb-1.5">
                                                    <span className="font-bold text-gray-300">{status}</span>
                                                    <span className="font-mono text-gray-500">{count} ({percentage}%)</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                                                        className="h-full rounded-full relative"
                                                        style={{ backgroundColor: color }}
                                                    >
                                                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                                    </motion.div>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-center text-xs text-gray-500 py-4">No active statuses found</div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-300">
                        {filteredItems.map((item: any, idx: number) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05, duration: 0.3 }}
                                className="group relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                <div className="relative p-6 rounded-2xl bg-[#0e0e1a] border border-white/5 shadow-xl hover:border-white/10 hover:bg-[#131322] transition-all h-full flex flex-col gap-5">
                                    {/* Item Name Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <h4 className="text-lg font-bold text-white leading-snug flex-1">{item.name}</h4>
                                        <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse flex-shrink-0 mt-2" />
                                    </div>

                                    <div className="w-full h-[1px] bg-white/5" />

                                    {/* Column Values */}
                                    <div className="space-y-4 flex-1">
                                        {boardData.columns?.filter((col: any) => col.type !== 'name' && !col.title.startsWith('C-F-')).map((col: any) => (
                                            <div key={col.id} className="flex flex-col gap-1.5">
                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{col.title}</span>
                                                <div className="min-h-[28px] flex items-center">
                                                    <BoardCell
                                                        item={item}
                                                        column={col}
                                                        boardId={selectedBoardId}
                                                        onUpdate={() => refreshBoardDetails(selectedBoardId!, true)}
                                                        onPreview={(url, name, assetId) => setPreviewFile({ url, name, assetId })}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {filteredItems.length === 0 && (
                            <div className="col-span-full text-center text-gray-500 italic py-12 bg-[#0e0e1a] rounded-3xl border border-white/5">
                                No items found
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- CYCLES MODE (Timeline Style) --- */}
            {cycleViewMode === 'cycles' && (sortedCycles.length > 0 ? (
                <div className="relative pb-10">
                    {/* Vertical Timeline Line */}
                    <div className="absolute left-[29px] top-4 bottom-0 w-[2px] bg-gradient-to-b from-violet-500/50 via-white/10 to-transparent" />

                    <div className="space-y-10">
                        {sortedCycles.map((cycleKey, cycleIdx) => {
                            const isExpanded = expandedCycles.has(cycleKey);
                            // Extract Cycle Number for Badge (e.g., "Cycle 1" -> "01")
                            const cycleMatch = cycleKey.match(/Cycle (\d+)/);
                            const cycleNum = cycleMatch ? cycleMatch[1].padStart(2, '0') : '01';

                            return (
                                <div key={cycleKey} className="relative pl-24 group">
                                    {/* Timeline Node (Cycle Indicator) */}
                                    <div
                                        onClick={() => toggleCycle(cycleKey)}
                                        className={`absolute left-0 top-0 w-[60px] h-[60px] rounded-full border-2 cursor-pointer transition-all duration-500 flex items-center justify-center z-10 bg-[#0e0e1a]
                                            ${isExpanded ? 'border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-110' : 'border-white/10 hover:border-white/30 grayscale opacity-70 group-hover:opacity-100'}
                                        `}
                                    >
                                        {/* Spinning Ring when active */}
                                        {isExpanded && (
                                            <div className="absolute inset-[-4px] rounded-full border border-violet-500/30 border-t-transparent animate-spin-slow" />
                                        )}

                                        <div className="flex flex-col items-center leading-none">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isExpanded ? 'text-violet-400' : 'text-gray-500'}`}>Cycle</span>
                                            <span className={`text-xl font-bold ${isExpanded ? 'text-white' : 'text-gray-400'}`}>{cycleNum}</span>
                                        </div>
                                    </div>

                                    {/* Content Card */}
                                    <div className={`rounded-3xl border transition-all duration-300 overflow-hidden
                                        ${isExpanded ? 'bg-[#0e0e1a] border-white/10 shadow-2xl' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'}
                                    `}>
                                        {/* Interactive Header */}
                                        <div
                                            onClick={() => toggleCycle(cycleKey)}
                                            className="px-6 py-4 flex items-center gap-4 cursor-pointer"
                                        >
                                            <div className="flex-1">
                                                <h3 className={`text-2xl font-bold transition-colors ${isExpanded ? 'text-white' : 'text-gray-500 group-hover:text-white'}`}>
                                                    {cycleKey.replace(/ - Cycle \d+$/, '')} {/* Text: "February 2024" */}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1">{cycleGroups[cycleKey].length} PROJECTS</p>
                                            </div>

                                            <div className={`p-2 rounded-full border border-white/5 transition-all duration-300 ${isExpanded ? 'bg-violet-500/20 text-violet-400 rotate-180' : 'bg-transparent text-gray-500'}`}>
                                                <ChevronDown className="w-5 h-5" />
                                            </div>
                                        </div>

                                        {/* Expandable Body */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                                                >
                                                    <div className="p-6 pt-0 border-t border-white/5 mt-2">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
                                                            {cycleGroups[cycleKey].map((item: any, idx: number) => (
                                                                <motion.div
                                                                    key={item.id}
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    transition={{ delay: idx * 0.05 + 0.1 }}
                                                                    className="group/card relative"
                                                                >
                                                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
                                                                    <div className="relative p-5 rounded-2xl bg-[#131322] border border-white/5 hover:border-white/10 transition-all h-full flex flex-col gap-4 group-hover/card:translate-y-[-2px] group-hover/card:shadow-xl">
                                                                        {/* Simple header for card */}
                                                                        <div className="flex justify-between items-start gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                                                                                CV
                                                                            </div>
                                                                            <h4 className="flex-1 text-sm font-bold text-white leading-snug line-clamp-2">{item.name}</h4>
                                                                        </div>

                                                                        <div className="space-y-3 flex-1">
                                                                            {boardData.columns?.filter((col: any) => col.type !== 'name' && !col.title.startsWith('C-F-')).map((col: any) => (
                                                                                <div key={col.id} className="flex flex-col gap-1">
                                                                                    <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold opacity-60">{col.title}</span>
                                                                                    <div className="min-h-[24px] flex items-center text-xs">
                                                                                        <BoardCell
                                                                                            item={item}
                                                                                            column={col}
                                                                                            boardId={selectedBoardId}
                                                                                            onUpdate={() => refreshBoardDetails(selectedBoardId!, true)}
                                                                                            onPreview={(url, name, assetId) => setPreviewFile({ url, name, assetId })}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-500 italic py-12 bg-[#0e0e1a] rounded-3xl border border-white/5">
                    {allItems.length === 0 ? "No items in this board" : "No items match current filter"}
                </div>
            ))}
        </div>
    );
};
