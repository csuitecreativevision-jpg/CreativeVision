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
    X,
    Shield,
    Briefcase,
    Layout
} from 'lucide-react';
import {
    createUser, getAllUsers, updateUser, deleteUser
} from '../../services/boardsService';
import { getAllWorkspaces, getAllBoards } from '../../services/mondayService';
import { PremiumModal } from '../ui/PremiumModal';
import { createDiscordThread } from '../../services/discordService';

// --- Reusable UI Sub-Components (Internal) ---

const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-[#0E0E1A]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl ${className}`}>
        {children}
    </div>
);

const FormLabel = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
        {children} {required && <span className="text-red-400">*</span>}
    </label>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className={`w-full bg-[#131322] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all ${props.className}`}
    />
);

const StyledSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <div className="relative">
        <select
            {...props}
            className={`w-full bg-[#131322] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 appearance-none cursor-pointer transition-all ${props.className}`}
        />
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>
);

export function UserManagement() {
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

    // Auto-generate email
    useEffect(() => {
        if (!editingUserId) {
            const cleanName = newUserName.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (newUserRole === 'admin') setNewUserEmail(cleanName + '@admin.cv');
            else if (newUserRole === 'editor') setNewUserEmail(cleanName + '@editors.cv');
            else if (newUserRole === 'client') setNewUserEmail(cleanName + '@clients.cv');
        }
    }, [newUserRole, newUserName, editingUserId]);

    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let pass = '';
        for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
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
            if (result.success) fetchUsers();
            else alert('Failed: ' + result.error);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserError(null);
        setUserSuccess(null);

        if (!editingUserId) {
            if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
                setUserError('All fields are required.');
                return;
            }
            if (newUserPassword.length < 4) {
                setUserError('Password too short (min 4).');
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
                setUserSuccess(`User updated successfully!`);
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
                setUserSuccess(`User created successfully!`);

                // --- Start Discord Thread Creation ---
                if (newUserRole === 'editor') {
                    // Fire and forget - don't let it block the UI
                    createDiscordThread(newUserName.trim()).catch(err => {
                        console.error('Failed to auto-create discord thread:', err);
                    });
                }
                // --- End Discord Thread Creation ---

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
        <div className="space-y-6">
            {/* Header/Actions for the Component */}
            <div className="flex justify-between items-center bg-[#0E0E1A]/50 p-4 rounded-2xl border border-white/5">
                <div>
                    <h3 className="text-white font-bold">User Database</h3>
                    <p className="text-xs text-gray-500">Create, edit, and manage system access.</p>
                </div>
                <button
                    onClick={() => setIsUserListOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm transition-all group"
                >
                    <Users className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    Directory
                    <span className="px-1.5 py-0.5 rounded bg-black/30 text-[10px] text-gray-400 border border-white/5">
                        {userList.length}
                    </span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* --- Left Column: Create/Edit Form --- */}
                <GlassCard className="space-y-6">
                    <div className="flex items-center gap-3 pb-6 border-b border-white/5">
                        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                            {editingUserId ? <Pencil className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {editingUserId ? 'Edit Account' : 'New Account'}
                            </h2>
                            <p className="text-sm text-gray-400">
                                {editingUserId ? 'Update user details and permissions.' : 'Create a new access profile.'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateUser} className="space-y-6">
                        {/* Role Selector */}
                        <div>
                            <FormLabel>Access Role</FormLabel>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'admin', icon: Shield, label: 'Admin', color: 'purple' },
                                    { id: 'editor', icon: Briefcase, label: 'Editor', color: 'blue' },
                                    { id: 'client', icon: Layout, label: 'Client', color: 'emerald' },
                                ].map((role) => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setNewUserRole(role.id as any)}
                                        className={`relative group p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${newUserRole === role.id
                                            ? `bg-${role.color}-500/20 border-${role.color}-500/50`
                                            : 'bg-[#131322] border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <role.icon className={`w-5 h-5 ${newUserRole === role.id ? `text-${role.color}-400` : 'text-gray-500 group-hover:text-gray-300'}`} />
                                        <span className={`text-xs font-bold ${newUserRole === role.id ? 'text-white' : 'text-gray-500'}`}>{role.label}</span>
                                        {newUserRole === role.id && (
                                            <motion.div layoutId="role-selected-um" className={`absolute inset-0 rounded-xl border-2 border-${role.color}-500`} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <FormLabel required>Full Name</FormLabel>
                                <StyledInput
                                    placeholder="Jane Doe"
                                    value={newUserName}
                                    onChange={e => setNewUserName(e.target.value)}
                                />
                            </div>

                            {/* Conditional Workspace/Boards */}
                            <AnimatePresence>
                                {(newUserRole === 'editor' || newUserRole === 'client') && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 overflow-hidden"
                                    >
                                        <div>
                                            <FormLabel>Assigned Workspace</FormLabel>
                                            <StyledSelect
                                                value={selectedUserWorkspace}
                                                onChange={e => setSelectedUserWorkspace(e.target.value)}
                                            >
                                                <option value="">Select Workspace...</option>
                                                {workspaces.map(ws => (
                                                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                                                ))}
                                            </StyledSelect>
                                        </div>

                                        {selectedUserWorkspace && (
                                            <div>
                                                <FormLabel>Allowed Boards (Optional)</FormLabel>

                                                {/* Added Search Input */}
                                                <div className="relative mb-2">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                                                    <input
                                                        type="text"
                                                        placeholder="Filter boards..."
                                                        value={boardSearchQuery}
                                                        onChange={(e) => setBoardSearchQuery(e.target.value)}
                                                        className="w-full bg-[#131322] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                                                    />
                                                </div>

                                                <div className="bg-[#131322] border border-white/10 rounded-xl max-h-48 overflow-y-auto custom-scrollbar p-2">
                                                    {boards
                                                        .filter(b => {
                                                            const boardWsId = b.workspace?.id?.toString();
                                                            return boardWsId === selectedUserWorkspace;
                                                        })
                                                        .filter(b => {
                                                            const name = b.name.toLowerCase();
                                                            const matchesSearch = name.includes(boardSearchQuery.toLowerCase());

                                                            // Always exclude subitem boards
                                                            if (name.includes('subitems')) return false;

                                                            if (!matchesSearch) return false;

                                                            if (newUserRole === 'editor') {
                                                                return name.includes('- workspace');
                                                            }
                                                            if (newUserRole === 'client') {
                                                                // Correcting user typo "fullfillment" to "fulfillment"
                                                                return name.includes('fulfillment board');
                                                            }
                                                            return true;
                                                        })
                                                        .map(board => (
                                                            <label key={board.id} className="flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedBoardIds.includes(board.id) ? 'bg-violet-500 border-violet-500' : 'border-gray-600 group-hover:border-gray-400'
                                                                    }`}>
                                                                    {selectedBoardIds.includes(board.id) && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                                                                </div>
                                                                <input
                                                                    type="checkbox"
                                                                    className="hidden"
                                                                    checked={selectedBoardIds.includes(board.id)}
                                                                    onChange={e => {
                                                                        if (e.target.checked) setSelectedBoardIds([...selectedBoardIds, board.id]);
                                                                        else setSelectedBoardIds(selectedBoardIds.filter(id => id !== board.id));
                                                                    }}
                                                                />
                                                                <span className={`text-sm ${selectedBoardIds.includes(board.id) ? 'text-white' : 'text-gray-400'}`}>{board.name}</span>
                                                            </label>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Credentials */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <FormLabel>Email (Auto)</FormLabel>
                                    <div className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-gray-500 font-mono text-sm">
                                        {newUserEmail || '...'}
                                    </div>
                                </div>
                                <div>
                                    <FormLabel required={!editingUserId}>
                                        Password {editingUserId && '(Optional)'}
                                    </FormLabel>
                                    <div className="relative flex gap-2">
                                        <div className="relative flex-1">
                                            <StyledInput
                                                type={showPassword ? "text" : "password"}
                                                value={newUserPassword}
                                                onChange={e => setNewUserPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={generatePassword}
                                            className="px-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400 hover:bg-violet-500/20 transition-all flex items-center justify-center group"
                                            title="Auto-generate secure password"
                                        >
                                            <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-white/5 flex justify-center gap-3">
                            {editingUserId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 hover:text-white transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isCreatingUser}
                                className="px-20 py-3 rounded-full bg-white text-black font-bold hover:bg-custom-bright hover:text-white transition-all flex items-center gap-2"
                            >
                                {isCreatingUser ? 'Processing...' : (editingUserId ? 'Save Changes' : 'Create User')}
                            </button>
                        </div>

                        {/* Feedback Messages */}
                        <AnimatePresence>
                            {userError && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
                                    {userError}
                                </motion.div>
                            )}
                            {userSuccess && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm font-medium">
                                    {userSuccess}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </GlassCard>

                {/* --- Right Column: Info/Help --- */}
                <div className="space-y-6">
                    <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-violet-600/20 to-blue-600/5 border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 blur-[80px] rounded-full pointer-events-none -mr-32 -mt-32" />

                        <h3 className="text-lg font-bold text-white mb-4 relative z-10">Role Guidelines</h3>
                        <div className="space-y-4 relative z-10">
                            {[
                                { role: 'Admin', desc: 'Full system access. Can manage users, view all boards, and modify global settings.', color: 'purple' },
                                { role: 'Editor', desc: 'Restricted to specific Workspaces. Can view/edit boards assigned to them.', color: 'blue' },
                                { role: 'Client', desc: 'Restricted view. Can only access "Fulfillment" boards in their workspace.', color: 'emerald' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-[#0E0E1A]/60 border border-white/5 backdrop-blur-sm">
                                    <div className={`w-1 h-full rounded-full bg-${item.color}-500 shrink-0`} />
                                    <div>
                                        <span className={`text-xs font-bold uppercase tracking-wider text-${item.color}-400 mb-1 block`}>{item.role}</span>
                                        <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- User Directory Modal --- */}
            <PremiumModal
                isOpen={isUserListOpen}
                onClose={() => setIsUserListOpen(false)}
                maxWidth="max-w-5xl"
            >
                {/* Modal Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#131322]/50">
                    <div>
                        <h2 className="text-xl font-bold text-white">User Directory</h2>
                        <p className="text-sm text-gray-400">{userList.length} registered accounts</p>
                    </div>
                    <button
                        onClick={() => setIsUserListOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-auto p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#131322] sticky top-0 z-10">
                            <tr>
                                {['Name', 'Role', 'Workspace', 'Actions'].map(h => (
                                    <th key={h} className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {userList.map((user) => (
                                <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-white text-sm">{user.name}</div>
                                        <div className="text-xs text-gray-500 font-mono">{user.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                            user.role === 'editor' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {user.workspace_id ? (
                                            <span className="text-xs text-gray-300">
                                                {workspaces.find(w => w.id.toString() === user.workspace_id)?.name || 'Unknown'}
                                            </span>
                                        ) : <span className="text-gray-600">-</span>}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-blue-400 transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id, user.name)}
                                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </PremiumModal>
        </div>
    );
}
