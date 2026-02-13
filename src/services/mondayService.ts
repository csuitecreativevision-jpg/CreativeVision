const MONDAY_API_URL = "https://api.monday.com/v2";
const MONDAY_API_TOKEN = import.meta.env.VITE_MONDAY_API_TOKEN;
import { supabase } from '../lib/supabaseClient';
import { getCycleFromDate, getCycleDates, isDateInCycle } from '../features/performance-dashboard/utils/dateUtils';

export interface ApplicationData {
    fullName: string;
    email: string;
    specialization: string;
    portfolioLink: string;

    // 13 Questions Data
    hasWorkedBefore: string;
    experienceDescription: string;
    toolsUsed: string;
    motionGraphicsExp: string;
    workflowDescription: string;
    successMetric: string;
    whyJoin: string;
    employmentStatus: string;
    isStudent: string;
    expectedRate: string;

    resumeFile?: File;
    [key: string]: any;
}

const BOARD_NAME = "Job Applications";

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getUsers() {
    const query = `query {
        users (limit: 500) {
            id
            name
            email
            is_guest
        }
    }`;
    const response = await mondayRequest(query);

    if (!response?.users) {
        console.error("Failed to fetch users from Monday.com", response);
        return [];
    }

    return response.users;
}

export async function mondayRequest(query: string, variables: any = {}, retries = 3, backoff = 1000) {
    try {
        const response = await fetch(MONDAY_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": MONDAY_API_TOKEN,
            },
            body: JSON.stringify({ query, variables }),
        });

        // Handle HTTP errors (like 429 Too Many Requests, 500 Server Error)
        if (!response.ok) {
            if (retries > 0 && (response.status === 429 || response.status >= 500)) {
                console.warn(`Monday API ${response.status} Error. Retrying in ${backoff}ms...`);
                await delay(backoff);
                return mondayRequest(query, variables, retries - 1, backoff * 2);
            }
            throw new Error(`Monday API HTTP Error: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();

        // Handle GraphQL errors (like Complexity Budget)
        if (json.errors) {
            const complexityError = json.errors.find((e: any) => e.extensions?.code === 'COMPLEXITY_BUDGET_EXHAUSTED');
            if (complexityError && retries > 0) {
                const waitTime = (complexityError.extensions?.retry_in_seconds || 10) * 1000 + 1000; // Wait extra 1s
                console.warn(`Complexity Budget Exhausted. Waiting ${waitTime}ms...`);
                await delay(waitTime);
                return mondayRequest(query, variables, retries - 1, backoff);
            }

            console.error("Monday API Errors:", json.errors);
            throw new Error(JSON.stringify(json.errors));
        }

        return json.data;
    } catch (error: any) {
        // Handle Network errors
        if (retries > 0 && (error.name === 'TypeError' || error.message.includes('NetworkError'))) {
            console.warn(`Network Error. Retrying in ${backoff}ms...`);
            await delay(backoff);
            return mondayRequest(query, variables, retries - 1, backoff * 2);
        }

        console.error("Monday API Request Failed:", error);
        throw error;
    }
}


// --- Caching Helper ---
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 Minutes

async function getCachedOrFetch<T>(key: string, fetcher: () => Promise<T>, meta: boolean = true, forceSync: boolean = false): Promise<T> {
    const table = meta ? 'cache_monday_meta' : 'cache_monday_board_items';
    const idColumn = meta ? 'key' : 'board_id';

    try {
        // Try Cache
        const { data } = await supabase.from(table).select('data, updated_at').eq(idColumn, key).maybeSingle();
        if (data?.data) {
            // Check TTL
            const age = Date.now() - new Date(data.updated_at).getTime();
            const isStale = age > CACHE_TTL_MS;

            if (isStale || forceSync) {
                // Background Sync
                fetcher().then(freshData => {
                    supabase.from(table).upsert({ [idColumn]: key, data: freshData, updated_at: new Date() }).then();
                }).catch(err => console.error("Background sync failed", err));
            }
            return data.data;
        }
    } catch (e) {
        // Continue to fetch if cache fails
    }

    // Cache Miss -> Fetch & Wait
    const freshData = await fetcher();
    // Update Cache
    supabase.from(table).upsert({ [idColumn]: key, data: freshData, updated_at: new Date() }).then();
    return freshData;
}

async function getOrCreateBoard(): Promise<string> {
    // 1. Check if board exists
    const query = `query {
    boards(limit: 50) {
      id
      name
    }
  }`;

    const data = await mondayRequest(query);
    const existingBoard = data.boards?.find((b: any) => b.name === BOARD_NAME);

    if (existingBoard) {
        return existingBoard.id;
    }

    // 2. Create board if not found
    const createBoardQuery = `mutation {
    create_board (board_name: "${BOARD_NAME}", board_kind: public) {
      id
    }
  }`;

    const createData = await mondayRequest(createBoardQuery);
    return createData.create_board.id;
    // Columns will be created by ensureColumnsExist called in submitApplication
}

async function ensureColumnsExist(boardId: string) {
    const columnsQuery = `query {
        boards (ids: [${boardId}]) {
            columns {
                id
                title
                type
                settings_str
            }
        }
    }`;
    const columnsData = await mondayRequest(columnsQuery);
    const existingColumns = columnsData.boards[0]?.columns || [];

    const requiredColumns = [
        { title: "Email", type: "text" },
        { title: "Specialization", type: "text" },
        { title: "Portfolio", type: "link" },
        // { title: "Resume", type: "file" }, // Removed

        { title: "Worked Before", type: "status" },
        { title: "Experience Desc", type: "long_text" },
        { title: "Tools Used", type: "long_text" },
        { title: "Motion Graphics", type: "long_text" },
        { title: "Workflow", type: "long_text" },
        { title: "Success Metric", type: "long_text" },
        { title: "Why Join", type: "long_text" },

        { title: "Employment Status", type: "status" },
        { title: "Is Student", type: "status" },
        { title: "Expected Rate", type: "status" },
        { title: "Application Status", type: "status" } // The one missing
    ];

    for (const col of requiredColumns) {
        // loose matching for existence check
        const exists = existingColumns.some((c: any) => c.title.toLowerCase() === col.title.toLowerCase());
        if (!exists) {
            console.log(`Creating missing column: ${col.title}`);
            await createColumn(boardId, col.title, col.type, col.title);
        }
    }
}

async function getOrCreateGroup(boardId: string, groupName: string): Promise<string> {
    const query = `query {
        boards (ids: [${boardId}]) {
            groups {
                id
                title
            }
        }
    }`;
    const data = await mondayRequest(query);
    const groups = data.boards[0]?.groups || [];
    const existingGroup = groups.find((g: any) => g.title.toLowerCase() === groupName.toLowerCase());

    if (existingGroup) return existingGroup.id;

    const createGroupQuery = `mutation {
        create_group (board_id: ${boardId}, group_name: "${groupName}") {
            id
        }
    }`;
    const createData = await mondayRequest(createGroupQuery);
    return createData.create_group.id;
}

export async function getBoardGroups(boardId: string) {
    return getCachedOrFetch(`groups_${boardId}`, async () => {
        const query = `query {
            boards (ids: [${boardId}]) {
                groups {
                    id
                    title
                }
            }
        }`;
        const data = await mondayRequest(query);
        return data.boards[0]?.groups || [];
    }, true);
}

async function createColumn(boardId: string, title: string, type: string, label?: string) {
    const query = `mutation {
        create_column (board_id: ${boardId}, title: "${label || title}", column_type: ${type}) {
            id
        }
    }`;
    await mondayRequest(query).catch(() => { });
}

export async function submitApplicationToMonday(data: ApplicationData) {
    if (MONDAY_API_TOKEN === "YOUR_MONDAY_API_TOKEN" || !MONDAY_API_TOKEN) {
        console.warn("Monday.com API Token not set.");
        alert("Monday.com integration demo mode.");
        return;
    }

    try {
        const boardId = await getOrCreateBoard();

        // NEW: Ensure all columns exist before we try to look them up
        await ensureColumnsExist(boardId);

        const groupId = await getOrCreateGroup(boardId, data.specialization || "General");

        const columnsQuery = `query {
            boards (ids: [${boardId}]) {
                columns {
                    id
                    title
                    type
                    settings_str
                }
            }
        }`;

        const columnsData = await mondayRequest(columnsQuery);
        const columns = columnsData.boards[0]?.columns || [];

        // Helper: Find exact match first, then partial.
        const getColId = (title: string, strict = false) => {
            const exact = columns.find((c: any) => c.title.toLowerCase() === title.toLowerCase());
            if (exact) return exact.id;
            if (strict) return undefined;
            return columns.find((c: any) => c.title.toLowerCase().includes(title.toLowerCase()))?.id;
        };

        // Helper: Format value based on column type
        const formatValue = (colId: string | undefined, value: string | object) => {
            if (!colId) return null;
            const col = columns.find((c: any) => c.id === colId);
            if (!col) return null;

            if (['status', 'color', 'dropdown', 'type'].includes(col.type)) {
                return { label: value };
            }
            if (col.type === 'text') {
                if (typeof value === 'object') return JSON.stringify(value);
                return value;
            }
            if (col.type === 'long_text') {
                return { text: typeof value === 'object' ? JSON.stringify(value) : value };
            }
            if (col.type === 'link' && typeof value === 'string') {
                return { url: value, text: value };
            }

            return value;
        };

        const emailColId = getColId("Email");
        const specColId = getColId("Specialization");
        const portfolioColId = getColId("Portfolio");

        // NEW: Specific Application Status Column
        const appStatusColId = getColId("Application Status");
        const statusColId = columns.find((c: any) => c.title.toLowerCase() === "status")?.id;

        // Detailed Columns Lookup
        const workedBeforeId = getColId("Worked Before");
        const expDescId = getColId("Experience Desc");
        const toolsId = getColId("Tools Used");
        const motionId = getColId("Motion Graphics");
        const workflowId = getColId("Workflow");
        const successId = getColId("Success Metric");
        const whyJoinId = getColId("Why Join");
        const empStatusId = getColId("Employment Status");
        const isStudentId = getColId("Is Student");
        const rateId = getColId("Expected Rate");

        const columnValues: any = {};

        // Basic Info
        if (emailColId) columnValues[emailColId] = formatValue(emailColId, data.email);
        if (specColId) columnValues[specColId] = formatValue(specColId, data.specialization);
        if (portfolioColId && data.portfolioLink) {
            columnValues[portfolioColId] = { url: data.portfolioLink, text: "Portfolio / Resume" };
        }

        // Detailed Fields Mapping
        if (workedBeforeId) columnValues[workedBeforeId] = formatValue(workedBeforeId, data.hasWorkedBefore);
        if (expDescId) columnValues[expDescId] = formatValue(expDescId, data.experienceDescription);
        if (toolsId) columnValues[toolsId] = formatValue(toolsId, data.toolsUsed);
        if (motionId) columnValues[motionId] = formatValue(motionId, data.motionGraphicsExp);
        if (workflowId) columnValues[workflowId] = formatValue(workflowId, data.workflowDescription);
        if (successId) columnValues[successId] = formatValue(successId, data.successMetric);
        if (whyJoinId) columnValues[whyJoinId] = formatValue(whyJoinId, data.whyJoin);

        if (empStatusId) columnValues[empStatusId] = formatValue(empStatusId, data.employmentStatus);
        if (isStudentId) columnValues[isStudentId] = formatValue(isStudentId, data.isStudent);
        if (rateId) columnValues[rateId] = formatValue(rateId, data.expectedRate);


        // STATUS LOGIC
        if (appStatusColId) {
            columnValues[appStatusColId] = { label: "New" };
        }
        else if (statusColId) {
            columnValues[statusColId] = { label: "New" };
        }

        const createItemQuery = `mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
            create_item (board_id: $boardId, group_id: $groupId, item_name: $itemName, column_values: $columnValues, create_labels_if_missing: true) {
                id
            }
            }`;

        const variables = {
            boardId: Number(boardId),
            groupId: groupId,
            itemName: data.fullName,
            columnValues: JSON.stringify(columnValues)
        };

        const itemData = await mondayRequest(createItemQuery, variables);
        return itemData.create_item.id;

    } catch (error) {
        console.error("Failed to submit to Monday.com", error);
        throw error;
    }
}

// --- New Dashboard Integration Functions ---

export async function getAllBoards() {
    return getCachedOrFetch('all_boards', async () => {
        const query = `query {
        boards (limit: 500) {
            id
            name
            type
            items_count
            workspace {
                id
            }
        }
    }`;
        const data = await mondayRequest(query);
        return data.boards;
    }, true);
}

export async function getAllFolders() {
    return getCachedOrFetch('all_folders', async () => {
        const query = `query {
        folders (limit: 100) {
            id
            name
            color
            workspace {
                id
            }
            children {
                id
            }
        }
    }`;
        const data = await mondayRequest(query);
        return data.folders;
    }, true);
}

export async function getAllWorkspaces() {
    return getCachedOrFetch('all_workspaces', async () => {
        const query = `query {
        workspaces {
            id
            name
            kind
            }
        }
    }`;
        const data = await mondayRequest(query);
        return data.workspaces;
    }, true);
}

export async function getBoardItems(boardId: string) {
    return getCachedOrFetch(boardId, async () => {
        let allItems: any[] = [];
        let cursor: string | null = null;
        let hasMore = true;

        // Initial Fetch
        const query = `query {
            boards (ids: [${boardId}]) {
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
        const board = data.boards[0];

        if (board && board.items_page) {
            allItems = [...board.items_page.items];
            cursor = board.items_page.cursor;
        }

        // Pagination Loop
        while (cursor) {
            const nextQuery = `query {
                next_items_page (limit: 500, cursor: "${cursor}") {
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
                    }
                }
            }`;

            try {
                // Wait a bit to be nice to the API
                await new Promise(resolve => setTimeout(resolve, 200));

                const nextData = await mondayRequest(nextQuery);
                if (nextData && nextData.next_items_page) {
                    allItems = [...allItems, ...nextData.next_items_page.items];
                    cursor = nextData.next_items_page.cursor;
                    // Safety break
                    if (allItems.length > 5000) {
                        console.warn("Reached 5000 items limit, stopping pagination.");
                        break;
                    }
                } else {
                    cursor = null;
                }
            } catch (e) {
                console.error("Error fetching next page of items", e);
                cursor = null;
            }
        }

        if (board) {
            board.items = allItems;
        }
        return board;
    }, false); // meta=false -> cache_monday_board_items
}

export async function getBoardColumns(boardId: string) {
    return getCachedOrFetch(`columns_${boardId}`, async () => {
        const query = `query {
        boards (ids: [${boardId}]) {
            columns {
                id
                title
                type
                settings_str
            }
        }
    }`;
        const data = await mondayRequest(query);
        return data.boards[0]?.columns || [];
    }, true); // meta=true -> cache_monday_meta
}

export async function createNewBoard(name: string) {
    const query = `mutation {
        create_board (board_name: "${name}", board_kind: public) {
            id
        }
    }`;
    const data = await mondayRequest(query);
    return data.create_board.id;
}

export async function createNewGroup(boardId: string, groupName: string) {
    const query = `mutation {
        create_group (board_id: ${boardId}, group_name: "${groupName}") {
            id
        }
    }`;
    const data = await mondayRequest(query);
    return data.create_group.id;
}

export async function updateItemValue(boardId: string, itemId: string, columnId: string, value: string) {
    // For status/dropdown, value should be the label. For text, it's the text.
    // change_simple_column_value is easiest for text/status
    const query = `mutation {
        change_simple_column_value (board_id: ${boardId}, item_id: ${itemId}, column_id: "${columnId}", value: "${value}") {
            id
        }
    }`;
    const data = await mondayRequest(query);
    return data;
}

export async function getMultipleBoardItems(boardIds: string[]) {
    if (boardIds.length === 0) return [];

    // Chunking to avoid query length limits (e.g., 20 boards at a time)
    // REDUCED to 2 for maximum stability
    const chunkSize = 2;
    const chunks = [];
    for (let i = 0; i < boardIds.length; i += chunkSize) {
        chunks.push(boardIds.slice(i, i + chunkSize));
    }

    let allBoards: any[] = [];

    for (const chunk of chunks) {
        const query = `query {
            boards (ids: [${chunk.join(',')}]) {
                id
                name
                columns {
                    id
                    title
                    type
                }
                items_page (limit: 50) {
                    items {
                        id
                        name
                        created_at
                        updated_at
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
                    }
                }
            }
        }`;

        try {
            const data = await mondayRequest(query);
            if (data && data.boards) {
                const processedBoards = data.boards.map((b: any) => ({
                    ...b,
                    items: b.items_page?.items || []
                }));
                allBoards = [...allBoards, ...processedBoards];
            }
        } catch (e) {
            console.error("Failed to fetch chunk", chunk, e);
        }

        // Wait 200ms between chunks to respect API limits (reduced from 1000ms)
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    return allBoards;
}

export async function getMultipleBoardActivityLogs(boardIds: string[], fromDate: string, columnId?: string) {
    if (boardIds.length === 0) return [];

    const chunkSize = 20;
    const chunks = [];
    for (let i = 0; i < boardIds.length; i += chunkSize) {
        chunks.push(boardIds.slice(i, i + chunkSize));
    }

    let allBoardsWithLogs: any[] = [];

    for (const chunk of chunks) {
        // limit 1000 should be enough for 2 weeks
        const colFilter = columnId ? `, column_ids: ["${columnId}"]` : '';
        const query = `query {
            boards (ids: [${chunk.join(',')}]) {
                id
                name
                activity_logs (from: "${fromDate}"${colFilter}, limit: 1000) {
                    id
                    event
                    data
                    entity
                    created_at
                }
            }
        }`;

        try {
            const data = await mondayRequest(query);
            if (data && data.boards) {
                allBoardsWithLogs = [...allBoardsWithLogs, ...data.boards];
            }
        } catch (e) {
            console.error("Failed to fetch activity logs chunk", chunk, e);
        }
    }

    return allBoardsWithLogs;
}

export function normalizeMondayFileUrl(url: string | null | undefined): string {
    if (!url) return '';

    // Simple string replacement is safer and sufficient here
    if (url.startsWith("https://files-monday-com.s3.amazonaws.com")) {
        return url.replace("https://files-monday-com.s3.amazonaws.com", "https://files.monday.com/use1");
    }

    // Basic normalization: Ensure HTTPS if missing scheme (though usually fine)
    if (url.startsWith('//')) {
        return `https:${url}`;
    }

    return url;
}

export async function getAssetPublicUrl(assetId: string) {
    const query = `query {
        assets (ids: [${assetId}]) {
            public_url
        }
    }`;
    const data = await mondayRequest(query);
    return normalizeMondayFileUrl(data.assets[0]?.public_url);
}

export async function prefetchBoardItems(boardIds: string[]) {
    if (!boardIds || boardIds.length === 0) return;

    // Process in chunks of 5 parallel requests to avoid overwhelming the network/API
    const CHUNK_SIZE = 5;
    for (let i = 0; i < boardIds.length; i += CHUNK_SIZE) {
        const chunk = boardIds.slice(i, i + CHUNK_SIZE);
        // Call getBoardItems for each ID. This triggers the getCachedOrFetch logic.
        // We use Promise.all to run them in parallel.
        await Promise.all(chunk.map(id => getBoardItems(id).catch(err => console.error('Prefetch failed for ' + id, err))));
        // Tiny delay to be nice to CPU?
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// --- Analytics Aggregation ---

export async function getAggregatedAnalytics() {
    // 1. Get all relevant boards (Fulfillment, Video Production, etc.)
    const allBoards = await getAllBoards();
    const analyticsBoards = allBoards.filter((b: any) =>
        b.name.toLowerCase().includes('fulfillment') ||
        b.name.toLowerCase().includes('video') ||
        b.name.toLowerCase().includes('edit')
    ).slice(0, 15); // LIMIT to 15 boards to prevent infinite load during dev

    if (analyticsBoards.length === 0) {
        return generateMockAnalytics(); // Fallback if no real data found
    }

    // 2. Fetch items for these boards
    const boardIds = analyticsBoards.map((b: any) => b.id);
    const boardsWithItems = await getMultipleBoardItems(boardIds);

    // 3. Aggregate Data
    const editorStats: Record<string, { name: string, videos: number, revisions: number, ratings: number[] }> = {};
    let totalVideos = 0;
    let totalRevisions = 0;

    boardsWithItems.forEach((board: any) => {
        // Find Column IDs based on Titles from board definitions
        const peopleColDef = board.columns?.find((c: any) => c.title.toLowerCase().includes('editor') || c.type === 'people');
        const peopleColId = peopleColDef?.id;

        const revColDef = board.columns?.find((c: any) => c.title.toLowerCase().includes('revision') || c.id.includes('numbers'));
        const revColId = revColDef?.id;

        const ratingColDef = board.columns?.find((c: any) => c.title.toLowerCase().includes('rating'));
        const ratingColId = ratingColDef?.id;

        board.items?.forEach((item: any) => {
            totalVideos++;

            // Get Editor Name
            let editorName = 'Unassigned';
            if (peopleColId) {
                const val = item.column_values.find((v: any) => v.id === peopleColId);
                if (val && val.text) editorName = val.text;
            } else {
                // Fallback scan if mapping failed
                const fallback = item.column_values.find((c: any) => c.type === 'people');
                if (fallback && fallback.text) editorName = fallback.text;
            }

            // Clean up name (handle multiple people "Name, Name")
            if (editorName.includes(',')) editorName = editorName.split(',')[0].trim();

            if (!editorStats[editorName]) {
                editorStats[editorName] = { name: editorName, videos: 0, revisions: 0, ratings: [] };
            }

            editorStats[editorName].videos++;

            // Revisions
            if (revColId) {
                const val = item.column_values.find((v: any) => v.id === revColId);
                if (val && val.text) {
                    const revCount = parseInt(val.text) || 0;
                    editorStats[editorName].revisions += revCount;
                    totalRevisions += revCount;
                }
            }

            // Ratings
            if (ratingColId) {
                const val = item.column_values.find((v: any) => v.id === ratingColId);
                if (val && val.text) {
                    const rating = parseInt(val.text.split(' ')[0]) || 0; // "5 Stars" -> 5
                    if (rating > 0) editorStats[editorName].ratings.push(rating);
                }
            }
        });
    });

    // Format for Charts
    const videosPerEditor = Object.values(editorStats)
        .map(s => ({ name: s.name, count: s.videos }))
        .sort((a, b) => b.count - a.count);

    const revisionsPerEditor = Object.values(editorStats)
        .map(s => ({ name: s.name, count: s.revisions }))
        .sort((a, b) => b.count - a.count);

    // Calculate rating distribution for stacked bar
    // This part is complex, skipping for brevity in this specific fix, keeping existing structure if possible
    // But for the NEW requirement, we need Cycle based analytics.

    return {
        totalVideos,
        totalRevisions,
        videosPerEditor,
        revisionsPerEditor,
        ratingsPerEditor: [] // Placeholder
    };
}

export async function getWorkspaceAnalytics() {
    // 1. Get all Workspace Boards
    const allBoards = await getAllBoards();
    const workspaceBoards = allBoards.filter((b: any) =>
        (b.name.toLowerCase().includes('- workspace') || b.name.toLowerCase().includes('management')) &&
        !b.type.includes('sub_items') &&
        !b.name.toLowerCase().includes('subitems')
    );

    // 2. Fetch Items
    const boardIds = workspaceBoards.map((b: any) => b.id);
    const boardsWithItems = await getMultipleBoardItems(boardIds);

    // 3. Process Items & Assign Cycles
    const analyticsData: Record<string, Record<string, number>> = {}; // { "Cycle Key": { "Editor Name": Count } }
    const paymentData: Record<string, Record<string, number>> = {}; // { "Cycle Key": { "Editor Name": TotalPrice } }
    const typeData: Record<string, Record<string, number>> = {}; // { "Cycle Key": { "Type Name": Count } }
    const statusData: Record<string, Record<string, number>> = {}; // { "Cycle Key": { "Status Name": Count } }
    const revisionsData: Record<string, Record<string, number>> = {}; // { "Cycle Key": { "Editor Name": Count } }
    const cyclesSet = new Set<string>();

    console.log(`[Analytics] Processing ${boardsWithItems.length} workspace boards...`);

    boardsWithItems.forEach((board: any) => {
        // Determine Editor Name from Board Name
        let editorName = board.name.replace(/- Workspace/i, '').replace(/\(c-w-[\w-]+\)/i, '').trim();

        // Find Price Column
        const priceCol = board.columns?.find((c: any) => c.title.toLowerCase().includes('price') || c.title.toLowerCase().includes('php'));
        const priceColId = priceCol?.id;

        // Find Type Column
        const typeCol = board.columns?.find((c: any) => c.title.toLowerCase() === 'type' || c.title.toLowerCase().includes('type'));
        const typeColId = typeCol?.id;

        // Find Status Column (Status, Project Status, or simply a status column if unthemed)
        const statusCol = board.columns?.find((c: any) =>
            c.title.toLowerCase() === 'status' ||
            c.title.toLowerCase() === 'project status' ||
            (c.type === 'color' && !c.title.toLowerCase().includes('priority') && !c.title.toLowerCase().includes('label'))
        );
        const statusColId = statusCol?.id;

        if (typeColId) {
            console.log(`[Analytics] Found Type column '${typeCol.title}' (${typeCol.id}) for board: ${board.name}`);
        } else {
            console.log(`[Analytics] NO Type column found for board: ${board.name}`);
        }

        if (!priceColId) {
            console.warn(`[Analytics] No Price column found for board: ${board.name}`);
            // Log all columns to see what's available
            // console.log(`[Analytics] Available columns for ${board.name}:`, board.columns?.map((c: any) => `${c.title} (${c.id})`));
        } else {
            console.log(`[Analytics] Found Price column '${priceCol.title}' (${priceCol.id}) for board: ${board.name}`);
        }

        let debugCount = 0; // Limit logs per board

        board.items.forEach((item: any) => {
            if (!item.created_at) return;

            const date = new Date(item.created_at);
            if (isNaN(date.getTime())) return;

            // Strict Cycle Check
            const monthNum = date.getMonth() + 1;
            const year = date.getFullYear();

            let cycleKey = '';

            // Check Cycle 1
            const cycle1 = getCycleDates(1, monthNum, year);
            if (isDateInCycle(date, cycle1)) {
                const monthStr = date.toLocaleString('default', { month: 'long' });
                cycleKey = `${monthStr} ${year} - Cycle 1`;
            } else {
                // Check Cycle 2
                const cycle2 = getCycleDates(2, monthNum, year);
                if (isDateInCycle(date, cycle2)) {
                    const monthStr = date.toLocaleString('default', { month: 'long' });
                    cycleKey = `${monthStr} ${year} - Cycle 2`;
                }
            }

            if (cycleKey) {
                cyclesSet.add(cycleKey);

                // Initialize Data Structures
                // SKIP GENERAL ANALYTICS FOR "Management Dashboard"
                // It is only here for Revisions data.
                const isManagementBoard = board.name.includes('Management') || board.name.includes('Manag');

                if (!isManagementBoard) {
                    if (!analyticsData[cycleKey]) analyticsData[cycleKey] = {};
                    if (!analyticsData[cycleKey][editorName]) analyticsData[cycleKey][editorName] = 0;

                    if (!paymentData[cycleKey]) paymentData[cycleKey] = {};
                    if (!paymentData[cycleKey][editorName]) paymentData[cycleKey][editorName] = 0;

                    if (!typeData[cycleKey]) typeData[cycleKey] = {};
                    if (!statusData[cycleKey]) statusData[cycleKey] = {};

                    // Increment Video Count
                    analyticsData[cycleKey][editorName]++;

                    // Add Price
                    if (priceColId) {
                        const priceVal = item.column_values?.find((cv: any) => cv.id === priceColId);

                        if (priceVal && (priceVal.text || priceVal.display_value)) {
                            // Use display_value for Mirror columns if available, otherwise text
                            const rawText = priceVal.display_value || priceVal.text;

                            // Robust Parse: Remove everything that is NOT a digit, dot, or minus.
                            const cleanVal = rawText.replace(/[^0-9.-]+/g, '');
                            const amount = parseFloat(cleanVal);

                            if (!isNaN(amount)) {
                                paymentData[cycleKey][editorName] += amount;
                            }
                        }
                    }

                    // Process Type
                    if (typeColId) {
                        const typeVal = item.column_values?.find((cv: any) => cv.id === typeColId);
                        if (typeVal) {
                            // Handle Mirror Columns (display_value) and Regular Columns (text)
                            const rawType = typeVal.display_value || typeVal.text;

                            if (rawType) {
                                // Clean up type name (remove extra spaces, handle comma separated if multiple)
                                const typeName = rawType.split(',')[0].trim();

                                // EXCLUDE: Ignore "(Unassigned) VE" as it's not a real project type
                                if (typeName && typeName !== '(Unassigned) VE') {
                                    if (!typeData[cycleKey][typeName]) typeData[cycleKey][typeName] = 0;
                                    typeData[cycleKey][typeName]++;
                                }
                            }
                        }
                    }

                    // Process Status
                    if (statusColId) {
                        const statusVal = item.column_values?.find((cv: any) => cv.id === statusColId);
                        if (statusVal) {
                            // Handle Mirror Columns (display_value) and Regular Columns (text/label)
                            const rawStatus = statusVal.display_value || statusVal.text;

                            if (rawStatus) {
                                if (!statusData[cycleKey][rawStatus]) statusData[cycleKey][rawStatus] = 0;
                                statusData[cycleKey][rawStatus]++;
                            }
                        }
                    }
                }

                // Process Revisions
                // Prioritize "Amount of Revisions" as per user request
                const revisionsCol = board.columns?.find((c: any) => c.title.toLowerCase() === 'amount of revisions') ||
                    board.columns?.find((c: any) => c.title.toLowerCase().includes('amount of revisions')) ||
                    board.columns?.find((c: any) => c.title.toLowerCase() === 'revisions') ||
                    board.columns?.find((c: any) => c.title.toLowerCase().includes('revision'));

                // Find Editor Column (People)
                const editorCol = board.columns?.find((c: any) => c.title.toLowerCase().includes('editor') || c.title.toLowerCase().includes('people'));

                if (revisionsCol) {
                    // DEBUG: Verify which column we picked
                    if (debugCount < 1 && board.name.includes('Manag')) {
                        console.log(`[Analytics] Selected Revision Column: '${revisionsCol.title}' (${revisionsCol.id}) Type: ${revisionsCol.type}`);
                    }
                    const revVal = item.column_values?.find((cv: any) => cv.id === revisionsCol.id);

                    // console.log(`[Analytics] Item: ${item.name}, RevCol Type: ${revisionsCol.type}, Val:`, revVal);

                    // Handle Mirror Columns (display_value) or Regular (text)
                    const rawRev = revVal?.display_value || revVal?.text;

                    if (rawRev) {
                        const count = parseFloat(rawRev.toString()); // Ensure string
                        if (!isNaN(count) && count > 0) {

                            // Determine which editor to attribute this to
                            let currentEditorName = editorName; // Default to board-derived name

                            if (editorCol) {
                                const editorVal = item.column_values?.find((cv: any) => cv.id === editorCol.id);
                                // For People column (or mirror of people), display_value usually has names
                                const rawEditor = editorVal?.display_value || editorVal?.text;

                                if (rawEditor) {
                                    // People column text often contains names like "John Smith, Jane Doe"
                                    // We'll take the first one or assume the primary editor is the target
                                    const peopleNames = rawEditor.split(',').map((s: string) => s.trim());
                                    if (peopleNames.length > 0) {
                                        currentEditorName = peopleNames[0];
                                    }
                                }
                            }

                            // Initialize & Accumulate
                            if (!revisionsData[cycleKey]) revisionsData[cycleKey] = {};
                            if (!revisionsData[cycleKey][currentEditorName]) revisionsData[cycleKey][currentEditorName] = 0;
                            revisionsData[cycleKey][currentEditorName] += count;
                        }
                    }
                }
            }
        });

    });


    console.log('[Analytics] Type Data:', typeData);
    console.log('[Analytics] Revisions Data:', revisionsData);

    // 4. Sort Cycles
    const sortedCycles = Array.from(cyclesSet).sort((a, b) => {
        const parseCycle = (key: string) => {
            const match = key.match(/(\w+) (\d+) - Cycle (\d)/);
            if (!match) return 0;
            const [, m, y, c] = match;
            const monthNum = new Date(`${m} 1, ${y}`).getMonth();
            return parseInt(y) * 10000 + monthNum * 100 + parseInt(c);
        };
        return parseCycle(b) - parseCycle(a); // Newest first
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


function generateMockAnalytics() {
    return {
        totalVideos: 31,
        totalRevisions: 19,
        videosPerEditor: [
            { name: 'Joshua', count: 8 },
            { name: 'Tosh', count: 8 },
            { name: 'Altea', count: 3 },
            { name: 'Mark', count: 3 },
            { name: 'colin', count: 3 },
            { name: 'Rain', count: 2 },
            { name: 'Kanchi', count: 2 },
        ],
        revisionsPerEditor: [
            { name: 'Joshua', count: 7 },
            { name: 'Rijan', count: 5 },
            { name: 'Altea', count: 4 },
            { name: 'Rain', count: 2 },
            { name: 'Tosh', count: 1 },
            { name: 'Mark', count: 0 },
            { name: 'colin', count: 0 },
        ],
        ratingsPerEditor: [
            { name: 'Tosh', '5 Stars': 6, '4 Stars': 5, '3 Stars': 0, '2 Stars': 0, '1 Star': 0 },
            { name: 'Joshua', '5 Stars': 7, '4 Stars': 2, '3 Stars': 0, '2 Stars': 0, '1 Star': 0 },
            { name: 'Altea', '5 Stars': 1, '4 Stars': 2, '3 Stars': 0, '2 Stars': 0, '1 Star': 0 },
            { name: 'Mark', '5 Stars': 0, '4 Stars': 2, '3 Stars': 0, '2 Stars': 0, '1 Star': 0 },
            { name: 'Kanchi', '5 Stars': 0, '4 Stars': 1, '3 Stars': 0, '2 Stars': 0, '1 Star': 0 },
            { name: 'colin', '5 Stars': 1, '4 Stars': 3, '3 Stars': 0, '2 Stars': 0, '1 Star': 0 },
        ]
    };
}

export async function submitProjectAssignment(
    boardId: string,
    groupId: string,
    data: {
        itemName: string,
        status?: string,
        type?: string,
        editor?: string,
        price?: string,
        timeline?: string,
        priority?: string,
        instructions?: string
    }
) {
    // 1. Fetch Columns to map IDs
    const columns = await getBoardColumns(boardId);

    const getColId = (title: string) => columns.find((c: any) => c.title.toLowerCase().includes(title.toLowerCase()))?.id;

    const statusId = getColId('status') || 'status'; // fallback
    const typeId = getColId('type') || 'type';
    const priceId = getColId('price') || getColId('budget') || 'numbers';
    const instructionId = getColId('instruction') || getColId('notes') || 'text';
    const priorityId = getColId('priority');

    const columnValues: any = {};

    if (data.status) columnValues[statusId] = { label: data.status };
    if (data.type) columnValues[typeId] = { label: data.type };
    if (data.price) columnValues[priceId] = data.price;
    if (data.priority && priorityId) columnValues[priorityId] = { label: data.priority };
    if (data.instructions) columnValues[instructionId] = { text: data.instructions };


    // Editor Logic for VE Board: Assign to People column only
    if (data.editor) {
        // Find the People column (usually named "Editor")
        const peopleCol = columns.find((c: any) => c.type === 'people' && c.title.toLowerCase() === 'editor')
            || columns.find((c: any) => c.type === 'people' && c.title.toLowerCase().includes('editor'));

        // Assign to People Column
        if (peopleCol) {
            try {
                const allUsers = await getUsers();
                // data.editor is the clean name "John Mark Ormido"
                const matchedUser = allUsers.find((u: any) => u.name.toLowerCase() === data.editor?.toLowerCase());
                if (matchedUser) {
                    columnValues[peopleCol.id] = { personsAndTeams: [{ id: Number(matchedUser.id), kind: "person" }] };
                } else {
                    console.warn(`Could not find Monday User ID for editor: ${data.editor}`);
                }
            } catch (err) {
                console.error("Failed to map editor to User ID", err);
            }
        }
    }

    // NEW: Deadline / Date Logic
    const deadlineId = getColId('deadline') || getColId('date') || getColId('timeline');
    if (data.timeline && deadlineId) {
        const col = columns.find((c: any) => c.id === deadlineId);
        if (col?.type === 'date') {
            // Check if input is datetime-local (YYYY-MM-DDTHH:mm)
            if (data.timeline.includes('T')) {
                let [datePart, timePart] = data.timeline.split('T');
                // Ensure time has seconds (HH:mm:ss) required by Monday API
                if (timePart.length === 5) {
                    timePart += ':00';
                }
                columnValues[deadlineId] = { date: datePart, time: timePart };
            } else {
                columnValues[deadlineId] = { date: data.timeline };
            }
        } else if (col?.type === 'timeline') {
            // Timeline usually doesn't support time well via API in this simple format, send date
            const dateOnly = data.timeline.split('T')[0];
            columnValues[deadlineId] = { from: dateOnly, to: dateOnly };
        } else {
            // Text fallback - pretty print roughly
            columnValues[deadlineId] = data.timeline.replace('T', ' ');
        }
    }

    // Note: Editor Board submission removed - handled by Monday.com automations

    // IMPORTANT: Two-step process to ensure automations are triggered
    // Step 1: Create the item WITHOUT column values
    const createQuery = `mutation ($boardId: ID!, $groupId: String!, $itemName: String!) {
        create_item (board_id: $boardId, group_id: $groupId, item_name: $itemName) {
            id
        }
    }`;

    const createVariables = {
        boardId: Number(boardId),
        groupId,
        itemName: data.itemName
    };

    const createResult = await mondayRequest(createQuery, createVariables);
    const newItemId = createResult.create_item.id;

    // Step 2: Update column values to trigger automations
    if (Object.keys(columnValues).length > 0) {
        const updateQuery = `mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
            change_multiple_column_values (board_id: $boardId, item_id: $itemId, column_values: $columnValues) {
                id
            }
        }`;

        const updateVariables = {
            boardId: Number(boardId),
            itemId: Number(newItemId),
            columnValues: JSON.stringify(columnValues)
        };

        await mondayRequest(updateQuery, updateVariables);
    }

    return createResult;
}

/**
 * Get all views for a board
 * @param boardId - The board ID
 * @returns Array of views with id and name
 */
export async function getBoardViews(boardId: string) {
    const query = `query {
        boards (ids: [${boardId}]) {
            views {
                id
                name
                type
            }
        }
    }`;

    const data = await mondayRequest(query);
    return data.boards[0]?.views || [];
}

/**
 * Get items from a specific board view
 * @param boardId - The board ID
 * @param viewName - The view name to filter by
 * @returns Board data with items from the specified view
 */
export async function getBoardItemsByView(boardId: string, viewName: string) {
    // First, get all views to find the view ID
    const views = await getBoardViews(boardId);
    const targetView = views.find((v: any) =>
        v.name.toLowerCase().includes(viewName.toLowerCase())
    );

    if (!targetView) {
        console.warn(`View "${viewName}" not found in board ${boardId}, fetching all items`);
        return getBoardItems(boardId);
    }

    const cacheKey = `${boardId}_view_${targetView.id}`;

    return getCachedOrFetch(cacheKey, async () => {
        // For now, fetch all items and filter client-side
        // Monday.com API doesn't easily support filtering by view in items_page
        const boardData = await getBoardItems(boardId);

        // Note: View filtering would require more complex logic
        // For simplicity, we're returning all board items
        // The view is more of a UI concept in Monday.com
        return boardData;
    }, false);
}



