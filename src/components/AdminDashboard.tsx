import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BackgroundLayout } from './layout/BackgroundLayout';
import { CinematicOverlay } from './ui/CinematicOverlay';
import { SpotlightCard } from './ui/SpotlightCard';
import {
    LayoutDashboard,
    Users,
    Settings,
    Activity,
    Search,
    Bell,
    Menu,
    TrendingUp,
    Eye,
    Briefcase,
    Globe,
    LogOut,
    AlignLeft,
    ArrowLeft,
    Table,
    Loader2,
    Plus,
    X,
    Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllBoards, getBoardItems, createNewBoard, createNewGroup, updateItemValue } from '../services/mondayService';

// --- Board Cell Component for Inline Editing ---
const BoardCell = ({ item, column, boardId, onUpdate }: { item: any, column: any, boardId: string, onUpdate: () => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Find value for this column
    const colValueObj = item.column_values.find((v: any) => v.id === column.id);
    const displayValue = colValueObj ? (colValueObj.text || '') : '';

    // Parse column settings for Status/Dropdown
    let options = [];
    if (column.type === 'color' || column.type === 'status') { // 'color' is internal name for status sometimes
        try {
            const settings = JSON.parse(column.settings_str || '{}');
            // Status settings format usually: { labels: { 0: "Done", 1: "Working", ... }, labels_colors: { ... } }
            if (settings.labels) {
                options = Object.entries(settings.labels).map(([key, label]: any) => ({
                    id: key,
                    label: label,
                    color: settings.labels_colors ? settings.labels_colors[key]?.color : '#fff'
                }));
            }
        } catch (e) {
            console.error("Failed to parse column settings", e);
        }
    }

    const handleSave = async (newValue: string) => {
        if (newValue === displayValue) {
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            await updateItemValue(boardId, item.id, column.id, newValue);
            await onUpdate(); // Refresh parent
        } catch (err) {
            console.error(err);
            alert("Failed to update value");
        } finally {
            setIsLoading(false);
            setIsEditing(false);
        }
    };

    if (isLoading) {
        return <div className="text-gray-500 text-xs animate-pulse">Saving...</div>;
    }

    // Status / Dropdown Rendering
    if (column.type === 'color' || column.type === 'status') {
        // Find current option color if possible
        const currentOption = options.find(o => o.label === displayValue);
        const bgStyle = currentOption ? { backgroundColor: currentOption.color } : { backgroundColor: '#579bfc' }; // default blueish

        if (isEditing) {
            return (
                <div className="relative z-50">
                    <div
                        className="fixed inset-0"
                        onClick={() => setIsEditing(false)}
                    />
                    <div className="absolute top-0 left-0 min-w-[120px] bg-[#1a1a2e] border border-white/20 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        {options.map((opt: any) => (
                            <button
                                key={opt.id}
                                onClick={() => handleSave(opt.label)}
                                className="w-full text-left px-4 py-2 hover:bg-white/10 text-white text-sm transition-colors flex items-center gap-2"
                            >
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.color || '#fff' }} />
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 rounded-full text-white text-xs font-bold text-center min-w-[80px] hover:opacity-80 transition-opacity"
                style={currentOption && currentOption.label ? { backgroundColor: currentOption.color || '#7c3aed' } : { backgroundColor: '#333', color: '#888' }}
            >
                {displayValue || '-'}
            </button>
        );
    }

    // Text / Numbers / Default Rendering
    if (isEditing) {
        return (
            <input
                autoFocus
                className="bg-[#050511] border border-custom-bright rounded px-2 py-1 text-white text-sm w-full min-w-[100px] outline-none"
                defaultValue={displayValue}
                onBlur={(e) => handleSave(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave(e.currentTarget.value);
                    if (e.key === 'Escape') setIsEditing(false);
                }}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className="cursor-text hover:bg-white/5 px-2 py-1 rounded transition-colors text-gray-300 min-h-[24px] min-w-[50px]"
        >
            {displayValue || <span className="text-white/10 text-xs italic">Empty</span>}
        </div>
    );
};

// ... (Rest of dashboard code)

// Reusable Sidebar Item Component
const SidebarItem = ({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${active ? 'bg-custom-bright/10 border border-custom-bright/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
    >
        <div className={`p-1 rounded-lg ${active ? 'text-custom-bright' : 'text-gray-500 group-hover:text-white transition-colors'}`}>
            {icon}
        </div>
        <span className="text-sm font-medium tracking-wide">{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-custom-bright shadow-[0_0_8px_rgba(124,58,237,0.5)]" />}
    </button>
);

// Reusable Stat Card Component
const StatCard = ({ title, value, change, icon, delay }: { title: string, value: string, change: string, icon: any, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
    >
        <SpotlightCard className="p-6 rounded-3xl bg-black/20 border border-white/5 backdrop-blur-xl h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    {icon}
                </div>
                <div className="px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {change}
                </div>
            </div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
            <div className="text-3xl font-black text-white tracking-tight">{value}</div>
        </SpotlightCard>
    </motion.div>
);

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');

    // Board Integration State
    const [boards, setBoards] = useState<any[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
    const [boardData, setBoardData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Create Modal State
    const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    const handleLogout = () => {
        navigate('/');
    };

    const refreshBoards = () => {
        setLoading(true);
        getAllBoards().then(data => {
            setBoards(data);
            setLoading(false);
        }).catch(err => { console.error(err); setLoading(false); });
    };

    const refreshBoardDetails = (id: string, silent = false) => {
        if (!silent) setLoading(true);
        getBoardItems(id).then(data => {
            setBoardData(data);
            if (!silent) setLoading(false);
        }).catch(err => { console.error(err); if (!silent) setLoading(false); });
    };

    // Fetch boards when tab changes to 'Boards'
    useEffect(() => {
        if (activeTab === 'Boards' && boards.length === 0) {
            refreshBoards();
        }
    }, [activeTab]);

    // Fetch specific board data when selected
    useEffect(() => {
        if (selectedBoardId) {
            refreshBoardDetails(selectedBoardId);
        }
    }, [selectedBoardId]);

    const handleCreateBoard = async () => {
        if (!newBoardName.trim()) return;
        setLoading(true);
        try {
            await createNewBoard(newBoardName);
            setNewBoardName('');
            setIsCreateBoardOpen(false);
            refreshBoards();
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
            refreshBoardDetails(selectedBoardId);
        } catch (error) {
            console.error("Failed to create group", error);
            setLoading(false);
        }
    };

    return (
        <BackgroundLayout>
            <CinematicOverlay />

            <div className="relative min-h-screen w-full flex bg-[#050511] overflow-hidden">
                {/* Sidebar */}
                <aside className="hidden lg:flex w-72 h-screen flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl p-6 relative z-30">
                    {/* Logo Area */}
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-custom-border to-custom-violet p-[1px]">
                            <div className="w-full h-full rounded-xl bg-black flex items-center justify-center">
                                <img src="/Untitled design (3).png" alt="Logo" className="w-6 h-6 object-contain" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-white font-bold tracking-tight">CreativeVision</h2>
                            <div className="text-[10px] text-custom-bright font-bold uppercase tracking-widest">Admin Console</div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-2">
                        <SidebarItem icon={<LayoutDashboard className="w-5 h-5" />} label="Overview" active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
                        <SidebarItem icon={<AlignLeft className="w-5 h-5" />} label="Boards" active={activeTab === 'Boards'} onClick={() => { setActiveTab('Boards'); setSelectedBoardId(null); }} />
                        <SidebarItem icon={<Briefcase className="w-5 h-5" />} label="Projects" active={activeTab === 'Projects'} onClick={() => setActiveTab('Projects')} />
                        <SidebarItem icon={<Activity className="w-5 h-5" />} label="Analytics" active={activeTab === 'Analytics'} onClick={() => setActiveTab('Analytics')} />
                        <SidebarItem icon={<Users className="w-5 h-5" />} label="Team" active={activeTab === 'Team'} onClick={() => setActiveTab('Team')} />
                        <SidebarItem icon={<Globe className="w-5 h-5" />} label="Website" active={activeTab === 'Website'} onClick={() => setActiveTab('Website')} />
                        <SidebarItem icon={<Settings className="w-5 h-5" />} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-gray-400 transition-colors group">
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm font-medium">Log Out</span>
                        </button>
                    </div>
                </aside>

                <main className="flex-1 h-screen overflow-y-auto relative z-20">
                    {/* Header */}
                    <header className="sticky top-0 z-40 px-8 py-5 flex items-center justify-between border-b border-white/5 bg-[#050511]/80 backdrop-blur-2xl">
                        <div className="flex items-center gap-4 lg:hidden">
                            <button className="text-white"><Menu className="w-6 h-6" /></button>
                        </div>

                        <div className="hidden lg:block">
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                {activeTab === 'Boards' && selectedBoardId && boardData ? boardData.name : activeTab}
                            </h1>
                            <p className="text-xs text-gray-400">Welcome back, Administrator.</p>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="relative hidden md:block group">
                                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-custom-bright transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-custom-bright/50 focus:bg-white/10 transition-all w-64"
                                />
                            </div>
                            <button className="relative text-gray-400 hover:text-white transition-colors">
                                <Bell className="w-5 h-5" />
                                <span className="absolute -top-1 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
                            </button>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-custom-blue to-custom-purple p-[1px]">
                                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop" alt="Admin" className="w-full h-full rounded-full object-cover" />
                            </div>
                        </div>
                    </header>


                    <div className="p-6 md:p-8 space-y-8 pb-20">
                        {/* Overview Tab */}
                        {activeTab === 'Overview' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard title="Total Views" value="124.5K" change="+12.5%" icon={<Eye className="w-5 h-5 text-blue-400" />} delay={0.1} />
                                    <StatCard title="Active Projects" value="14" change="+4" icon={<Briefcase className="w-5 h-5 text-purple-400" />} delay={0.2} />
                                    <StatCard title="Conversion Rate" value="3.2%" change="+0.8%" icon={<TrendingUp className="w-5 h-5 text-green-400" />} delay={0.3} />
                                    <StatCard title="System Status" value="99.9%" change="Stable" icon={<Activity className="w-5 h-5 text-custom-bright" />} delay={0.4} />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2 rounded-[2rem] bg-black/20 border border-white/5 backdrop-blur-xl p-8">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold text-white">Recent Inquiries</h3>
                                            <button className="text-xs text-custom-bright hover:text-white transition-colors">View All</button>
                                        </div>
                                        <div className="space-y-4">
                                            {[1, 2, 3].map((item) => (
                                                <div key={item} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group cursor-pointer">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white">JD</div>
                                                        <div><div className="text-white font-medium text-sm">John Doe</div><div className="text-gray-500 text-xs">Project Inquiry: Branding</div></div>
                                                    </div>
                                                    <div className="text-gray-400 text-xs text-right"><div>2 mins ago</div><div className="text-custom-bright group-hover:underline">Reply</div></div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="rounded-[2rem] bg-gradient-to-b from-custom-violet/20 to-black/20 border border-white/5 backdrop-blur-xl p-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-custom-violet/30 rounded-full blur-[50px] pointer-events-none" />
                                        <h3 className="text-lg font-bold text-white mb-6 relative z-10">System Alerts</h3>
                                        <div className="space-y-6 relative z-10">
                                            <div className="flex gap-3"><div className="mt-1 w-2 h-2 rounded-full bg-green-400 shrink-0" /><div><div className="text-white text-sm font-medium">Server Optimization</div><div className="text-gray-400 text-xs mt-1">Load times reduced by 40%.</div></div></div>
                                        </div>
                                    </motion.div>
                                </div>
                            </>
                        )}

                        {activeTab === 'Boards' && (
                            <div className="min-h-[500px]">
                                {/* Back Button Logic */}
                                {selectedBoardId && (
                                    <div className="flex justify-between items-center mb-8">
                                        <button
                                            onClick={() => { setSelectedBoardId(null); setBoardData(null); }}
                                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5"
                                        >
                                            <ArrowLeft className="w-4 h-4" /> Back to Boards
                                        </button>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setIsCreateGroupOpen(true)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-custom-bright text-white text-sm font-bold hover:brightness-110 transition-all"
                                            >
                                                <Plus className="w-4 h-4" /> Add Group
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {loading && !boardData ? (
                                    <div className="flex flex-col items-center justify-center h-96">
                                        <Loader2 className="w-12 h-12 text-custom-bright animate-spin mb-4" />
                                        <p className="text-gray-400 text-sm animate-pulse">Syncing with Monday.com...</p>
                                    </div>
                                ) : (
                                    <>
                                        {!selectedBoardId && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {/* Create Board Card */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    onClick={() => setIsCreateBoardOpen(true)}
                                                >
                                                    <div className="p-8 rounded-3xl bg-white/5 border border-dashed border-white/20 hover:border-custom-bright hover:bg-white/10 transition-all cursor-pointer group h-full flex flex-col items-center justify-center min-h-[240px]">
                                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                            <Plus className="w-8 h-8 text-gray-400 group-hover:text-custom-bright transition-colors" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-gray-300 group-hover:text-white">Create New Board</h3>
                                                    </div>
                                                </motion.div>

                                                {boards.map((board, i) => (
                                                    <motion.div
                                                        key={board.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        onClick={() => setSelectedBoardId(board.id)}
                                                    >
                                                        <SpotlightCard className="p-8 rounded-3xl bg-black/20 border border-white/5 backdrop-blur-xl hover:bg-white/5 transition-all cursor-pointer group h-full">
                                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-custom-blue to-custom-violet flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                                <Table className="w-6 h-6 text-white" />
                                                            </div>
                                                            <h3 className="text-xl font-bold text-white mb-2">{board.name}</h3>
                                                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                                <AlignLeft className="w-4 h-4" />
                                                                {board.items_count || 0} Items
                                                            </div>
                                                        </SpotlightCard>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}

                                        {selectedBoardId && boardData && (
                                            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                                                {(!boardData.groups || boardData.groups.length === 0) && (
                                                    <div className="p-8 text-center text-gray-500">No groups found in this board.</div>
                                                )}

                                                {boardData.groups?.map((group: any) => {
                                                    const groupItems = boardData.items?.filter((item: any) => item.group?.id === group.id) || [];
                                                    return (
                                                        <motion.div
                                                            key={group.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="rounded-[2rem] bg-black/20 border border-white/5 backdrop-blur-xl overflow-hidden"
                                                        >
                                                            {/* Group Header */}
                                                            <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center gap-3">
                                                                <div className={`w-1.5 h-6 rounded-full`} style={{ backgroundColor: group.color || '#7c3aed' }} />
                                                                <h3 className="text-lg font-bold text-white tracking-wide">{group.title}</h3>
                                                                <span className="text-xs text-gray-400 bg-black/30 px-2 py-0.5 rounded-full border border-white/5">{groupItems.length} items</span>
                                                            </div>

                                                            <div className="overflow-x-auto custom-scrollbar">
                                                                <table className="w-full text-left border-collapse">
                                                                    <thead className="bg-black/20">
                                                                        <tr>
                                                                            <th className="p-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest font-mono min-w-[250px] sticky left-0 bg-[#0A0A16] z-10 border-r border-white/5">Item Name</th>
                                                                            {boardData.columns?.map((col: any) => (
                                                                                <th key={col.id} className="p-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap font-mono min-w-[150px]">{col.title}</th>
                                                                            ))}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-white/5">
                                                                        {groupItems.length > 0 ? (
                                                                            groupItems.map((item: any) => (
                                                                                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                                                                    {/* Name Column (Sticky) */}
                                                                                    <td className="p-3 px-6 text-white font-medium whitespace-nowrap border-r border-white/5 sticky left-0 bg-[#0A0A16] z-10 group-hover:bg-[#1a1a2e]">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className="w-2 h-2 rounded-full bg-blue-400/50 group-hover:bg-blue-400 transition-colors" />
                                                                                            {item.name}
                                                                                        </div>
                                                                                    </td>

                                                                                    {/* Edtiable Cells */}
                                                                                    {boardData.columns?.map((col: any) => (
                                                                                        <td key={col.id} className="p-3 px-6 text-gray-400 text-sm whitespace-nowrap border-l border-white/5">
                                                                                            <BoardCell
                                                                                                item={item}
                                                                                                column={col}
                                                                                                boardId={selectedBoardId}
                                                                                                onUpdate={() => refreshBoardDetails(selectedBoardId!, true)}
                                                                                            />
                                                                                        </td>
                                                                                    ))}
                                                                                </tr>
                                                                            ))
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan={boardData.columns.length + 1} className="p-6 text-center text-gray-600 italic text-sm">No items in this group</td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                    </div>
                </main>

                {/* Modals */}
                {isCreateBoardOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <SpotlightCard className="w-full max-w-md p-8 rounded-3xl bg-[#0A0A16] border border-white/10 shadow-2xl relative">
                            <button onClick={() => setIsCreateBoardOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                            <h2 className="text-xl font-bold text-white mb-4">Create New Board</h2>
                            <input
                                value={newBoardName}
                                onChange={(e) => setNewBoardName(e.target.value)}
                                placeholder="Board Name"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-6 focus:outline-none focus:border-custom-bright"
                            />
                            <button onClick={handleCreateBoard} disabled={loading} className="w-full py-3 rounded-xl bg-custom-bright text-white font-bold hover:brightness-110">
                                {loading ? 'Creating...' : 'Create Board'}
                            </button>
                        </SpotlightCard>
                    </div>
                )}

                {isCreateGroupOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <SpotlightCard className="w-full max-w-md p-8 rounded-3xl bg-[#0A0A16] border border-white/10 shadow-2xl relative">
                            <button onClick={() => setIsCreateGroupOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                            <h2 className="text-xl font-bold text-white mb-4">Add New Group</h2>
                            <input
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="Group Name (e.g. Design, Development)"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-6 focus:outline-none focus:border-custom-bright"
                            />
                            <button onClick={handleCreateGroup} disabled={loading} className="w-full py-3 rounded-xl bg-custom-bright text-white font-bold hover:brightness-110">
                                {loading ? 'Creating...' : 'Create Group'}
                            </button>
                        </SpotlightCard>
                    </div>
                )}

                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-custom-blue/10 rounded-full blur-[128px]" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-custom-purple/10 rounded-full blur-[128px]" />
                </div>
            </div>
        </BackgroundLayout>
    );
}
