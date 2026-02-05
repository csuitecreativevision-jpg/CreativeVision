import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Calendar, Activity } from 'lucide-react';
import { ProjectCard } from '../shared/ProjectCard';
import { BoardCell } from '../shared/BoardCell';

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
            <AnimatePresence>
                {selectedProject && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProject(null)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto cursor-pointer"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
                        >
                            <div className="bg-[#0E0E1A] border border-white/10 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col">

                                {/* Modal Header */}
                                <div className="p-6 border-b border-white/5 flex items-start justify-between bg-[#131322]">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getStatusColor(selectedProject) }} />
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{getStatusText(selectedProject)}</span>
                                        </div>
                                        <h2 className="text-2xl font-black text-white leading-tight">{selectedProject.name}</h2>
                                    </div>
                                    <button
                                        onClick={() => setSelectedProject(null)}
                                        className="p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Modal Content - Scrollable */}
                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                                    <div className="space-y-6">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                            <Activity className="w-4 h-4" /> Project Details
                                        </h3>

                                        <div className="grid grid-cols-1 gap-4">
                                            {boardData.columns?.filter((col: any) => col.type !== 'name' && !col.title.startsWith('C-F-')).map((col: any) => (
                                                <div key={col.id} className="bg-white/5 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold opacity-70 block mb-2">{col.title}</span>
                                                    <BoardCell
                                                        item={selectedProject}
                                                        column={col}
                                                        boardId={selectedBoardId}
                                                        onUpdate={() => refreshBoardDetails(selectedBoardId!, true)}
                                                        onPreview={(url, name, assetId) => setPreviewFile({ url, name, assetId })}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="p-4 border-t border-white/5 bg-[#131322] text-center text-xs text-gray-500 font-mono">
                                    Project ID: {selectedProject.id}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
