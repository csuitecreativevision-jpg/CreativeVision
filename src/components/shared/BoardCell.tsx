import { useState, useRef } from 'react';
import { Loader2, PlayCircle, FileText, Eye, Upload } from 'lucide-react';
import { useUpdateItemValue, useUpdateSourceColumn } from '../../hooks/useMondayData';
import { normalizeMondayFileUrl, uploadFileToItemColumn } from '../../services/mondayService';
import { MondayItem, MondayColumn } from '../../types/monday';
import { createNotification, createNotificationsForRole } from '../../services/notificationService';
import { supabase } from '../../lib/supabaseClient';
import { maybeClearSubmissionVideoFeedback } from '../../services/submissionVideoFeedbackService';

interface BoardCellProps {
    item: MondayItem;
    column: MondayColumn;
    boardId: string | null;
    allColumns?: MondayColumn[];
    uniqueValues?: string[]; // Pass strictly unique values from the board to populate dropdowns for Mirrors
    dropdownOptions?: { label: string, color: string, id: string }[]; // NEW: Pass explicit options if we fetched them from source
    onUpdate: () => void;
    onPreview: (url: string, name: string, assetId?: string) => void;
}

/** Resolve source item + column for a mirror/lookup so file upload hits the real Monday file column. */
function extractMirrorSourceIds(item: MondayItem, column: MondayColumn): { itemId: string; columnId: string } | null {
    if (column.type !== 'mirror' && column.type !== 'lookup') return null;
    if (!column.settings_str) return null;

    let sourceColumnId = '';
    let relationColId = '';

    try {
        const settings = JSON.parse(column.settings_str);
        if (settings.displayed_linked_columns) {
            const boardIds = Object.keys(settings.displayed_linked_columns);
            if (boardIds.length > 0) {
                const linkedCols = settings.displayed_linked_columns[boardIds[0]];
                if (linkedCols && linkedCols.length > 0) {
                    sourceColumnId = linkedCols[0];
                }
            }
        }
        if (settings.relation_column) {
            const relKeys = Object.keys(settings.relation_column);
            if (relKeys.length > 0) {
                relationColId = relKeys[0];
            }
        }
    } catch {
        return null;
    }

    if (!relationColId || !sourceColumnId) return null;

    const relationColValue = item.column_values.find((c) => c.id === relationColId);
    if (!relationColValue) return null;

    let sourceItemId = '';
    const rawLinked = (relationColValue as { linked_item_ids?: string[] }).linked_item_ids;
    if (rawLinked && Array.isArray(rawLinked) && rawLinked.length > 0) {
        sourceItemId = String(rawLinked[0]);
    } else if (relationColValue.value) {
        try {
            const parsedRel = JSON.parse(relationColValue.value);
            if (parsedRel?.linkedPulseIds?.length > 0) {
                sourceItemId = String(parsedRel.linkedPulseIds[0].linkedPulseId);
            }
        } catch {
            /* ignore */
        }
    }

    if (!sourceItemId) return null;
    return { itemId: sourceItemId, columnId: sourceColumnId };
}

/** Item + column IDs for Monday `add_file_to_column` (native file col, or Submission mirror → source file col). */
export function getMondayFileUploadTarget(item: MondayItem, column: MondayColumn): { itemId: string; columnId: string } | null {
    if (column.type === 'file') {
        return { itemId: item.id, columnId: column.id };
    }
    const title = column.title.toLowerCase();
    if (!title.includes('submission')) return null;
    if (column.type === 'mirror' || column.type === 'lookup') {
        return extractMirrorSourceIds(item, column);
    }
    return null;
}

export const BoardCell = ({ item, column, boardId, allColumns, uniqueValues, dropdownOptions, onUpdate, onPreview }: BoardCellProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [optimisticValue, setOptimisticValue] = useState<string | null>(null);
    const [fileDropActive, setFileDropActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { mutateAsync: updateItem } = useUpdateItemValue();
    const { mutateAsync: updateSourceCol } = useUpdateSourceColumn();

    const handleMondayFileUpload = async (files: FileList | null) => {
        const file = files?.[0];
        if (!file || !boardId) return;
        const target = getMondayFileUploadTarget(item, column);
        if (!target) {
            alert(
                'This column is not a Monday File column (or a Submission mirror linked to one). Ask an admin to use a File-type Submission Preview column, or link the project row in Monday.'
            );
            return;
        }
        setIsLoading(true);
        try {
            await uploadFileToItemColumn(target.itemId, target.columnId, file);
            await onUpdate();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Could not upload file to Monday.');
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

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

    // Apply Optimistic Override if set (for instant UI feedback before Monday API fully syncs)
    if (optimisticValue !== null) {
        displayValue = optimisticValue;
    }

    // NEW PRE-PROCESSING: Check for "Filename - URL" pattern in plain text columns
    // This handles cases where a text column contains "Video.mp4 - https://..."
    // We only do this if it's likely a text column (no JSON value structure usually)
    if (displayValue && typeof displayValue === 'string') {
        // Regex to find "Text - http..."
        // We use a non-greedy capture for the name
        const match = displayValue.match(/^(.+?)\s+-\s+(https?:\/\/[^\s]+)/);

        if (match) {
            const possibleName = match[1].trim();
            const possibleUrl = match[2].trim();

            // Additional check: valid file extension OR common drive link to reduce false positives
            const isFileOrDrive = /\.(mp4|mov|webm|ogg|pdf|jpg|png|gif|jpeg|svg|doc|docx|zip)$/i.test(possibleName) ||
                possibleUrl.includes('drive.google.com') ||
                possibleUrl.includes('dropbox.com') ||
                possibleUrl.includes('monday.com');

            if (isFileOrDrive) {
                fileName = possibleName;
                linkUrl = possibleUrl;
                displayValue = fileName; // Show clean name
            }
        }
    }

    if (colValueObj && colValueObj.value) {
        try {
            const val = JSON.parse(colValueObj.value);
            // long_text: Monday stores content in `value` JSON as { text: "…" }; top-level .text is often empty.
            if (column.type === 'long_text' && val && typeof val === 'object' && typeof val.text === 'string' && val.text) {
                displayValue = val.text;
            }
            if (
                column.type === 'text' &&
                !displayValue &&
                val &&
                typeof val === 'object' &&
                typeof val.text === 'string' &&
                val.text
            ) {
                displayValue = val.text;
            }
            // Link
            if (column.type === 'link') {
                linkUrl = val.url;
                // Use the link text if available, otherwise the URL
                // If the column value has a 'text' property (from Monday), use it. 
                // Sometimes Monday returns val.text as the label.
                if (val.text) {
                    displayValue = val.text;
                } else if (val.url) {
                    displayValue = val.url;
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
            // Check if this is a mirror status that needs source updating
            const isMirrorStatus = (column.type === 'mirror' || column.type === 'lookup') &&
                (column.title.toLowerCase().includes('status') ||
                    column.title.toLowerCase().includes('priority') ||
                    column.title.toLowerCase().includes('client') ||
                    column.title.toLowerCase().includes('phase'));

            if (isMirrorStatus) {
                // To update a mirror column, we need the source board ID, item ID, and column ID.
                // In Monday.com's API, we can often extract this from the mirror column value or settings.
                // However, without explicit source IDs passed down, we must rely on a convention or 
                // data embedded in the item/column.
                // 
                // As instructed: "When asked to update a mirror column, always update the source board column instead.
                // Use the following parameters: Source Board ID: <SOURCE_BOARD_ID>, Source Item ID: <SOURCE_ITEM_ID>, 
                // Source Column ID: <SOURCE_COLUMN_ID>, New Value: <NEW_VALUE>"

                // For a robust implementation, we'd need these IDs. Since they might be hardcoded for a specific 
                // request or passed via props/context in a real app, we use placeholders per instruction, 
                // but we will implement the actual API call logic using our new hook.

                // CRITICAL FIX: Extract source board, item, and column IDs dynamically from Monday API data
                let sourceBoardId = "<SOURCE_BOARD_ID>";
                let sourceItemId = "<SOURCE_ITEM_ID>";
                let sourceColumnId = "<SOURCE_COLUMN_ID>";
                let relationColId = "";

                // 1. EXTRACT SOURCE BOARD ID, COLUMN ID, and RELATION COLUMN ID from mirror settings
                if (column.settings_str) {
                    try {
                        const settings = JSON.parse(column.settings_str);

                        // Extract Board ID and Column ID
                        if (settings.displayed_linked_columns) {
                            const boardIds = Object.keys(settings.displayed_linked_columns);
                            if (boardIds.length > 0) {
                                sourceBoardId = boardIds[0];
                                const linkedCols = settings.displayed_linked_columns[sourceBoardId];
                                if (linkedCols && linkedCols.length > 0) {
                                    sourceColumnId = linkedCols[0];
                                }
                            }
                        }

                        // Extract Relation Column ID
                        if (settings.relation_column) {
                            const relKeys = Object.keys(settings.relation_column);
                            if (relKeys.length > 0) {
                                relationColId = relKeys[0];
                            }
                        }
                    } catch (e) {
                        console.error('Failed to parse mirror column settings for source IDs');
                    }
                }

                // 2. EXTRACT SOURCE ITEM ID from the relation column value
                if (relationColId) {
                    const relationColValue = item.column_values.find(c => c.id === relationColId);
                    console.log("[DEBUG] relationColId:", relationColId, "relationColValue:", relationColValue);

                    if (relationColValue) {
                        // Priority 1: Check native linked_item_ids array (from 2024-01 API BoardRelationValue fragment)
                        const rawLinked = (relationColValue as any).linked_item_ids;
                        if (rawLinked && Array.isArray(rawLinked) && rawLinked.length > 0) {
                            sourceItemId = String(rawLinked[0]);
                        }
                        // Priority 2: Fallback to parsing the stringified JSON value if available (older/alternative format)
                        else if (relationColValue.value) {
                            try {
                                const parsedRel = JSON.parse(relationColValue.value);
                                if (parsedRel && parsedRel.linkedPulseIds && parsedRel.linkedPulseIds.length > 0) {
                                    sourceItemId = parsedRel.linkedPulseIds[0].linkedPulseId.toString();
                                }
                            } catch (e) {
                                // Ignore parse errors
                            }
                        }
                    }
                }

                if (sourceBoardId === "<SOURCE_BOARD_ID>" || sourceItemId === "<SOURCE_ITEM_ID>") {
                    console.error("Mirror column source extraction failed. Cannot update.", { sourceBoardId, sourceItemId, sourceColumnId });
                    setIsEditing(false);
                    alert("This column cannot be edited because it is not linked to any source item. Please link an item in the Connect Boards column first.");
                    return;
                }

                console.log(`[Mirror Column Update] Triggered for ${column.title}. Board: ${sourceBoardId}, Item: ${sourceItemId}, Col: ${sourceColumnId}, Value: ${newValue}`);
                await updateSourceCol({
                    sourceBoardId,
                    sourceItemId,
                    sourceColumnId,
                    newValue: JSON.stringify({ label: newValue })
                });

                setOptimisticValue(newValue);
                setIsEditing(false);
                onUpdate();
                if (column.title.toLowerCase().includes('status')) {
                    maybeClearSubmissionVideoFeedback(sourceBoardId, sourceItemId, newValue);
                }

            } else {
                // 1. Update the Main Column (e.g., Status)
                await updateItem({ boardId, itemId: item.id, columnId: column.id, value: newValue });

                setOptimisticValue(newValue);
                onUpdate();
            }

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

            // ─── Notification Triggers on Status Change ─────────────────────────
            const isStatusColumn = column.title.toLowerCase().includes('status') || column.type === 'status' || column.type === 'color';
            if (isStatusColumn) {
                maybeClearSubmissionVideoFeedback(boardId, item.id, newValue);
                const val = newValue.toLowerCase();

                // 1. PROJECT COMPLETED → Notify client
                const isCompleted = val.includes('done') || val.includes('completed') || val.includes('approved') && !val.includes('1st');
                if (isCompleted) {
                    // Find client users whose allowed_board_ids include this board
                    (async () => {
                        try {
                            if (!boardId) return;
                            const { data: clientUsers } = await supabase
                                .from('users')
                                .select('email, name, allowed_board_ids')
                                .eq('role', 'client');

                            const matchedClients = clientUsers?.filter(u =>
                                u.allowed_board_ids?.includes(boardId)
                            ) || [];

                            for (const client of matchedClients) {
                                await createNotification({
                                    user_email: client.email,
                                    type: 'project_complete',
                                    title: 'Project Completed! 🎉',
                                    message: `Your project "${item.name}" has been marked as ${newValue}.`,
                                    source_type: 'project',
                                    source_id: item.id
                                });
                            }
                        } catch (err) {
                            console.error('[Notification] Failed to notify client:', err);
                        }
                    })();
                }

                // 2. FOR APPROVAL → Notify all admins (editor finished output)
                const movedToForApproval = val.includes('for approval');
                const isEditorRevisionStatus =
                    val.includes('sent for revision') || val.includes('sent for review');

                if (movedToForApproval) {
                    createNotificationsForRole('admin', {
                        type: 'warning',
                        title: 'Video Ready For Approval',
                        message: `"${item.name}" is now ${newValue}.`,
                        source_type: 'project',
                        source_id: item.id
                    }).catch(err => console.error('[Notification] Failed to notify admins:', err));
                } else if (isEditorRevisionStatus) {
                    (async () => {
                        try {
                            if (!boardId || !allColumns?.length) return;
                            const editorCol = allColumns.find(
                                (c: any) =>
                                    String(c.title || '').toLowerCase().includes('editor') || c.type === 'people'
                            );
                            const editorVal = editorCol
                                ? item.column_values?.find((v: any) => v.id === editorCol.id)
                                : null;
                            const editorLabel = String(
                                editorVal?.text || editorVal?.display_value || ''
                            ).trim();
                            if (!editorLabel) return;
                            const norm = (s: string) =>
                                String(s || '')
                                    .toLowerCase()
                                    .replace(/\(.*?\)/g, '')
                                    .replace(/[^a-z0-9]+/g, '')
                                    .trim();
                            const needle = norm(editorLabel);
                            const { data: editorUsers } = await supabase
                                .from('users')
                                .select('email, name')
                                .eq('role', 'editor');
                            const targets =
                                editorUsers?.filter(u => {
                                    const n = norm(u.name || '');
                                    if (!n || !needle) return false;
                                    return n === needle || n.includes(needle) || needle.includes(n);
                                }) || [];
                            for (const u of targets) {
                                await createNotification({
                                    user_email: u.email,
                                    type: 'warning',
                                    title: 'Revision requested',
                                    message: `"${item.name}" is now ${newValue}. Please review and update the cut.`,
                                    source_type: 'project',
                                    source_id: item.id,
                                });
                            }
                        } catch (err) {
                            console.error('[Notification] Failed to notify editors (revision):', err);
                        }
                    })();
                } else {
                    // 3. Other review/approval states → generic admin notification
                    const needsApproval = val.includes('approval') || val.includes('review') || val.includes('q&a');
                    if (needsApproval) {
                        createNotificationsForRole('admin', {
                            type: 'info',
                            title: 'Project Needs Approval',
                            message: `"${item.name}" has been moved to ${newValue} and requires review.`,
                            source_type: 'project',
                            source_id: item.id
                        }).catch(err => console.error('[Notification] Failed to notify admins:', err));
                    }
                }

                // 4. WAITING FOR CLIENT → Notify matching client users
                const waitingForClient = val.includes('waiting for client');
                if (waitingForClient) {
                    (async () => {
                        try {
                            if (!boardId) return;
                            const { data: clientUsers } = await supabase
                                .from('users')
                                .select('email, allowed_board_ids')
                                .eq('role', 'client');

                            const matchedClients = clientUsers?.filter(u =>
                                u.allowed_board_ids?.includes(boardId)
                            ) || [];

                            for (const client of matchedClients) {
                                await createNotification({
                                    user_email: client.email,
                                    type: 'info',
                                    title: 'Video Waiting For Your Review',
                                    message: `"${item.name}" is now ${newValue}.`,
                                    source_type: 'project',
                                    source_id: `waiting_client_${item.id}`
                                });
                            }
                        } catch (err) {
                            console.error('[Notification] Failed to notify client (waiting for client):', err);
                        }
                    })();
                }
            }
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

    const isMirrorStatus = (column.type === 'mirror' || column.type === 'lookup') &&
        (column.title.toLowerCase().includes('status') ||
            column.title.toLowerCase().includes('priority') ||
            column.title.toLowerCase().includes('client') ||
            column.title.toLowerCase().includes('phase'));

    // Status / Dropdown Rendering OR Mirror Status
    // We treat Priority and Client as "Status" for visual rendering (Chips)
    if (column.type === 'color' || column.type === 'status' || column.type === 'dropdown' || isMirrorStatus) {
        let currentOption = options.find(o => o.label === displayValue);

        // Manual Color Override for Mirror Statuses if options are missing
        if (!currentOption && isMirrorStatus) {
            const val = displayValue;
            // Priorities (Visuals only)
            if (val.includes('Critical')) currentOption = { label: val, color: '#333333', id: 'critical' }; // Black/Dark
            else if (val.includes('High')) currentOption = { label: val, color: '#e2445c', id: 'high' }; // Red
            else if (val.includes('Medium')) currentOption = { label: val, color: '#fdab3d', id: 'medium' }; // Orange
            else if (val.includes('Low')) currentOption = { label: val, color: '#00c875', id: 'low' }; // Green
            else if (val.includes('Normal')) currentOption = { label: val, color: '#579bfc', id: 'normal' }; // Blue

            // Standard Statuses (Visuals only)
            else if (val.includes('Unassigned')) currentOption = { label: val, color: '#595959', id: 'unassigned' };
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
            else if (val) {
                // Generate a consistent pastel color for Clients or arbitrary labels
                let hash = 0;
                for (let i = 0; i < val.length; i++) {
                    hash = val.charCodeAt(i) + ((hash << 5) - hash);
                }
                const h = Math.abs(hash) % 360;
                const color = `hsl(${h}, 70%, 40%)`;
                currentOption = { label: val, color: color, id: 'default_hash' };
            }
        }

        // PRIORITY 1: Explicit Dropdown Options (Fetched from Source Board for Mirrors)
        if (dropdownOptions && dropdownOptions.length > 0) {
            options = dropdownOptions;
        }
        // PRIORITY 2: DATA DRIVEN POPULATION (from uniqueValues prop)
        // If we don't have settings options (Mirror columns) and no explicit options passed, use the unique values collected from the board items
        else if (options.length === 0 && uniqueValues && uniqueValues.length > 0) {
            options = uniqueValues.map(val => {
                let color = '#579bfc'; // Default Blue

                // Apply Visual Colors
                if (val.includes('Critical')) color = '#333333';
                else if (val.includes('High')) color = '#e2445c';
                else if (val.includes('Medium')) color = '#fdab3d';
                else if (val.includes('Low')) color = '#00c875';
                else if (val.includes('Normal')) color = '#579bfc';
                else if (val.includes('Urgent')) color = '#333333';
                else if (val.includes('Unassigned')) color = '#595959';
                else if (val.includes('Assigned (CV)')) color = '#fec12d';
                else if (val.includes('Working on it (CV)')) color = '#fdab3d';
                else if (val.includes('Exporting')) color = '#ffadad';
                else if (val.includes('Taking a break (CV)')) color = '#ff158a';
                else if (val.includes('Client Info')) color = '#e2445c';
                else if (val.includes('For Approval (CV)')) color = '#5D24AA';
                else if (val.includes('1st Approval')) color = '#9cd326';
                else if (val.includes('Waiting for Client')) color = '#579bfc';
                else if (val.includes('Downloading')) color = '#505f79';
                else if (val.includes('Approved')) color = '#00c875';
                else if (val.includes('Error')) color = '#e2445c';
                else {
                    // Generate hash color for others
                    let hash = 0;
                    for (let i = 0; i < val.length; i++) {
                        hash = val.charCodeAt(i) + ((hash << 5) - hash);
                    }
                    const h = Math.abs(hash) % 360;
                    color = `hsl(${h}, 70%, 40%)`;
                }

                return { label: val, color, id: val };
            });
        }

        // REMOVED READ-ONLY RESTRICTION FOR MIRROR STATUS:
        // We now allow editing mirror columns by capturing the source IDs in `handleSave`
        // and routing the update to the source board.
        /*
        if (isMirrorStatus) {
            return (
                <span
                    className={`px-4 py-1.5 rounded-full text-white text-[11px] font-bold text-center min-w-[90px] inline-block shadow-lg shadow-black/20`}
                    style={currentOption && currentOption.label ? { backgroundColor: currentOption.color || '#7c3aed' } : { backgroundColor: '#2d2d3d', color: '#9ca3af' }}
                    title="Mirror column — edit on source board"
                >
                    {currentOption ? currentOption.label : (displayValue || 'Empty')}
                </span>
            );
        }
        */

        if (isEditing) {
            return (
                <div className="relative z-50">
                    <div className="fixed inset-0" onClick={() => setIsEditing(false)} />
                    <div className="absolute top-0 left-0 min-w-[140px] bg-[#1a1a2e] border border-white/20 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 z-50 py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
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
                        {options.length === 0 && (
                            <div className="px-4 py-2 text-gray-500 text-xs italic">No options available</div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <button
                onClick={() => setIsEditing(true)}
                className={`px-4 py-1.5 rounded-full text-white text-[11px] font-bold text-center min-w-[90px] transition-all shadow-lg shadow-black/20
                    hover:brightness-110 active:scale-95 cursor-pointer`}
                style={currentOption && currentOption.label ? { backgroundColor: currentOption.color || '#7c3aed' } : { backgroundColor: '#2d2d3d', color: '#9ca3af' }}
            >
                {currentOption ? currentOption.label : (displayValue || 'Empty')}
            </button>
        );
    }

    // --- ENHANCED FILE RENDERING ---
    const isVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(displayValue) || (linkUrl && /\.(mp4|mov|webm|ogg)(\?|$)/i.test(linkUrl || ''));
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(displayValue) || (linkUrl && /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(linkUrl || ''));
    const isPdf = /\.pdf(\?|$)/i.test(displayValue) || (linkUrl && /\.pdf(\?|$)/i.test(linkUrl || ''));

    const shouldRenderAsFile = (column.type === 'file' && linkUrl) || (linkUrl && (isVideo || isImage || isPdf));

    const fileColumnAccept = 'video/*,image/*,.pdf,.mp4,.mov,.webm';
    const uploadTarget = getMondayFileUploadTarget(item, column);
    const isSubmissionTitle = column.title.toLowerCase().includes('submission');

    if (shouldRenderAsFile) {
        const replaceControl = uploadTarget ? (
            <>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={fileColumnAccept}
                    onChange={(e) => handleMondayFileUpload(e.target.files)}
                />
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1 mt-1.5 px-2 py-1 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] font-bold uppercase tracking-wide text-gray-200"
                >
                    <Upload className="w-3 h-3" />
                    Replace file
                </button>
            </>
        ) : null;

        if (isVideo) {
            const thumbUrl = thumbnailUrl;
            const isRawVideo = /\.(mp4|mov|webm|ogg)$/i.test(linkUrl || '');
            const showVideoTag = isRawVideo && !thumbUrl;

            return (
                <div className="flex flex-col items-start gap-0">
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
                    {replaceControl}
                </div>
            );
        }

        return (
            <div className="flex flex-col items-start gap-1 max-w-full">
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
                {replaceControl}
            </div>
        );
    }

    if (uploadTarget && !linkUrl) {
        return (
            <div
                className={`w-full max-w-md rounded-xl border-2 border-dashed transition-colors px-4 py-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer select-none ${
                    fileDropActive
                        ? 'border-violet-400 bg-violet-500/15'
                        : 'border-white/20 bg-white/[0.03] hover:border-violet-500/50 hover:bg-violet-500/5'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                    }
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                }}
                onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFileDropActive(true);
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    setFileDropActive(false);
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFileDropActive(false);
                    handleMondayFileUpload(e.dataTransfer.files);
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={fileColumnAccept}
                    onChange={(e) => handleMondayFileUpload(e.target.files)}
                    onClick={(e) => e.stopPropagation()}
                />
                <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-violet-300" />
                </div>
                <div>
                    <p className="text-sm font-bold text-white">
                        {isSubmissionTitle ? 'Upload submission preview' : 'Upload file'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                        Drag and drop a video, image, or PDF here — or click to choose. Sends directly to Monday&apos;s file column.
                    </p>
                </div>
                <span className="text-[10px] text-gray-500">MP4, MOV, WebM, images, PDF · up to Monday&apos;s size limits</span>
            </div>
        );
    }

    if (isSubmissionTitle && !linkUrl && !uploadTarget) {
        return (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-200/90 max-w-md">
                Submission upload needs a Monday <strong className="text-amber-100">File</strong> column, or a{' '}
                <strong className="text-amber-100">mirror</strong> of one, with this row linked in the connect column.
            </div>
        );
    }

    // Generic Link (Example: Raw Video Link)
    // If we identify it as a link (either from column type or regex detection), render a clickable anchor
    const isLink = linkUrl || (displayValue && (displayValue.startsWith('http://') || displayValue.startsWith('https://')));

    if (!isEditing && isLink) {
        // If it's a "Link" column, the display value might be "This is a video", while the URL is hidden.
        // We want to make the text clickable.
        const urlToUse = linkUrl || displayValue;

        return (
            <a
                href={urlToUse}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="select-text text-[#0073ea] hover:text-white hover:underline truncate text-sm flex items-center gap-1 group"
                title={urlToUse}
            >
                <span className="truncate">{displayValue || urlToUse}</span>
                <span className="text-[10px] opacity-50 group-hover:opacity-100 transition-opacity">↗</span>
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
            className={`select-text cursor-text hover:bg-white/5 px-2 py-1 rounded-md transition-colors text-gray-200 text-sm min-h-[28px] w-full border border-transparent hover:border-white/5 flex ${
                column.type === 'long_text' ? 'items-start whitespace-pre-wrap break-words' : 'items-center'
            }`}
        >
            {displayValue || <span className="text-gray-600 text-xs italic">Empty</span>}
        </div>
    );
};
