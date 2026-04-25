const MONDAY_API_URL = "https://api.monday.com/v2";
const MONDAY_FILE_API_URL = "https://api.monday.com/v2/file";
const MONDAY_API_TOKEN = import.meta.env.VITE_MONDAY_API_TOKEN;
/** `set_item_description_content` and related APIs require 2026-04+ (see monday.com API changelog). */
export const MONDAY_API_VERSION_DOC_BLOCKS = "2026-04";
import { supabase } from '../lib/supabaseClient';
import { stripHtmlToPlainText } from '../lib/instructionLinkify';
import {
    manilaWallTimeToMondayDateColumnUtc,
    ymdInManila,
    todaysYmdManila,
    yesterdaysYmdManila,
    formatYmdHm24InManila,
    mondayDateColumnValueToUtcInstant,
    manilaWallHm24FromDate,
} from '../lib/philippinesTime';
import { getCycleDates, isDateInCycle } from '../features/performance-dashboard/utils/dateUtils';
import { idbGet, idbSet } from './idbService';

// Background refresh lock — prevents concurrent stale-refresh upserts for the same key
const backgroundRefreshing = new Set<string>();

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

// Global Rate Limiter
class RateLimiter {
    private queue: Array<() => void> = [];
    private activeCount = 0;
    private maxConcurrent: number;

    constructor(maxConcurrent: number) {
        this.maxConcurrent = maxConcurrent;
    }

    async add<T>(fn: () => Promise<T>): Promise<T> {
        if (this.activeCount >= this.maxConcurrent) {
            await new Promise<void>(resolve => this.queue.push(resolve));
        }

        this.activeCount++;
        try {
            return await fn();
        } finally {
            this.activeCount--;
            if (this.queue.length > 0) {
                const next = this.queue.shift();
                next?.();
            }
        }
    }
}

// Limit to 2 concurrent requests to respect Monday.com rate limits
const limiter = new RateLimiter(2);

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

export async function mondayRequest(
    query: string,
    variables: any = {},
    retries = 5,
    backoff = 1000,
    /** e.g. `MONDAY_API_VERSION_DOC_BLOCKS` for `set_item_description_content` */
    apiVersion?: string
) {
    try {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "Authorization": MONDAY_API_TOKEN!,
        };
        if (apiVersion?.trim()) {
            headers["API-Version"] = apiVersion.trim();
        }
        const response = await limiter.add(() => fetch(MONDAY_API_URL, {
            method: "POST",
            headers,
            body: JSON.stringify({ query, variables }),
        }));

        // Handle HTTP errors (like 429 Too Many Requests, 500 Server Error)
        if (!response.ok) {
            if (retries > 0 && (response.status === 429 || response.status >= 500)) {
                console.warn(`Monday API ${response.status} Error. Retrying in ${backoff}ms...`);
                await delay(backoff);
                return mondayRequest(query, variables, retries - 1, backoff * 2, apiVersion);
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
                return mondayRequest(query, variables, retries - 1, backoff, apiVersion);
            }

            // ColumnValueException is a data error — do not retry, surface immediately
            const columnError = json.errors.find((e: any) => e.extensions?.code === 'ColumnValueException');
            if (columnError) {
                console.warn('Monday ColumnValueException (non-retryable):', columnError.message);
                throw new Error(JSON.stringify(json.errors));
            }

            console.error("Monday API Errors:", json.errors);
            throw new Error(JSON.stringify(json.errors));
        }

        return json.data;
    } catch (error: any) {
        // Handle Network errors
        if (retries > 0 && (error.name === "TypeError" || error.message.includes("NetworkError"))) {
            console.warn(`Network Error. Retrying in ${backoff}ms...`);
            await delay(backoff);
            return mondayRequest(query, variables, retries - 1, backoff * 2, apiVersion);
        }

        console.error("Monday API Request Failed:", error);
        throw error;
    }
}


// --- Caching Helper (IndexedDB + Supabase) ---
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 Minutes


// Request Coalescing Map to prevent duplicate in-flight requests
const pendingRequests = new Map<string, Promise<any>>();

async function getCachedOrFetch<T>(key: string, fetcher: () => Promise<T>, meta: boolean = true, forceSync: boolean = false, onFresh?: (data: T) => void): Promise<T> {
    const table = meta ? 'cache_monday_meta' : 'cache_monday_board_items';
    const idColumn = meta ? 'key' : 'board_id';

    // Check if a request for this key is already in flight
    if (!forceSync && pendingRequests.has(key)) {
        return pendingRequests.get(key) as Promise<T>;
    }

    const promise = (async () => {
        try {
            // --- forceSync: Skip ALL caches, fetch fresh from API ---
            if (forceSync) {
                const freshData = await fetcher();
                // Store in IDB (async) - don't await strictly to speed up response
                idbSet(key, { data: freshData, timestamp: Date.now() }).catch(e => console.error("IDB Set Error", e));

                // Store in Supabase (intentional — user-triggered forceSync, no lock needed)
                supabase.from(table).upsert({ [idColumn]: key, data: freshData, updated_at: new Date() }).then();
                return freshData;
            }

            // --- Layer 1: IndexedDB (Async, High Capacity) ---
            try {
                const localCache = await idbGet<{ data: T, timestamp: number }>(key);
                if (localCache && localCache.data) {
                    const age = Date.now() - (localCache.timestamp || 0);
                    const isStale = age > CACHE_TTL_MS;

                    if (!isStale) {
                        return localCache.data;
                    }

                    // Stale IDB cache — return it now, background refresh
                    // Lock prevents duplicate concurrent upserts for the same key
                    console.log(`[Cache] IDB Stale for ${key}, refreshing in background...`);
                    if (!backgroundRefreshing.has(key)) {
                        backgroundRefreshing.add(key);
                        fetcher().then(freshData => {
                            idbSet(key, { data: freshData, timestamp: Date.now() });
                            supabase.from(table).upsert({ [idColumn]: key, data: freshData, updated_at: new Date() }).then();
                            onFresh?.(freshData);
                        }).catch(err => console.error("Background sync failed", err))
                        .finally(() => backgroundRefreshing.delete(key));
                    }

                    return localCache.data;
                }
            } catch (err) {
                console.warn("[Cache] IDB Read Error", err);
            }

            // --- Layer 2: Supabase (Network, Persistent) ---
            try {
                const { data } = await supabase.from(table).select('data, updated_at').eq(idColumn, key).maybeSingle();
                if (data?.data) {
                    // Update IDB for next time (Local Rehydration)
                    idbSet(key, { data: data.data, timestamp: new Date(data.updated_at).getTime() });

                    const age = Date.now() - new Date(data.updated_at).getTime();
                    const isStale = age > CACHE_TTL_MS;

                    if (isStale) {
                        // Background Sync
                        // Lock prevents duplicate concurrent upserts for the same key
                        console.log(`[Cache] Supabase Stale for ${key}, refreshing...`);
                        if (!backgroundRefreshing.has(key)) {
                            backgroundRefreshing.add(key);
                            fetcher().then(freshData => {
                                idbSet(key, { data: freshData, timestamp: Date.now() });
                                supabase.from(table).upsert({ [idColumn]: key, data: freshData, updated_at: new Date() }).then();
                                onFresh?.(freshData);
                            }).catch(err => console.error("Background sync failed", err))
                            .finally(() => backgroundRefreshing.delete(key));
                        }
                    }
                    return data.data;
                }
            } catch (e) {
                // Continue to fetch if Supabase fails
            }

            // --- Layer 3: Monday.com API (Authoritative) ---
            console.log(`[Cache] Cache Miss for ${key}, fetching from API...`);
            const freshData = await fetcher();

            // Update both caches
            idbSet(key, { data: freshData, timestamp: Date.now() });
            supabase.from(table).upsert({ [idColumn]: key, data: freshData, updated_at: new Date() }).then();

            return freshData;

        } finally {
            // Remove from pending map when done
            pendingRequests.delete(key);
        }
    })();

    // Store the promise in map
    pendingRequests.set(key, promise);

    return promise;
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

export async function getAllBoards(forceSync: boolean = false) {
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
    }, true, forceSync);
}

export async function getWorkspaceBoards(forceSync: boolean = false) {
    const allBoards = await getAllBoards(forceSync);
    return allBoards.filter((b: any) =>
        (b.name.toLowerCase().includes('- workspace') || b.name.toLowerCase().includes('management')) &&
        !b.type.includes('sub_items') &&
        !b.name.toLowerCase().includes('subitems')
    );
}

export async function getAllFolders(forceSync: boolean = false) {
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
    }, true, forceSync);
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

export async function getBoardItems(boardId: string, forceSync: boolean = false, onFresh?: (data: any) => void) {
    return getCachedOrFetch(boardId, async () => {
        let allItems: any[] = [];
        let cursor: string | null = null;

        // Initial Fetch
        const query = `query {
            boards (ids: [${boardId}]) {
                id
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
                            ... on BoardRelationValue {
                                linked_item_ids
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
                                ... on MirrorValue {
                                    display_value
                                }
                                ... on BoardRelationValue {
                                    linked_item_ids
                                }
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
                            ... on BoardRelationValue {
                                linked_item_ids
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
                                ... on MirrorValue {
                                    display_value
                                }
                                ... on BoardRelationValue {
                                    linked_item_ids
                                }
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
    }, false, forceSync, onFresh); // meta=false -> cache_monday_board_items
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

/**
 * Upload a file into a Monday.com **file** column (e.g. Submission Preview).
 *
 * **Architecture (v2 — streaming proxy):**
 * The browser builds the full Monday-compatible multipart body (GraphQL
 * `query` + `variables[file]`), then sends it to the `monday-file-upload`
 * Edge Function.  The Edge Function **never calls `req.formData()`** — it
 * pipes `req.body` as a `ReadableStream` straight to `api.monday.com/v2/file`,
 * keeping memory usage near-zero regardless of file size.
 *
 * This bypasses the 150 MB Supabase Edge Function memory limit.
 * Monday.com's own file limit is 500 MB.
 */
export async function uploadFileToItemColumn(itemId: string, columnId: string, file: File): Promise<void> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Configure VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env and deploy the monday-file-upload Edge Function.'
        );
    }

    // Build the Monday-compatible multipart form on the client side.
    // The Edge Function will stream this body to Monday without buffering.
    const mutation = `mutation ($file: File!) {
        add_file_to_column (
            file: $file,
            item_id: ${Number(itemId)},
            column_id: ${JSON.stringify(columnId)}
        ) {
            id
        }
    }`;

    const formData = new FormData();
    formData.append('query', mutation);
    formData.append('variables[file]', file, file.name);

    const uploadUrl = import.meta.env.DEV
        ? '/functions/v1/monday-file-upload'
        : `${supabaseUrl.replace(/\/$/, '')}/functions/v1/monday-file-upload`;

    const networkHint =
        'Could not reach the upload service. Deploy `monday-file-upload` with `verify_jwt = false` and set Edge secret `MONDAY_API_TOKEN`.';

    let response: Response;
    try {
        response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${supabaseAnonKey}`,
                apikey: supabaseAnonKey,
            },
            body: formData,
        });
    } catch {
        throw new Error(networkHint);
    }

    const text = await response.text();
    let json: { error?: string; success?: boolean };
    try {
        json = JSON.parse(text) as { error?: string; success?: boolean };
    } catch {
        throw new Error(
            `Upload proxy failed (${response.status}): ${text.slice(0, 300) || 'Invalid response'}`
        );
    }

    if (!response.ok || json.error) {
        throw new Error(json.error || `Upload failed (${response.status})`);
    }
}

/**
 * Updates a column value on a Monday.com source board.
 * When encountering a mirror column, always update the source board column instead.
 * 
 * @param sourceBoardId - The ID of the source board (<SOURCE_BOARD_ID>)
 * @param sourceItemId - The ID of the source item (<SOURCE_ITEM_ID>)
 * @param sourceColumnId - The ID of the source column (<SOURCE_COLUMN_ID>)
 * @param newValue - The new value as a string/JSON (<NEW_VALUE>)
 */
export async function updateSourceColumn(sourceBoardId: string | number, sourceItemId: string | number, sourceColumnId: string, newValue: string) {
    // If the value is complex JSON stringified (like {"label":"Done"}), we need to use change_column_value
    // If it's simple text, change_simple_column_value can handle it if value is just string
    // Here we use change_column_value for robustness with JSON stringified newValue
    const query = `mutation change_column_value($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(
        board_id: $boardId, 
        item_id: $itemId, 
        column_id: $columnId, 
        value: $value
      ) {
        id
      }
    }`;

    // ensure newValue is valid JSON string format if it is not already
    let finalValue = newValue;
    try {
        JSON.parse(newValue); // test if it's already JSON
    } catch {
        // if not valid JSON, assume it's simple string and needs quotes
        finalValue = JSON.stringify(newValue);
    }

    const variables = {
        boardId: String(sourceBoardId),
        itemId: String(sourceItemId),
        columnId: sourceColumnId,
        value: finalValue
    };

    const data = await mondayRequest(query, variables);
    return data;
}

export async function updateMondayItemColumns(
    boardId: string | number,
    itemId: string | number,
    columnValues: Record<string, unknown>
) {
    const query = `mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
        change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues) {
            id
        }
    }`;

    const variables = {
        boardId: Number(boardId),
        itemId: Number(itemId),
        columnValues: JSON.stringify(columnValues),
    };

    return mondayRequest(query, variables);
}



// Refactored to use getBoardItems which provides Caching & Pagination
// and uses the global RateLimiter (limit=2) to prevent concurrency issues.
export async function getMultipleBoardItems(boardIds: string[], forceSync: boolean = false) {
    if (boardIds.length === 0) return [];

    // Use Promise.all to fetch concurrently (limited by RateLimiter)
    // This leverages the 'cache_monday_board_items' automatically
    const results = await Promise.all(
        boardIds.map(id => getBoardItems(id, forceSync).catch(err => {
            console.error(`Failed to fetch board ${id}:`, err);
            return null;
        }))
    );

    return results.filter(b => b !== null);
}

export async function prefetchOverviewData() {
    try {
        // 1. Get All Folders to find "Active Clients" / "Active Projects"
        const folders = await getAllFolders();

        // 2. Identify relevant folders
        // Overview page uses 'Active Clients' and 'Active Projects'
        const targetFolders = folders.filter((f: any) =>
            f.name.toLowerCase().includes('active client') ||
            f.name.toLowerCase() === 'active projects'
        );

        const boardIdsToPrefetch = new Set<string>();

        targetFolders.forEach((f: any) => {
            f.children?.forEach((c: any) => boardIdsToPrefetch.add(String(c.id)));
        });

        // 3. Prefetch items for these boards
        // This will populate the cache so AdminOverview loads instantly
        if (boardIdsToPrefetch.size > 0) {
            console.log(`[Prefetch] Pre-loading ${boardIdsToPrefetch.size} overview boards...`);
            await getMultipleBoardItems(Array.from(boardIdsToPrefetch));
        }

    } catch (err) {
        console.error("[Prefetch] Failed to prefetch overview data", err);
    }
}

export async function getMultipleBoardActivityLogs(boardIds: string[], fromDate: string, columnId?: string) {
    if (boardIds.length === 0) return [];

    const chunkSize = 1;
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

        // Wait 500ms between chunks to respect API limits
        await new Promise(resolve => setTimeout(resolve, 500));
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
    const CHUNK_SIZE = 3;
    const boardsWithItems: any[] = [];
    for (let i = 0; i < boardIds.length; i += CHUNK_SIZE) {
        const chunk = boardIds.slice(i, i + CHUNK_SIZE);
        const results = await Promise.all(
            chunk.map(id => getMultipleBoardItems([id]).catch(() => []))
        );
        boardsWithItems.push(...results.flat());
    }

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

export async function getWorkspaceAnalytics(allowedBoardIds?: string[]) {
    // --- Check IndexedDB for cached analytics result ---
    // Make cache key unique to the specific boards being requested (or 'all' if none)
    const boardKeySuffix = allowedBoardIds && allowedBoardIds.length > 0
        ? `_${allowedBoardIds.sort().join('_')}`
        : '_all';
    const ANALYTICS_CACHE_KEY = `workspace_analytics${boardKeySuffix}`;
    const CACHE_TTL_MS = 1000 * 60 * 30; // 30 Minutes

    try {
        // Retrieve from IDB
        const cached = await idbGet<any>(ANALYTICS_CACHE_KEY);

        if (cached && cached.timestamp) {
            const age = Date.now() - cached.timestamp;
            const isStale = age > CACHE_TTL_MS;

            if (!isStale) {
                return cached.data;
            }

            // If stale cache exists, return it immediately and refresh in background
            console.log(`[Analytics] Cache stale for ${boardKeySuffix}, refreshing in background...`);
            getWorkspaceAnalyticsFresh(allowedBoardIds).then(freshResult => {
                idbSet(ANALYTICS_CACHE_KEY, { data: freshResult, timestamp: Date.now() });
            }).catch(err => console.error('[Analytics] Background refresh failed', err));

            return cached.data;
        }
    } catch (e) {
        console.warn('Failed to read analytics from cache', e);
    }

    // No cache at all — fetch and wait
    console.log(`[Analytics] No cache for ${boardKeySuffix}, fetching fresh...`);
    const result = await getWorkspaceAnalyticsFresh(allowedBoardIds);
    idbSet(ANALYTICS_CACHE_KEY, { data: result, timestamp: Date.now() });
    return result;
}

/** Internal: Actually fetch workspace analytics from Monday.com API */
async function getWorkspaceAnalyticsFresh(allowedBoardIds?: string[]) {
    let boardIds: string[] = [];

    // 1. Determine which boards to fetch
    if (allowedBoardIds && allowedBoardIds.length > 0) {
        // If specific boards are requested (e.g., Client Portal), fetch them directly
        // bypassing the '- workspace' name filter.
        boardIds = allowedBoardIds;
    } else {
        // Get all Editor Workspace Boards
        const workspaceBoards = await getWorkspaceBoards();
        boardIds = workspaceBoards.map((b: any) => b.id);
    }

    if (boardIds.length === 0) {
        return { cycles: [], data: {}, payments: {}, types: {}, statuses: {}, revisions: {} }; // Return empty data if no boards allowed
    }

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

const MONDAY_DESC_MARKDOWN_MAX = 200_000;

/**
 * Fills the item’s **Workdoc (item description)** from Markdown. This is the document that opens
 * in the item view in Monday, not the separate “Monday Doc” table column (that column is not
 * fully supported for API writes). Requires API version 2026-04+.
 */
export async function setItemDescriptionFromMarkdown(
    itemId: string,
    markdown: string
): Promise<{ success: boolean; error?: string }> {
    if (!MONDAY_API_TOKEN || MONDAY_API_TOKEN === "YOUR_MONDAY_API_TOKEN") {
        return { success: false, error: "no_token" };
    }
    const m = markdown.trim();
    if (!m) {
        return { success: true };
    }
    const body = m.length > MONDAY_DESC_MARKDOWN_MAX
        ? `${m.slice(0, MONDAY_DESC_MARKDOWN_MAX - 1)}…`
        : m;
    const query = `mutation SetItemDescription($itemId: ID!, $md: String!) {
  set_item_description_content(item_id: $itemId, markdown: $md) {
    success
    error
  }
}`;
    const variables = { itemId, md: body };
    try {
        const data: any = await mondayRequest(query, variables, 2, 1000, MONDAY_API_VERSION_DOC_BLOCKS);
        const r = data.set_item_description_content;
        if (r?.success) {
            return { success: true };
        }
        return { success: false, error: typeof r?.error === "string" ? r.error : "set_item_description_content_failed" };
    } catch (e: any) {
        return { success: false, error: e?.message || String(e) };
    }
}

/**
 * Creates a Monday Workdoc inside a **doc-type column cell** for a specific item,
 * then writes the instruction text into it as a `normal_text` doc block.
 *
 * Flow: `create_doc` (location = board item + column) → `create_doc_block` (normal_text).
 * Requires API version 2026-04+.
 */
export async function createDocInColumn(
    itemId: string,
    columnId: string,
    textContent: string
): Promise<{ success: boolean; docId?: string; error?: string }> {
    if (!MONDAY_API_TOKEN || MONDAY_API_TOKEN === "YOUR_MONDAY_API_TOKEN") {
        return { success: false, error: "no_token" };
    }
    const body = textContent.trim();
    if (!body) return { success: true };

    try {
        // Step 1 — Create a Workdoc inside the doc column cell
        //   CreateDocBoardInput only accepts: column_id (String!) and item_id (ID!)
        const createDocQuery = `mutation CreateDocInColumn($itemId: ID!, $columnId: String!) {
  create_doc(
    location: { board: { item_id: $itemId, column_id: $columnId } }
  ) {
    id
  }
}`;
        const docResult: any = await mondayRequest(
            createDocQuery,
            { itemId: Number(itemId), columnId },
            3,
            1000,
            MONDAY_API_VERSION_DOC_BLOCKS
        );
        const docId = docResult?.create_doc?.id;
        if (!docId) {
            return { success: false, error: "create_doc returned no id" };
        }

        // Step 2 — Add a normal_text block with the instructions content
        //   Monday expects Delta format: {"deltaFormat":[{"insert":"text\n"}]}
        const delta = JSON.stringify({
            deltaFormat: [{ insert: body + "\n" }]
        });
        const addBlockQuery = `mutation AddDocBlock($docId: ID!, $content: JSON!) {
  create_doc_block(doc_id: $docId, type: normal_text, content: $content) {
    id
  }
}`;
        await mondayRequest(
            addBlockQuery,
            { docId: Number(docId), content: delta },
            2,
            1000,
            MONDAY_API_VERSION_DOC_BLOCKS
        );

        console.log(`[Monday] Created doc (ID ${docId}) in column "${columnId}" for item ${itemId}`);
        return { success: true, docId: String(docId) };
    } catch (e: any) {
        return { success: false, error: e?.message || String(e) };
    }
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
        instructions?: string,
        rawVideoLink?: string
    }
) {
    // 1. Fetch Columns to map IDs
    const columns = await getBoardColumns(boardId);

    const getColId = (title: string) => columns.find((c: any) => c.title.toLowerCase().includes(title.toLowerCase()))?.id;
    const findInstructionColumn = () => {
        const isLoom = (t: string) => t.includes('loom');
        const exact = columns.find((c: any) => {
            const t = String(c.title || '').toLowerCase();
            if (isLoom(t)) return false;
            return t === 'instructions / notes' || t === 'instructions' || t === 'notes';
        });
        // Prefer a real text / long_text / doc column (API value shape depends on type).
        const fromKeyword = columns.filter((c: any) => {
            const t = String(c.title || '').toLowerCase();
            if (isLoom(t)) return false;
            return t.includes('instruction') || t.includes('notes');
        });
        return (
            fromKeyword.find((c: any) => c.type === 'doc' || c.type === 'long_text' || c.type === 'text') ||
            exact ||
            fromKeyword[0] ||
            columns.find((c: any) => {
                const t = String(c.title || '').toLowerCase();
                if (isLoom(t)) return false;
                return t.includes('instruction') || t.includes('notes');
            })
        );
    };

    const statusId = getColId('status') || 'status'; // fallback
    const typeId = getColId('type') || 'type';
    const priceId = getColId('price') || getColId('budget') || 'numbers';
    const instructionCol = findInstructionColumn();
    const instructionId = instructionCol?.id || getColId('instruction') || getColId('notes') || 'text';
    const instructionColResolved: any = instructionCol || (instructionId ? columns.find((c: any) => c.id === instructionId) : null);
    const priorityId = getColId('priority');
    const rawVideoId = getColId('raw video') || getColId('video link') || getColId('link');

    const columnValues: any = {};

    if (data.status) columnValues[statusId] = { label: data.status };
    if (data.type) columnValues[typeId] = { label: data.type };
    if (data.price) columnValues[priceId] = data.price;
    if (data.priority && priorityId) columnValues[priorityId] = { label: data.priority };
    const instructionSource = String(data.instructions ?? "").trim();
    const instructionPlain = instructionSource
        ? stripHtmlToPlainText(instructionSource).trim()
        : "";
    const isInstructionDocColumn = instructionColResolved?.type === "doc";
    // Only set column value for text/long_text columns; doc columns are handled after item creation
    if (instructionPlain && instructionId && !isInstructionDocColumn) {
        if (instructionColResolved?.type === "text") {
            columnValues[instructionId] = instructionPlain;
        } else {
            columnValues[instructionId] = { text: instructionPlain };
        }
    }
    if (data.rawVideoLink && rawVideoId) columnValues[rawVideoId] = { url: data.rawVideoLink, text: "Raw Video" };


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

                // Try exact lowercase match first
                let matchedUser = allUsers.find((u: any) => u.name.toLowerCase() === data.editor?.toLowerCase());

                // If not found, try a looser includes match (e.g. "John" in "John Mark")
                if (!matchedUser && data.editor) {
                    matchedUser = allUsers.find((u: any) =>
                        u.name.toLowerCase().includes(data.editor!.toLowerCase()) ||
                        data.editor!.toLowerCase().includes(u.name.toLowerCase())
                    );
                }

                if (matchedUser) {
                    // Verify the user is actually a board member before assigning
                    try {
                        const boardMembersQuery = `query { boards(ids: [${boardId}]) { owners { id } subscribers { id } } }`;
                        const boardMembersData = await mondayRequest(boardMembersQuery);
                        const board = boardMembersData?.boards?.[0];
                        const memberIds = new Set([
                            ...(board?.owners || []).map((u: any) => String(u.id)),
                            ...(board?.subscribers || []).map((u: any) => String(u.id))
                        ]);

                        if (memberIds.size > 0 && !memberIds.has(String(matchedUser.id))) {
                            console.warn(`Editor '${data.editor}' (ID: ${matchedUser.id}) is not a member of board ${boardId}. Skipping people column assignment.`);
                        } else {
                            columnValues[peopleCol.id] = { personsAndTeams: [{ id: Number(matchedUser.id), kind: "person" }] };
                            console.log(`Successfully mapped editor '${data.editor}' to Monday ID: ${matchedUser.id}`);
                        }
                    } catch (memberErr) {
                        // If board member check fails, attempt the assignment anyway
                        console.warn('Could not verify board membership, attempting assignment:', memberErr);
                        columnValues[peopleCol.id] = { personsAndTeams: [{ id: Number(matchedUser.id), kind: "person" }] };
                    }
                } else {
                    console.warn(`Could not find Monday User ID for editor: ${data.editor}. Available users: `, allUsers.map((u: any) => u.name).join(', '));
                }
            } catch (err) {
                console.error("Failed to map editor to User ID", err);
            }
        } else {
            console.warn("Could not find a 'People' column for Editor mapping.");
        }
    }

    // NEW: Deadline / Date Logic
    const deadlineId = getColId('deadline') || getColId('date') || getColId('timeline');
    if (data.timeline && deadlineId) {
        const col = columns.find((c: any) => c.id === deadlineId);
        if (col?.type === 'date') {
            // Check if input is datetime (PH wall time, often `…+08:00` from Assign Project; legacy `T` without Z = PH).
            if (data.timeline.includes('T')) {
                const utc = manilaWallTimeToMondayDateColumnUtc(data.timeline);
                columnValues[deadlineId] = { date: utc.date, time: utc.time };
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

    if (instructionPlain) {
        let docSynced = false;

        // If the Instructions column is a doc column, create a Workdoc inside it
        if (isInstructionDocColumn && instructionId) {
            const docResult = await createDocInColumn(String(newItemId), instructionId, instructionPlain);
            if (docResult.success) {
                docSynced = true;
            } else {
                console.warn(
                    "[Monday] Could not create doc in Instructions column. Error:",
                    docResult.error
                );
            }
        }

        // Fallback: sync to item description only when doc column was not used / failed
        if (!docSynced) {
            const r = await setItemDescriptionFromMarkdown(String(newItemId), instructionPlain);
            if (!r.success) {
                console.warn(
                    "[Monday] Could not sync instructions to the item Workdoc (description). " +
                    "Error:",
                    r.error
                );
            }
        }
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

export async function getApprovalItems(forceSync: boolean = false) {
    return getCachedOrFetch('approval_items', async () => {
        return getApprovalItemsFresh(forceSync);
    }, true, forceSync);
}

/** Parse workspace deadline: labels and calendar buckets use **Asia/Manila**; `date`+`time` in value JSON are UTC. */
function parseMondayItemDeadline(
    board: any,
    item: any,
    deadlineCol: any,
    now: Date
): { dueYmd: string | null; dueDate: Date | null; dueText: string } {
    let dueDate: Date | null = null;
    let dueYmd: string | null = null;
    let dueText = '';
    let valueUtcParsed = false;
    let showTimeInPh = false;

    if (!deadlineCol?.id) {
        return { dueYmd, dueDate, dueText };
    }

    const resolveAuxTime = (it: any): { hh: number; mm: number } | null => {
        const timeCol = (board.columns || []).find((c: any) => {
            const t = String(c?.title || '').toLowerCase();
            return t.includes('time') && !t.includes('tracking') && !t.includes('timezone');
        });
        if (!timeCol?.id) return null;
        const tv = it?.column_values?.find((v: any) => v.id === timeCol.id);
        const raw = String(tv?.text || tv?.display_value || '').trim();
        const m = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!m) return null;
        let hh = Number(m[1]);
        const mm = Number(m[2]);
        const ap = m[3].toUpperCase();
        if (ap === 'PM' && hh < 12) hh += 12;
        if (ap === 'AM' && hh === 12) hh = 0;
        if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
        return { hh, mm };
    };

    const deadlineVal = item.column_values?.find((cv: any) => cv.id === deadlineCol.id);
    const rawTextFromColumn = String(deadlineVal?.text || deadlineVal?.display_value || '').trim();
    dueText = rawTextFromColumn;
    const timeMatch = dueText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    const textSuggestsTime = !!(
        timeMatch
        || /T\d{1,2}:\d{2}/i.test(dueText)
        || /(\d{1,2}:\d{2}\s*(am|pm))/i.test(dueText)
    );

    if (deadlineVal?.value) {
        const fromApi = mondayDateColumnValueToUtcInstant(String(deadlineVal.value), deadlineCol.type);
        if (fromApi) {
            valueUtcParsed = true;
            dueDate = fromApi.instant;
            if (!Number.isNaN(dueDate.getTime())) {
                showTimeInPh = fromApi.showTimeInPh || textSuggestsTime;
                dueYmd = ymdInManila(dueDate);
                dueText = showTimeInPh
                    ? formatYmdHm24InManila(dueDate)
                    : ymdInManila(dueDate);
            }
        }
    }

    if (!dueDate && dueText) {
        const iso = dueText.match(/\d{4}-\d{2}-\d{2}/)?.[0];
        if (iso) {
            let hasTime = false;
            if (timeMatch) {
                hasTime = true;
                let hh = Number(timeMatch[1]);
                const mm = Number(timeMatch[2]);
                const ap = timeMatch[3].toUpperCase();
                if (ap === 'PM' && hh < 12) hh += 12;
                if (ap === 'AM' && hh === 12) hh = 0;
                dueDate = new Date(
                    `${iso}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00+08:00`
                );
            } else {
                const aux = resolveAuxTime(item);
                if (aux) {
                    hasTime = true;
                    const hid = String(aux.hh).padStart(2, '0');
                    const mid = String(aux.mm).padStart(2, '0');
                    dueDate = new Date(`${iso}T${hid}:${mid}:00+08:00`);
                } else {
                    dueDate = new Date(`${iso}T12:00:00+08:00`);
                }
            }
            if (dueDate && !Number.isNaN(dueDate.getTime())) {
                dueYmd = ymdInManila(dueDate);
                showTimeInPh = hasTime;
                dueText = showTimeInPh ? formatYmdHm24InManila(dueDate) : ymdInManila(dueDate);
            }
        } else {
            const withYear = /\b[A-Za-z]{3,9}\s+\d{1,2}\b/.test(dueText)
                ? `${dueText}, ${ymdInManila(now).slice(0, 4)}`
                : dueText;
            const parsedTs = Date.parse(withYear);
            if (!Number.isNaN(parsedTs)) {
                dueDate = new Date(parsedTs);
            }
        }
    }

    if (dueDate && !Number.isNaN(dueDate.getTime()) && !dueYmd) {
        dueYmd = ymdInManila(dueDate);
    }

    if (dueDate && !Number.isNaN(dueDate.getTime()) && !valueUtcParsed) {
        showTimeInPh = !!(timeMatch || resolveAuxTime(item));
        dueText = showTimeInPh ? formatYmdHm24InManila(dueDate) : ymdInManila(dueDate);
    }

    if (!valueUtcParsed && deadlineVal) {
        const displayBlob = [deadlineVal.text, deadlineVal.display_value]
            .map((s) => String(s || '').trim())
            .filter(Boolean)
            .join(' ');
        const displayIsos = displayBlob.match(/\d{4}-\d{2}-\d{2}/g) ?? null;
        const displayYmd = displayIsos && displayIsos.length > 0 ? displayIsos[displayIsos.length - 1]! : null;
        if (displayYmd && /^\d{4}-\d{2}-\d{2}$/.test(displayYmd)) {
            const [y, m, d] = displayYmd.split('-').map(Number);
            if (timeMatch) {
                let hh = Number(timeMatch[1]);
                const mm = Number(timeMatch[2]);
                const ap = timeMatch[3].toUpperCase();
                if (ap === 'PM' && hh < 12) hh += 12;
                if (ap === 'AM' && hh === 12) hh = 0;
                dueDate = new Date(
                    `${displayYmd}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00+08:00`
                );
            } else {
                const aux = resolveAuxTime(item);
                if (aux) {
                    const hid = String(aux.hh).padStart(2, '0');
                    const mid = String(aux.mm).padStart(2, '0');
                    dueDate = new Date(`${displayYmd}T${hid}:${mid}:00+08:00`);
                } else if (dueDate) {
                    const { h, m } = manilaWallHm24FromDate(dueDate);
                    dueDate = new Date(`${displayYmd}T${h}:${m}:00+08:00`);
                } else {
                    dueDate = new Date(`${displayYmd}T12:00:00+08:00`);
                }
            }
            if (dueDate && !Number.isNaN(dueDate.getTime())) {
                dueYmd = ymdInManila(dueDate);
                showTimeInPh = !!(timeMatch || resolveAuxTime(item));
                dueText = showTimeInPh ? formatYmdHm24InManila(dueDate) : ymdInManila(dueDate);
            }
        }
    }

    const reanchored = reanchorDeadlineYmdToOpsYear(dueYmd, dueDate, now);
    dueYmd = reanchored.dueYmd;
    dueDate = reanchored.dueDate;

    return { dueYmd, dueDate, dueText };
}

/** When dueYmd is in a past calendar year, roll month/day to the current year in **Manila** for operational bucketing. */
function reanchorDeadlineYmdToOpsYear(
    dueYmd: string | null,
    dueDate: Date | null,
    now: Date
): { dueYmd: string | null; dueDate: Date | null } {
    if (!dueYmd || !/^\d{4}-\d{2}-\d{2}$/.test(dueYmd)) {
        return { dueYmd, dueDate };
    }
    const y = Number(dueYmd.slice(0, 4));
    const cy = Number(ymdInManila(now).slice(0, 4));
    if (y >= cy) return { dueYmd, dueDate };
    const md = dueYmd.slice(5);
    const newYmd = `${cy}${md}`;
    const [ny, nm, nd] = newYmd.split('-').map(Number);
    if (Number.isNaN(ny) || Number.isNaN(nm) || Number.isNaN(nd)) {
        return { dueYmd, dueDate };
    }
    let newDueDate: Date | null = null;
    if (dueDate && !Number.isNaN(dueDate.getTime())) {
        const { h, m } = manilaWallHm24FromDate(dueDate);
        newDueDate = new Date(`${newYmd}T${h}:${m}:00+08:00`);
    } else {
        newDueDate = new Date(`${newYmd}T12:00:00+08:00`);
    }
    if (Number.isNaN(newDueDate.getTime())) {
        return { dueYmd, dueDate };
    }
    return { dueYmd: newYmd, dueDate: newDueDate };
}

function resolveWorkspaceEditorName(board: any, item: any, editorCol: any): string {
    let editorName = 'Unknown';
    if (editorCol) {
        const editorVal = item.column_values?.find((cv: any) => cv.id === editorCol.id);
        const rawEditor = editorVal?.display_value || editorVal?.text;
        if (rawEditor) editorName = String(rawEditor).split(',')[0].trim();
    }
    if (editorName === 'Unknown') {
        editorName = board.name
            .replace(/- Workspace/gi, '')
            .replace(/\(c-w-[\w-]+\)/gi, '')
            .replace(/\((Active|On Hold|Inactive|Done)\)/gi, '')
            .trim();
    }
    return editorName;
}

function resolveWorkspaceClientName(item: any, clientCol: any): string {
    if (!clientCol?.id) return '';
    const clientVal = item?.column_values?.find((cv: any) => cv.id === clientCol.id);
    return String(clientVal?.display_value || clientVal?.text || '').trim();
}

function isDeadlineDateTimePassed(dueDate: Date | null, now: Date): boolean {
    return !!(dueDate && !Number.isNaN(dueDate.getTime()) && dueDate.getTime() < now.getTime());
}

/**
 * Calendar buckets for admin lists. "Due today" is the **Manila** calendar day, even if the due
 * time has already passed — otherwise those rows disappear from both Today and Yesterday.
 */
function bucketEditorApprovalDeadline(
    dueYmd: string | null,
    dueDate: Date | null,
    todayYmd: string,
    now: Date
): { showDueToday: boolean; showBacklogOverdue: boolean } {
    if (!dueYmd) return { showDueToday: false, showBacklogOverdue: false };
    const isCalendarPast = dueYmd < todayYmd;
    const isCalendarToday = dueYmd === todayYmd;
    const timePassedToday = isCalendarToday && isDeadlineDateTimePassed(dueDate, now);
    return {
        showDueToday: isCalendarToday,
        showBacklogOverdue: isCalendarPast || timePassedToday,
    };
}

export async function getDueTodayItems(forceSync: boolean = false) {
    // v3: Due Today = full calendar day (not hiding rows after due time — those were missing from both lists).
    return getCachedOrFetch('due_today_items_v3', async () => {
        const allWorkspaceBoards = await getWorkspaceBoards(forceSync);
        const workspaceBoards = allWorkspaceBoards.filter((b: any) =>
            b.name.toLowerCase().includes('- workspace')
        );
        const boardIds = workspaceBoards.map((b: any) => b.id);
        const boardsWithItems = await getMultipleBoardItems(boardIds, forceSync);

        const now = new Date();
        const todayYmd = todaysYmdManila(now);
        const dueItems: any[] = [];

        const pickBestDeadlineColumn = (cols: any[], sampleItem?: any) => {
            const strictCandidates = cols.filter((c: any) => {
                const t = String(c?.title || '').trim().toLowerCase();
                return t.includes('ve project board') && t.includes('deadline') || t === 'deadline' || t === 'deadline date';
            });
            if (strictCandidates.length > 0) {
                if (!sampleItem?.column_values?.length) return strictCandidates[0];
                const byItemValue = [...strictCandidates].sort((a, b) => {
                    const av = sampleItem.column_values.find((v: any) => v.id === a.id);
                    const bv = sampleItem.column_values.find((v: any) => v.id === b.id);
                    const ar = String(av?.text || av?.display_value || '').trim();
                    const br = String(bv?.text || bv?.display_value || '').trim();
                    const as = (ar ? 10 : 0) + ((av?.value ? 10 : 0)) + (/(\d{1,2}:\d{2}\s*(am|pm))/i.test(ar) ? 5 : 0);
                    const bs = (br ? 10 : 0) + ((bv?.value ? 10 : 0)) + (/(\d{1,2}:\d{2}\s*(am|pm))/i.test(br) ? 5 : 0);
                    return bs - as;
                });
                return byItemValue[0];
            }
            const scoreCol = (c: any) => {
                const t = String(c?.title || '').toLowerCase().trim();
                let score = 0;
                if (t === 'deadline' || t === 'due date') score += 100;
                if (t.includes('deadline')) score += 40;
                if (t.includes('due')) score += 25;
                if (c?.type === 'date' || c?.type === 'timeline') score += 20;
                if (t.includes('created') || t.includes('updated') || t.includes('start')) score -= 30;
                if (sampleItem?.column_values?.length) {
                    const cv = sampleItem.column_values.find((v: any) => v.id === c.id);
                    const raw = String(cv?.text || cv?.display_value || '');
                    if (/(\d{1,2}:\d{2}\s*(am|pm))/i.test(raw)) score += 15;
                    if (cv?.value) {
                        try {
                            const parsed = JSON.parse(cv.value) as { time?: string };
                            if (parsed?.time) score += 15;
                        } catch {
                            /* ignore */
                        }
                    }
                }
                return score;
            };
            return [...(cols || [])].sort((a, b) => scoreCol(b) - scoreCol(a))[0] || null;
        };

        boardsWithItems.forEach((board: any) => {
            const statusCol = board.columns?.find((c: any) => {
                const title = String(c.title || '').toLowerCase();
                return title.includes('status') || title.includes('phase') || title.includes('stage') || c.type === 'status' || c.type === 'color';
            });
            const editorCol = board.columns?.find((c: any) => {
                const title = String(c.title || '').toLowerCase();
                return title.includes('editor') || title.includes('owner') || c.type === 'people';
            });
            const clientCol = board.columns?.find((c: any) => {
                const title = String(c.title || '').toLowerCase();
                return title.includes('client') || title.includes('customer') || title.includes('brand') || title.includes('company');
            });
            const deadlineCol = pickBestDeadlineColumn(board.columns || [], board.items?.[0]);
            if (!deadlineCol?.id) return;

            board.items?.forEach((item: any) => {
                const { dueYmd, dueDate, dueText } = parseMondayItemDeadline(board, item, deadlineCol, now);
                const { showDueToday } = bucketEditorApprovalDeadline(dueYmd, dueDate, todayYmd, now);
                if (!showDueToday) return;

                const editorName = resolveWorkspaceEditorName(board, item, editorCol);
                const clientName = resolveWorkspaceClientName(item, clientCol);

                const statusVal = statusCol ? item.column_values?.find((cv: any) => cv.id === statusCol.id) : null;
                const progressStatus = String(statusVal?.text || statusVal?.display_value || 'No status').trim();

                const dueAtSort =
                    dueDate && !Number.isNaN(dueDate.getTime())
                        ? dueDate.toISOString()
                        : (dueYmd || '');
                dueItems.push({
                    id: item.id,
                    name: item.name,
                    boardId: board.id,
                    boardName: board.name,
                    editor: editorName,
                    clientName,
                    progressStatus,
                    dueAt: dueAtSort,
                    dueText: dueText || dueYmd,
                });
            });
        });

        dueItems.sort((a, b) => {
            const ax = new Date((a as { dueAt?: string }).dueAt || 0).getTime();
            const bx = new Date((b as { dueAt?: string }).dueAt || 0).getTime();
            return (Number.isNaN(ax) ? 0 : ax) - (Number.isNaN(bx) ? 0 : bx);
        });
        return dueItems;
    }, true, forceSync);
}

/** Skip Due Yesterday row when status is already approved (e.g. Approved (CV)). Not "for approval". */
function isApprovedStatusHideFromDueYesterday(progressStatus: string): boolean {
    const t = progressStatus.toLowerCase().trim();
    if (!t) return false;
    if (t.includes('not approved') || t.includes('unapproved')) return false;
    return t.includes('approved');
}

/** Calendar yesterday in Asia/Manila — follow-up list for admin approvals. */
export async function getDueYesterdayItems(forceSync: boolean = false) {
    return getCachedOrFetch('due_yesterday_items', async () => {
        const allWorkspaceBoards = await getWorkspaceBoards(forceSync);
        const workspaceBoards = allWorkspaceBoards.filter((b: any) =>
            b.name.toLowerCase().includes('- workspace')
        );
        const boardIds = workspaceBoards.map((b: any) => b.id);
        const boardsWithItems = await getMultipleBoardItems(boardIds, forceSync);

        const now = new Date();
        const yesterdayYmd = yesterdaysYmdManila(now);
        const dueItems: any[] = [];

        const pickBestDeadlineColumn = (cols: any[], sampleItem?: any) => {
            const strictCandidates = cols.filter((c: any) => {
                const t = String(c?.title || '').trim().toLowerCase();
                return t.includes('ve project board') && t.includes('deadline') || t === 'deadline' || t === 'deadline date';
            });
            if (strictCandidates.length > 0) {
                if (!sampleItem?.column_values?.length) return strictCandidates[0];
                const byItemValue = [...strictCandidates].sort((a, b) => {
                    const av = sampleItem.column_values.find((v: any) => v.id === a.id);
                    const bv = sampleItem.column_values.find((v: any) => v.id === b.id);
                    const ar = String(av?.text || av?.display_value || '').trim();
                    const br = String(bv?.text || bv?.display_value || '').trim();
                    const as = (ar ? 10 : 0) + ((av?.value ? 10 : 0)) + (/(\d{1,2}:\d{2}\s*(am|pm))/i.test(ar) ? 5 : 0);
                    const bs = (br ? 10 : 0) + ((bv?.value ? 10 : 0)) + (/(\d{1,2}:\d{2}\s*(am|pm))/i.test(br) ? 5 : 0);
                    return bs - as;
                });
                return byItemValue[0];
            }
            const scoreCol = (c: any) => {
                const t = String(c?.title || '').toLowerCase().trim();
                let score = 0;
                if (t === 'deadline' || t === 'due date') score += 100;
                if (t.includes('deadline')) score += 40;
                if (t.includes('due')) score += 25;
                if (c?.type === 'date' || c?.type === 'timeline') score += 20;
                if (t.includes('created') || t.includes('updated') || t.includes('start')) score -= 30;
                if (sampleItem?.column_values?.length) {
                    const cv = sampleItem.column_values.find((v: any) => v.id === c.id);
                    const raw = String(cv?.text || cv?.display_value || '');
                    if (/(\d{1,2}:\d{2}\s*(am|pm))/i.test(raw)) score += 15;
                    if (cv?.value) {
                        try {
                            const parsed = JSON.parse(cv.value) as { time?: string };
                            if (parsed?.time) score += 15;
                        } catch {
                            /* ignore */
                        }
                    }
                }
                return score;
            };
            return [...(cols || [])].sort((a, b) => scoreCol(b) - scoreCol(a))[0] || null;
        };

        boardsWithItems.forEach((board: any) => {
            const statusCol = board.columns?.find((c: any) => {
                const title = String(c.title || '').toLowerCase();
                return title.includes('status') || title.includes('phase') || title.includes('stage') || c.type === 'status' || c.type === 'color';
            });
            const editorCol = board.columns?.find((c: any) => {
                const title = String(c.title || '').toLowerCase();
                return title.includes('editor') || title.includes('owner') || c.type === 'people';
            });
            const clientCol = board.columns?.find((c: any) => {
                const title = String(c.title || '').toLowerCase();
                return title.includes('client') || title.includes('customer') || title.includes('brand') || title.includes('company');
            });
            const deadlineCol = pickBestDeadlineColumn(board.columns || [], board.items?.[0]);
            if (!deadlineCol?.id) return;

            board.items?.forEach((item: any) => {
                const { dueYmd, dueDate, dueText } = parseMondayItemDeadline(board, item, deadlineCol, now);
                if (!dueYmd || dueYmd !== yesterdayYmd) return;

                const editorName = resolveWorkspaceEditorName(board, item, editorCol);
                const clientName = resolveWorkspaceClientName(item, clientCol);

                const statusVal = statusCol ? item.column_values?.find((cv: any) => cv.id === statusCol.id) : null;
                const progressStatus = String(statusVal?.text || statusVal?.display_value || 'No status').trim();
                if (isApprovedStatusHideFromDueYesterday(progressStatus)) return;

                const dueAtSortY =
                    dueDate && !Number.isNaN(dueDate.getTime())
                        ? dueDate.toISOString()
                        : (dueYmd || '');
                dueItems.push({
                    id: item.id,
                    name: item.name,
                    boardId: board.id,
                    boardName: board.name,
                    editor: editorName,
                    clientName,
                    progressStatus,
                    dueAt: dueAtSortY,
                    dueText: dueText || dueYmd,
                });
            });
        });

        dueItems.sort((a, b) => {
            const ax = new Date((a as { dueAt?: string }).dueAt || 0).getTime();
            const bx = new Date((b as { dueAt?: string }).dueAt || 0).getTime();
            return (Number.isNaN(ax) ? 0 : ax) - (Number.isNaN(bx) ? 0 : bx);
        });
        return dueItems;
    }, true, forceSync);
}

async function getApprovalItemsFresh(forceSync: boolean = false) {
    // 1. Get all Workspace Boards
    const allWorkspaceBoards = await getWorkspaceBoards(forceSync);
    // User Request: Only fetch ' - Workspace' boards, exclude generic Management boards for Approvals
    const workspaceBoards = allWorkspaceBoards.filter((b: any) =>
        b.name.toLowerCase().includes('- workspace')
    );

    // 2. Fetch Items
    const boardIds = workspaceBoards.map((b: any) => b.id);
    const boardsWithItems = await getMultipleBoardItems(boardIds, forceSync);

    const approvalItems: any[] = [];

    const pickBestDeadlineColumn = (cols: any[], sampleItem?: any) => {
        const strictCandidates = cols.filter((c: any) => {
            const t = String(c?.title || '').trim().toLowerCase();
            return t.includes('ve project board') && t.includes('deadline') || t === 'deadline' || t === 'deadline date';
        });
        if (strictCandidates.length > 0) {
            if (!sampleItem?.column_values?.length) return strictCandidates[0];
            const byItemValue = [...strictCandidates].sort((a, b) => {
                const av = sampleItem.column_values.find((v: any) => v.id === a.id);
                const bv = sampleItem.column_values.find((v: any) => v.id === b.id);
                const ar = String(av?.text || av?.display_value || '').trim();
                const br = String(bv?.text || bv?.display_value || '').trim();
                const as = (ar ? 10 : 0) + ((av?.value ? 10 : 0)) + (/(\d{1,2}:\d{2}\s*(am|pm))/i.test(ar) ? 5 : 0);
                const bs = (br ? 10 : 0) + ((bv?.value ? 10 : 0)) + (/(\d{1,2}:\d{2}\s*(am|pm))/i.test(br) ? 5 : 0);
                return bs - as;
            });
            return byItemValue[0];
        }
        const scoreCol = (c: any) => {
            const t = String(c?.title || '').toLowerCase().trim();
            let score = 0;
            if (t === 'deadline' || t === 'due date') score += 100;
            if (t.includes('deadline')) score += 40;
            if (t.includes('due')) score += 25;
            if (c?.type === 'date' || c?.type === 'timeline') score += 20;
            if (t.includes('created') || t.includes('updated') || t.includes('start')) score -= 30;
            if (sampleItem?.column_values?.length) {
                const cv = sampleItem.column_values.find((v: any) => v.id === c.id);
                const raw = String(cv?.text || cv?.display_value || '');
                if (/(\d{1,2}:\d{2}\s*(am|pm))/i.test(raw)) score += 15;
                if (cv?.value) {
                    try {
                        const parsed = JSON.parse(cv.value) as { time?: string };
                        if (parsed?.time) score += 15;
                    } catch {
                        /* ignore */
                    }
                }
            }
            return score;
        };
        return [...(cols || [])].sort((a, b) => scoreCol(b) - scoreCol(a))[0] || null;
    };

    boardsWithItems.forEach((board: any) => {
        // Find ALL relevant status columns to check
        // (Use filter instead of find to catch both "Status", "Project Status", "Phase", etc.)
        const statusCols = board.columns?.filter((c: any) => {
            const title = c.title.toLowerCase();
            return (
                title.includes('status') ||
                title.includes('phase') ||
                title.includes('stage') ||
                (c.type === 'color' && !title.includes('priority') && !title.includes('label'))
            );
        });

        const videoCol = board.columns?.find((c: any) =>
            c.title.toLowerCase().includes('video') ||
            c.title.toLowerCase().includes('link') ||
            c.title.toLowerCase().includes('portfolio') // Fallback
        );

        const editorCol = board.columns?.find((c: any) =>
            c.title.toLowerCase().includes('editor') ||
            c.title.toLowerCase().includes('owner') ||
            c.type === 'people'
        );
        const clientCol = board.columns?.find((c: any) => {
            const title = String(c?.title || '').toLowerCase();
            return title.includes('client') || title.includes('customer') || title.includes('brand') || title.includes('company');
        });
        const deadlineCol = pickBestDeadlineColumn(board.columns || [], board.items?.[0]);

        board.items?.forEach((item: any) => {
            // Check if ANY status column has an "Approval" or "Review" status
            let matchingStatusText = '';

            const hasApprovalStatus = statusCols?.some((col: any) => {
                const statusVal = item.column_values.find((cv: any) => cv.id === col.id);
                const text = (statusVal?.text || statusVal?.display_value || statusVal?.label || '').toLowerCase();
                if (text.includes('approval') || text.includes('review') || text.includes('q&a')) {
                    matchingStatusText = statusVal?.text || statusVal?.display_value || statusVal?.label || '';
                    return true;
                }
                return false;
            });

            if (hasApprovalStatus) {
                const videoVal = item.column_values.find((cv: any) => cv.id === videoCol?.id);

                // Extract clean URL
                let videoLink = '';
                if (videoVal) {
                    if (videoVal.text && videoVal.text.startsWith('http')) {
                        videoLink = videoVal.text.split(' ')[0];
                    } else if (videoVal.value) {
                        try {
                            const linkObj = JSON.parse(videoVal.value);
                            if (linkObj && linkObj.url) videoLink = linkObj.url;
                        } catch (e) { }
                    }
                }

                // Determine Editor Name
                let editorName = 'Unknown';
                if (editorCol) {
                    const editorVal = item.column_values.find((cv: any) => cv.id === editorCol.id);
                    const rawEditor = editorVal?.display_value || editorVal?.text;
                    if (rawEditor) {
                        editorName = rawEditor.split(',')[0].trim();
                    }
                }

                // Fallback: Parse from Board Name if column missing or empty
                if (editorName === 'Unknown') {
                    editorName = board.name
                        .replace(/- Workspace/gi, '')
                        .replace(/\(c-w-[\w-]+\)/gi, '')
                        .replace(/\((Active|On Hold|Inactive|Done)\)/gi, '')
                        .trim();
                }
                const clientName = resolveWorkspaceClientName(item, clientCol);

                const nowAppr = new Date();
                let dueAt: string | null = null;
                let dueText: string = '';
                if (deadlineCol?.id) {
                    const { dueDate, dueText: ph } = parseMondayItemDeadline(
                        board,
                        item,
                        deadlineCol,
                        nowAppr
                    );
                    if (dueDate && !Number.isNaN(dueDate.getTime())) {
                        dueAt = dueDate.toISOString();
                    }
                    dueText = ph;
                }

                approvalItems.push({
                    id: item.id,
                    name: item.name,
                    boardId: board.id,
                    boardName: board.name,
                    status: matchingStatusText,
                    editor: editorName,
                    clientName,
                    videoLink: videoLink,
                    createdAt: item.created_at,
                    group: item.group,
                    dueAt,
                    dueText: dueText || (dueAt ? formatYmdHm24InManila(new Date(dueAt)) : ''),
                });
            }
        });
    });

    return approvalItems;
}
