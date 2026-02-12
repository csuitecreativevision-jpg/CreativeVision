import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Calendar, Activity } from 'lucide-react';
import { ProjectCard } from '../shared/ProjectCard';
import { BoardCell } from '../shared/BoardCell';
import { PremiumModal } from '../ui/PremiumModal';
import { getCycleFromDate } from '../../features/performance-dashboard/utils/dateUtils';
import { getBoardColumns } from '../../services/mondayService';

interface ProjectSelectionViewProps {
    boardData: any;
    selectedBoardId: string | null;
    refreshBoardDetails: (boardId: string, silent: boolean) => void;
    setPreviewFile: (file: { url: string, name: string, assetId?: string } | null) => void;
}

export const ProjectSelectionView = ({
    boardData,
    selectedBoardId,
    refreshBoardDetails,
    setPreviewFile
}: ProjectSelectionViewProps) => {
    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [viewMode, setViewMode] = useState<'all' | 'cycles'>('all'); // NEW: View Mode
    const [expandedCycles, setExpandedCycles] = useState<Set<string>>(new Set()); // NEW: Expanded Cycles
    const [mirrorOptions, setMirrorOptions] = useState<Record<string, any[]>>({});

    // Effect to fetch source columns for Mirror fields (Status/Priority)
    useEffect(() => {
        const fetchMirrorSourceColumns = async () => {
            if (!boardData.columns) return;

            const newMirrorOptions: Record<string, any[]> = {};

            for (const col of boardData.columns) {
                // Check if it's a Mirror Status column
                if ((col.type === 'mirror' || col.type === 'lookup') &&
                    (col.title.toLowerCase().includes('status') || col.title.toLowerCase().includes('priority') || col.title.toLowerCase().includes('client'))) {

                    try {
                        if (col.settings_str) {
                            const settings = JSON.parse(col.settings_str);

                            // Strategy for Mirror Columns:
                            // The settings_str typically contains `displayed_linked_columns` which maps { sourceBoardId: [sourceColumnId] }
                            // Example: {"displayed_linked_columns":{"7146314401":["color__1"]}}

                            let sourceBoardId: string | null = null;
                            let sourceColumnId: string | null = null;

                            if (settings.displayed_linked_columns) {
                                const boardIds = Object.keys(settings.displayed_linked_columns);
                                if (boardIds.length > 0) {
                                    sourceBoardId = boardIds[0];
                                    const cols = settings.displayed_linked_columns[sourceBoardId];
                                    if (cols && cols.length > 0) {
                                        sourceColumnId = cols[0];
                                    }
                                }
                            }
                            // Fallback: Check board_ids (standard connect boards column sometimes used)
                            else if (settings.board_ids && settings.board_ids.length > 0) {
                                sourceBoardId = settings.board_ids[0];
                            }

                            if (sourceBoardId) {
                                // Fetch columns from that board
                                const sourceColumns = await getBoardColumns(sourceBoardId);

                                // Find the matching status column on the source board
                                // If we have the exact sourceColumnId, use it. Otherwise fall back to title matching.
                                let sourceStatusCol;
                                if (sourceColumnId) {
                                    sourceStatusCol = sourceColumns?.find((sc: any) => sc.id === sourceColumnId);
                                } else {
                                    sourceStatusCol = sourceColumns?.find((sc: any) =>
                                        sc.type === 'status' && (sc.title === col.title || sc.title.includes('Status') || sc.title.includes('Priority'))
                                    );
                                }

                                if (sourceStatusCol && sourceStatusCol.settings_str) {
                                    const sourceSettings = JSON.parse(sourceStatusCol.settings_str);
                                    if (sourceSettings.labels) {
                                        const options = Object.entries(sourceSettings.labels).map(([key, label]: any) => ({
                                            id: key,
                                            label: label,
                                            color: sourceSettings.labels_colors ? sourceSettings.labels_colors[key]?.color : '#579bfc'
                                        }));
                                        newMirrorOptions[col.id] = options;
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Failed to fetch source for mirror:", col.title, e);
                    }
                }
            }

            if (Object.keys(newMirrorOptions).length > 0) {
                setMirrorOptions(prev => ({ ...prev, ...newMirrorOptions }));
            }
        };

        fetchMirrorSourceColumns();
    }, [boardData.columns]);

    // Data Processing
    const allItems = useMemo(() => {
        return boardData.groups?.flatMap((g: any) =>
            boardData.items?.filter((i: any) => i.group.id === g.id).map((i: any) => ({ ...i, groupColor: g.color }))
        ) || [];
    }, [boardData]);

    // Filtering & Sorting
    const filteredItems = useMemo(() => {
        let items = [...allItems];

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            items = items.filter((i: any) => i.name.toLowerCase().includes(lowerTerm));
        }

        items.sort((a: any, b: any) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return items;
    }, [allItems, searchTerm, sortOrder]);

    // --- CYCLE LOGIC (Ported) ---


    // ... inside component ...
    const getCycleKey = (item: any) => {
        if (!item.created_at) return 'Unknown Date';
        const date = new Date(item.created_at);
        if (isNaN(date.getTime())) return 'Unknown Date';

        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'long' });
        // const day = date.getDate();
        const cycle = getCycleFromDate(date);

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

    const cycleGroups = useMemo(() => {
        const groups: Record<string, any[]> = {};
        // Use filteredItems so search applies to cycles too
        filteredItems.forEach((item: any) => {
            const cycleKey = getCycleKey(item);
            if (!groups[cycleKey]) groups[cycleKey] = [];
            groups[cycleKey].push(item);
        });
        return groups;
    }, [filteredItems]);

    const sortedCycles = useMemo(() => {
        return Object.keys(cycleGroups).sort((a, b) => getCycleSortKey(b) - getCycleSortKey(a));
    }, [cycleGroups]);

    // Auto-expand most recent cycle
    useMemo(() => {
        if (sortedCycles.length > 0 && expandedCycles.size === 0) {
            setExpandedCycles(new Set([sortedCycles[0]]));
        }
    }, [sortedCycles.length]); // Dependencies adjusted

    const toggleCycle = (cycle: string) => {
        const newSet = new Set(expandedCycles);
        if (newSet.has(cycle)) {
            newSet.delete(cycle);
        } else {
            newSet.add(cycle);
        }
        setExpandedCycles(newSet);
    };
    // ---------------------------

    // Helper to get Status Color
    const getStatusColor = (item: any) => {
        const statusCol = boardData.columns?.find((c: any) => c.title.toLowerCase().includes('status'));
        if (!statusCol) return item.groupColor || '#8b5cf6';

        // Parse Settings for Colors
        try {
            const val = item.column_values.find((v: any) => v.id === statusCol.id)?.text;
            const settings = JSON.parse(statusCol.settings_str || '{}');
            if (val && settings.labels && settings.labels_colors) {
                const labelKey = Object.keys(settings.labels).find(k => settings.labels[k] === val);
                if (labelKey && settings.labels_colors[labelKey]) {
                    return settings.labels_colors[labelKey].color;
                }
            }
        } catch (e) { }
        return item.groupColor || '#8b5cf6';
    };

    const getStatusText = (item: any) => {
        const statusCol = boardData.columns?.find((c: any) => c.title.toLowerCase().includes('status'));
        if (!statusCol) return 'Active';
        const val = item.column_values.find((v: any) => v.id === statusCol.id)?.text;
        return val || 'Active';
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 relative min-h-[500px]">
            {/* Header / Controls */}
            <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">

                {/* Search & View Mode Group */}
                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                    {/* View Switcher */}
                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 relative flex-shrink-0">
                        <div className="relative flex gap-1">
                            {['all', 'cycles'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode as 'all' | 'cycles')}
                                    className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-all z-10 ${viewMode === mode ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {viewMode === mode && (
                                        <motion.div
                                            layoutId="viewModeHighlight"
                                            className="absolute inset-0 bg-white/10 rounded-lg"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    {mode === 'all' ? 'All Projects' : 'Cycles Trend'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0e0e1a] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
                    <button
                        onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#0e0e1a] border border-white/5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                    </button>
                    <div className="px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-xs font-bold text-violet-400">
                        {filteredItems.length} PROJECTS
                    </div>
                </div>
            </div>

            {/* --- ALL PROJECTS VIEW --- */}
            {viewMode === 'all' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode='popLayout'>
                        {filteredItems.map((item: any, index: number) => (
                            <ProjectCard
                                key={item.id}
                                index={index}
                                name={item.name}
                                status={getStatusText(item)}
                                color={getStatusColor(item)}
                                date={new Date(item.created_at).toLocaleDateString()}
                                onClick={() => setSelectedProject(item)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* --- CYCLES VIEW --- */}
            {viewMode === 'cycles' && (
                <div className="space-y-6">
                    {sortedCycles.length > 0 ? sortedCycles.map((cycleKey) => {
                        const isExpanded = expandedCycles.has(cycleKey);
                        const cycleNum = cycleKey.match(/Cycle (\d+)/)?.[1]?.padStart(2, '0') || '01';
                        const items = cycleGroups[cycleKey];

                        return (
                            <motion.div
                                key={cycleKey}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group"
                            >
                                <div
                                    onClick={() => toggleCycle(cycleKey)}
                                    className={`
                                        cursor-pointer rounded-2xl border transition-all duration-300 overflow-hidden
                                        ${isExpanded ? 'bg-[#0E0E1A] border-white/10' : 'bg-transparent border-white/5 hover:bg-white/5'}
                                    `}
                                >
                                    {/* Header */}
                                    <div className="p-6 flex items-center gap-6">
                                        {/* Badge */}
                                        <div className={`
                                            w-14 h-14 rounded-2xl flex flex-col items-center justify-center border transition-all
                                            ${isExpanded ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/5 text-gray-500 group-hover:bg-white/10'}
                                        `}>
                                            <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">Cycle</span>
                                            <span className="text-xl font-bold">{cycleNum}</span>
                                        </div>

                                        <div className="flex-1">
                                            <h3 className={`text-xl font-bold transition-colors ${isExpanded ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                                {cycleKey.replace(/ - Cycle \d+$/, '')}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">{items.length} Projects</p>
                                        </div>
                                    </div>

                                    {/* Grid Body */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            >
                                                <div className="p-6 pt-0 border-t border-white/5 mt-0">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                                                        {items.map((item: any, index: number) => (
                                                            <ProjectCard
                                                                key={item.id}
                                                                index={index}
                                                                name={item.name}
                                                                status={getStatusText(item)}
                                                                color={getStatusColor(item)}
                                                                date={new Date(item.created_at).toLocaleDateString()}
                                                                onClick={() => setSelectedProject(item)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    }) : (
                        <div className="text-center py-20 text-gray-500">
                            No cycles found.
                        </div>
                    )}
                </div>
            )}

            {filteredItems.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    No projects found matching your search.
                </div>
            )}

            {/* Detail Modal */}
            <PremiumModal
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
            >
                {selectedProject && (
                    <>
                        {/* Modal Header containing Status & Title */}
                        <div className="p-8 border-b border-white/5 bg-[#131322] relative">
                            {/* Ambient Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

                            <div className="relative z-10 flex items-start justify-between gap-4">
                                <div className="space-y-4">
                                    {/* Status Badge */}
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: getStatusColor(selectedProject) }} />
                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-none pt-0.5">
                                            {getStatusText(selectedProject)}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
                                        {selectedProject.name}
                                    </h2>
                                </div>

                                <button
                                    onClick={() => setSelectedProject(null)}
                                    className="p-2.5 rounded-xl hover:bg-white/10 text-gray-500 hover:text-white transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-[#0E0E1A]">
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                                    <Activity className="w-4 h-4 text-violet-400" />
                                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Project Details</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    {boardData.columns?.filter((col: any) => col.type !== 'name' && !col.title.startsWith('C-F-')).map((col: any) => (
                                        <div key={col.id} className="group bg-[#131322]/50 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-300 hover:bg-[#131322]">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-1 h-3 rounded-full bg-violet-500/20 group-hover:bg-violet-500 transition-colors" />
                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold group-hover:text-gray-300 transition-colors">
                                                    {col.title}
                                                </span>
                                            </div>




                                            <div className="pl-3">
                                                <BoardCell
                                                    item={selectedProject}
                                                    column={col}
                                                    boardId={selectedBoardId}
                                                    allColumns={boardData.columns}
                                                    uniqueValues={Array.from(new Set(
                                                        boardData.items?.map((i: any) => {
                                                            const val = i.column_values.find((cv: any) => cv.id === col.id);
                                                            return val?.display_value || val?.text;
                                                        }).filter(Boolean) as string[]
                                                    ))}
                                                    dropdownOptions={mirrorOptions[col.id]} // Pass fetched options
                                                    onUpdate={() => refreshBoardDetails(selectedBoardId!, true)}
                                                    onPreview={(url, name, assetId) => setPreviewFile({ url, name, assetId })}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-white/5 bg-[#0a0a12] text-center">
                            <span className="text-[10px] font-mono text-gray-600">
                                Project ID: {selectedProject.id}
                            </span>
                        </div>
                    </>
                )}
            </PremiumModal>
        </div>
    );
};
