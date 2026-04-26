import { useState, useMemo, useEffect, useRef } from 'react';
import { Smile } from 'lucide-react';
import { BoardCell } from '../shared/BoardCell';
import { YouTubeModal } from '../ui/YouTubeModal';
import { SubmissionVideoPlayer, type SubmissionVideoPlayerHandle } from '../shared/SubmissionVideoPlayer';
import { SubmissionVideoFeedbackPanel } from '../shared/SubmissionVideoFeedbackPanel';
import { getBoardColumns, getAssetPublicUrl, normalizeMondayFileUrl } from '../../services/mondayService';
import { getItemStatusLabel, isMondayStatusForApproval } from '../../lib/mondayItemStatus';

interface AdminApprovalModalProps {
    approvalItems: any[];
    currentApprovalItem: any;
    boardData: any;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    refreshBoardDetails: () => Promise<void>;
    setPreviewFile: (file: { url: string, name: string, assetId?: string } | null) => void;
}

function editorNameHintFromItem(item: any, columns: any[] | undefined): string {
    const cv = item?.column_values?.find((v: any) => {
        const c = columns?.find((x: any) => x.id === v.id);
        return c?.title?.toLowerCase().includes('editor');
    });
    return (cv?.text || '').trim();
}

export const AdminApprovalModal = ({
    approvalItems,
    currentApprovalItem,
    boardData,
    onClose,
    onNext,
    onPrev,
    refreshBoardDetails,
    setPreviewFile
}: AdminApprovalModalProps) => {

    const videoRef = useRef<SubmissionVideoPlayerHandle>(null);
    const [mirrorOptions, setMirrorOptions] = useState<Record<string, any[]>>({});

    // Find the full item with column_values from boardData
    const selectedProject = useMemo(() => {
        if (!currentApprovalItem || !boardData?.items) return null;
        return boardData.items.find((i: any) => i.id === currentApprovalItem.id) || null;
    }, [currentApprovalItem, boardData]);

    const currentIndex = useMemo(() => {
        if (!currentApprovalItem || !approvalItems) return -1;
        return approvalItems.findIndex(i => i.id === currentApprovalItem.id);
    }, [currentApprovalItem, approvalItems]);

    const hasNext = currentIndex !== -1 && currentIndex < approvalItems.length - 1;
    const hasPrev = currentIndex !== -1 && currentIndex > 0;

    // Derived main asset for download & preview
    const mainAsset = useMemo(() => {
        if (!selectedProject || !boardData?.columns) return null;

        let mainAssetUrl: string | null = null;
        let mainAssetName: string = selectedProject.name;

        // Try 'Submission Preview' column conceptually
        const submissionCol = boardData.columns?.find((c: any) => c.title.toLowerCase().includes('submission'));
        if (submissionCol) {
            const val = selectedProject.column_values.find((v: any) => v.id === submissionCol.id);
            if (val?.value) {
                try {
                    const fileData = JSON.parse(val.value);
                    if (fileData.files && fileData.files.length > 0) {
                        const f = fileData.files[0];
                        mainAssetUrl = f.public_url || f.url || f.urlThumbnail;
                        mainAssetName = f.name;
                    } else if (fileData.url) {
                        mainAssetUrl = fileData.url;
                        mainAssetName = fileData.text;
                    }
                } catch (e) { }
            }
            if (!mainAssetUrl && val?.display_value?.startsWith('http')) {
                mainAssetUrl = val.display_value;
            }
        }

        // Try File Columns
        if (!mainAssetUrl) {
            const fileCols = boardData.columns?.filter((c: any) => c.type === 'file') || [];
            for (const col of fileCols) {
                const val = selectedProject.column_values.find((v: any) => v.id === col.id);
                if (val && val.value) {
                    try {
                        const fileData = JSON.parse(val.value);
                        if (fileData.files && fileData.files.length > 0) {
                            const f = fileData.files[0];
                            const url = f.public_url || f.url || f.urlThumbnail;
                            if (url) {
                                if (/\.(mp4|mov|webm|ogg)$/i.test(f.name) || /\.(mp4|mov|webm|ogg)$/i.test(url)) {
                                    mainAssetUrl = url;
                                    mainAssetName = f.name;
                                    break;
                                }
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

        // Try Link Columns
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

        // Try text columns parsing URLs
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

    // Mirror options effect
    useEffect(() => {
        const fetchMirrorSourceColumns = async () => {
            if (!boardData?.columns) return;
            const mirrorCols = boardData.columns.filter((col: any) =>
                (col.type === 'mirror' || col.type === 'lookup') &&
                (col.title.toLowerCase().includes('status') || col.title.toLowerCase().includes('priority') || col.title.toLowerCase().includes('client'))
            );
            if (mirrorCols.length === 0) return;

            const promises = mirrorCols.map(async (col: any) => {
                try {
                    if (!col.settings_str) return null;
                    const settings = JSON.parse(col.settings_str);
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
                    } else if (settings.board_ids && settings.board_ids.length > 0) {
                        sourceBoardId = settings.board_ids[0];
                    }

                    if (sourceBoardId) {
                        const sourceColumns = await getBoardColumns(sourceBoardId);
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
                } catch (e) { }
                return null;
            });

            const results = await Promise.all(promises);
            const newMirrorOptions: Record<string, any[]> = {};
            results.forEach(res => {
                if (res) newMirrorOptions[res.id] = res.options;
            });

            if (Object.keys(newMirrorOptions).length > 0) {
                setMirrorOptions(prev => ({ ...prev, ...newMirrorOptions }));
            }
        };

        fetchMirrorSourceColumns();
    }, [boardData]);

    if (!selectedProject) {
        return null;
    }

    const mainAssetVideoInfo = (() => {
        if (!mainAsset?.url) return { isVideo: false as const, cleanUrl: '' as const };
        const cleanUrl = mainAsset.url.split('?')[0];
        const ext = cleanUrl.split('.').pop()?.toLowerCase() || '';
        const isVideo = ['mp4', 'mov', 'webm', 'ogg', 'avi', 'mkv'].includes(ext);
        return { isVideo, cleanUrl };
    })();

    const approvalBoardId = currentApprovalItem?.boardId || boardData?.id || '';
    const approvalStatusLabel = getItemStatusLabel(selectedProject, boardData?.columns);
    const canComposeVideoFeedback = isMondayStatusForApproval(approvalStatusLabel);

    return (
        <YouTubeModal
            isOpen={true}
            onClose={onClose}
            title={selectedProject?.name || currentApprovalItem?.name}
            onNext={onNext}
            onPrev={onPrev}
            hasNext={hasNext}
            hasPrev={hasPrev}
            splitSidePanel={
                mainAsset?.url && mainAssetVideoInfo.isVideo && approvalBoardId ? (
                    <SubmissionVideoFeedbackPanel
                        boardId={approvalBoardId}
                        itemId={selectedProject.id}
                        projectName={selectedProject.name}
                        mode="admin"
                        videoRef={videoRef}
                        editorNameHint={editorNameHintFromItem(selectedProject, boardData?.columns)}
                        canCompose={canComposeVideoFeedback}
                    />
                ) : undefined
            }
            mainContent={
                mainAsset?.url ? (() => {
                    if (mainAssetVideoInfo.isVideo) {
                        return <SubmissionVideoPlayer ref={videoRef} url={mainAsset.url} />;
                    }

                    return (
                        <div className="w-full h-full flex items-center justify-center min-h-[40vh]">
                            <iframe
                                src={mainAsset.url}
                                className="w-full h-full border-0 min-h-[40vh]"
                                title={mainAsset.name}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    );
                })() : (
                    <div className="flex flex-col items-center justify-center text-center p-10">
                        <div className="mb-6">
                            <Smile className="w-16 h-16 text-white opacity-20" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-2">
                            {selectedProject?.name || 'Select a Project'}
                        </h3>
                        <p className="text-gray-400 max-w-md">
                            Select a file from the sidebar to preview, or view project details.
                        </p>
                    </div>
                )
            }
            sidebarContent={
                <>
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
                                    {/* Filtered Columns */}
                                    {boardData?.columns?.filter((col: any) =>
                                        col.type !== 'name' &&
                                        !col.title.startsWith('C-F-') &&
                                        !col.title.toLowerCase().startsWith('c-w-') &&
                                        !col.title.toLowerCase().includes('submission') &&
                                        !col.title.toLowerCase().includes('subitems')
                                    ).map((col: any) => (
                                        <div key={col.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl hover:bg-white/[0.03] transition-colors border-b border-white/[0.02] last:border-0 gap-2">
                                            <span className="text-sm font-medium text-gray-500 group-hover:text-gray-400 transition-colors uppercase tracking-wider min-w-[150px]">
                                                {col.title}
                                            </span>
                                            <div className="flex-1 flex justify-start sm:justify-end">
                                                <BoardCell
                                                    item={selectedProject}
                                                    column={col}
                                                    boardId={currentApprovalItem.boardId}
                                                    allColumns={boardData.columns}
                                                    uniqueValues={Array.from(new Set(
                                                        boardData.items?.map((i: any) => {
                                                            const val = i.column_values.find((cv: any) => cv.id === col.id);
                                                            return val?.display_value || val?.text;
                                                        }).filter(Boolean) as string[]
                                                    ))}
                                                    dropdownOptions={mirrorOptions[col.id]}
                                                    onUpdate={() => refreshBoardDetails()}
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
            }
        />
    );
};
