import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, FileText, Table } from 'lucide-react';

// --- Helpers ---
const getBoardIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('dashboard')) return LayoutDashboard;
    if (n.includes('form')) return FileText;
    return Table;
};

interface FolderTreeItemProps {
    folder: any;
    allFolders: any[];
    allBoards: any[];
    onSelectBoard: (boardId: string) => void;
    selectedBoardId: string | null;
    depth?: number;
}

export const FolderTreeItem = ({ folder, allFolders, allBoards, onSelectBoard, selectedBoardId, depth = 0 }: FolderTreeItemProps) => {
    const [isOpen, setIsOpen] = useState(false);

    // Custom Sort Logic
    const FOLDER_ORDER = ["Hiring and Onboarding", "Management", "Editors", "Clients", "Old"];
    const getSortWeight = (name: string) => {
        const index = FOLDER_ORDER.findIndex(n => name.includes(n));
        return index === -1 ? 999 : index;
    };

    // Find nested items using IDs
    const childFolders = folder.children
        ? folder.children
            .map((c: any) => allFolders.find((f: any) => String(f.id) === String(c.id)))
            .filter(Boolean)
            .sort((a: any, b: any) => getSortWeight(a.name) - getSortWeight(b.name))
        : [];

    const childBoards = folder.children
        ? folder.children
            .map((c: any) => allBoards.find((b: any) => String(b.id) === String(c.id)))
            .filter(Boolean)
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
        : [];

    // Auto-expand if selected board is inside
    useEffect(() => {
        if (childBoards.some((b: any) => b.id === selectedBoardId)) {
            setIsOpen(true);
        }
    }, [selectedBoardId, childBoards]);

    // Recursive check for content visibility
    const hasVisibleBoards = (fId: string): boolean => {
        // Check direct boards in this folder
        const hasDirectBoards = allBoards.some((b: any) => String(b.folder_id) === String(fId));
        if (hasDirectBoards) return true;

        // Check subfolders
        const thisFolder = allFolders.find(f => String(f.id) === String(fId));
        if (!thisFolder || !thisFolder.children) return false;

        return thisFolder.children.some((child: any) => {
            // Is child a folder?
            const isFolder = allFolders.find(f => String(f.id) === String(child.id));
            if (isFolder) return hasVisibleBoards(isFolder.id);
            // Is child a board? (Already filtered list)
            const isBoard = allBoards.find(b => String(b.id) === String(child.id));
            return !!isBoard;
        });
    };

    const hasContent = hasVisibleBoards(folder.id);
    if (!hasContent) return null;

    const hasChildren = childFolders.length > 0 || childBoards.length > 0;
    if (!hasChildren && !hasContent) return null;

    return (
        <div className="select-none text-[13px] font-sans">
            <div
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all mb-0.5 group ${isOpen ? 'text-white' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}`}
                style={{ paddingLeft: `${depth * 12 + 12}px` }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center transition-colors">
                    <div className={`transition-transform duration-200 ${isOpen ? 'rotate-90 text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                        <svg width="6" height="8" viewBox="0 0 6 8" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 0L6 4L0 8V0Z" />
                        </svg>
                    </div>
                </div>
                {/* Folder Name - Colored */}
                <span className={`font-semibold truncate transition-colors ${isOpen ? 'opacity-100' : 'opacity-90'}`} style={{ color: folder.color || 'inherit' }}>
                    {folder.name}
                </span>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {childFolders.map((subFolder: any) => (
                            <FolderTreeItem
                                key={subFolder.id}
                                folder={subFolder}
                                allFolders={allFolders}
                                allBoards={allBoards}
                                onSelectBoard={onSelectBoard}
                                selectedBoardId={selectedBoardId}
                                depth={depth + 1}
                            />
                        ))}
                        {childBoards.map((board: any) => {
                            const Icon = getBoardIcon(board.name);
                            // Clean Name for Display
                            let displayName = board.name.replace(/ - Workspace/g, '').replace(/\([^)]*\)/g, '').trim();
                            if (!displayName) displayName = board.name.replace(/ - Workspace/g, '').trim();
                            const isSelected = selectedBoardId === board.id;

                            return (
                                <div
                                    key={board.id}
                                    onClick={() => onSelectBoard(board.id)}
                                    className={`flex items-center gap-2.5 px-3 py-1.5 mx-2 rounded-lg cursor-pointer transition-all mb-0.5 relative group/item
                                        ${isSelected
                                            ? 'bg-custom-bright/10 text-white font-semibold'
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 font-medium'}`}
                                    style={{ paddingLeft: `${(depth + 1) * 12 + 12}px` }}
                                    title={board.name} // Show full name on hover
                                >
                                    {/* Active Indicator Bar */}
                                    {isSelected && (
                                        <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-custom-bright rounded-r-full shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
                                    )}

                                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${isSelected ? 'text-custom-bright' : 'text-gray-500 group-hover/item:text-gray-400'}`} />
                                    <span className="truncate tracking-wide">{displayName}</span>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
