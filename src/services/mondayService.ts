const MONDAY_API_URL = "https://api.monday.com/v2";
const MONDAY_API_TOKEN = import.meta.env.VITE_MONDAY_API_TOKEN;
import { supabase } from '../lib/supabaseClient';

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

async function mondayRequest(query: string, variables?: any) {
    try {
        const response = await fetch(MONDAY_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": MONDAY_API_TOKEN,
            },
            body: JSON.stringify({ query, variables }),
        });
        const json = await response.json();

        if (json.errors) {
            console.error("Monday API Errors:", json.errors);
            throw new Error(JSON.stringify(json.errors));
        }

        return json.data;
    } catch (error) {
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
    }`;
        const data = await mondayRequest(query);
        return data.workspaces;
    }, true);
}

export async function getBoardItems(boardId: string) {
    return getCachedOrFetch(boardId, async () => {
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
            items_page (limit: 50) {
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
        }
    }`;
        const data = await mondayRequest(query);
        const board = data.boards[0];
        // Flatten items structure for easier consumption
        if (board && board.items_page) {
            board.items = board.items_page.items;
        }
        return board;
    }, false); // meta=false -> cache_monday_board_items
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
    const chunkSize = 20;
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
                items_page (limit: 500) {
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

export async function getAssetPublicUrl(assetId: string) {
    const query = `query {
        assets (ids: [${assetId}]) {
            public_url
        }
    }`;
    const data = await mondayRequest(query);
    return data.assets[0]?.public_url;
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

