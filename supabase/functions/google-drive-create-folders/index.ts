const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateFoldersRequest {
    action?: 'create' | 'list-root-folders' | 'list-folder-contents' | 'move-item' | 'trash-item' | 'rename-item' | 'get-item-details';
    mainFolderName?: string;
    subfolderNames?: string[];
    foldersTree?: FolderNodeInput[];
    search?: string;
    folderId?: string;
    itemId?: string;
    destinationFolderId?: string;
    newName?: string;
}

interface FolderNodeInput {
    name?: string;
    children?: FolderNodeInput[];
}

interface CreatedFolderNode {
    id: string;
    name: string;
    url: string;
    children: CreatedFolderNode[];
}

interface DriveFolder {
    id: string;
    name: string;
    webViewLink?: string;
}

function sanitizeName(input: string): string {
    return input
        .replace(/[\\/:*?"<>|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeDriveFolderId(input?: string): string | undefined {
    const raw = String(input || '').trim();
    if (!raw) return undefined;
    const folderMatch = raw.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch?.[1]) return folderMatch[1];
    const idMatch = raw.match(/^[a-zA-Z0-9_-]{10,}$/);
    if (idMatch?.[0]) return idMatch[0];
    return raw;
}

function base64UrlEncode(input: Uint8Array | string): string {
    const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i += 1) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
    const cleaned = pem
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s/g, '');
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

async function getOAuthRefreshAccessToken(): Promise<string | null> {
    const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')?.trim();
    const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')?.trim();
    const refreshToken = Deno.env.get('GOOGLE_OAUTH_REFRESH_TOKEN')?.trim();
    if (!clientId || !clientSecret || !refreshToken) return null;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson?.access_token) {
        throw new Error(`Google OAuth refresh exchange failed (${tokenRes.status}).`);
    }
    return String(tokenJson.access_token);
}

async function getDriveAccessToken(): Promise<string> {
    const staticAccessToken = Deno.env.get('GOOGLE_DRIVE_ACCESS_TOKEN')?.trim();
    if (staticAccessToken) return staticAccessToken;

    const oauthToken = await getOAuthRefreshAccessToken();
    if (oauthToken) return oauthToken;

    const clientEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')?.trim();
    const privateKeyRaw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')?.trim();
    if (!clientEmail || !privateKeyRaw) {
        throw new Error(
            'Missing Google Drive credentials. Set GOOGLE_DRIVE_ACCESS_TOKEN, or GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET + GOOGLE_OAUTH_REFRESH_TOKEN, or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in Supabase secrets.'
        );
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claimSet = {
        iss: clientEmail,
        scope: 'https://www.googleapis.com/auth/drive',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
    };

    const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claimSet))}`;
    const key = await crypto.subtle.importKey(
        'pkcs8',
        pemToArrayBuffer(privateKey),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const sigBuffer = await crypto.subtle.sign(
        { name: 'RSASSA-PKCS1-v1_5' },
        key,
        new TextEncoder().encode(signingInput)
    );
    const jwt = `${signingInput}.${base64UrlEncode(new Uint8Array(sigBuffer))}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson?.access_token) {
        throw new Error(`Google token exchange failed (${tokenRes.status}).`);
    }
    return String(tokenJson.access_token);
}

async function createFolder(
    accessToken: string,
    name: string,
    parentId?: string
): Promise<DriveFolder> {
    const body: Record<string, unknown> = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentId) body.parents = [parentId];

    const res = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
        const message = json?.error?.message || `Google Drive error ${res.status}`;
        throw new Error(message);
    }
    return {
        id: String(json.id),
        name: String(json.name || name),
        webViewLink: `https://drive.google.com/drive/folders/${json.id}`,
    };
}

function escapeDriveQueryLiteral(input: string): string {
    return input.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function listRootFolders(
    accessToken: string,
    rootParentId?: string,
    search?: string
): Promise<Array<{ id: string; name: string; url: string; modifiedTime?: string }>> {
    const clauses = [`mimeType='application/vnd.google-apps.folder'`, 'trashed=false'];
    if (rootParentId) clauses.push(`'${escapeDriveQueryLiteral(rootParentId)}' in parents`);
    if (search?.trim()) clauses.push(`name contains '${escapeDriveQueryLiteral(search.trim())}'`);
    const q = clauses.join(' and ');

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('supportsAllDrives', 'true');
    url.searchParams.set('includeItemsFromAllDrives', 'true');
    url.searchParams.set('q', q);
    url.searchParams.set('fields', 'files(id,name,modifiedTime),nextPageToken');
    url.searchParams.set('orderBy', 'name_natural');
    url.searchParams.set('pageSize', '200');

    const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = await res.json();
    if (!res.ok) {
        const message = json?.error?.message || `Google Drive error ${res.status}`;
        throw new Error(message);
    }
    const files = Array.isArray(json?.files) ? json.files : [];
    return files.map((f: any) => ({
        id: String(f.id),
        name: String(f.name || ''),
        url: `https://drive.google.com/drive/folders/${f.id}`,
        modifiedTime: typeof f.modifiedTime === 'string' ? f.modifiedTime : undefined,
    }));
}

async function listFolderContents(
    accessToken: string,
    folderId: string,
    search?: string
): Promise<Array<{ id: string; name: string; url: string; mimeType: string; modifiedTime?: string; size?: string }>> {
    const clauses = [`'${escapeDriveQueryLiteral(folderId)}' in parents`, 'trashed=false'];
    if (search?.trim()) clauses.push(`name contains '${escapeDriveQueryLiteral(search.trim())}'`);
    const q = clauses.join(' and ');

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('supportsAllDrives', 'true');
    url.searchParams.set('includeItemsFromAllDrives', 'true');
    url.searchParams.set('q', q);
    url.searchParams.set('fields', 'files(id,name,mimeType,modifiedTime,size,webViewLink),nextPageToken');
    url.searchParams.set('orderBy', 'folder,name_natural');
    url.searchParams.set('pageSize', '200');

    const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = await res.json();
    if (!res.ok) {
        const message = json?.error?.message || `Google Drive error ${res.status}`;
        throw new Error(message);
    }
    const files = Array.isArray(json?.files) ? json.files : [];
    return files.map((f: any) => ({
        id: String(f.id),
        name: String(f.name || ''),
        url: String(f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`),
        mimeType: String(f.mimeType || ''),
        modifiedTime: typeof f.modifiedTime === 'string' ? f.modifiedTime : undefined,
        size: typeof f.size === 'string' ? f.size : undefined,
    }));
}

async function resolveParentIds(accessToken: string, itemId: string): Promise<string[]> {
    const metaUrl = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(itemId)}`);
    metaUrl.searchParams.set('supportsAllDrives', 'true');
    metaUrl.searchParams.set('fields', 'parents');
    const res = await fetch(metaUrl.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = await res.json();
    if (!res.ok) {
        const message = json?.error?.message || `Google Drive error ${res.status}`;
        throw new Error(message);
    }
    return Array.isArray(json?.parents) ? json.parents.map((p: any) => String(p)) : [];
}

async function moveItemToFolder(accessToken: string, itemId: string, destinationFolderId: string): Promise<void> {
    const removeParents = (await resolveParentIds(accessToken, itemId)).join(',');
    const patchUrl = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(itemId)}`);
    patchUrl.searchParams.set('supportsAllDrives', 'true');
    patchUrl.searchParams.set('addParents', destinationFolderId);
    if (removeParents) patchUrl.searchParams.set('removeParents', removeParents);
    patchUrl.searchParams.set('fields', 'id');

    const res = await fetch(patchUrl.toString(), {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    });
    if (!res.ok) {
        const txt = await res.text();
        let message = `Failed to move item (${res.status}).`;
        try {
            const j = JSON.parse(txt);
            message = j?.error?.message || message;
        } catch {
            if (txt) message = txt.slice(0, 220);
        }
        throw new Error(message);
    }
}

async function trashItem(accessToken: string, itemId: string): Promise<void> {
    const patchUrl = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(itemId)}`);
    patchUrl.searchParams.set('supportsAllDrives', 'true');
    patchUrl.searchParams.set('fields', 'id,trashed');
    const res = await fetch(patchUrl.toString(), {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trashed: true }),
    });
    if (!res.ok) {
        const txt = await res.text();
        let message = `Failed to delete item (${res.status}).`;
        try {
            const j = JSON.parse(txt);
            message = j?.error?.message || message;
        } catch {
            if (txt) message = txt.slice(0, 220);
        }
        throw new Error(message);
    }
}

async function renameItem(accessToken: string, itemId: string, newName: string): Promise<void> {
    const patchUrl = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(itemId)}`);
    patchUrl.searchParams.set('supportsAllDrives', 'true');
    patchUrl.searchParams.set('fields', 'id,name');
    const res = await fetch(patchUrl.toString(), {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
    });
    if (!res.ok) {
        const txt = await res.text();
        let message = `Failed to rename item (${res.status}).`;
        try {
            const j = JSON.parse(txt);
            message = j?.error?.message || message;
        } catch {
            if (txt) message = txt.slice(0, 220);
        }
        throw new Error(message);
    }
}

async function getItemDetails(
    accessToken: string,
    itemId: string
): Promise<Record<string, unknown>> {
    const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(itemId)}`);
    url.searchParams.set('supportsAllDrives', 'true');
    url.searchParams.set(
        'fields',
        'id,name,mimeType,size,modifiedTime,createdTime,webViewLink,parents,owners(displayName,emailAddress),lastModifyingUser(displayName,emailAddress)'
    );
    const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = await res.json();
    if (!res.ok) {
        const message = json?.error?.message || `Google Drive error ${res.status}`;
        throw new Error(message);
    }
    return json as Record<string, unknown>;
}

async function streamVideoFromDrive(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const fileId = normalizeDriveFolderId(url.searchParams.get('fileId') || undefined);
    if (!fileId) {
        return new Response(JSON.stringify({ success: false, error: 'fileId is required.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const accessToken = await getDriveAccessToken();
    const driveUrl = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`);
    driveUrl.searchParams.set('alt', 'media');
    driveUrl.searchParams.set('supportsAllDrives', 'true');

    const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
    };
    const range = req.headers.get('range');
    if (range) headers.Range = range;

    const driveRes = await fetch(driveUrl.toString(), {
        method: 'GET',
        headers,
    });

    if (!driveRes.ok) {
        const txt = await driveRes.text();
        let message = `Google Drive stream failed (${driveRes.status}).`;
        try {
            const j = JSON.parse(txt);
            message = j?.error?.message || message;
        } catch {
            if (txt) message = txt.slice(0, 240);
        }
        return new Response(JSON.stringify({ success: false, error: message }), {
            status: driveRes.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const passthrough = new Headers();
    passthrough.set('Access-Control-Allow-Origin', '*');
    passthrough.set('Accept-Ranges', driveRes.headers.get('accept-ranges') || 'bytes');
    passthrough.set('Content-Type', driveRes.headers.get('content-type') || 'video/mp4');
    const len = driveRes.headers.get('content-length');
    const rangeOut = driveRes.headers.get('content-range');
    if (len) passthrough.set('Content-Length', len);
    if (rangeOut) passthrough.set('Content-Range', rangeOut);
    passthrough.set('Cache-Control', 'private, max-age=60');

    return new Response(driveRes.body, {
        status: driveRes.status,
        headers: passthrough,
    });
}

function normalizeFolderTree(body: CreateFoldersRequest): FolderNodeInput[] {
    if (Array.isArray(body.foldersTree) && body.foldersTree.length > 0) {
        return body.foldersTree;
    }
    return Array.isArray(body.subfolderNames)
        ? body.subfolderNames.map(name => ({ name }))
        : [];
}

function sanitizeFolderTree(nodes: FolderNodeInput[]): FolderNodeInput[] {
    const output: FolderNodeInput[] = [];
    const seen = new Set<string>();
    for (const node of nodes) {
        const name = sanitizeName(String(node?.name || ''));
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        output.push({
            name,
            children: sanitizeFolderTree(Array.isArray(node?.children) ? node.children : []),
        });
    }
    return output;
}

async function createFolderTree(
    accessToken: string,
    nodes: FolderNodeInput[],
    parentId: string
): Promise<CreatedFolderNode[]> {
    const result: CreatedFolderNode[] = [];
    for (const node of nodes) {
        const name = sanitizeName(String(node.name || ''));
        if (!name) continue;
        const created = await createFolder(accessToken, name, parentId);
        const children = await createFolderTree(
            accessToken,
            Array.isArray(node.children) ? node.children : [],
            created.id
        );
        result.push({
            id: created.id,
            name: created.name,
            url: created.webViewLink || '',
            children,
        });
    }
    return result;
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method === 'GET') {
        try {
            const url = new URL(req.url);
            const action = url.searchParams.get('action');
            if (action === 'stream-video') {
                return await streamVideoFromDrive(req);
            }
            return new Response(JSON.stringify({ success: false, error: 'Unknown GET action.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to process GET request';
            return new Response(JSON.stringify({ success: false, error: message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
    }
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = (await req.json()) as CreateFoldersRequest;
        const action = body.action || 'create';
        const rootParentId = normalizeDriveFolderId(Deno.env.get('GOOGLE_DRIVE_ROOT_FOLDER_ID'));
        const accessToken = await getDriveAccessToken();

        if (action === 'list-root-folders') {
            const folders = await listRootFolders(accessToken, rootParentId, body.search);
            return new Response(
                JSON.stringify({
                    success: true,
                    data: { folders },
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (action === 'list-folder-contents') {
            const folderId = normalizeDriveFolderId(body.folderId);
            if (!folderId) throw new Error('folderId is required for list-folder-contents action.');
            const items = await listFolderContents(accessToken, folderId, body.search);
            return new Response(
                JSON.stringify({
                    success: true,
                    data: { items },
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (action === 'move-item') {
            const itemId = normalizeDriveFolderId(body.itemId);
            const destinationFolderId = normalizeDriveFolderId(body.destinationFolderId);
            if (!itemId || !destinationFolderId) {
                throw new Error('itemId and destinationFolderId are required for move-item action.');
            }
            await moveItemToFolder(accessToken, itemId, destinationFolderId);
            return new Response(
                JSON.stringify({
                    success: true,
                    data: { moved: true, itemId, destinationFolderId },
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (action === 'trash-item') {
            const itemId = normalizeDriveFolderId(body.itemId);
            if (!itemId) throw new Error('itemId is required for trash-item action.');
            await trashItem(accessToken, itemId);
            return new Response(
                JSON.stringify({
                    success: true,
                    data: { trashed: true, itemId },
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (action === 'rename-item') {
            const itemId = normalizeDriveFolderId(body.itemId);
            const newName = sanitizeName(String(body.newName || ''));
            if (!itemId || !newName) throw new Error('itemId and newName are required for rename-item action.');
            await renameItem(accessToken, itemId, newName);
            return new Response(
                JSON.stringify({
                    success: true,
                    data: { renamed: true, itemId, newName },
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (action === 'get-item-details') {
            const itemId = normalizeDriveFolderId(body.itemId);
            if (!itemId) throw new Error('itemId is required for get-item-details action.');
            const details = await getItemDetails(accessToken, itemId);
            return new Response(
                JSON.stringify({
                    success: true,
                    data: { details },
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { mainFolderName } = body;
        const mainName = sanitizeName(String(mainFolderName || ''));
        if (!mainName) throw new Error('Main folder name is required.');

        const sanitizedTree = sanitizeFolderTree(normalizeFolderTree(body));
        if (sanitizedTree.length === 0) {
            throw new Error('At least one subfolder is required.');
        }

        const mainFolder = await createFolder(accessToken, mainName, rootParentId);
        const children = await createFolderTree(accessToken, sanitizedTree, mainFolder.id);

        return new Response(
            JSON.stringify({
                success: true,
                data: {
                    mainFolderId: mainFolder.id,
                    mainFolderName: mainFolder.name,
                    mainFolderUrl: mainFolder.webViewLink || '',
                    subfolders: children.map(({ id, name, url }) => ({ id, name, url })),
                    foldersTree: children,
                },
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create folders';
        return new Response(JSON.stringify({ success: false, error: message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
