import { supabase } from '../lib/supabaseClient';
import { getCache, setCache } from './cacheService';

export const MONDAY_SYNC_TABLES = {
    BOARDS: 'monday_boards',
    ITEMS: 'monday_items',
    VALUES: 'monday_column_values',
    COLUMNS: 'monday_columns'
};

/**
 * Sync Service - Reads from Supabase (Source of Truth)
 * 
 * Flow: 
 * 1. Check IndexedDB
 * 2. If missing, fetch from Supabase
 * 3. Store in IndexedDB
 */

export async function getSyncedBoardColumns(boardId: string) {
    const cacheKey = `synced_columns_${boardId}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached && !cached.isStale) return cached.data;

    const { data, error } = await supabase
        .from(MONDAY_SYNC_TABLES.COLUMNS)
        .select('*')
        .eq('board_id', boardId);

    if (error) {
        console.error('Failed to fetch columns:', error);
        return [];
    }

    await setCache(cacheKey, data);
    return data;
}

export async function getSyncedBoardItems(boardId: string) {
    const cacheKey = `synced_board_${boardId}`;

    // 1. Try Cache
    const cached = await getCache<any[]>(cacheKey);
    if (cached && !cached.isStale) return cached.data;

    // 2. Fetch from Supabase (Relational Query)
    // We join items with column_values
    const { data, error } = await supabase
        .from(MONDAY_SYNC_TABLES.ITEMS)
        .select(`
            *,
            monday_column_values (
                column_id,
                text,
                value,
                type
            )
        `)
        .eq('board_id', boardId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[SyncService] Failed to fetch board items:', error);
        // Fallback: Return empty array or throw?
        // Let's check if we have STALE cache?
        return cached?.data || [];
    }

    // 3. Transform to match the shape expected by UI (if needed)
    // The UI expects item.column_values array. Supabase returns it as monday_column_values.
    const transformed = data.map(item => ({
        ...item,
        column_values: item.monday_column_values.map((cv: any) => ({
            id: cv.column_id, // Map column_id -> id for compatibility
            text: cv.text,
            value: cv.value,
            type: cv.type,
            // Mock display_value for MirrorValue compatibility
            display_value: cv.text
        }))
    }));

    // 4. Update Cache
    await setCache(cacheKey, transformed);

    return transformed;
}

export async function getSyncedWorkspaceAnalytics() {
    // 1. Fetch relevant boards (Cache-First)
    // In a real app we might query 'monday_boards' table.
    // For now, let's assume we know the IDs or fetch all workspace boards.

    const { data: boards } = await supabase
        .from(MONDAY_SYNC_TABLES.BOARDS)
        .select('id, name')
        .ilike('name', '%- Workspace%'); // Filter by naming convention

    if (!boards || boards.length === 0) return { cycles: [], data: {}, payments: {}, types: {}, statuses: {}, revisions: {} };

    // 2. Data Structures
    const analyticsData: any = {};
    const paymentData: any = {};
    const typeData: any = {};
    const statusData: any = {};
    const revisionsData: any = {};
    const cyclesSet = new Set<string>();

    const getCycleDates = (cycleNum: number, month: number, year: number) => {
        // Logic copied from dateUtils/mondayService
        if (cycleNum === 1) return { start: new Date(year, month - 1, 1), end: new Date(year, month - 1, 15) };
        return { start: new Date(year, month - 1, 16), end: new Date(year, month, 0) };
    };

    const isDateInCycle = (date: Date, cycle: { start: Date, end: Date }) => {
        return date >= cycle.start && date <= cycle.end;
    };

    // 3. Process each board
    for (const board of boards) {
        const [items, columns] = await Promise.all([
            getSyncedBoardItems(board.id),
            getSyncedBoardColumns(board.id)
        ]);

        // Find Column IDs
        // helper
        const findColId = (titles: string[]) => {
            const col = columns?.find((c: any) => titles.some(t => c.title.toLowerCase().includes(t.toLowerCase())));
            return col?.id;
        };

        const priceColId = findColId(['price', 'rate', 'amount', 'cost']);
        const typeColId = findColId(['type', 'category']);
        const statusColId = findColId(['status']);
        const revisionsColId = findColId(['revisions', 'revision']);
        const editorColId = findColId(['editor', 'people', 'owner']);

        // Determine Editor Name from Board Name (Fallback)
        let boardEditorName = board.name.replace(/- Workspace/gi, '').trim();
        // Clean up common suffixes
        boardEditorName = boardEditorName.replace(/\(.*\)/g, '').trim();

        // Process Items
        items.forEach((item: any) => {
            if (!item.created_at) return;
            const date = new Date(item.created_at);
            if (isNaN(date.getTime())) return;

            // Strict Cycle Check
            const monthNum = date.getMonth() + 1;
            const year = date.getFullYear();
            let cycleKey = '';

            const cycle1 = getCycleDates(1, monthNum, year);
            const cycle2 = getCycleDates(2, monthNum, year);

            if (isDateInCycle(date, cycle1)) {
                cycleKey = `${date.toLocaleString('default', { month: 'long' })} ${year} - Cycle 1`;
            } else if (isDateInCycle(date, cycle2)) {
                cycleKey = `${date.toLocaleString('default', { month: 'long' })} ${year} - Cycle 2`;
            }

            if (cycleKey) {
                cyclesSet.add(cycleKey);

                // Editor Name Resolution
                // Priority: Column > Board Name
                let editorName = boardEditorName;
                if (editorColId) {
                    const cv = item.column_values.find((c: any) => c.id === editorColId);
                    if (cv && cv.text) {
                        editorName = cv.text.split(',')[0].trim();
                    }
                }

                // Initialize
                if (!analyticsData[cycleKey]) analyticsData[cycleKey] = {};
                if (!analyticsData[cycleKey][editorName]) analyticsData[cycleKey][editorName] = 0;
                if (!paymentData[cycleKey]) paymentData[cycleKey] = {};
                if (!paymentData[cycleKey][editorName]) paymentData[cycleKey][editorName] = 0;
                if (!typeData[cycleKey]) typeData[cycleKey] = {};
                if (!statusData[cycleKey]) statusData[cycleKey] = {};

                // Count Video
                analyticsData[cycleKey][editorName]++;

                // Price
                if (priceColId) {
                    const cv = item.column_values.find((c: any) => c.id === priceColId);
                    if (cv && cv.text) {
                        const cleanVal = cv.text.replace(/[^0-9.-]+/g, '');
                        const amount = parseFloat(cleanVal);
                        if (!isNaN(amount)) paymentData[cycleKey][editorName] += amount;
                    }
                }

                // Type
                if (typeColId) {
                    const cv = item.column_values.find((c: any) => c.id === typeColId);
                    if (cv && cv.text) {
                        const t = cv.text.split(',')[0].trim();
                        if (t !== '(Unassigned) VE') {
                            if (!typeData[cycleKey][t]) typeData[cycleKey][t] = 0;
                            typeData[cycleKey][t]++;
                        }
                    }
                }

                // Status
                if (statusColId) {
                    const cv = item.column_values.find((c: any) => c.id === statusColId);
                    if (cv && cv.text) {
                        if (!statusData[cycleKey][cv.text]) statusData[cycleKey][cv.text] = 0;
                        statusData[cycleKey][cv.text]++;
                    }
                }

                // Revisions
                if (revisionsColId) {
                    const cv = item.column_values.find((c: any) => c.id === revisionsColId);
                    if (cv && cv.text) {
                        const count = parseFloat(cv.text);
                        if (!isNaN(count) && count > 0) {
                            if (!revisionsData[cycleKey]) revisionsData[cycleKey] = {};
                            if (!revisionsData[cycleKey][editorName]) revisionsData[cycleKey][editorName] = 0;
                            revisionsData[cycleKey][editorName] += count;
                        }
                    }
                }
            }
        });
    }

    // Sort Cycles
    const sortedCycles = Array.from(cyclesSet).sort((a, b) => {
        const parseCycle = (key: string) => {
            const match = key.match(/(\w+) (\d+) - Cycle (\d)/);
            if (!match) return 0;
            const [, m, y, c] = match;
            const monthNum = new Date(`${m} 1, ${y}`).getMonth();
            return parseInt(y) * 10000 + monthNum * 100 + parseInt(c);
        };
        return parseCycle(b) - parseCycle(a);
    });

    return {
        cycles: sortedCycles,
        data: analyticsData,
        payments: paymentData,
        types: typeData,
        statuses: statusData,
        revisions: revisionsData
    };
}

export async function triggerBoardSync(boardId: string) {
    // Call Edge Function to force a sync
    const { data, error } = await supabase.functions.invoke('monday-sync', {
        body: { boardId }
    });

    if (error) console.error('Sync Trigger Failed:', error);
    return data;
}
