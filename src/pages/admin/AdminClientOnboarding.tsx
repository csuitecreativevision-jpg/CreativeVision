import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { fireCvSwal } from '../../lib/swalTheme';
import { AlertTriangle, ArrowLeft, ChevronRight, CopyPlus, ExternalLink, File, FileVideo, Folder as FolderGlyph, FolderPlus, GripVertical, Info, LayoutGrid, List, Loader2, MoveRight, Pencil, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { createGoogleDriveFolderTree, getGoogleDriveItemDetails, getGoogleDriveVideoStreamUrl, listGoogleDriveFolderContents, listGoogleDriveRootFolders, moveGoogleDriveItem, renameGoogleDriveItem, trashGoogleDriveItem, type DriveFolderContentItem, type DriveItemDetails, type DriveRootFolderItem } from '../../services/googleDriveFolderService';
import Folder from '../../components/ui/Folder';
import { AnimatePresence, motion } from 'framer-motion';
import { usePortalTheme } from '../../contexts/PortalThemeContext';

type FolderNode = {
    id: string;
    name: string;
    children: FolderNode[];
};

type FolderTemplate = {
    id: string;
    name: string;
    nodes: FolderNode[];
};

type ContextMenuItem = {
    id: string;
    name: string;
    mimeType: string;
    source: 'root' | 'explorer';
    url?: string;
};

const STORAGE_KEY = 'admin_client_onboarding_templates_v1';

const createNode = (name = ''): FolderNode => ({
    id: `node_${Math.random().toString(36).slice(2, 10)}`,
    name,
    children: [],
});

const DEFAULT_TREE: FolderNode[] = [
    createNode('Raw Footage'),
    createNode('Project Files'),
    createNode('Exports'),
    createNode('Client Delivery'),
];

const DEFAULT_TEMPLATES: FolderTemplate[] = [
    {
        id: 'tpl_default_video',
        name: 'Video Editing Default',
        nodes: [
            createNode('Raw Footage'),
            createNode('Project Files'),
            {
                ...createNode('Edits'),
                children: [createNode('V1'), createNode('V2'), createNode('Final')],
            },
            createNode('Client Delivery'),
        ],
    },
];

const cloneNodes = (nodes: FolderNode[]): FolderNode[] =>
    nodes.map(n => ({ ...n, children: cloneNodes(n.children) }));

const updateNodeName = (nodes: FolderNode[], id: string, value: string): FolderNode[] =>
    nodes.map(n =>
        n.id === id ? { ...n, name: value } : { ...n, children: updateNodeName(n.children, id, value) }
    );

const addChildNode = (nodes: FolderNode[], parentId: string): FolderNode[] =>
    nodes.map(n =>
        n.id === parentId
            ? { ...n, children: [...n.children, createNode('')] }
            : { ...n, children: addChildNode(n.children, parentId) }
    );

function addSiblingNode(nodes: FolderNode[], targetId: string): { tree: FolderNode[]; added: boolean } {
    const idx = nodes.findIndex(n => n.id === targetId);
    if (idx >= 0) {
        const next = [...nodes];
        next.splice(idx + 1, 0, createNode(''));
        return { tree: next, added: true };
    }
    let added = false;
    const tree = nodes.map(n => {
        if (added) return n;
        const nested = addSiblingNode(n.children, targetId);
        if (nested.added) {
            added = true;
            return { ...n, children: nested.tree };
        }
        return n;
    });
    return { tree, added };
}

const removeNode = (nodes: FolderNode[], targetId: string): FolderNode[] =>
    nodes
        .filter(n => n.id !== targetId)
        .map(n => ({ ...n, children: removeNode(n.children, targetId) }));

function takeNodeById(nodes: FolderNode[], targetId: string): { tree: FolderNode[]; taken: FolderNode | null } {
    let taken: FolderNode | null = null;
    const tree: FolderNode[] = [];
    for (const node of nodes) {
        if (node.id === targetId) {
            taken = node;
            continue;
        }
        const nested = takeNodeById(node.children, targetId);
        if (nested.taken && !taken) {
            taken = nested.taken;
        }
        tree.push({ ...node, children: nested.tree });
    }
    return { tree, taken };
}

function insertNodeBeforeId(nodes: FolderNode[], targetId: string, incoming: FolderNode): { tree: FolderNode[]; inserted: boolean } {
    const idx = nodes.findIndex(n => n.id === targetId);
    if (idx >= 0) {
        const next = [...nodes];
        next.splice(idx, 0, incoming);
        return { tree: next, inserted: true };
    }
    let inserted = false;
    const tree = nodes.map(node => {
        if (inserted) return node;
        const nested = insertNodeBeforeId(node.children, targetId, incoming);
        if (nested.inserted) {
            inserted = true;
            return { ...node, children: nested.tree };
        }
        return node;
    });
    return { tree, inserted };
}

type PayloadNode = { name: string; children?: PayloadNode[] };
const toPayloadTree = (nodes: FolderNode[]): PayloadNode[] => {
    const out: PayloadNode[] = [];
    const seen = new Set<string>();
    for (const n of nodes) {
        const name = n.name.trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const children = toPayloadTree(n.children);
        out.push({ name, children: children.length ? children : undefined });
    }
    return out;
};

const countNodes = (nodes: FolderNode[]): number =>
    nodes.reduce((acc, n) => acc + 1 + countNodes(n.children), 0);
const EXISTING_FOLDER_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

export default function AdminClientOnboarding() {
    const { isDark } = usePortalTheme();
    const [mainFolderName, setMainFolderName] = useState('');
    const [folderTree, setFolderTree] = useState<FolderNode[]>(cloneNodes(DEFAULT_TREE));
    const [templates, setTemplates] = useState<FolderTemplate[]>(DEFAULT_TEMPLATES);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_TEMPLATES[0]?.id || '');
    const [isCreating, setIsCreating] = useState(false);
    const [existingFolders, setExistingFolders] = useState<DriveRootFolderItem[]>([]);
    const [isLoadingFolders, setIsLoadingFolders] = useState(false);
    const [folderSearch, setFolderSearch] = useState('');
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [folderGridRenderKey, setFolderGridRenderKey] = useState(0);
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);
    const [explorerStack, setExplorerStack] = useState<Array<{ id: string; name: string }>>([]);
    const [explorerItems, setExplorerItems] = useState<DriveFolderContentItem[]>([]);
    const [explorerSearch, setExplorerSearch] = useState('');
    const [isLoadingExplorer, setIsLoadingExplorer] = useState(false);
    const [explorerLayout, setExplorerLayout] = useState<'grid' | 'list'>('grid');
    const [previewVideo, setPreviewVideo] = useState<DriveFolderContentItem | null>(null);
    const [isMutatingExplorer, setIsMutatingExplorer] = useState(false);
    const [detailsItem, setDetailsItem] = useState<DriveItemDetails | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: ContextMenuItem } | null>(null);
    const longPressTimerRef = useRef<number | null>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as FolderTemplate[];
            if (!Array.isArray(parsed) || parsed.length === 0) return;
            setTemplates(parsed);
            setSelectedTemplateId(parsed[0]?.id || '');
        } catch {
            // ignore invalid saved templates
        }
    }, []);

    const persistTemplates = (next: FolderTemplate[]) => {
        setTemplates(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    };

    const applyTemplate = (templateId: string) => {
        const found = templates.find(t => t.id === templateId);
        if (!found) return;
        setFolderTree(cloneNodes(found.nodes));
    };

    const saveCurrentAsTemplate = async () => {
        const { value } = await fireCvSwal({
            title: 'Template name',
            input: 'text',
            inputPlaceholder: 'e.g. Social Media Package',
            showCancelButton: true,
            confirmButtonText: 'Save template',
            cancelButtonText: 'Cancel',
        });
        const name = String(value || '').trim();
        if (!name) return;
        const nodes = toPayloadTree(folderTree);
        if (nodes.length === 0) {
            await fireCvSwal({
                icon: 'warning',
                title: 'No folders to save',
                text: 'Add at least one folder before saving a template.',
                confirmButtonText: 'OK',
            });
            return;
        }
        const newTemplate: FolderTemplate = {
            id: `tpl_${Math.random().toString(36).slice(2, 10)}`,
            name,
            nodes: cloneNodes(folderTree),
        };
        const next = [...templates, newTemplate];
        persistTemplates(next);
        setSelectedTemplateId(newTemplate.id);
    };

    const deleteTemplate = async () => {
        const found = templates.find(t => t.id === selectedTemplateId);
        if (!found) return;
        const res = await fireCvSwal({
            icon: 'warning',
            title: 'Delete template?',
            text: `Template "${found.name}" will be removed.`,
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
        });
        if (!res.isConfirmed) return;
        const next = templates.filter(t => t.id !== found.id);
        persistTemplates(next.length ? next : DEFAULT_TEMPLATES);
        const nextSelected = (next.length ? next : DEFAULT_TEMPLATES)[0]?.id || '';
        setSelectedTemplateId(nextSelected);
    };

    const payloadTree = useMemo(() => toPayloadTree(folderTree), [folderTree]);
    const normalizedMain = mainFolderName.trim().toLowerCase();
    const exactDuplicate = useMemo(
        () => existingFolders.find(f => f.name.trim().toLowerCase() === normalizedMain),
        [existingFolders, normalizedMain]
    );

    const loadRootFolders = async (search?: string) => {
        setIsLoadingFolders(true);
        try {
            const folders = await listGoogleDriveRootFolders(search);
            setExistingFolders(folders);
        } catch (error: any) {
            await fireCvSwal({
                icon: 'error',
                title: 'Failed to load root folders',
                text: error?.message || 'Could not list folders in Google Drive root.',
                confirmButtonText: 'OK',
            });
        } finally {
            setIsLoadingFolders(false);
        }
    };

    const loadExplorerItems = async (folderId: string, search?: string) => {
        setIsLoadingExplorer(true);
        try {
            const items = await listGoogleDriveFolderContents(folderId, search);
            setExplorerItems(items);
        } catch (error: any) {
            await fireCvSwal({
                icon: 'error',
                title: 'Failed to load folder contents',
                text: error?.message || 'Could not list files/folders for this Drive folder.',
                confirmButtonText: 'OK',
            });
        } finally {
            setIsLoadingExplorer(false);
        }
    };

    const openExplorer = async (folder: DriveRootFolderItem) => {
        setExplorerStack([{ id: folder.id, name: folder.name }]);
        setExplorerSearch('');
        setIsExplorerOpen(true);
        await loadExplorerItems(folder.id);
    };

    const currentExplorerFolder = explorerStack[explorerStack.length - 1] || null;
    const explorerPathLabel = useMemo(() => {
        if (explorerStack.length === 0) return 'Drive';
        const parts = explorerStack.map(n => n.name);
        if (parts.length <= 4) return `Drive\\${parts.join('\\')}`;
        return `Drive\\${parts[0]}\\...\\${parts.slice(-2).join('\\')}`;
    }, [explorerStack]);
    const getDrivePreviewUrl = (item: DriveFolderContentItem) => `https://drive.google.com/file/d/${item.id}/preview`;

    const enterSubfolder = async (item: DriveFolderContentItem) => {
        setExplorerStack(prev => [...prev, { id: item.id, name: item.name }]);
        setExplorerSearch('');
        await loadExplorerItems(item.id);
    };

    const handleMoveItem = async (item: DriveFolderContentItem) => {
        const folderCandidates = explorerItems.filter(
            x => x.mimeType === 'application/vnd.google-apps.folder' && x.id !== item.id
        );
        if (folderCandidates.length === 0) {
            await fireCvSwal({
                icon: 'info',
                title: 'No destination folders',
                text: 'Create or open a folder destination first, then try move again.',
                confirmButtonText: 'OK',
            });
            return;
        }
        const options: Record<string, string> = {};
        folderCandidates.forEach(f => {
            options[f.id] = f.name;
        });
        const result = await fireCvSwal({
            title: `Move "${item.name}"`,
            input: 'select',
            inputOptions: options,
            inputPlaceholder: 'Select destination folder',
            showCancelButton: true,
            confirmButtonText: 'Move',
            cancelButtonText: 'Cancel',
        });
        const destination = String(result.value || '');
        if (!result.isConfirmed || !destination) return;

        setIsMutatingExplorer(true);
        try {
            await moveGoogleDriveItem(item.id, destination);
            if (currentExplorerFolder) await loadExplorerItems(currentExplorerFolder.id, explorerSearch);
        } catch (error: any) {
            await fireCvSwal({
                icon: 'error',
                title: 'Failed to move item',
                text: error?.message || 'Could not move this item.',
                confirmButtonText: 'OK',
            });
        } finally {
            setIsMutatingExplorer(false);
        }
    };

    const handleTrashItem = async (item: DriveFolderContentItem) => {
        const result = await fireCvSwal({
            icon: 'warning',
            title: `Delete "${item.name}"?`,
            text: 'This will move it to Google Drive trash.',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
        });
        if (!result.isConfirmed) return;

        setIsMutatingExplorer(true);
        try {
            await trashGoogleDriveItem(item.id);
            if (currentExplorerFolder) await loadExplorerItems(currentExplorerFolder.id, explorerSearch);
        } catch (error: any) {
            await fireCvSwal({
                icon: 'error',
                title: 'Failed to delete item',
                text: error?.message || 'Could not delete this item.',
                confirmButtonText: 'OK',
            });
        } finally {
            setIsMutatingExplorer(false);
        }
    };

    const handleTrashRootFolder = async (folder: DriveRootFolderItem) => {
        const result = await fireCvSwal({
            icon: 'warning',
            title: `Delete "${folder.name}"?`,
            text: 'This will move the folder to Google Drive trash.',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
        });
        if (!result.isConfirmed) return;

        setIsLoadingFolders(true);
        try {
            await trashGoogleDriveItem(folder.id);
            await loadRootFolders(folderSearch);
        } catch (error: any) {
            await fireCvSwal({
                icon: 'error',
                title: 'Failed to delete folder',
                text: error?.message || 'Could not delete this folder.',
                confirmButtonText: 'OK',
            });
        } finally {
            setIsLoadingFolders(false);
        }
    };

    const handleMoveRootFolder = async (folder: DriveRootFolderItem) => {
        const folderCandidates = existingFolders.filter(f => f.id !== folder.id);
        if (folderCandidates.length === 0) {
            await fireCvSwal({
                icon: 'info',
                title: 'No destination folders',
                text: 'Create another root folder first, then try move again.',
                confirmButtonText: 'OK',
            });
            return;
        }
        const options: Record<string, string> = {};
        folderCandidates.forEach(f => {
            options[f.id] = f.name;
        });
        const result = await fireCvSwal({
            title: `Move "${folder.name}"`,
            input: 'select',
            inputOptions: options,
            inputPlaceholder: 'Select destination folder',
            showCancelButton: true,
            confirmButtonText: 'Move',
            cancelButtonText: 'Cancel',
        });
        const destination = String(result.value || '');
        if (!result.isConfirmed || !destination) return;

        setIsLoadingFolders(true);
        try {
            await moveGoogleDriveItem(folder.id, destination);
            await loadRootFolders(folderSearch);
        } catch (error: any) {
            await fireCvSwal({
                icon: 'error',
                title: 'Failed to move folder',
                text: error?.message || 'Could not move this folder.',
                confirmButtonText: 'OK',
            });
        } finally {
            setIsLoadingFolders(false);
        }
    };

    const openContextMenuItem = async (menuItem: ContextMenuItem) => {
        if (menuItem.mimeType === 'application/vnd.google-apps.folder') {
            if (menuItem.source === 'root') {
                const folder = existingFolders.find(f => f.id === menuItem.id);
                if (folder) await openExplorer(folder);
            } else {
                await enterSubfolder({
                    id: menuItem.id,
                    name: menuItem.name,
                    mimeType: menuItem.mimeType,
                    url: menuItem.url || '',
                });
            }
        }
    };

    const clearLongPress = () => {
        if (longPressTimerRef.current) {
            window.clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const openContextMenuAt = (x: number, y: number, item: ContextMenuItem) => {
        const MENU_W = 160;
        const MENU_H = 210;
        const pad = 10;
        const maxX = Math.max(pad, window.innerWidth - MENU_W - pad);
        const maxY = Math.max(pad, window.innerHeight - MENU_H - pad);
        const safeX = Math.min(Math.max(x, pad), maxX);
        const safeY = Math.min(Math.max(y, pad), maxY);
        setContextMenu({ x: safeX, y: safeY, item });
    };

    const onCardContextMenu = (e: React.MouseEvent, item: ContextMenuItem) => {
        e.preventDefault();
        openContextMenuAt(e.clientX, e.clientY, item);
    };

    const onCardTouchStart = (e: React.TouchEvent, item: ContextMenuItem) => {
        clearLongPress();
        const t = e.touches[0];
        longPressTimerRef.current = window.setTimeout(() => {
            openContextMenuAt(t.clientX, t.clientY, item);
            longPressTimerRef.current = null;
        }, 450);
    };

    const toExplorerItem = (folder: DriveRootFolderItem): DriveFolderContentItem => ({
        id: folder.id,
        name: folder.name,
        url: folder.url,
        mimeType: 'application/vnd.google-apps.folder',
        modifiedTime: folder.modifiedTime,
    });

    useEffect(() => {
        const closeMenu = () => setContextMenu(null);
        window.addEventListener('click', closeMenu);
        window.addEventListener('scroll', closeMenu, true);
        return () => {
            window.removeEventListener('click', closeMenu);
            window.removeEventListener('scroll', closeMenu, true);
        };
    }, []);

    const handleRenameItem = async (item: DriveFolderContentItem) => {
        const result = await fireCvSwal({
            title: `Rename "${item.name}"`,
            input: 'text',
            inputValue: item.name,
            inputPlaceholder: 'Enter new file/folder name',
            showCancelButton: true,
            confirmButtonText: 'Rename',
            cancelButtonText: 'Cancel',
        });
        const newName = String(result.value || '').trim();
        if (!result.isConfirmed || !newName || newName === item.name.trim()) return;

        setIsMutatingExplorer(true);
        try {
            await renameGoogleDriveItem(item.id, newName);
            if (currentExplorerFolder) await loadExplorerItems(currentExplorerFolder.id, explorerSearch);
        } catch (error: any) {
            await fireCvSwal({
                icon: 'error',
                title: 'Failed to rename item',
                text: error?.message || 'Could not rename this item.',
                confirmButtonText: 'OK',
            });
        } finally {
            setIsMutatingExplorer(false);
        }
    };

    const handleViewDetails = async (item: DriveFolderContentItem) => {
        setIsMutatingExplorer(true);
        try {
            const details = await getGoogleDriveItemDetails(item.id);
            setDetailsItem(details);
            setIsDetailsOpen(true);
        } catch (error: any) {
            await fireCvSwal({
                icon: 'error',
                title: 'Failed to load details',
                text: error?.message || 'Could not fetch details for this item.',
                confirmButtonText: 'OK',
            });
        } finally {
            setIsMutatingExplorer(false);
        }
    };

    const goToExplorerIndex = async (index: number) => {
        const nextStack = explorerStack.slice(0, index + 1);
        setExplorerStack(nextStack);
        setExplorerSearch('');
        const target = nextStack[nextStack.length - 1];
        if (target) await loadExplorerItems(target.id);
    };

    useEffect(() => {
        void loadRootFolders();
    }, []);

    useEffect(() => {
        const t = window.setTimeout(() => {
            void loadRootFolders(folderSearch);
        }, 220);
        return () => window.clearTimeout(t);
    }, [folderSearch]);

    useEffect(() => {
        if (!currentExplorerFolder) return;
        const t = window.setTimeout(() => {
            void loadExplorerItems(currentExplorerFolder.id, explorerSearch);
        }, 220);
        return () => window.clearTimeout(t);
    }, [explorerSearch, currentExplorerFolder?.id]);

    const handleCreate = async () => {
        const folderName = mainFolderName.trim();
        if (!folderName) {
            await fireCvSwal({
                icon: 'warning',
                title: 'Main folder name required',
                text: 'Please enter a client or project name first.',
                confirmButtonText: 'OK',
            });
            return;
        }
        if (payloadTree.length === 0) {
            await fireCvSwal({
                icon: 'warning',
                title: 'Subfolders required',
                text: 'Add at least one folder in the structure.',
                confirmButtonText: 'OK',
            });
            return;
        }
        if (exactDuplicate) {
            const res = await fireCvSwal({
                icon: 'warning',
                title: 'Possible duplicate folder',
                html: `A folder named <b>${exactDuplicate.name}</b> already exists.<br/>Create another one anyway?`,
                showCancelButton: true,
                confirmButtonText: 'Create Anyway',
                cancelButtonText: 'Cancel',
            });
            if (!res.isConfirmed) return;
        }

        setIsCreating(true);
        try {
            const result = await createGoogleDriveFolderTree({
                mainFolderName: folderName,
                foldersTree: payloadTree,
            });
            const swalResult = await fireCvSwal({
                icon: 'success',
                title: 'Client folder structure created',
                html: `Main folder: <b>${result.mainFolderName}</b><br/><br/>Created <b>${countNodes(result.foldersTree)}</b> nested folders.`,
                confirmButtonText: 'Open Main Folder',
                showCancelButton: true,
                cancelButtonText: 'Close',
            });
            if (swalResult.isConfirmed) {
                window.open(result.mainFolderUrl, '_blank', 'noopener,noreferrer');
            }
            setIsBuilderOpen(false);
            await loadRootFolders(folderSearch);
        } catch (error: any) {
            await fireCvSwal({
                icon: 'error',
                title: 'Drive onboarding failed',
                text: error?.message || 'Could not create Drive folders.',
                confirmButtonText: 'OK',
            });
        } finally {
            setIsCreating(false);
        }
    };

    const renderNodes = (nodes: FolderNode[], depth = 0): ReactNode =>
        nodes.map((node, index) => (
            <div key={node.id} className="space-y-2">
                <div className="flex items-center gap-2" style={{ marginLeft: `${depth * 18}px` }}>
                    <button
                        type="button"
                        draggable
                        onDragStart={e => {
                            setDraggingNodeId(node.id);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', node.id);
                        }}
                        onDragEnd={() => {
                            setDraggingNodeId(null);
                            setDragOverNodeId(null);
                        }}
                        onDragOver={e => {
                            e.preventDefault();
                            if (draggingNodeId && draggingNodeId !== node.id) {
                                e.dataTransfer.dropEffect = 'move';
                                setDragOverNodeId(node.id);
                            }
                        }}
                        onDrop={e => {
                            e.preventDefault();
                            const dragId = draggingNodeId || e.dataTransfer.getData('text/plain');
                            if (!dragId || dragId === node.id) return;
                            setFolderTree(prev => {
                                const removed = takeNodeById(prev, dragId);
                                if (!removed.taken) return prev;
                                const inserted = insertNodeBeforeId(removed.tree, node.id, removed.taken);
                                return inserted.inserted ? inserted.tree : [removed.taken, ...removed.tree];
                            });
                            setDraggingNodeId(null);
                            setDragOverNodeId(null);
                        }}
                        className={`h-10 w-8 rounded-lg border transition-colors flex items-center justify-center ${
                            draggingNodeId === node.id
                                ? 'border-violet-400/50 bg-violet-500/20 text-violet-100'
                                : dragOverNodeId === node.id
                                  ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100'
                                  : 'border-white/[0.1] text-white/45 hover:text-white hover:border-white/25'
                        }`}
                        title="Drag to reorder"
                    >
                        <GripVertical className="w-4 h-4" />
                    </button>
                    <input
                        type="text"
                        value={node.name}
                        onChange={e => setFolderTree(prev => updateNodeName(prev, node.id, e.target.value))}
                        placeholder={depth === 0 ? `Subfolder ${index + 1}` : 'Nested subfolder'}
                        className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
                    />
                    <button
                        type="button"
                        onClick={() => setFolderTree(prev => addChildNode(prev, node.id))}
                        className="h-10 px-2.5 rounded-xl border border-white/[0.1] text-white/60 hover:text-white hover:border-white/25 transition-colors inline-flex items-center gap-1"
                        title="Add child subfolder"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-semibold">Child</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFolderTree(prev => addSiblingNode(prev, node.id).tree)}
                        className="h-10 w-10 rounded-xl border border-white/[0.1] text-white/50 hover:text-white hover:border-white/25 transition-colors flex items-center justify-center"
                        title="Add sibling folder"
                    >
                        <CopyPlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setFolderTree(prev => removeNode(prev, node.id))}
                        className="h-10 w-10 rounded-xl border border-white/[0.1] text-white/45 hover:text-red-300 hover:border-red-400/40 transition-colors flex items-center justify-center"
                        title="Remove folder"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                {node.children.length > 0 ? renderNodes(node.children, depth + 1) : null}
            </div>
        ));

    return (
        <AdminPageLayout
            label="Admin"
            title="Client Onboarding"
            subtitle="Browse existing client folders and create new structures from a focused builder."
        >
            <div
                className="w-full max-w-6xl mx-auto px-2 sm:px-0"
                onContextMenu={e => e.preventDefault()}
            >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">
                            Existing Folders in Root ({existingFolders.length})
                        </p>
                        <p className="text-[11px] text-white/40 mt-1">Check existing client folders before onboarding a new one.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsBuilderOpen(true)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-violet-500 hover:bg-violet-400 text-white transition-colors"
                    >
                        <FolderPlus className="w-4 h-4" />
                        New Client Folder Structure
                    </button>
                </div>

                <div className="flex items-center gap-2 mb-5">
                    <input
                        type="text"
                        value={folderSearch}
                        onChange={e => setFolderSearch(e.target.value)}
                        placeholder="Search existing root folders..."
                        className="w-full sm:w-80 bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
                    />
                    <button
                        type="button"
                        onClick={() => void loadRootFolders(folderSearch)}
                        disabled={isLoadingFolders}
                        className="h-10 px-3 rounded-xl border border-violet-500/30 text-violet-200 text-[11px] font-semibold hover:text-white hover:border-violet-400/50 transition-colors disabled:opacity-50"
                    >
                        Search
                    </button>
                    <button
                        type="button"
                        onClick={() => void loadRootFolders(folderSearch)}
                        disabled={isLoadingFolders}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-white/[0.12] text-white/70 hover:text-white hover:border-white/25 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFolders ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {existingFolders.length === 0 ? (
                    <div className="py-16 text-center text-[12px] text-white/35">No folders found for current root/search.</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10 pt-2 pb-8">
                        {existingFolders.map((folder, index) => (
                            <div
                                key={`${folder.id}-${folderGridRenderKey}`}
                                className="flex flex-col items-center gap-2 group"
                                onContextMenu={e =>
                                    onCardContextMenu(e, {
                                        id: folder.id,
                                        name: folder.name,
                                        mimeType: 'application/vnd.google-apps.folder',
                                        source: 'root',
                                        url: folder.url,
                                    })
                                }
                                onTouchStart={e =>
                                    onCardTouchStart(e, {
                                        id: folder.id,
                                        name: folder.name,
                                        mimeType: 'application/vnd.google-apps.folder',
                                        source: 'root',
                                        url: folder.url,
                                    })
                                }
                                onTouchEnd={clearLongPress}
                                onTouchMove={clearLongPress}
                                onTouchCancel={clearLongPress}
                            >
                                <div style={{ width: 100, height: 110, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                    <div
                                        onContextMenu={e =>
                                            onCardContextMenu(e, {
                                                id: folder.id,
                                                name: folder.name,
                                                mimeType: 'application/vnd.google-apps.folder',
                                                source: 'root',
                                                url: folder.url,
                                            })
                                        }
                                        onTouchStart={e =>
                                            onCardTouchStart(e, {
                                                id: folder.id,
                                                name: folder.name,
                                                mimeType: 'application/vnd.google-apps.folder',
                                                source: 'root',
                                                url: folder.url,
                                            })
                                        }
                                        onTouchEnd={clearLongPress}
                                        onTouchMove={clearLongPress}
                                        onTouchCancel={clearLongPress}
                                    >
                                        <Folder
                                            color={EXISTING_FOLDER_COLORS[index % EXISTING_FOLDER_COLORS.length]}
                                            size={1}
                                            onOpen={() => {
                                                void openExplorer(folder);
                                                // Remount folders so animated icon does not remain visually "open".
                                                setTimeout(() => setFolderGridRenderKey(k => k + 1), 60);
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="w-full flex flex-col items-center">
                                    <p className="text-[11px] font-semibold text-white/60 group-hover:text-white/90 text-center leading-tight line-clamp-2 max-w-[110px] transition-colors">
                                        {folder.name}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isExplorerOpen && (
                    <motion.div
                        className={`fixed inset-0 z-[119] flex items-center justify-center p-4 ${
                            isDark ? 'bg-black/70 backdrop-blur-sm' : 'bg-zinc-900/35 backdrop-blur-[2px]'
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <motion.div
                            className={`w-full max-w-6xl h-[calc(100vh-7rem)] sm:h-[88vh] overflow-hidden rounded-2xl p-4 sm:p-6 space-y-4 mt-16 sm:mt-0 ${
                                isDark
                                    ? 'border border-white/[0.12] bg-[#0d0d18]'
                                    : 'border border-zinc-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.18)]'
                            }`}
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.99 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="flex items-start justify-between gap-3 flex-shrink-0">
                                <div className="min-w-0">
                                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Drive Explorer</h3>
                                    <p className={`mt-1 text-[11px] ${isDark ? 'text-white/55' : 'text-zinc-600'}`}>
                                        {explorerPathLabel}
                                    </p>
                                </div>
                                <div className="flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setIsExplorerOpen(false)}
                                        className={`h-8 w-8 rounded-lg border inline-flex items-center justify-center ${
                                            isDark
                                                ? 'border-white/[0.14] text-white/70 hover:text-white hover:border-white/30'
                                                : 'border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400'
                                        }`}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (explorerStack.length > 1) void goToExplorerIndex(explorerStack.length - 2);
                                        }}
                                        disabled={explorerStack.length <= 1}
                                        className={`h-9 px-3 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1 ${
                                            isDark
                                                ? 'border-white/[0.14] text-white/70 hover:text-white hover:border-white/30 disabled:opacity-40'
                                                : 'border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400 disabled:opacity-40'
                                        }`}
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                                    </button>
                                    <div className={`flex-1 min-w-0 overflow-x-auto whitespace-nowrap rounded-lg border px-2 py-1.5 ${isDark ? 'border-white/[0.12] bg-white/[0.02]' : 'border-zinc-200 bg-zinc-50'}`}>
                                        <button
                                            type="button"
                                            onClick={() => explorerStack.length > 0 && void goToExplorerIndex(0)}
                                            className={`text-[11px] ${isDark ? 'text-violet-300 hover:text-violet-200' : 'text-violet-700 hover:text-violet-900'}`}
                                        >
                                            Drive
                                        </button>
                                        {explorerStack.map((node, i) => (
                                            <span key={node.id} className="text-[11px]">
                                                <span className={isDark ? 'text-white/30 px-1' : 'text-zinc-400 px-1'}>\</span>
                                                <button
                                                    type="button"
                                                    onClick={() => void goToExplorerIndex(i)}
                                                    className={`${
                                                        i === explorerStack.length - 1
                                                            ? isDark ? 'text-white/85' : 'text-zinc-900'
                                                            : isDark ? 'text-violet-300 hover:text-violet-200' : 'text-violet-700 hover:text-violet-900'
                                                    }`}
                                                >
                                                    {node.name}
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <input
                                        type="text"
                                        value={explorerSearch}
                                        onChange={e => setExplorerSearch(e.target.value)}
                                        placeholder="Search current folder..."
                                        className={`w-full sm:w-80 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors ${
                                            isDark
                                                ? 'bg-white/[0.04] border border-white/[0.07] text-white placeholder-white/20 focus:border-violet-500/50'
                                                : 'bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-violet-500'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => currentExplorerFolder && void loadExplorerItems(currentExplorerFolder.id, explorerSearch)}
                                        disabled={isLoadingExplorer || !currentExplorerFolder}
                                        className="h-10 px-3 rounded-xl border border-violet-500/30 text-violet-200 text-[11px] font-semibold hover:text-white hover:border-violet-400/50 transition-colors disabled:opacity-50"
                                    >
                                        Search
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => currentExplorerFolder && void loadExplorerItems(currentExplorerFolder.id, explorerSearch)}
                                        disabled={isLoadingExplorer || !currentExplorerFolder}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border ${
                                            isDark ? 'border-white/[0.12] text-white/70 hover:text-white' : 'border-zinc-300 text-zinc-700 hover:text-zinc-900'
                                        } disabled:opacity-50`}
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingExplorer ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </button>
                                    <div className={`inline-flex items-center rounded-lg border overflow-hidden ml-auto ${isDark ? 'border-white/[0.12]' : 'border-zinc-300'}`}>
                                        <button
                                            type="button"
                                            onClick={() => setExplorerLayout('grid')}
                                            className={`h-9 px-2.5 inline-flex items-center gap-1 text-[11px] ${
                                                explorerLayout === 'grid'
                                                    ? isDark ? 'bg-violet-500/30 text-white' : 'bg-violet-100 text-violet-800'
                                                    : isDark ? 'text-white/70 hover:text-white' : 'text-zinc-700 hover:text-zinc-900'
                                            }`}
                                            title="Grid layout"
                                        >
                                            <LayoutGrid className="w-3.5 h-3.5" /> Grid
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setExplorerLayout('list')}
                                            className={`h-9 px-2.5 inline-flex items-center gap-1 text-[11px] ${
                                                explorerLayout === 'list'
                                                    ? isDark ? 'bg-violet-500/30 text-white' : 'bg-violet-100 text-violet-800'
                                                    : isDark ? 'text-white/70 hover:text-white' : 'text-zinc-700 hover:text-zinc-900'
                                            }`}
                                            title="List layout"
                                        >
                                            <List className="w-3.5 h-3.5" /> List
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl overflow-auto flex-1 min-h-0">
                                {isLoadingExplorer || isMutatingExplorer ? (
                                    <div className="py-14 flex items-center justify-center text-white/50 text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> {isMutatingExplorer ? 'Applying changes...' : 'Loading folder...'}
                                    </div>
                                ) : explorerItems.length === 0 ? (
                                    <div className={`py-14 text-center text-sm ${isDark ? 'text-white/40' : 'text-zinc-500'}`}>No items in this folder.</div>
                                ) : explorerLayout === 'grid' ? (
                                    <div className="p-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-6">
                                            {explorerItems.map((item, idx) => {
                                                const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
                                                const isVideo = item.mimeType.startsWith('video/');
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="flex flex-col items-center gap-2 group cursor-pointer"
                                                        onClick={() => {
                                                            if (isFolder) void enterSubfolder(item);
                                                        }}
                                                        onDoubleClick={() => {
                                                            if (isFolder) void enterSubfolder(item);
                                                        }}
                                                        onContextMenu={e =>
                                                            onCardContextMenu(e, {
                                                                id: item.id,
                                                                name: item.name,
                                                                mimeType: item.mimeType,
                                                                source: 'explorer',
                                                                url: item.url,
                                                            })
                                                        }
                                                        onTouchStart={e =>
                                                            onCardTouchStart(e, {
                                                                id: item.id,
                                                                name: item.name,
                                                                mimeType: item.mimeType,
                                                                source: 'explorer',
                                                                url: item.url,
                                                            })
                                                        }
                                                        onTouchEnd={clearLongPress}
                                                        onTouchMove={clearLongPress}
                                                        onTouchCancel={clearLongPress}
                                                        title={isFolder ? 'Double-click to open folder' : item.name}
                                                    >
                                                        <div style={{ width: 94, height: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                                            {isFolder ? (
                                                                <Folder
                                                                    color={EXISTING_FOLDER_COLORS[idx % EXISTING_FOLDER_COLORS.length]}
                                                                    size={0.95}
                                                                    onOpen={() => void enterSubfolder(item)}
                                                                />
                                                            ) : (
                                                                <span className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${isDark ? 'bg-white/[0.06]' : 'bg-zinc-100'}`}>
                                                                    {isVideo ? (
                                                                        <FileVideo className={`w-7 h-7 ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`} />
                                                                    ) : (
                                                                        <File className={`w-7 h-7 ${isDark ? 'text-white/70' : 'text-zinc-600'}`} />
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-[11px] text-center leading-tight line-clamp-2 max-w-[120px] ${isDark ? 'text-white/75' : 'text-zinc-700'}`}>
                                                            {item.name}
                                                        </p>
                                                        <p className={`text-[10px] ${isDark ? 'text-white/35' : 'text-zinc-500'}`}>
                                                            Right-click / long press for options
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/[0.06]">
                                        {explorerItems.map(item => {
                                            const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
                                            const isVideo = item.mimeType.startsWith('video/');
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="px-3 py-2.5 flex items-center justify-between gap-2"
                                                    onDoubleClick={() => {
                                                        if (isFolder) void enterSubfolder(item);
                                                    }}
                                                    onContextMenu={e =>
                                                        onCardContextMenu(e, {
                                                            id: item.id,
                                                            name: item.name,
                                                            mimeType: item.mimeType,
                                                            source: 'explorer',
                                                            url: item.url,
                                                        })
                                                    }
                                                    onTouchStart={e =>
                                                        onCardTouchStart(e, {
                                                            id: item.id,
                                                            name: item.name,
                                                            mimeType: item.mimeType,
                                                            source: 'explorer',
                                                            url: item.url,
                                                        })
                                                    }
                                                    onTouchEnd={clearLongPress}
                                                    onTouchMove={clearLongPress}
                                                    onTouchCancel={clearLongPress}
                                                    title={isFolder ? 'Double-click to open folder' : item.name}
                                                >
                                                    <div className="min-w-0 flex items-center gap-2">
                                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${isDark ? 'bg-white/[0.06]' : 'bg-zinc-100'}`}>
                                                            {isFolder ? (
                                                                <FolderGlyph className={`w-4 h-4 ${isDark ? 'text-violet-300' : 'text-violet-600'}`} />
                                                            ) : isVideo ? (
                                                                <FileVideo className={`w-4 h-4 ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`} />
                                                            ) : (
                                                                <File className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-zinc-600'}`} />
                                                            )}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className={`text-[12px] truncate ${isDark ? 'text-white/85' : 'text-zinc-800'}`}>{item.name}</p>
                                                            <p className={`text-[10px] truncate ${isDark ? 'text-white/35' : 'text-zinc-500'}`}>{item.mimeType}</p>
                                                        </div>
                                                    </div>
                                                    <p className={`text-[10px] ${isDark ? 'text-white/35' : 'text-zinc-500'}`}>
                                                        Right-click / long press
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                {isBuilderOpen && (
                    <motion.div
                        className={`fixed inset-0 z-[120] flex items-center justify-center p-4 ${
                            isDark ? 'bg-black/70 backdrop-blur-sm' : 'bg-zinc-900/35 backdrop-blur-[2px]'
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <motion.div
                            className={`w-full max-w-3xl max-h-[90vh] overflow-auto rounded-2xl p-5 sm:p-6 space-y-5 ${
                                isDark
                                    ? 'border border-white/[0.12] bg-[#0d0d18]'
                                    : 'border border-zinc-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.18)]'
                            }`}
                            initial={{ opacity: 0, y: 24, scale: 0.975 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.985 }}
                            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                        >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Create Client Folder Structure</h3>
                                <p className={`text-[11px] mt-1 ${isDark ? 'text-white/40' : 'text-zinc-600'}`}>Use templates and nested folders, then create in Drive.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsBuilderOpen(false)}
                                className={`h-8 px-3 rounded-lg border text-[11px] font-semibold ${
                                    isDark
                                        ? 'border-white/[0.14] text-white/70 hover:text-white hover:border-white/30'
                                        : 'border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400'
                                }`}
                            >
                                Close
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-zinc-500'}`}>Templates</label>
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={selectedTemplateId}
                                    onChange={e => setSelectedTemplateId(e.target.value)}
                                    className={`min-w-[13rem] rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors ${
                                        isDark
                                            ? 'bg-white/[0.03] border border-white/[0.07] text-white focus:border-violet-500/50'
                                            : 'bg-white border border-zinc-300 text-zinc-800 focus:border-violet-500'
                                    }`}
                                >
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id} className={isDark ? 'bg-[#181826] text-white' : 'bg-white text-zinc-900'}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => applyTemplate(selectedTemplateId)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                                        isDark
                                            ? 'border-white/[0.12] text-white/70 hover:text-white hover:border-white/25'
                                            : 'border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:border-zinc-400'
                                    }`}
                                >
                                    Apply Template
                                </button>
                                <button
                                    type="button"
                                    onClick={saveCurrentAsTemplate}
                                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                                        isDark
                                            ? 'border-violet-500/30 text-violet-200 hover:text-white hover:border-violet-400/50'
                                            : 'border-violet-300 text-violet-700 hover:text-violet-900 hover:border-violet-400'
                                    }`}
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    Save as Template
                                </button>
                                <button
                                    type="button"
                                    onClick={deleteTemplate}
                                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                                        isDark
                                            ? 'border-red-500/25 text-red-200/80 hover:text-red-100 hover:border-red-400/45'
                                            : 'border-red-300 text-red-700 hover:text-red-900 hover:border-red-400'
                                    }`}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Template
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-zinc-500'}`}>Main Folder Name</label>
                            <input
                                type="text"
                                value={mainFolderName}
                                onChange={e => setMainFolderName(e.target.value)}
                                placeholder="e.g. 72. Joshua"
                                className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
                                    isDark
                                        ? 'bg-white/[0.03] border border-white/[0.07] text-white placeholder-white/20 focus:border-violet-500/50'
                                        : 'bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-violet-500'
                                }`}
                            />
                            {exactDuplicate ? (
                                <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-200 bg-amber-500/15 border border-amber-400/30 rounded-lg px-2.5 py-1">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Existing folder with same name detected.
                                </div>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-zinc-500'}`}>Folder Structure</label>
                            <p className={`text-[11px] ${isDark ? 'text-white/45' : 'text-zinc-600'}`}>
                                Add nested subfolders freely. Use <span className={isDark ? 'text-white/70 font-semibold' : 'text-zinc-800 font-semibold'}>Child</span> to create subfolder inside subfolder.
                            </p>
                            <div className="space-y-2">{renderNodes(folderTree)}</div>
                            <button
                                type="button"
                                onClick={() => setFolderTree(prev => [...prev, createNode('')])}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-white/[0.12] text-white/70 hover:text-white hover:border-white/25 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Top-level Subfolder
                            </button>
                        </div>

                        <div className="pt-1">
                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={isCreating}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                    isCreating
                                        ? 'opacity-60 cursor-not-allowed bg-violet-500/30 text-white/80'
                                        : 'bg-violet-500 hover:bg-violet-400 text-white'
                                }`}
                            >
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                                {isCreating ? 'Creating folders...' : 'Create Client Folder Structure'}
                            </button>
                        </div>
                        </motion.div>
                    </motion.div>
                )}
                {previewVideo && (
                    <motion.div
                        className={`fixed inset-0 z-[121] flex items-center justify-center p-4 ${
                            isDark ? 'bg-black/80 backdrop-blur-sm' : 'bg-zinc-900/40 backdrop-blur-[2px]'
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                    >
                        <motion.div
                            className={`w-full max-w-5xl rounded-2xl p-4 sm:p-5 ${
                                isDark ? 'bg-[#0b0d18] border border-white/[0.12]' : 'bg-white border border-zinc-200'
                            }`}
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.99 }}
                            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                    {previewVideo.name}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setPreviewVideo(null)}
                                    className={`h-8 px-3 rounded-lg border text-[11px] font-semibold ${
                                        isDark
                                            ? 'border-white/[0.14] text-white/70 hover:text-white hover:border-white/30'
                                            : 'border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400'
                                    }`}
                                >
                                    Close
                                </button>
                            </div>
                            <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/[0.08] bg-black">
                                <video
                                    src={getGoogleDriveVideoStreamUrl(previewVideo.id)}
                                    controls
                                    autoPlay
                                    preload="metadata"
                                    className="w-full h-full bg-black"
                                />
                            </div>
                            <div className="pt-2">
                                <a
                                    href={getDrivePreviewUrl(previewVideo)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border ${
                                        isDark ? 'border-white/[0.14] text-white/70 hover:text-white' : 'border-zinc-300 text-zinc-700 hover:text-zinc-900'
                                    }`}
                                >
                                    Open original preview <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                {isDetailsOpen && detailsItem && (
                    <motion.div
                        className={`fixed inset-0 z-[121] flex items-center justify-center p-4 ${
                            isDark ? 'bg-black/80 backdrop-blur-sm' : 'bg-zinc-900/40 backdrop-blur-[2px]'
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                    >
                        <motion.div
                            className={`w-full max-w-2xl rounded-2xl p-4 sm:p-5 ${
                                isDark ? 'bg-[#0b0d18] border border-white/[0.12]' : 'bg-white border border-zinc-200'
                            }`}
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.99 }}
                            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                    Item Details
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setIsDetailsOpen(false)}
                                    className={`h-8 px-3 rounded-lg border text-[11px] font-semibold ${
                                        isDark
                                            ? 'border-white/[0.14] text-white/70 hover:text-white hover:border-white/30'
                                            : 'border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400'
                                    }`}
                                >
                                    Close
                                </button>
                            </div>
                            <div className={`rounded-xl border p-3 space-y-2 text-[12px] ${isDark ? 'border-white/[0.1] text-white/80' : 'border-zinc-200 text-zinc-700'}`}>
                                <p><span className="opacity-60">Name:</span> {detailsItem.name || '-'}</p>
                                <p><span className="opacity-60">Type:</span> {detailsItem.mimeType || '-'}</p>
                                <p><span className="opacity-60">Size:</span> {detailsItem.size || '-'}</p>
                                <p><span className="opacity-60">Created:</span> {detailsItem.createdTime || '-'}</p>
                                <p><span className="opacity-60">Modified:</span> {detailsItem.modifiedTime || '-'}</p>
                                <p><span className="opacity-60">ID:</span> {detailsItem.id || '-'}</p>
                                {detailsItem.webViewLink ? (
                                    <p>
                                        <span className="opacity-60">Link:</span>{' '}
                                        <a
                                            href={detailsItem.webViewLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={isDark ? 'text-cyan-300 hover:text-cyan-200 underline' : 'text-cyan-700 hover:text-cyan-900 underline'}
                                        >
                                            Open in Drive
                                        </a>
                                    </p>
                                ) : null}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                <AnimatePresence>
                    {contextMenu && (
                    <motion.div
                        className={`fixed z-[130] rounded-xl border p-1 shadow-xl ${
                            isDark ? 'bg-[#121427] border-white/[0.14]' : 'bg-white border-zinc-200'
                        }`}
                        style={{ left: contextMenu.x, top: contextMenu.y, width: 160 }}
                        onClick={e => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.94, y: 8, filter: 'blur(3px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.96, y: 6, filter: 'blur(2px)' }}
                        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {contextMenu.item.mimeType === 'application/vnd.google-apps.folder' ? (
                            <button
                                type="button"
                                onClick={() => {
                                    void openContextMenuItem(contextMenu.item);
                                    setContextMenu(null);
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] inline-flex items-center gap-1.5 ${
                                    isDark ? 'text-white/85 hover:bg-white/[0.08]' : 'text-zinc-800 hover:bg-zinc-100'
                                }`}
                            >
                                <FolderGlyph className="w-3.5 h-3.5" /> Open
                            </button>
                        ) : null}
                        {contextMenu.item.mimeType.startsWith('video/') ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setPreviewVideo({
                                        id: contextMenu.item.id,
                                        name: contextMenu.item.name,
                                        mimeType: contextMenu.item.mimeType,
                                        url: contextMenu.item.url || '',
                                    });
                                    setContextMenu(null);
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] inline-flex items-center gap-1.5 ${
                                    isDark ? 'text-white/85 hover:bg-white/[0.08]' : 'text-zinc-800 hover:bg-zinc-100'
                                }`}
                            >
                                <FileVideo className="w-3.5 h-3.5" /> Watch
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => {
                                void handleViewDetails({
                                    id: contextMenu.item.id,
                                    name: contextMenu.item.name,
                                    mimeType: contextMenu.item.mimeType,
                                    url: contextMenu.item.url || '',
                                });
                                setContextMenu(null);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] inline-flex items-center gap-1.5 ${
                                isDark ? 'text-white/85 hover:bg-white/[0.08]' : 'text-zinc-800 hover:bg-zinc-100'
                            }`}
                        >
                            <Info className="w-3.5 h-3.5" /> Details
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                void handleRenameItem({
                                    id: contextMenu.item.id,
                                    name: contextMenu.item.name,
                                    mimeType: contextMenu.item.mimeType,
                                    url: contextMenu.item.url || '',
                                });
                                setContextMenu(null);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] inline-flex items-center gap-1.5 ${
                                isDark ? 'text-white/85 hover:bg-white/[0.08]' : 'text-zinc-800 hover:bg-zinc-100'
                            }`}
                        >
                            <Pencil className="w-3.5 h-3.5" /> Rename
                        </button>
                        {contextMenu.item.source === 'explorer' ? (
                            <button
                                type="button"
                                onClick={() => {
                                    void handleMoveItem({
                                        id: contextMenu.item.id,
                                        name: contextMenu.item.name,
                                        mimeType: contextMenu.item.mimeType,
                                        url: contextMenu.item.url || '',
                                    });
                                    setContextMenu(null);
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] inline-flex items-center gap-1.5 ${
                                    isDark ? 'text-white/85 hover:bg-white/[0.08]' : 'text-zinc-800 hover:bg-zinc-100'
                                }`}
                            >
                                <MoveRight className="w-3.5 h-3.5" /> Move
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    void handleMoveRootFolder({
                                        id: contextMenu.item.id,
                                        name: contextMenu.item.name,
                                        url: contextMenu.item.url || '',
                                    });
                                    setContextMenu(null);
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] inline-flex items-center gap-1.5 ${
                                    isDark ? 'text-white/85 hover:bg-white/[0.08]' : 'text-zinc-800 hover:bg-zinc-100'
                                }`}
                            >
                                <MoveRight className="w-3.5 h-3.5" /> Move
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                if (contextMenu.item.source === 'root') {
                                    void handleTrashRootFolder({
                                        id: contextMenu.item.id,
                                        name: contextMenu.item.name,
                                        url: contextMenu.item.url || '',
                                    });
                                } else {
                                    void handleTrashItem({
                                        id: contextMenu.item.id,
                                        name: contextMenu.item.name,
                                        mimeType: contextMenu.item.mimeType,
                                        url: contextMenu.item.url || '',
                                    });
                                }
                                setContextMenu(null);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] inline-flex items-center gap-1.5 ${
                                isDark ? 'text-red-200 hover:bg-red-500/20' : 'text-red-700 hover:bg-red-50'
                            }`}
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                    </motion.div>
                    )}
                </AnimatePresence>
            </AnimatePresence>
        </AdminPageLayout>
    );
}
