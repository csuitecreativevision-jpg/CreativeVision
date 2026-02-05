import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    UserPlus,
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    Wand2,
    ChevronDown,
    Search,
    Table,
    X
} from 'lucide-react';
import {
    createUser, getAllUsers, updateUser, deleteUser
} from '../../services/boardsService';
import { getAllWorkspaces, getAllBoards } from '../../services/mondayService';

export default function AdminUsers() {
    // User Management State
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserRole, setNewUserRole] = useState<'admin' | 'editor' | 'client'>('editor');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [selectedUserWorkspace, setSelectedUserWorkspace] = useState('');
    const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([]);
    const [boardSearchQuery, setBoardSearchQuery] = useState('');
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [userSuccess, setUserSuccess] = useState<string | null>(null);
    const [isUserListOpen, setIsUserListOpen] = useState(false);
    const [userError, setUserError] = useState<string | null>(null);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Data State
    const [userList, setUserList] = useState<any[]>([]);
    const [userListLoading, setUserListLoading] = useState(false);
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [boards, setBoards] = useState<any[]>([]);

    useEffect(() => {
        fetchUsers();
        fetchAuxData();
    }, []);

    const fetchUsers = async () => {
        setUserListLoading(true);
        const users = await getAllUsers();
        setUserList(users);
        setUserListLoading(false);
    };

    const fetchAuxData = async () => {
        const [ws, b] = await Promise.all([
            getAllWorkspaces(),
            getAllBoards()
        ]);
        setWorkspaces(ws || []);
        setBoards(b || []);
    };

    // Auto-generate email based on role
    useEffect(() => {
        if (!editingUserId) {
            if (newUserRole === 'admin') {
                setNewUserEmail(newUserName.toLowerCase().replace(/\s+/g, '') + '@admin.cv');
            } else if (newUserRole === 'editor') {
                setNewUserEmail(newUserName.toLowerCase().replace(/\s+/g, '') + '@editors.cv');
            } else if (newUserRole === 'client') {
                setNewUserEmail(newUserName.toLowerCase().replace(/\s+/g, '') + '@clients.cv');
            }
        }
    }, [newUserRole, newUserName, editingUserId]);

    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let pass = '';
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewUserPassword(pass);
        setShowPassword(true);
    };

    const handleEditUser = (user: any) => {
        setEditingUserId(user.id);
        setNewUserName(user.name);
        setNewUserRole(user.role);
        setNewUserEmail(user.email);
        setSelectedUserWorkspace(user.workspace_id || '');
        setSelectedBoardIds(user.allowed_board_ids || []);
        setNewUserPassword('');
        setIsUserListOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setNewUserName('');
        setNewUserPassword('');
        setNewUserRole('editor');
        setSelectedUserWorkspace('');
        setSelectedBoardIds([]);
        setUserError(null);
        setUserSuccess(null);
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete user "${name}"?`)) {
            const result = await deleteUser(id);
            if (result.success) {
                fetchUsers();
            } else {
                alert('Failed to delete user: ' + result.error);
            }
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserError(null);
        setUserSuccess(null);

        if (!editingUserId) {
            if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
                setUserError('Name, email, and password are required');
                return;
            }
            if (newUserPassword.length < 4) {
                setUserError('Password must be at least 4 characters');
                return;
            }
        } else {
            if (!newUserName.trim()) {
                setUserError('Name is required');
                return;
            }
        }

        setIsCreatingUser(true);
        const cleanEmail = newUserEmail.trim().toLowerCase();

        if (editingUserId) {
            const result = await updateUser(editingUserId, {
                role: newUserRole,
                workspace_id: selectedUserWorkspace,
                allowed_board_ids: selectedBoardIds,
                name: newUserName.trim()
            });
            setIsCreatingUser(false);
            if (result.success) {
                setUserSuccess(`User "${newUserName}" updated successfully!`);
                handleCancelEdit();
                fetchUsers();
            } else {
                setUserError(result.error || 'Failed to update user');
            }
        } else {
            const result = await createUser(
                newUserName.trim(),
                cleanEmail,
                newUserPassword,
                newUserRole,
                selectedUserWorkspace || undefined,
                selectedBoardIds
            );

            setIsCreatingUser(false);

            if (result.success) {
                setUserSuccess(`User "${result.user?.name}" created successfully!`);
                setNewUserName('');
                setNewUserPassword('');
                setNewUserRole('editor');
                setSelectedUserWorkspace('');
                setSelectedBoardIds([]);
                fetchUsers();
            } else {
                setUserError(result.error || 'Failed to create user');
            }
        }
    };

    return (
        <div className="p-8 w-full max-w-7xl mx-auto animate-in fade-in duration-500 overflow-y-auto h-full">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400 mb-10 tracking-tight">User Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column Wrapper (Form + Roles) */}
                <div className="space-y-6 lg:col-span-8">
                    {/* Create User Form */}
                    <div className="bg-[#0A0A16] border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            {editingUserId ? <Pencil className="w-5 h-5 text-custom-bright" /> : <UserPlus className="w-5 h-5 text-custom-bright" />}
                            {editingUserId ? 'Edit User' : 'Create New User'}
                        </h2>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            {/* Role Selection */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Role</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['admin', 'editor', 'client'] as const).map(role => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setNewUserRole(role)}
                                            className={`py-2 rounded-lg text-sm font-bold capitalize transition-all ${newUserRole === role
                                                ? 'bg-custom-bright text-white shadow-lg shadow-custom-bright/20'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10 py-2 border border-transparent'
                                                }`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Name Input */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-custom-bright transition-colors"
                                    placeholder="e.g. John Doe"
                                />
                            </div>

                            {/* Workspace Selection (For Editors/Clients) */}
                            {(newUserRole === 'editor' || newUserRole === 'client') && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Assigned Workspace</label>
                                    <div className="relative">
                                        <select
                                            value={selectedUserWorkspace}
                                            onChange={(e) => setSelectedUserWorkspace(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-custom-bright appearance-none cursor-pointer"
                                        >
                                            <option value="" className="bg-[#0A0A16] text-gray-400">Select a Workspace...</option>
                                            {workspaces.map(ws => (
                                                <option key={ws.id} value={ws.id} className="bg-[#0A0A16]">{ws.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        Associates this user with a specific Monday.com workspace
                                    </p>
                                </div>
                            )}

                            {/* Board Selection */}
                            {(selectedUserWorkspace && (newUserRole === 'editor' || newUserRole === 'client')) && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                        Allowed Boards <span className="text-gray-600 normal-case ml-1">(Optional - Select none for all)</span>
                                    </label>

                                    <div className="relative mb-2">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder="Filter boards..."
                                            value={boardSearchQuery}
                                            onChange={(e) => setBoardSearchQuery(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-custom-bright transition-colors"
                                        />
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-xl p-2 max-h-48 overflow-y-auto custom-scrollbar">
                                        {boards
                                            .filter(b =>
                                                b.workspace_id === selectedUserWorkspace &&
                                                b.name.toLowerCase().includes(boardSearchQuery.toLowerCase()) &&
                                                (newUserRole === 'editor' ? b.name.toLowerCase().includes('workspace') : newUserRole === 'client' ? b.name.toLowerCase().includes('fulfillment') : true)
                                            )
                                            .map(board => (
                                                <label key={board.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedBoardIds.includes(board.id)
                                                        ? 'bg-custom-bright border-custom-bright'
                                                        : 'border-gray-600 group-hover:border-gray-400'
                                                        }`}>
                                                        {selectedBoardIds.includes(board.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={selectedBoardIds.includes(board.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedBoardIds([...selectedBoardIds, board.id]);
                                                            } else {
                                                                setSelectedBoardIds(selectedBoardIds.filter(id => id !== board.id));
                                                            }
                                                        }}
                                                    />
                                                    <span className={`text-sm ${selectedBoardIds.includes(board.id) ? 'text-white' : 'text-gray-400'}`}>
                                                        {board.name}
                                                    </span>
                                                </label>
                                            ))}
                                        {boards.filter(b => b.workspace_id === selectedUserWorkspace).length === 0 && <p className="text-sm text-gray-500 p-2">No boards found in workspace.</p>}
                                    </div>
                                </div>
                            )}

                            {/* Auto-Generated Email */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email (Auto-Generated)</label>
                                <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-400 font-mono text-sm flex items-center gap-2">
                                    <span className="truncate">{newUserEmail || 'Start typing name...'}</span>
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password {editingUserId && <span className="text-custom-bright normal-case ml-1">(Optional)</span>}</label>
                                <div className="relative flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={newUserPassword}
                                            onChange={(e) => setNewUserPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-custom-bright transition-colors pr-10"
                                            placeholder="Enter password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={generatePassword}
                                        className="px-4 py-2 bg-custom-bright/10 border border-custom-bright/20 rounded-xl text-custom-bright hover:bg-custom-bright/20 transition-all flex items-center gap-2"
                                        title="Auto-generate secure password"
                                    >
                                        <Wand2 className="w-4 h-4" />
                                        <span className="text-xs font-bold hidden sm:inline">Generate</span>
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">Min. 4 characters</p>
                            </div>

                            {/* Status Messages */}
                            {userError && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{userError}</div>
                            )}
                            {userSuccess && (
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{userSuccess}</div>
                            )}

                            <div className="flex gap-3">
                                {editingUserId && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all border border-white/10"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={isCreatingUser}
                                    className="flex-1 py-3 rounded-xl bg-custom-bright text-white font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-custom-bright/20"
                                >
                                    {isCreatingUser
                                        ? (editingUserId ? 'Updating...' : 'Creating...')
                                        : (editingUserId ? 'Update User' : 'Create User')}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Roles Info */}
                    <div className="bg-[#0A0A16]/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                        <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider opacity-80">Role Permissions</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {/* ... Role descriptions ... */}
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                                <span className="self-start px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase">Admin</span>
                                <span className="text-xs text-gray-400">Full access to all boards, settings, and user management.</span>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                                <span className="self-start px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase">Editor</span>
                                <span className="text-xs text-gray-400">Access to "Editor Portal". Sees only assigned workspace boards.</span>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                                <span className="self-start px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold uppercase">Client</span>
                                <span className="text-xs text-gray-400">Access to "Client Portal". Sees only fulfillment deliverable boards.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - User List Launcher */}
                <div className="flex flex-col gap-6 lg:col-span-4">
                    <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0A16] to-[#0F0F1A] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-custom-bright/30 transition-all group cursor-pointer shadow-2xl shadow-black/50"
                        onClick={() => setIsUserListOpen(true)}>

                        <div className="relative z-10 w-16 h-16 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Users className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors" />
                        </div>
                        <h2 className="relative z-10 text-2xl font-bold text-white mb-2">User Directory</h2>
                        <p className="relative z-10 text-gray-400 mb-8 max-w-[200px] text-xs leading-relaxed">
                            Manage all registered users in a centralized table view.
                        </p>
                        <button className="relative z-10 w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-white/10">
                            <Table className="w-4 h-4" />
                            Open Directory
                        </button>
                        <div className="relative z-10 mt-6 flex items-center gap-2 text-[10px] font-mono text-gray-500 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            {userList.length} Active Users
                        </div>
                    </div>
                </div>
            </div>

            {/* User List Modal */}
            <AnimatePresence>
                {isUserListOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsUserListOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0A0A16] border border-white/10 rounded-2xl shadow-2xl w-full max-w-6xl max-h-full flex flex-col relative z-10 overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0A0A16]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-custom-bright/20">
                                        <Users className="w-6 h-6 text-custom-bright" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">User Directory</h2>
                                        <p className="text-sm text-gray-400">{userList.length} active users</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsUserListOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-6 bg-[#080816]">
                                <div className="bg-[#0A0A16] border border-white/5 rounded-xl overflow-hidden">
                                    <table className="w-full text-left border-collapse relative">
                                        <thead className="sticky top-0 bg-[#0A0A16] z-10 shadow-sm shadow-black/50">
                                            <tr className="border-b border-white/5 bg-white/5">
                                                <th className="p-4 text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Name</th>
                                                <th className="p-4 text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Role</th>
                                                <th className="p-4 text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Workspace</th>
                                                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {userListLoading ? (
                                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading users...</td></tr>
                                            ) : userList.length === 0 ? (
                                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No users found</td></tr>
                                            ) : (
                                                userList.map(user => (
                                                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                                        <td className="p-4">
                                                            <div className="text-sm text-white font-medium">{user.name}</div>
                                                            <div className="text-xs text-gray-500 font-mono mt-0.5">{user.email}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                                                                user.role === 'editor' ? 'bg-blue-500/20 text-blue-400' :
                                                                    'bg-green-500/20 text-green-400'
                                                                }`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-xs text-gray-400">
                                                            {user.workspace_id ? (
                                                                workspaces.find(w => w.id.toString() === user.workspace_id)?.name || 'Unknown WS'
                                                            ) : (
                                                                <span className="text-gray-600">-</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={() => handleEditUser(user)}
                                                                    className="p-1.5 hover:bg-blue-500/20 rounded-lg text-gray-500 hover:text-blue-400 transition-colors"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                                                    className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
