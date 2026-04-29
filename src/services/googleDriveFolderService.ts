import { supabase } from '../lib/supabaseClient';

export interface CreateDriveFoldersInput {
    mainFolderName: string;
    subfolderNames?: string[];
    foldersTree?: DriveFolderTreeNodeInput[];
}

export interface DriveFolderTreeNodeInput {
    name: string;
    children?: DriveFolderTreeNodeInput[];
}

export interface DriveFolderTreeNode {
    id: string;
    name: string;
    url: string;
    children: DriveFolderTreeNode[];
}

export interface CreateDriveFoldersResult {
    mainFolderId: string;
    mainFolderName: string;
    mainFolderUrl: string;
    subfolders: Array<{ id: string; name: string; url: string }>;
    foldersTree: DriveFolderTreeNode[];
}

export interface DriveRootFolderItem {
    id: string;
    name: string;
    url: string;
    modifiedTime?: string;
}

export interface DriveFolderContentItem {
    id: string;
    name: string;
    url: string;
    mimeType: string;
    modifiedTime?: string;
    size?: string;
}

export interface DriveItemDetails {
    id?: string;
    name?: string;
    mimeType?: string;
    size?: string;
    modifiedTime?: string;
    createdTime?: string;
    webViewLink?: string;
    parents?: string[];
    owners?: Array<{ displayName?: string; emailAddress?: string }>;
    lastModifyingUser?: { displayName?: string; emailAddress?: string };
}

export async function createGoogleDriveFolderTree(
    payload: CreateDriveFoldersInput
): Promise<CreateDriveFoldersResult> {
    const { data, error } = await supabase.functions.invoke('google-drive-create-folders', {
        body: payload,
    });

    if (error) {
        throw new Error(error.message || 'Failed to create Google Drive folders');
    }
    if (!data?.success || !data?.data) {
        throw new Error(data?.error || 'Invalid response while creating Google Drive folders');
    }
    return data.data as CreateDriveFoldersResult;
}

export async function listGoogleDriveRootFolders(search?: string): Promise<DriveRootFolderItem[]> {
    const { data, error } = await supabase.functions.invoke('google-drive-create-folders', {
        body: {
            action: 'list-root-folders',
            search: search?.trim() || undefined,
        },
    });

    if (error) {
        throw new Error(error.message || 'Failed to fetch Google Drive root folders');
    }
    if (!data?.success || !Array.isArray(data?.data?.folders)) {
        throw new Error(data?.error || 'Invalid response while listing Google Drive folders');
    }
    return data.data.folders as DriveRootFolderItem[];
}

export async function listGoogleDriveFolderContents(
    folderId: string,
    search?: string
): Promise<DriveFolderContentItem[]> {
    const { data, error } = await supabase.functions.invoke('google-drive-create-folders', {
        body: {
            action: 'list-folder-contents',
            folderId,
            search: search?.trim() || undefined,
        },
    });

    if (error) {
        throw new Error(error.message || 'Failed to fetch Google Drive folder contents');
    }
    if (!data?.success || !Array.isArray(data?.data?.items)) {
        throw new Error(data?.error || 'Invalid response while listing folder contents');
    }
    return data.data.items as DriveFolderContentItem[];
}

export function getGoogleDriveVideoStreamUrl(fileId: string): string {
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
    if (!supabaseUrl) {
        throw new Error('Missing VITE_SUPABASE_URL');
    }
    const u = new URL('/functions/v1/google-drive-create-folders', supabaseUrl);
    u.searchParams.set('action', 'stream-video');
    u.searchParams.set('fileId', fileId);
    return u.toString();
}

export async function moveGoogleDriveItem(itemId: string, destinationFolderId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('google-drive-create-folders', {
        body: {
            action: 'move-item',
            itemId,
            destinationFolderId,
        },
    });
    if (error) throw new Error(error.message || 'Failed to move Google Drive item');
    if (!data?.success) throw new Error(data?.error || 'Failed to move Google Drive item');
}

export async function trashGoogleDriveItem(itemId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('google-drive-create-folders', {
        body: {
            action: 'trash-item',
            itemId,
        },
    });
    if (error) throw new Error(error.message || 'Failed to delete Google Drive item');
    if (!data?.success) throw new Error(data?.error || 'Failed to delete Google Drive item');
}

export async function renameGoogleDriveItem(itemId: string, newName: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('google-drive-create-folders', {
        body: {
            action: 'rename-item',
            itemId,
            newName,
        },
    });
    if (error) throw new Error(error.message || 'Failed to rename Google Drive item');
    if (!data?.success) throw new Error(data?.error || 'Failed to rename Google Drive item');
}

export async function getGoogleDriveItemDetails(itemId: string): Promise<DriveItemDetails> {
    const { data, error } = await supabase.functions.invoke('google-drive-create-folders', {
        body: {
            action: 'get-item-details',
            itemId,
        },
    });
    if (error) throw new Error(error.message || 'Failed to fetch Google Drive item details');
    if (!data?.success || !data?.data?.details) {
        throw new Error(data?.error || 'Failed to fetch Google Drive item details');
    }
    return data.data.details as DriveItemDetails;
}
