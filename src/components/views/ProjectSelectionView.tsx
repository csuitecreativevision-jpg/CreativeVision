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
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0e0e1a] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2">
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

            {/* Grid */}
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
