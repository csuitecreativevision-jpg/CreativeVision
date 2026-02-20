import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Calendar, Activity } from 'lucide-react';
import { ProjectCard } from '../shared/ProjectCard';
import { BoardCell } from '../shared/BoardCell';
import { PremiumModal } from '../ui/PremiumModal';
import { YouTubeModal } from '../ui/YouTubeModal';
import { getCycleFromDate } from '../../features/performance-dashboard/utils/dateUtils';
import { getBoardColumns, getAssetPublicUrl, normalizeMondayFileUrl } from '../../services/mondayService';

interface ProjectSelectionViewProps {
    boardData: any;
    selectedBoardId: string | null;
    refreshBoardDetails: (boardId: string, silent: boolean) => void;
    setPreviewFile: (file: { url: string, name: string, assetId?: string } | null) => void;
    useYouTubeModal?: boolean;
}

// Helper component for video playback with signed URL fetching
const SubmissionVideoPlayer = ({ url }: { url: string }) => {
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchUrl = async () => {
            // Check if it's a protected Monday URL that needs signing
            // Format: .../resources/ASSET_ID/...
            const match = url.match(/\/resources\/(\d+)\//);
            if (match && match[1]) {
                try {
                    const assetId = match[1];
                    const publicUrl = await getAssetPublicUrl(assetId);
                    if (isMounted && publicUrl) {
                        const normalized = normalizeMondayFileUrl(publicUrl);
                        setVideoSrc(normalized);
                        return;
                    }
                } catch (e) {
                    console.error("Failed to fetch signed video URL", e);
                }
            }

            // Fallback to original URL if not protected or fetch failed
            if (isMounted) {
                setVideoSrc(url);
            }
        };

        fetchUrl();
        return () => { isMounted = false; };
    }, [url]);

    if (error) {
        return <div className="text-white">Video failed to load. <a href={url} target="_blank" className="underline">Download</a></div>;
    }

    if (!videoSrc) {
        return <div className="flex items-center justify-center h-full"><span className="animate-pulse text-gray-400">Loading video...</span></div>;
    }

    return (
        <div className="w-full h-full flex items-center justify-center bg-black relative group">
            <video
                src={videoSrc}
                className="w-full h-full object-contain"
                controls
                autoPlay
                muted
                loop
                preload="auto"
                playsInline
                // @ts-ignore
                referrerPolicy="no-referrer"
                onError={(e) => {
                    console.error("DEBUG: Video Playback Error", e);
                    setError(true);
                }}
            >
                Your browser does not support the video tag.
            </video>

            {/* Fallback Link Overlay (Visible on Error or Hover) */}
            <div className={`absolute bottom-4 right-4 bg-black/80 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 pointer-events-none`}>
                <span className="text-xs text-white">Video not playing?</span>
            </div>
            {/* Invisible clickable layer for debugging/fallback if needed? No, native controls cover most. */}
        </div>
    );
};

export const ProjectSelectionView = ({
    boardData,
    selectedBoardId,
    refreshBoardDetails,
    setPreviewFile,
    useYouTubeModal = false
}: ProjectSelectionViewProps) => {
    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [viewMode, setViewMode] = useState<'all' | 'cycles'>('all'); // NEW: View Mode
    const [expandedCycles, setExpandedCycles] = useState<Set<string>>(new Set()); // NEW: Expanded Cycles
    const [mirrorOptions, setMirrorOptions] = useState<Record<string, any[]>>({});

    // Derived main asset for download & preview
    const mainAsset = useMemo(() => {
        if (!selectedProject || !boardData.columns) return null;

        let mainAssetUrl: string | null = null;
        let mainAssetName: string = selectedProject.name;

        // A. Check for "Submission Preview" specifically (File or Link)
        const submissionCol = boardData.columns?.find((c: any) => c.title.toLowerCase().includes('submission preview'));

        if (submissionCol) {
            const val = selectedProject.column_values.find((v: any) => v.id === submissionCol.id);
            if (val) {
                // 1. Try Standard File/Link Parsing (JSON value)
                if (val.value) {
                    try {
                        const fileData = JSON.parse(val.value);
                        if (fileData.files && fileData.files.length > 0) {
                            const f = fileData.files[0];
                            mainAssetUrl = f.public_url || f.url || f.urlThumbnail;
                            mainAssetName = f.name || "Submission Preview";
                        }
                        else if (fileData.url) {
                            mainAssetUrl = fileData.url;
                            mainAssetName = fileData.text || "Submission Preview";
                        }
                    } catch (e) { }
                }

                // 2. Fallback: Check display_value (Mirror columns often return direct text/url here)
                if (!mainAssetUrl && val.display_value) {
                    if (val.display_value.startsWith('http')) {
                        mainAssetUrl = val.display_value;
                        mainAssetName = "Submission Preview";
                    }
                }
            }
        }

        // B. Check File Columns
        if (!mainAssetUrl) {
            const fileCols = boardData.columns?.filter((c: any) => c.type === 'file') || [];
            for (const col of fileCols) {
                const val = selectedProject.column_values.find((v: any) => v.id === col.id);
                if (val && val.value) {
                    try {
                        const fileData = JSON.parse(val.value);
                        if (fileData.files && fileData.files.length > 0) {
                            const f = fileData.files[0];
                            const url = f.public_url || f.url || f.urlThumbnail; // Prioritize public
                            if (url) {
                                // Prefer video
                                if (/\.(mp4|mov|webm|ogg)$/i.test(f.name) || /\.(mp4|mov|webm|ogg)$/i.test(url)) {
                                    mainAssetUrl = url;
                                    mainAssetName = f.name;
                                    break; // Found video, stop
                                }
                                // Fallback to image if no video found yet
                                if (!mainAssetUrl && /\.(jpg|png|jpeg|webp|gif)$/i.test(f.name)) {
                                    mainAssetUrl = url;
                                    mainAssetName = f.name;
                                }
                            }
                        }
                    } catch (e) { }
                }
            }
        }

        // Check Link Columns (if no file found)
        if (!mainAssetUrl) {
            const linkCols = boardData.columns?.filter((c: any) => c.type === 'link') || [];
            for (const col of linkCols) {
                const val = selectedProject.column_values.find((v: any) => v.id === col.id);
                if (val && val.value) {
                    try {
                        const linkData = JSON.parse(val.value);
                        if (linkData.url) {
                            mainAssetUrl = linkData.url;
                            mainAssetName = linkData.text || selectedProject.name;
                            break;
                        }
                    } catch (e) { }
                }
            }
        }

        // If still no asset, check text columns for "Filename - URL" pattern
        if (!mainAssetUrl) {
            const textCols = boardData.columns?.filter((c: any) => c.type === 'text') || [];
            for (const col of textCols) {
                const val = selectedProject.column_values.find((v: any) => v.id === col.id);
                const displayValue = val?.text || val?.display_value;
                if (displayValue && typeof displayValue === 'string') {
                    const match = displayValue.match(/^(.+?)\s+-\s+(https?:\/\/[^\s]+)/);
                    if (match) {
                        mainAssetName = match[1].trim();
                        mainAssetUrl = match[2].trim();
                        break;
                    }
                }
            }
        }

        return { url: mainAssetUrl, name: mainAssetName };
    }, [selectedProject, boardData]);

    const handleDownload = async () => {
        if (!mainAsset?.url) return;

        let downloadUrl = mainAsset.url as string;

        // Check for Monday protected resource
        const match = downloadUrl.match(/\/resources\/(\d+)\//);
        if (match && match[1]) {
            try {
                const publicUrl = await getAssetPublicUrl(match[1]);
                if (publicUrl) {
                    downloadUrl = normalizeMondayFileUrl(publicUrl);
                }
            } catch (e) { console.error("Failed to sign URL for download", e); }
        }

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = mainAsset.name || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Effect to fetch source columns for Mirror fields (Status/Priority)
    useEffect(() => {
        const fetchMirrorSourceColumns = async () => {
            if (!boardData.columns) return;

            const mirrorCols = boardData.columns.filter((col: any) =>
                (col.type === 'mirror' || col.type === 'lookup') &&
                (col.title.toLowerCase().includes('status') || col.title.toLowerCase().includes('priority') || col.title.toLowerCase().includes('client'))
            );

            if (mirrorCols.length === 0) return;

            // Map each mirror column to a promise that resolves to [colId, options] or null
            const promises = mirrorCols.map(async (col: any) => {
                try {
                    if (!col.settings_str) return null;
                    const settings = JSON.parse(col.settings_str);

                    // Strategy for Mirror Columns:
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
                    // Fallback: Check board_ids
                    else if (settings.board_ids && settings.board_ids.length > 0) {
                        sourceBoardId = settings.board_ids[0];
                    }

                    if (sourceBoardId) {
                        // Fetch columns from that board
                        const sourceColumns = await getBoardColumns(sourceBoardId);

                        // Find matching status column
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
                                return { id: col.id, options };
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch source for mirror:", col.title, e);
                }
                return null;
            });

            const results = await Promise.all(promises);
            const newMirrorOptions: Record<string, any[]> = {};

            results.forEach(res => {
                if (res) {
                    newMirrorOptions[res.id] = res.options;
                }
            });

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

    // Navigation handlers for Modal Cycling
    const currentIndex = useMemo(() => {
        if (!selectedProject) return -1;
        return filteredItems.findIndex((i: any) => i.id === selectedProject.id);
    }, [filteredItems, selectedProject]);

    const handleNextProject = () => {
        if (currentIndex !== -1 && currentIndex < filteredItems.length - 1) {
            setSelectedProject(filteredItems[currentIndex + 1]);
        }
    };

    const handlePrevProject = () => {
        if (currentIndex !== -1 && currentIndex > 0) {
            setSelectedProject(filteredItems[currentIndex - 1]);
        }
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
            {useYouTubeModal ? (
                <YouTubeModal
                    isOpen={!!selectedProject}
                    onClose={() => setSelectedProject(null)}
                    title={selectedProject?.name}
                    onNext={handleNextProject}
                    onPrev={handlePrevProject}
                    hasNext={currentIndex !== -1 && currentIndex < filteredItems.length - 1}
                    hasPrev={currentIndex !== -1 && currentIndex > 0}
                    mainContent={
                        mainAsset?.url ? (() => {
                            // Extract extension ignoring query strings
                            const cleanUrl = mainAsset.url.split('?')[0];
                            const ext = cleanUrl.split('.').pop()?.toLowerCase() || '';
                            const isVideo = ['mp4', 'mov', 'webm', 'ogg', 'avi', 'mkv'].includes(ext);

                            console.log('DEBUG: Video Detection', { url: mainAsset.url, cleanUrl, ext, isVideo });

                            if (isVideo) {
                                return <SubmissionVideoPlayer url={mainAsset.url} />;
                            }

                            return (
                                <div className="w-full h-full flex items-center justify-center">
                                    <iframe
                                        src={mainAsset.url}
                                        className="w-full h-full border-0"
                                        title={mainAsset.name}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            );
                        })() : (
                            <div className="flex flex-col items-center justify-center text-center p-10">
                                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-6 border border-white/10 shadow-2xl shadow-violet-500/10">
                                    <Activity className="w-16 h-16 text-violet-400" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2">
                                    {selectedProject ? selectedProject.name : 'Select a Project'}
                                </h3>
                                <p className="text-gray-400 max-w-md">
                                    Select a file from the sidebar to preview, or view project details.
                                </p>
                            </div>
                        )
                    }
                    sidebarContent={
                        selectedProject && (
                            <>
                                {/* --- YouTube Style Layout --- */}

                                {/* 1. Video Title & Primary Info */}
                                <div className="flex flex-col md:flex-row gap-6 items-start justify-between border-b border-white/5 pb-6">
                                    <div className="space-y-3 flex-1">

                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                                                Project ID: <span className="text-gray-200 font-mono">{selectedProject.id}</span>
                                            </span>
                                            <span>•</span>
                                            <span>Updated {new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Metadata Grid (The Description) */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Column: Description/Main Details */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-[#13131f] rounded-2xl p-6 border border-white/5">
                                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                                <div className="w-1 h-4 rounded-full bg-violet-500" />
                                                PROJECT DETAILS
                                            </h3>

                                            <div className="flex flex-col gap-1">
                                                {boardData.columns?.filter((col: any) =>
                                                    col.type !== 'name' &&
                                                    !col.title.startsWith('C-F-') &&
                                                    col.title.toLowerCase() !== 'submission preview'
                                                ).map((col: any) => (
                                                    <div key={col.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl hover:bg-white/[0.03] transition-colors border-b border-white/[0.02] last:border-0 gap-2">
                                                        <span className="text-sm font-medium text-gray-500 group-hover:text-gray-400 transition-colors uppercase tracking-wider min-w-[150px]">
                                                            {col.title}
                                                        </span>
                                                        <div className="flex-1 flex justify-start sm:justify-end">
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
                                                                dropdownOptions={mirrorOptions[col.id]}
                                                                onUpdate={() => refreshBoardDetails(selectedBoardId!, true)}
                                                                onPreview={(url, name, assetId) => setPreviewFile({ url, name, assetId })}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Quick Actions */}
                                    <div className="space-y-4">
                                        <div className="bg-[#13131f] rounded-2xl p-6 border border-white/5">
                                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Quick Actions</p>
                                            <div className="space-y-2">
                                                <button
                                                    onClick={handleDownload}
                                                    className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-sm font-medium flex items-center justify-between group"
                                                >
                                                    Download <span className="opacity-0 group-hover:opacity-100 transition-opacity">↓</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Metadata Footer */}
                                <div className="pt-6 mt-8 border-t border-white/5 text-center">
                                    <span className="text-[10px] font-mono text-gray-600">
                                    </span>
                                </div>
                            </>
                        )
                    }
                />
            ) : (
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
                                                        dropdownOptions={mirrorOptions[col.id]}
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
            )}
        </div >
    );
};
