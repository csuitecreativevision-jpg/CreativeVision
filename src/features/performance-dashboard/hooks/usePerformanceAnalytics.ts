/**
 * Performance Analytics Hook
 * 
 * Responsibilities:
 * 1. Fetch raw data from mondayService
 * 2. Map raw Monday.com data to clean VideoTask domain objects (ADAPTER LAYER)
 * 3. Filter by selected cycle
 * 4. Calculate the 4 required metrics
 */

import { useState, useEffect } from 'react';
import { getAllBoards, getBoardItems, getBoardItemsByView, mondayRequest } from '../../../services/mondayService';
import type { VideoTask, CycleInfo, DashboardMetrics } from '../types';
import { isDateInCycle } from '../utils/dateUtils';

// Configuration: Board and View names
const BOARD_NAME = 'Management Dashboard';
const VIEW_NAME = 'Main Table'; // The view that contains Performance Board groups

/**
 * Adapter: Map raw Monday.com item to clean VideoTask domain object
 * This is the ONLY place where raw Monday.com data structures are handled
 */
function mapRawItemToVideoTask(rawItem: any, boardColumns: any[] = []): VideoTask {
    const columnValues = rawItem.column_values || [];

    // Create a map of column ID to column title from board columns
    const columnIdToTitle = new Map<string, string>();
    boardColumns.forEach((col: any) => {
        if (col.id && col.title) {
            columnIdToTitle.set(col.id, col.title);
        }
    });

    // Debug: Log available columns for first item
    const loggedKey = '__adapter_logged__';
    if (!(globalThis as any)[loggedKey]) {
        console.log('=== ADAPTER DEBUG ===');
        console.log('Item name:', rawItem.name);
        console.log('Total columns:', columnValues.length);
        columnValues.forEach((c: any, idx: number) => {
            const title = columnIdToTitle.get(c.id) || c.title || 'undefined';
            console.log(`  Column ${idx + 1}: "${title}" (type: ${c.type}, id: ${c.id})`);
            console.log(`    text: "${c.text || 'EMPTY'}"`);
            console.log(`    display_value: "${c.display_value || 'EMPTY'}"`);
            if (c.value) {
                try {
                    const parsed = JSON.parse(c.value);
                    console.log(`    value (parsed):`, parsed);
                } catch {
                    console.log(`    value (raw): "${c.value}"`);
                }
            }
        });
        (globalThis as any)[loggedKey] = true;
    }

    // Helper to get text value from column (handles both regular and mirror columns)
    const getColumnText = (col: any): string | null => {
        if (!col) return null;

        // For mirror columns, use display_value
        if (col.type === 'mirror' && col.display_value) {
            return col.display_value;
        }

        // For regular columns, use text
        return col.text || null;
    };

    // Helper to find column value by title (case-insensitive)
    // Now uses the ID-to-title mapping for subitems
    const findColumn = (titleMatch: string) => {
        return columnValues.find((col: any) => {
            const colTitle = columnIdToTitle.get(col.id) || col.title || '';
            return colTitle.toLowerCase().includes(titleMatch.toLowerCase());
        });
    };

    // Extract columns by title (subitems should have proper column titles via ID mapping)
    // Performance Board columns: Client, Deadline, Project Status, Raw Video Link, Revision,
    // Submission Preview, Submission Link, Amount of Revision, Quality, Time Audit, Strike,
    // Badge, Follow Up, Instructions, Type, Priority, Payroll, Loom Instructions, Observations, Attendance

    const clientCol = findColumn('client');
    const deadlineCol = findColumn('deadline');
    const editorCol = findColumn('editor'); // This might be the parent item name instead
    const revisionsCol = findColumn('amount of revision');
    const qualityCol = findColumn('quality'); // This is the rating
    const projectStatusCol = findColumn('project status');

    // Extract Deadline
    let deadline: Date | null = null;
    if (deadlineCol) {
        const deadlineText = getColumnText(deadlineCol);
        if (deadlineText) {
            // Parse date string (format: "YYYY-MM-DD" or similar)
            deadline = new Date(deadlineText);
            if (isNaN(deadline.getTime())) {
                console.warn(`Invalid deadline date: "${deadlineText}" for item "${rawItem.name}"`);
                deadline = null;
            }
        }
    }

    // Extract Editor (might be from parent item name or editor column)
    const editor = getColumnText(editorCol) || 'Unknown';

    // Extract Client
    const client = getColumnText(clientCol) || 'Unknown';

    // Extract Revisions (Amount of Revision column)
    let revisions = 0;
    if (revisionsCol) {
        const revText = getColumnText(revisionsCol);
        if (revText) {
            const parsed = parseInt(revText, 10);
            if (!isNaN(parsed)) {
                revisions = parsed;
            }
        }
    }

    // Extract Rating (Quality column)
    let rating: number | null = null;
    if (qualityCol) {
        const ratingText = getColumnText(qualityCol);
        if (ratingText) {
            const parsed = parseFloat(ratingText);
            if (!isNaN(parsed)) {
                rating = parsed;
            }
        }
    }

    // Extract Project Status (optional, for debugging)
    const projectStatus = getColumnText(projectStatusCol);

    return {
        id: rawItem.id,
        name: rawItem.name || 'Untitled',
        deadline,
        editor,
        client,
        amountOfRevisions: revisions, // Use the 'revisions' variable
        rating
    };
}

/**
 * Calculate dashboard metrics from filtered video tasks
 */
function calculateMetrics(tasks: VideoTask[], cycleInfo: CycleInfo): DashboardMetrics {
    console.log('=== CALCULATE METRICS DEBUG ===');
    console.log('Total tasks received:', tasks.length);
    console.log('Cycle info:', {
        cycle: cycleInfo.cycle,
        month: cycleInfo.month,
        year: cycleInfo.year,
        startDate: cycleInfo.startDate.toISOString(),
        endDate: cycleInfo.endDate.toISOString()
    });

    // Log first few tasks to see what data we have - with detailed output
    console.log('Sample tasks (first 3):');
    tasks.slice(0, 3).forEach((t, idx) => {
        console.log(`  Task ${idx + 1}:`, {
            name: t.name,
            deadline: t.deadline ? t.deadline.toISOString() : 'NULL',
            deadlineRaw: t.deadline,
            editor: t.editor || 'NULL',
            client: t.client || 'NULL',
            revisions: t.amountOfRevisions !== null ? t.amountOfRevisions : 'NULL',
            rating: t.rating !== null ? t.rating : 'NULL'
        });
    });

    // Filter tasks within the cycle
    const tasksInCycle = tasks.filter(task => {
        const isInCycle = task.deadline && isDateInCycle(task.deadline, cycleInfo);
        if (task.deadline) {
            console.log(`Task "${task.name}" deadline: ${task.deadline.toISOString()}, in cycle: ${isInCycle}`);
        }
        return isInCycle;
    });

    console.log('Tasks in cycle:', tasksInCycle.length);

    // 1. Total Videos Produced
    const totalVideosProduced = tasksInCycle.length;

    // 2. Total Revisions (where amountOfRevisions is NOT null)
    const totalRevisions = tasksInCycle
        .filter(task => task.amountOfRevisions !== null)
        .reduce((sum, task) => sum + (task.amountOfRevisions || 0), 0);

    // 3. Average Rating (where client is NOT empty AND rating exists)
    const tasksWithRatings = tasksInCycle.filter(task =>
        task.client !== null &&
        task.client.trim() !== '' &&
        task.rating !== null
    );

    const averageRating = tasksWithRatings.length > 0
        ? tasksWithRatings.reduce((sum, task) => sum + (task.rating || 0), 0) / tasksWithRatings.length
        : null;

    // 4. Revisions Per Editor (grouped by editor)
    const revisionsByEditor: Record<string, number> = {};

    tasksInCycle
        .filter(task => task.editor !== null && task.editor.trim() !== '')
        .forEach(task => {
            const editor = task.editor!;
            if (!revisionsByEditor[editor]) {
                revisionsByEditor[editor] = 0;
            }
            revisionsByEditor[editor] += task.amountOfRevisions || 0;
        });

    const revisionsPerEditor = Object.entries(revisionsByEditor)
        .map(([editorName, revisions]) => ({ editorName, revisions }))
        .sort((a, b) => b.revisions - a.revisions); // Sort by revisions descending

    console.log('Final metrics:', {
        totalVideosProduced,
        totalRevisions,
        averageRating,
        revisionsPerEditor
    });
    console.log('=== END CALCULATE METRICS DEBUG ===');

    return {
        totalVideosProduced,
        totalRevisions,
        averageRating,
        revisionsPerEditor
    };
}

/**
 * Hook to fetch and calculate performance analytics for a given cycle
 */
export function usePerformanceAnalytics(cycleInfo: CycleInfo) {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Step 1: Use the correct Management Dashboard board ID
            const MANAGEMENT_BOARD_ID = '7146476541';
            console.log(`Using Management Dashboard board ID: ${MANAGEMENT_BOARD_ID}`);

            // Clear cache to ensure we get fresh data
            console.log('Clearing cache for fresh data...');
            localStorage.removeItem(`cache_monday_board_items_${MANAGEMENT_BOARD_ID}`);

            // Step 2: Fetch all items from the board
            console.log('Fetching all board data...');

            // Direct API call to bypass caching issues
            const query = `query {
                boards (ids: [${MANAGEMENT_BOARD_ID}]) {
                    name
                    columns {
                        id
                        title
                        type
                        settings_str
                    }
                    groups {
                        id
                        title
                        color
                    }
                    items_page (limit: 500) {
                        cursor
                        items {
                            id
                            name
                            created_at
                            group {
                                id
                            }
                            column_values {
                                id
                                text
                                value
                                type
                                ... on MirrorValue {
                                    display_value
                                }
                            }
                            subitems {
                                id
                                name
                                column_values {
                                    id
                                    text
                                    value
                                    type
                                }
                            }
                        }
                    }
                }
            }`;

            const data = await mondayRequest(query);
            console.log('=== RAW API RESPONSE ===');
            console.log('Response structure:', {
                hasBoards: !!data.boards,
                boardsLength: data.boards?.length,
                firstBoard: data.boards?.[0] ? {
                    name: data.boards[0].name,
                    hasItemsPage: !!data.boards[0].items_page,
                    itemsPageStructure: data.boards[0].items_page ? {
                        hasCursor: !!data.boards[0].items_page.cursor,
                        hasItems: !!data.boards[0].items_page.items,
                        itemsLength: data.boards[0].items_page.items?.length || 0
                    } : null
                } : null
            });
            console.log('=== END RAW RESPONSE ===');

            const rawData = data.boards[0];

            // Extract items from items_page
            if (rawData.items_page) {
                rawData.items = rawData.items_page.items || [];
                console.log(`Extracted ${rawData.items.length} items from items_page`);
            }

            // Check if board data was returned
            if (!rawData) {
                throw new Error(`Board ID ${MANAGEMENT_BOARD_ID} returned no data`);
            }

            // Step 3: Debug - Show ALL groups with full details
            console.log('=== ALL GROUPS IN BOARD ===');
            console.log('Total groups:', rawData.groups?.length || 0);
            (rawData.groups || []).forEach((g: any, idx: number) => {
                console.log(`Group ${idx + 1}:`, {
                    id: g.id,
                    title: g.title,
                    color: g.color,
                    // Check if title contains any variation of "performance"
                    hasPerformance: g.title?.toLowerCase().includes('performance'),
                    hasBoard: g.title?.toLowerCase().includes('board')
                });
            });
            console.log('=== END GROUPS ===');

            // Filter groups that have "Performance Board" in the title
            const performanceBoardGroups = (rawData.groups || []).filter((g: any) =>
                g.title?.toLowerCase().includes('performance board')
            );

            if (performanceBoardGroups.length === 0) {
                console.error('No groups with "Performance Board" in name found. Available groups:',
                    rawData.groups?.map((g: any) => g.title)
                );
                throw new Error('No Performance Board groups found in Management Dashboard. Please check the group names.');
            }

            console.log(`Found ${performanceBoardGroups.length} Performance Board group(s):`,
                performanceBoardGroups.map((g: any) => g.title)
            );

            // Debug: Show ALL items in the board
            console.log('=== ALL ITEMS IN BOARD ===');
            console.log('Total items:', rawData.items?.length || 0);
            if (rawData.items && rawData.items.length > 0) {
                console.log('Sample items (first 5):');
                rawData.items.slice(0, 5).forEach((item: any) => {
                    console.log(`  - "${item.name}" (group: ${item.group?.id || 'none'})`);
                });
            }
            console.log('=== END ITEMS ===');

            // Collect items from all Performance Board groups
            const allEditorItems: any[] = [];

            for (const group of performanceBoardGroups) {
                const groupItems = (rawData.items || []).filter((item: any) =>
                    item.group?.id === group.id
                );

                console.log(`Group "${group.title}" has ${groupItems.length} items:`,
                    groupItems.map((i: any) => i.name)
                );

                allEditorItems.push(...groupItems);
            }

            console.log(`Total items across all Performance Board groups: ${allEditorItems.length}`);

            // Step 4: Collect all subitems (projects) from all editors
            const allProjects: any[] = [];

            for (const editorItem of allEditorItems) {
                const editorName = editorItem.name;

                console.log(`Checking item "${editorName}":`, {
                    hasSubitems: !!editorItem.subitems,
                    subitemsLength: editorItem.subitems?.length || 0,
                    subitemsData: editorItem.subitems
                });

                // Fetch subitems for this editor
                if (editorItem.subitems && editorItem.subitems.length > 0) {
                    console.log(`Editor "${editorName}" has ${editorItem.subitems.length} projects`);
                    allProjects.push(...editorItem.subitems);
                }
            }

            console.log(`Total projects across all editors: ${allProjects.length}`);

            // Check if items exist
            if (allProjects.length === 0) {
                console.warn(`No projects found in Performance Board group`);
            }

            // Get column definitions from the board to map IDs to titles
            const boardColumns = rawData.columns || [];
            console.log('Board columns:', boardColumns.map((c: any) => ({ id: c.id, title: c.title, type: c.type })));

            // Adapter: Map subitems to clean domain objects
            const videoTasks: VideoTask[] = allProjects.map(subitem =>
                mapRawItemToVideoTask(subitem, boardColumns)
            );

            console.log(`Mapped ${videoTasks.length} video tasks from subitems`);

            // Calculate metrics for the selected cycle
            const calculatedMetrics = calculateMetrics(videoTasks, cycleInfo);

            setMetrics(calculatedMetrics);
        } catch (err) {
            console.error('Failed to fetch performance analytics:', err);
            setError(err instanceof Error ? err.message : 'Failed to load performance data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [cycleInfo.cycle, cycleInfo.month, cycleInfo.year]);

    return {
        metrics,
        loading,
        error,
        refetch: fetchData
    };
}
