import { useState } from 'react';
import { Loader2, PlayCircle, FileText, Eye, Check } from 'lucide-react';
import { useUpdateItemValue } from '../../hooks/useMondayData';
import { normalizeMondayFileUrl } from '../../services/mondayService';
import { MondayItem, MondayColumn } from '../../types/monday';

interface BoardCellProps {
    item: MondayItem;
    column: MondayColumn;
    boardId: string | null;
    allColumns?: MondayColumn[]; // NEW: For finding related columns
    onUpdate: () => void;
    onPreview: (url: string, name: string, assetId?: string) => void;
}

export const BoardCell = ({ item, column, boardId, allColumns, onUpdate, onPreview }: BoardCellProps) => {
    // ... existing state ...
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { mutateAsync: updateItem } = useUpdateItemValue();

    // ... existing displayValue logic ...
    // Find value for this column
    const colValueObj = item.column_values.find((v) => v.id === column.id);
    let displayValue = colValueObj ? (colValueObj.text || '') : '';

    // ... (rest of display value logic is same) ...
    // Robust Parsing for Complex Types
    let linkUrl: string | null = null;
    let fileName: string | null = null;
    let assetId: string | undefined = undefined;
    let thumbnailUrl: string | null = null;

    // Fix for Mirror Columns: Use display_value if available (native or from our updated query)
    if ((column.type === 'mirror' || column.type === 'lookup') && colValueObj?.display_value) {
        displayValue = colValueObj.display_value;
    }

    if (colValueObj && colValueObj.value) {
        try {
            const val = JSON.parse(colValueObj.value);
            // Link
            if (column.type === 'link') {
                linkUrl = val.url;
                // If we haven't already set displayValue from mirror logic, use the link text
                if (!colValueObj.display_value) {
                    displayValue = val.text || val.url || displayValue;
                }
            }
            // Date
            if (column.type === 'date') {
                displayValue = val.date || displayValue;
            }
            // Email
            if (column.type === 'email') {
                displayValue = val.email || displayValue;
            }

            // Universal File Extraction
            if (val.files && val.files.length > 0) {
                const f = val.files[0];
                const thumb = f.urlThumbnail || f.thumbnail_url || f.micro_thumbnail_url;

                const fileUrl = normalizeMondayFileUrl(f.public_url || f.url || thumb);
                if (fileUrl) {
                    linkUrl = fileUrl;
                    fileName = f.name;
                    assetId = f.assetId;
                    thumbnailUrl = thumb;
                }
            }
        } catch (e) {
            // value might not be JSON, ignore
        }
    }

    // Special handling if displayValue (text) is actually a raw URL for files
    const isFileLike = /\.(mp4|mov|webm|ogg|pdf|jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(displayValue);

    if (!linkUrl && (displayValue.startsWith('http') || isFileLike)) {
        if (displayValue.startsWith('http') || displayValue.startsWith('blob:')) {
            linkUrl = displayValue;
        }
        try {
            fileName = displayValue.startsWith('http') ? decodeURIComponent(displayValue.split('/').pop() || 'File') : displayValue;
        } catch (e) {
            fileName = "Attachment";
        }
    }
    if (fileName) displayValue = fileName;

    // Fallback: Extract assetId from protected_static URL pattern if not already captured
    if (!assetId && linkUrl && linkUrl.includes('protected_static') && linkUrl.includes('/resources/')) {
        const match = linkUrl.match(/\/resources\/(\d+)\//);
        if (match && match[1]) {
            assetId = match[1];
        }
    }

    // Parse column settings for Status/Dropdown
    let options: any[] = [];
    if (column.type === 'color' || column.type === 'status') {
        try {
            const settings = JSON.parse(column.settings_str || '{}');
            if (settings.labels) {
                options = Object.entries(settings.labels).map(([key, label]: any) => ({
                    id: key,
                    label: label,
                    color: settings.labels_colors ? settings.labels_colors[key]?.color : '#fff'
                }));
            }
        } catch (e) {
            console.error("Failed to parse column settings", e);
        }
    }

    const handleSave = async (newValue: string) => {
        if (newValue === displayValue) {
            setIsEditing(false);
            return;
        }

        if (!boardId) {
            console.error("Cannot save: No board ID");
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            // 1. Update the Main Column (e.g., Status)
            await updateItem({ boardId, itemId: item.id, columnId: column.id, value: newValue });

            // 2. SYSTEM LOGIC: Check for Revision Logic
            // If this is a Status column AND new value implies Revision (e.g. "Sent for Revisions")
            // We check for "Sent for" to catch variations like "(CV) Sent for Revisions" or "(Client) Sent for Revisions"
            const isRevisionStatus = newValue.toLowerCase().includes('sent for revision') ||
                newValue.toLowerCase().includes('sent for review'); // broad catch if needed, but 'revision' is safer

            if ((column.title.toLowerCase().includes('status') || column.type === 'status') && isRevisionStatus) {
                console.log('[System Logic] Detected "Sent for Revisions" status. Checking for "Amount of Revisions" counter...');

                if (allColumns) {
                    // Find "Amount of Revisions" column (Numbers) - Prioritize exact match
                    const revisionsCol = allColumns.find(c =>
                        c.title.toLowerCase() === 'amount of revisions' && (c.type === 'numeric' || c.type === 'numbers')
                    ) || allColumns.find(c =>
                        c.title.toLowerCase().includes('amount of revision') && (c.type === 'numeric' || c.type === 'numbers')
                    );

                    if (revisionsCol) {
                        // Get current value
                        const currentValObj = item.column_values.find(v => v.id === revisionsCol.id);
                        let currentCount = 0;
                        if (currentValObj && currentValObj.text) {
                            currentCount = parseFloat(currentValObj.text) || 0;
                        }

                        const newCount = currentCount + 1;
                        console.log(`[System Logic] Incrementing revisions from ${currentCount} to ${newCount}`);

                        // Update Revisions Column
                        await updateItem({ boardId, itemId: item.id, columnId: revisionsCol.id, value: newCount.toString() });
                    } else {
                        console.warn('[System Logic] "Amount of Revisions" numeric column not found on this board.');
                    }
                }
            }

            await onUpdate();
        } catch (err) {
            console.error(err);
            alert("Failed to update value");
        } finally {
            setIsLoading(false);
            setIsEditing(false);
        }
    };

    if (isLoading) {
        return <div className="text-gray-500 text-xs animate-pulse flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</div>;
    }

    const isMirrorStatus = (column.type === 'mirror' || column.type === 'lookup') && column.title.toLowerCase().includes('status');

    // Status / Dropdown Rendering OR Mirror Status
    if (column.type === 'color' || column.type === 'status' || isMirrorStatus) {
        let currentOption = options.find(o => o.label === displayValue);

        // Manual Color Override for Mirror Statuses if options are missing
        if (!currentOption && isMirrorStatus) {
            const val = displayValue;
            if (val.includes('Unassigned')) currentOption = { label: val, color: '#595959', id: 'unassigned' };
            else if (val.includes('Assigned (CV)')) currentOption = { label: val, color: '#fec12d', id: 'assigned_cv' };
            else if (val.includes('Working on it (CV)')) currentOption = { label: val, color: '#fdab3d', id: 'working_cv' };
            else if (val.includes('Exporting')) currentOption = { label: val, color: '#ffadad', id: 'exporting' };
            else if (val.includes('Taking a break (CV)')) currentOption = { label: val, color: '#ff158a', id: 'break_cv' };
            else if (val.includes('Client Info')) currentOption = { label: val, color: '#e2445c', id: 'client_info' };
            else if (val.includes('(Client) Approved')) currentOption = { label: val, color: '#cd3859', id: 'client_approved' };
            else if (val.includes('For Approval (CV)')) currentOption = { label: val, color: '#5D24AA', id: 'for_approval_cv' };
            else if (val.includes('(Client) Uploading')) currentOption = { label: val, color: '#904EE2', id: 'client_uploading' };
            else if (val.includes('1st Approval')) currentOption = { label: val, color: '#9cd326', id: '1st_approval' };
            else if (val.includes('Approved (CV)')) currentOption = { label: val, color: '#00c875', id: 'approved_cv' };
            else if (val.includes('(Client) Sent for')) currentOption = { label: val, color: '#009d6c', id: 'client_sent' };
            else if (val.includes('Waiting for Client')) currentOption = { label: val, color: '#579bfc', id: 'waiting_client' };
            else if (val.includes('Downloading')) currentOption = { label: val, color: '#505f79', id: 'downloading' };
            else if (val.includes('Approved')) currentOption = { label: val, color: '#00c875', id: 'approved_gen' };
            else if (val.includes('Revision')) currentOption = { label: val, color: '#eebb4d', id: 'revision' };
            else if (val.includes('Stuck') || val.includes('Error')) currentOption = { label: val, color: '#e2445c', id: 'error' };
            else if (val) currentOption = { label: val, color: '#579bfc', id: 'default' };
        }

        if (isEditing && !isMirrorStatus) {
            return (
                <div className="relative z-50">
                    <div className="fixed inset-0" onClick={() => setIsEditing(false)} />
                    <div className="absolute top-0 left-0 min-w-[140px] bg-[#1a1a2e] border border-white/20 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 z-50 py-1">
                        {options.map((opt: any) => (
                            <button
                                key={opt.id}
                                onClick={() => handleSave(opt.label)}
                                className="w-full text-left px-4 py-2 hover:bg-white/10 text-white text-xs transition-colors flex items-center gap-3"
                            >
                                <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white/10" style={{ backgroundColor: opt.color || '#fff' }} />
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <button
                disabled={isMirrorStatus}
                onClick={() => !isMirrorStatus && setIsEditing(true)}
                className={`px-4 py-1.5 rounded-full text-white text-[11px] font-bold text-center min-w-[90px] transition-all shadow-lg shadow-black/20
                    ${!isMirrorStatus ? 'hover:brightness-110 active:scale-95 cursor-pointer' : 'cursor-default opacity-90'}`}
                style={currentOption && currentOption.label ? { backgroundColor: currentOption.color || '#7c3aed' } : { backgroundColor: '#2d2d3d', color: '#9ca3af' }}
            >
                {currentOption ? currentOption.label : (displayValue || 'Empty')}
            </button>
        );
    }

    // Link Rendering
    if (column.type === 'link' && !isEditing && linkUrl) {
        return (
            <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0073ea] hover:text-white hover:underline truncate text-sm flex items-center gap-1"
            >
                {displayValue}
                <span className="text-[10px] opacity-50">↗</span>
            </a>
        );
    }

    // --- ENHANCED FILE RENDERING ---
    const isVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(displayValue) || (linkUrl && /\.(mp4|mov|webm|ogg)(\?|$)/i.test(linkUrl || ''));
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(displayValue) || (linkUrl && /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(linkUrl || ''));
    const isPdf = /\.pdf(\?|$)/i.test(displayValue) || (linkUrl && /\.pdf(\?|$)/i.test(linkUrl || ''));

    const shouldRenderAsFile = (column.type === 'file' && linkUrl) || (linkUrl && (isVideo || isImage || isPdf));

    if (shouldRenderAsFile) {
        if (isVideo) {
            const thumbUrl = thumbnailUrl;
            const isRawVideo = /\.(mp4|mov|webm|ogg)$/i.test(linkUrl || '');
            const showVideoTag = isRawVideo && !thumbUrl;

            return (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onPreview(linkUrl!, displayValue, assetId);
                    }}
                    className="relative group/video w-full max-w-[240px] aspect-video bg-black/40 rounded-lg overflow-hidden border border-white/10 cursor-pointer shadow-sm hover:shadow-md transition-all hover:border-emerald-500/30"
                >
                    {thumbUrl ? (
                        <img src={thumbUrl} alt={displayValue} className="w-full h-full object-cover opacity-80 group-hover/video:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                    ) : showVideoTag ? (
                        <video
                            src={linkUrl!}
                            className="w-full h-full object-cover opacity-80 group-hover/video:opacity-100 transition-opacity"
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            onMouseOver={e => e.currentTarget.play().catch(() => { })}
                            onMouseOut={e => e.currentTarget.pause()}
                            // @ts-ignore
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#0e0e1a]">
                            <PlayCircle className="w-8 h-8 text-white/20" />
                        </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/video:bg-transparent transition-all">
                        <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover/video:scale-110 transition-transform">
                            <PlayCircle className="w-5 h-5 text-white/90 fill-white/20" />
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onPreview(linkUrl!, displayValue, assetId);
                }}
                className={`flex items-center gap-2 py-1.5 px-3 rounded-lg border transition-all group max-w-full text-left relative overflow-hidden
                    ${isPdf ? 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20 text-orange-400' :
                        'bg-[#0073ea]/10 border-[#0073ea]/20 hover:bg-[#0073ea]/20 text-[#0073ea]'}`}
                title={displayValue}
            >
                {isPdf ? <FileText className="w-4 h-4 flex-shrink-0" /> :
                    <Eye className="w-4 h-4 flex-shrink-0" />}

                <span className="text-[11px] font-bold truncate group-hover:underline decoration-current">
                    {displayValue}
                </span>
            </button>
        );
    }

    // Generic Link in Text Column
    if (!isEditing && displayValue && (displayValue.startsWith('http://') || displayValue.startsWith('https://'))) {
        return (
            <a
                href={displayValue}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[#0073ea] hover:text-white hover:underline truncate text-sm flex items-center gap-1"
            >
                {displayValue}
                <span className="text-[10px] opacity-50">↗</span>
            </a>
        );
    }

    if (isEditing) {
        return (
            <input
                autoFocus
                className="bg-[#050511] border border-blue-500/50 rounded-lg px-3 py-1.5 text-white text-sm w-full outline-none shadow-[0_0_15px_rgba(0,115,234,0.1)] transition-all"
                defaultValue={displayValue}
                onBlur={(e) => handleSave(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave(e.currentTarget.value);
                    if (e.key === 'Escape') setIsEditing(false);
                }}
                onClick={(e) => e.stopPropagation()}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className="cursor-text hover:bg-white/5 px-2 py-1 rounded-md transition-colors text-gray-200 text-sm min-h-[28px] w-full border border-transparent hover:border-white/5 flex items-center"
        >
            {displayValue || <span className="text-gray-600 text-xs italic">Empty</span>}
        </div>
    );
};
