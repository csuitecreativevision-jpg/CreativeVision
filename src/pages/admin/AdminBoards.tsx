import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    LayoutDashboard,
    Search,
    Loader2,
    Plus,
    FileText,
    Table,
    MoreHorizontal
} from 'lucide-react';
import {
    getAllBoards, getAllFolders, getAllWorkspaces, createNewBoard,
    getAssetPublicUrl,
    prefetchBoardItems,
    createNewGroup
} from '../../services/mondayService';
import { supabase } from '../../services/boardsService';
import { useVisibilityPolling, useBoardItems } from '../../hooks/useMondayData';
import { FolderTreeItem } from '../../components/shared/FolderTree';
import { BoardCell } from '../../components/shared/BoardCell';
import { FilePreviewModal } from '../../components/ui/FilePreviewModal';
import { GlobalCycleView } from '../../components/views/GlobalCycleView';

// --- Helpers ---
const getBoardIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('dashboard')) return LayoutDashboard;
    if (n.includes('form')) return FileText;
    return Table;
};

export default function AdminBoards() {
    // Data State
    const [boards, setBoards] = useState<any[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(localStorage.getItem('portal_user_workspace') || null);
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(localStorage.getItem('admin_selected_board_id') || null);
    const [manualLoading, setManualLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState<{ url: string, name: string, assetId?: string } | null>(null);

    // Permissions
    const [currentUserAllowedBoards, setCurrentUserAllowedBoards] = useState<string[]>([]);
    const [currentUserWorkspaceId, setCurrentUserWorkspaceId] = useState<string | null>(null);

    // Board Items Hook
    const { boardData, isLoading: isBoardItemsLoading, refreshBoardItems } = useBoardItems(selectedBoardId);

    const loading = manualLoading || isBoardItemsLoading;
    const setLoading = setManualLoading;

    // Create Modal States
    const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    // Collapsed Groups
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const currentUserRole = localStorage.getItem('portal_user_role') || 'admin';
    const [checkingPermissions, setCheckingPermissions] = useState(true);

    const stableAllowedBoards = useMemo(() => currentUserAllowedBoards, [JSON.stringify(currentUserAllowedBoards)]);

    useEffect(() => {
        if (selectedBoardId) {
            localStorage.setItem('admin_selected_board_id', selectedBoardId);
        }
    }, [selectedBoardId]);

    // Permissions Fetch
    // Permissions Fetch
    useEffect(() => {
        const checkUser = async () => {
            const email = localStorage.getItem('portal_user_email');
            if (email) {
                try {
                    const { data } = await supabase
                        .from('users')
                        .select('allowed_board_ids, workspace_id')
                        .eq('email', email)
                        .single();

                    if (data) {
                        setCurrentUserAllowedBoards(data.allowed_board_ids || []);
                        setCurrentUserWorkspaceId(data.workspace_id || null);
                    }
                } catch (error) {
                    console.error("Error checking permissions:", error);
                } finally {
                    setCheckingPermissions(false);
                }
            } else {
                setCheckingPermissions(false);
            }
        };
        checkUser();
    }, []);

    const refreshCallback = useCallback(() => {
        if (!checkingPermissions) {
            refreshBoardsAndFolders(true);
        }
    }, [checkingPermissions, stableAllowedBoards, currentUserWorkspaceId]);

    useVisibilityPolling(refreshCallback, 60000);

    useEffect(() => {
        if (checkingPermissions) return;
        refreshBoardsAndFolders();
    }, [stableAllowedBoards, currentUserWorkspaceId, checkingPermissions]);

    // Prefetch
    const [prefetchStarted, setPrefetchStarted] = useState(false);
    useEffect(() => {
        if (!checkingPermissions && boards.length > 0 && !prefetchStarted) {
            setPrefetchStarted(true);
            const boardIds = boards.map((b: any) => b.id);
            prefetchBoardItems(boardIds).catch(err => console.error("Prefetch failed", err));
        }
    }, [boards, checkingPermissions, prefetchStarted]);

    // Preview URL Fetcher
    useEffect(() => {
        if (previewFile?.assetId && previewFile.url && !previewFile.url.includes('public_url_fetched')) {
            const fetchPublicUrl = async () => {
                try {
                    const publicUrl = await getAssetPublicUrl(previewFile.assetId!);
                    if (publicUrl) {
                        setPreviewFile(prev => prev ? { ...prev, url: publicUrl, assetId: undefined } : null);
                    }
                } catch (err) {
                    console.error("Failed to fetch public URL", err);
                }
            };
            fetchPublicUrl();
        }
    }, [previewFile]);


    async function refreshBoardsAndFolders(background = false) {
        if (!background) setLoading(true);
        try {
            const [boardsData, foldersData, workspacesData] = await Promise.all([
                getAllBoards(),
                getAllFolders(),
                getAllWorkspaces()
            ]);

            const rawBoards = boardsData || [];
            const mappedBoards = rawBoards
                .filter((b: any) => b.type !== 'sub_items_board' && !b.name.toLowerCase().includes('subitems'))
                .map((b: any) => ({
                    ...b,
                    workspace_id: b.workspace?.id ? String(b.workspace.id) : null
                }));

            let filteredBoards = mappedBoards;

            if (currentUserAllowedBoards.length > 0) {
                filteredBoards = mappedBoards.filter((b: any) => currentUserAllowedBoards.includes(b.id));
            } else if (currentUserWorkspaceId) {
                filteredBoards = mappedBoards.filter((b: any) => b.workspace_id === currentUserWorkspaceId);
            } else if (currentUserRole === 'editor') {
                filteredBoards = mappedBoards.filter((b: any) =>
                    b.name?.toLowerCase().includes('workspace') ||
                    b.name?.toLowerCase().includes('editor') ||
                    b.name?.toLowerCase().includes('project')
                );
            } else if (currentUserRole === 'client') {
                filteredBoards = mappedBoards.filter((b: any) =>
                    b.name?.toLowerCase().includes('fulfillment') ||
                    b.name?.toLowerCase().includes('client') ||
                    b.name?.toLowerCase().includes('delivery')
                );
            }
            setBoards(filteredBoards);

            let filteredFolders = foldersData || [];
            if (currentUserAllowedBoards.length > 0) {
                const allowedWorkspaces = new Set(filteredBoards.map((b: any) => b.workspace_id).filter(Boolean));
                filteredFolders = filteredFolders.filter((f: any) => f.workspace?.id && allowedWorkspaces.has(String(f.workspace.id)));
            } else if (currentUserWorkspaceId) {
                filteredFolders = filteredFolders.filter((f: any) => f.workspace?.id && String(f.workspace.id) === currentUserWorkspaceId);
            }

            setFolders(filteredFolders);
            setWorkspaces(workspacesData || []);

            if (filteredBoards.length > 0 && !selectedBoardId) {
                setSelectedBoardId(filteredBoards[0].id);
            }

        } catch (error) {
            console.error("Failed to load boards", error);
        } finally {
            setLoading(false);
        }
    }

    const handleCreateBoard = async () => {
        if (!newBoardName.trim()) return;
        setLoading(true);
        try {
            await createNewBoard(newBoardName);
            setNewBoardName('');
            setIsCreateBoardOpen(false);
            refreshBoardsAndFolders();
        } catch (error) {
            console.error("Failed to create board", error);
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || !selectedBoardId) return;
        setLoading(true);
        try {
            await createNewGroup(selectedBoardId, newGroupName);
            setNewGroupName('');
            setIsCreateGroupOpen(false);
            refreshBoardItems();
        } catch (error) {
            console.error("Failed to create group", error);
            setLoading(false);
        }
    };

    const toggleGroup = (groupId: string) => {
        const newCollapsed = new Set(collapsedGroups);
        if (newCollapsed.has(groupId)) {
            newCollapsed.delete(groupId);
        } else {
            newCollapsed.add(groupId);
        }
        setCollapsedGroups(newCollapsed);
    };

    // Filter Boards for Sidebar
    // const userWorkspaceBoards = selectedWorkspaceId
    //     ? boards.filter(b => b.workspace_id === selectedWorkspaceId)
    //     : boards;

    // const workspaceFolders = selectedWorkspaceId
    //     ? folders.filter(f => String(f.workspace?.id || '') === selectedWorkspaceId)
    //     : folders;

    return (
        <div className="flex h-full w-full overflow-hidden bg-[#050511] relative animate-in fade-in duration-500">
            {/* Left Sidebar - Board List */}
            <div className="w-80 border-r border-white/5 bg-[#0a0a16] flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-white/5 space-y-4">
                    {/* Workspace Selector */}
                    {workspaces.length > 0 && (
                        <select
                            className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-custom-bright/50"
                            value={selectedWorkspaceId || ''}
                            onChange={(e) => setSelectedWorkspaceId(e.target.value || null)}
                        >
                            <option value="">All Workspaces</option>
                            {workspaces.map((ws: any) => (
                                <option key={ws.id} value={ws.id}>{ws.name}</option>
                            ))}
                        </select>
                    )}

                    <div className="relative group">
                        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-custom-bright transition-colors" />
                        <input
                            type="text"
                            placeholder="Find a board..."
                            className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-custom-bright/50 transition-all placeholder:text-gray-600"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {/* Create Board Button */}
                    <button
                        onClick={() => setIsCreateBoardOpen(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors mb-2 text-sm font-medium border border-transparent hover:border-white/5 border-dashed"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New Board</span>
                    </button>

                    {/* Folders & Boards Tree */}
                    {(() => {
                        // Filter by Workspace
                        // Main Workspace = item.workspace is null/undefined
                        const visibleFolders = folders.filter(f => selectedWorkspaceId ? String(f.workspace?.id) === String(selectedWorkspaceId) : !f.workspace);
                        // Filter by Workspace AND exclude Subitem Boards
                        const visibleBoards = boards
                            .filter(b => selectedWorkspaceId ? String(b.workspace?.id) === String(selectedWorkspaceId) : !b.workspace)
                            .filter(b => b.type !== 'sub_items_board' && !b.name.startsWith("Subitems of"));

                        // Custom Sort Logic based on Screenshot
                        const FOLDER_ORDER = ["Hiring and Onboarding", "Management", "Editors", "Clients", "Old"];
                        const getSortWeight = (name: string) => {
                            const index = FOLDER_ORDER.findIndex(n => name.includes(n));
                            return index === -1 ? 999 : index;
                        };

                        // VIRTUAL GROUPING: "Editor Workspaces" should be in "Editors" folder

                        // 1. Find key folders
                        const editorsFolder = visibleFolders.find(f => f.name.trim() === 'Editors');
                        const workspacesFolder = visibleFolders.find(f => f.name.trim() === 'Workspaces');

                        // 2. Identify "Workspace" boards
                        const editorBoards = visibleBoards.filter(b => b.name.includes(' - Workspace'));

                        // 3. Ensure "Editors" folder exists (Virtual or Real)
                        let effectiveEditorsFolder = editorsFolder;
                        if (!effectiveEditorsFolder && (workspacesFolder || editorBoards.length > 0)) {
                            effectiveEditorsFolder = {
                                id: 'virtual-editors',
                                name: 'Editors',
                                color: '#ffcc00',
                                children: []
                            };
                        }

                        // 4. Populate "Editors" folder children
                        if (effectiveEditorsFolder) {
                            if (!effectiveEditorsFolder.children) effectiveEditorsFolder.children = [];

                            // Helper to check if child exists in our effective folder
                            const hasChild = (id: string) => effectiveEditorsFolder!.children.some((c: any) => String(c.id) === String(id));

                            // A) Nest "Workspaces" folder inside "Editors"
                            if (workspacesFolder && !hasChild(workspacesFolder.id)) {
                                effectiveEditorsFolder.children.push({ id: workspacesFolder.id });
                            }

                            // B) Nest loose "Workspace" boards inside "Editors"
                            editorBoards.forEach(b => {
                                if (!hasChild(b.id)) {
                                    const isInWorkspaces = workspacesFolder && workspacesFolder.children && workspacesFolder.children.some((c: any) => String(c.id) === String(b.id));
                                    if (!isInWorkspaces) {
                                        effectiveEditorsFolder!.children.push({ id: b.id });
                                    }
                                }
                            });
                        }

                        // 5. Construct Final Folders List
                        // Start with all visible folders
                        let finalFolders = [...visibleFolders];

                        // Remove "Workspaces" from root list (as it is now nested)
                        if (workspacesFolder) {
                            finalFolders = finalFolders.filter(f => f.id !== workspacesFolder.id);
                        }

                        // Ensure "Editors" is in the list (if virtual)
                        if (effectiveEditorsFolder && !finalFolders.some(f => f.id === effectiveEditorsFolder!.id)) {
                            finalFolders.push(effectiveEditorsFolder);
                        }

                        // 6. Calculate Root Items (Hiding nested children)
                        const childIds = new Set();
                        finalFolders.forEach(f => {
                            if (f.children) {
                                f.children.forEach((c: any) => childIds.add(String(c.id)));
                            }
                        });

                        // Also exclude items that are children of the hidden "Workspaces" folder from root
                        // (Recursion in FolderTreeItem handles display, we just need to hide from root here)
                        if (workspacesFolder && workspacesFolder.children) {
                            workspacesFolder.children.forEach((c: any) => childIds.add(String(c.id)));
                        }

                        const rootFolders = finalFolders
                            .filter(f => !childIds.has(String(f.id)))
                            .sort((a, b) => getSortWeight(a.name) - getSortWeight(b.name));

                        // Boards A-Z fallback
                        const rootBoards = visibleBoards
                            .filter(b => !childIds.has(String(b.id)))
                            // Functionally, this removes 'editorBoards' because we added their IDs to 'editorsFolder' children
                            .sort((a, b) => a.name.localeCompare(b.name));

                        return (
                            <>
                                {/* Root Folders */}
                                {rootFolders.map(folder => (
                                    <FolderTreeItem
                                        key={folder.id}
                                        folder={folder}
                                        allFolders={visibleFolders}
                                        allBoards={visibleBoards}
                                        onSelectBoard={setSelectedBoardId}
                                        selectedBoardId={selectedBoardId}
                                    />
                                ))}
                                {/* Root Boards */}
                                {rootBoards.map(board => {
                                    const Icon = getBoardIcon(board.name);
                                    return (
                                        <div
                                            key={board.id}
                                            onClick={() => setSelectedBoardId(board.id)}
                                            className={`flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md cursor-pointer transition-all mb-0.5 ${selectedBoardId === board.id
                                                ? 'bg-[#0073ea] text-white shadow-lg shadow-blue-900/20 font-medium'
                                                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1C212E]'
                                                }`}
                                        >
                                            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${selectedBoardId === board.id ? 'text-white' : 'text-gray-500'}`} />
                                            <span className="text-[13px] truncate">{board.name}</span>
                                        </div>
                                    );
                                })}

                                {loading && (
                                    <div className="p-4 text-center text-gray-500 text-xs animate-pulse">Loading workspace...</div>
                                )}
                                {!loading && visibleBoards.length === 0 && visibleFolders.length === 0 && (
                                    <div className="p-4 text-center text-gray-500 text-xs opacity-50 flex flex-col gap-2">
                                        <span>Empty Workspace</span>
                                        <span className="text-[10px]">(or Main Workspace selected)</span>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Main Board View */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050511] relative">
                {/* Board Header */}
                {boardData ? (
                    <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-black/20 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${selectedBoardId ? 'bg-custom-bright/10 text-custom-bright' : 'bg-white/5 text-gray-400'}`}>
                                {(() => {
                                    const Icon = getBoardIcon(boardData.name);
                                    return <Icon className="w-5 h-5" />;
                                })()}
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg leading-tight">{boardData.name}</h2>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                    <span>{boardData.items?.length || 0} Items</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                    <span>Last updated: Just now</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsCreateGroupOpen(true)}
                                className="px-4 py-2 bg-custom-bright hover:bg-custom-bright/90 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-custom-bright/20 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                New Group
                            </button>
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                <Search className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                        <div className="flex items-center gap-2">
                            <div className="w-32 h-6 bg-white/5 rounded animate-pulse" />
                        </div>
                    </div>
                )}

                {/* Board Content */}
                <div className="flex-1 overflow-auto custom-scrollbar p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-custom-bright" />
                            <p className="text-sm font-medium animate-pulse">Loading Board Data...</p>
                        </div>
                    ) : boardData ? (
                        (boardData.name.toLowerCase().includes('- workspace') ||
                            boardData.name.toLowerCase().includes('editor') ||
                            boardData.name.toLowerCase().includes('project')) ? (
                            <GlobalCycleView
                                boardData={boardData}
                                selectedBoardId={selectedBoardId}
                                refreshBoardDetails={(id, silent) => refreshBoardItems(silent)}
                                setPreviewFile={(file) => setPreviewFile(file)}
                            />
                        ) : (
                            <div className="space-y-8 pb-20">
                                {boardData.groups?.map((group: any) => (
                                    <div key={group.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {/* Group Header */}
                                        <div
                                            className="flex items-center gap-3 mb-3 group/header cursor-pointer select-none sticky top-0 bg-[#050511] z-10 py-2 border-b border-transparent hover:border-white/5 transition-colors"
                                            onClick={() => toggleGroup(group.id)}
                                        >
                                            <div
                                                className={`w-4 h-4 rounded flex items-center justify-center transition-transform ${collapsedGroups.has(group.id) ? '-rotate-90' : 'rotate-0'}`}
                                            // style={{ color: group.color }}
                                            >
                                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-current text-gray-500">
                                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <h3 className="text-sm font-bold truncate flex-1" style={{ color: group.color }}>
                                                {group.title}
                                            </h3>
                                            <span className="text-xs text-gray-600 font-medium px-2 py-0.5 rounded-full bg-white/5">
                                                {boardData.items.filter((i: any) => i.group.id === group.id).length}
                                            </span>
                                        </div>

                                        {/* Group Items Table */}
                                        {!collapsedGroups.has(group.id) && (
                                            <div className="border border-white/5 rounded-xl overflow-hidden bg-[#0e0e1a]/50 shadow-sm transition-all hover:shadow-md hover:border-white/10">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                                                <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[280px] sticky left-0 bg-[#0e0e1a] z-20 shadow-[1px_0_0_rgba(255,255,255,0.05)]">Item Name</th>
                                                                {boardData.columns.slice(0, 8).map((col: any) => (
                                                                    <th key={col.id} className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider min-w-[140px] whitespace-nowrap">
                                                                        {col.title}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {boardData.items.filter((i: any) => i.group.id === group.id).length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={boardData.columns.length + 1} className="py-8 text-center text-gray-600 text-sm italic">
                                                                        This group is empty
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                boardData.items
                                                                    .filter((i: any) => i.group.id === group.id)
                                                                    .map((item: any) => (
                                                                        <tr key={item.id} className="group/row hover:bg-white/[0.02] transition-colors">
                                                                            <td className="py-2 px-4 text-sm font-medium text-gray-200 sticky left-0 bg-[#0e0e1a] group-hover/row:bg-[#131325] transition-colors z-10 border-r border-white/5 shadow-[1px_0_0_rgba(255,255,255,0.05)]">
                                                                                <div className="flex items-center gap-2 max-w-[250px]">
                                                                                    <div className="w-1 h-8 rounded-full bg-gradient-to-b from-transparent via-custom-bright/50 to-transparent opacity-0 group-hover/row:opacity-100 absolute left-0 top-1/2 -translate-y-1/2 transition-opacity" />
                                                                                    <span className="truncate" title={item.name}>{item.name}</span>
                                                                                </div>
                                                                            </td>
                                                                            {boardData.columns.slice(0, 8).map((col: any) => (
                                                                                <td key={col.id} className="py-2 px-4 relative">
                                                                                    <BoardCell
                                                                                        item={item}
                                                                                        column={col}
                                                                                        boardId={selectedBoardId}
                                                                                        onUpdate={refreshBoardItems}
                                                                                        onPreview={(url, name, assetId) => setPreviewFile({ url, name, assetId })}
                                                                                    />
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                            <LayoutDashboard className="w-16 h-16 mb-4 stroke-1" />
                            <p className="text-lg">Select a board to view contents</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {isCreateBoardOpen && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-[#1a1a2e] p-6 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Create New Board</h3>
                        <input
                            autoFocus
                            type="text"
                            className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-custom-bright outline-none mb-6"
                            placeholder="Board Name"
                            value={newBoardName}
                            onChange={(e) => setNewBoardName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsCreateBoardOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                            <button
                                onClick={handleCreateBoard}
                                disabled={loading || !newBoardName.trim()}
                                className="px-6 py-2 bg-custom-bright hover:brightness-110 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Board'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Group Modal */}
            {isCreateGroupOpen && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-[#1a1a2e] p-6 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Create New Group</h3>
                        <input
                            autoFocus
                            type="text"
                            className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-custom-bright outline-none mb-6"
                            placeholder="Group Name"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsCreateGroupOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                            <button
                                onClick={handleCreateGroup}
                                disabled={loading || !newGroupName.trim()}
                                className="px-6 py-2 bg-custom-bright hover:brightness-110 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Group'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Preview Modal */}
            <FilePreviewModal
                previewFile={previewFile}
                isLoading={false}
                onClose={() => setPreviewFile(null)}
            />
        </div>
    );
}
