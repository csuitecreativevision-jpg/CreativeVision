import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deploymentService, DeploymentNote, DeploymentFolder } from '../../services/deploymentService';
import { Plus, Edit2, Trash2, ExternalLink, Calendar as CalendarIcon, Loader2, X, DollarSign, RefreshCw, Layers, Folder } from 'lucide-react';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { stripHtmlToPlainText } from '../../lib/instructionLinkify';

export default function AdminDeploymentCenter() {
    const role = localStorage.getItem('portal_user_role');
    const isSuperAdmin = role === 'super_admin';
    const isAdmin = role === 'admin';

    // Data State
    const [folders, setFolders] = useState<DeploymentFolder[]>([]);
    const [deployments, setDeployments] = useState<DeploymentNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // View State
    const [activeFolder, setActiveFolder] = useState<DeploymentFolder | null>(null);

    // Deployment Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<DeploymentNote | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Folder Modal State
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState<DeploymentFolder | null>(null);
    const [isFolderSaving, setIsFolderSaving] = useState(false);
    const [folderName, setFolderName] = useState('');

    // Form State (Deployments)
    const [formData, setFormData] = useState<Partial<DeploymentNote>>({
        instructions: '',
        raw_video_link: '',
        video_type: 'Short Form',
        price: '',
        deadline: '',
        status: 'Ready for Deployment'
    });

    const loadFolders = async (isRefetch = false) => {
        if (isRefetch) setIsRefreshing(true);
        else setLoading(true);

        try {
            const data = await deploymentService.getFolders();
            setFolders(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const loadDeployments = async (folderId: string, isRefetch = false) => {
        if (isRefetch) setIsRefreshing(true);
        else setLoading(true);

        try {
            const data = await deploymentService.getDeploymentsByFolder(folderId);
            setDeployments(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (activeFolder) {
            loadDeployments(activeFolder.id);
        } else {
            loadFolders();
        }
    }, [activeFolder]);

    const handleOpenModal = (note?: DeploymentNote) => {
        if (note) {
            setEditingNote(note);
            setFormData({
                folder_id: note.folder_id,
                instructions: note.instructions,
                raw_video_link: note.raw_video_link,
                video_type: note.video_type,
                price: note.price,
                deadline: note.deadline ? formattedDateForInput(note.deadline) : '',
                status: note.status
            });
        } else {
            setEditingNote(null);
            setFormData({
                folder_id: activeFolder?.id || '',
                instructions: '',
                raw_video_link: '',
                video_type: 'Short Form', // Default
                price: '',
                deadline: '',
                status: 'Ready for Deployment'
            });
        }
        setIsModalOpen(true);
    };

    const handleOpenFolderModal = (folder?: DeploymentFolder) => {
        if (folder) {
            setEditingFolder(folder);
            setFolderName(folder.name);
        } else {
            setEditingFolder(null);
            setFolderName('');
        }
        setIsFolderModalOpen(true);
    };

    const formattedDateForInput = (isoDate: string) => {
        try {
            return new Date(isoDate).toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeFolder) return;

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                folder_id: activeFolder.id,
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
            } as DeploymentNote;

            if (editingNote?.id) {
                await deploymentService.updateDeployment(editingNote.id, payload);
            } else {
                await deploymentService.createDeployment(payload);
            }
            setIsModalOpen(false);
            loadDeployments(activeFolder.id, true);
        } catch (error) {
            console.error("Failed to save:", error);
            alert("Failed to save deployment note.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFolderSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsFolderSaving(true);
        try {
            if (editingFolder?.id) {
                await deploymentService.updateFolder(editingFolder.id, folderName);
            } else {
                await deploymentService.createFolder(folderName);
            }
            setIsFolderModalOpen(false);
            loadFolders(true);
        } catch (error) {
            console.error("Failed to save folder:", error);
            alert("Failed to save client folder.");
        } finally {
            setIsFolderSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!activeFolder) return;
        if (!window.confirm("Are you sure you want to delete this deployment note?")) return;

        try {
            await deploymentService.deleteDeployment(id);
            setDeployments(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("Failed to delete deployment note.");
        }
    };

    const handleFolderDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // prevent opening the folder
        if (!window.confirm("Are you sure you want to delete this folder and ALL its deployments?")) return;

        try {
            await deploymentService.deleteFolder(id);
            setFolders(prev => prev.filter(f => f.id !== id));
        } catch (error) {
            console.error("Failed to delete folder:", error);
            alert("Failed to delete client folder.");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'deployed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'ready for deployment': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'draft': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
            default: return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
        }
    };

    return (
        <div className="flex-1 w-full flex flex-col min-h-screen bg-[#07070f] relative overflow-hidden font-sans">
            {/* Background elements */}
            <div className="absolute top-0 left-1/4 w-[800px] h-[500px] bg-violet-600/10 mix-blend-screen rounded-full blur-[100px] opacity-30 pointer-events-none" />
            <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-emerald-600/5 mix-blend-screen rounded-full blur-[120px] opacity-30 pointer-events-none" />

            <div className="relative flex-1 w-full max-w-[1600px] mx-auto p-3 sm:p-6 lg:p-8 flex flex-col z-10 mt-16 sm:mt-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4 mb-5 sm:mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            {activeFolder && (
                                <button
                                    onClick={() => setActiveFolder(null)}
                                    className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                                    title="Back to Folders"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                                </button>
                            )}
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none">
                                {activeFolder ? activeFolder.name : 'Deployment Center'}
                            </h1>
                        </div>
                        <p className="text-gray-400 text-base md:text-lg max-w-2xl font-medium">
                            {activeFolder ? 'Manage deployment tracking for this client.' : 'Manage ready-to-deploy videos, organize by client folders.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => activeFolder ? loadDeployments(activeFolder.id, true) : loadFolders(true)}
                            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 text-white transition-all group"
                        >
                            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-violet-400' : 'text-gray-400 group-hover:text-white'} `} />
                        </button>
                        {(isSuperAdmin || isAdmin) && (
                            <button
                                onClick={activeFolder ? () => handleOpenModal() : () => handleOpenFolderModal()}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-lg shadow-violet-500/25 border border-violet-500/50 transition-all hover:-translate-y-0.5"
                            >
                                <Plus className="w-5 h-5" />
                                {activeFolder ? 'New Deployment' : 'New Client Folder'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                {!activeFolder ? (
                    /* Folders Grid View */
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                                <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
                                <p className="text-gray-400 font-medium animate-pulse">Loading folders...</p>
                            </div>
                        ) : folders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 bg-[#0e0e1a]/80 backdrop-blur-xl rounded-2xl border border-white/10">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                    <Folder className="w-10 h-10 text-gray-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">No Folders</h3>
                                <p className="text-gray-400 max-w-md">
                                    Create your first client folder to start organizing deployments.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {folders.map(folder => (
                                    <motion.div
                                        key={folder.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => setActiveFolder(folder)}
                                        className="bg-[#0e0e1a]/80 backdrop-blur-xl border border-white/10 hover:border-violet-500/40 rounded-2xl p-4 sm:p-5 lg:p-6 cursor-pointer transition-all hover:-translate-y-1 shadow-lg hover:shadow-violet-500/10 group relative"
                                    >
                                        <div className="flex items-start justify-between mb-2 sm:mb-4">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Folder className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </div>
                                            {(isSuperAdmin || isAdmin) && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOpenFolderModal(folder); }}
                                                        className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleFolderDelete(folder.id, e)}
                                                        className="p-2 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/20 rounded-lg"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-base sm:text-xl font-bold text-white mb-0.5 sm:mb-1 truncate" title={folder.name}>
                                            {folder.name}
                                        </h3>
                                        <p className="text-gray-500 text-sm font-medium">
                                            Created {new Date(folder.created_at).toLocaleDateString()}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Deployments Table View */
                    <div className="flex-1 overflow-x-auto relative rounded-2xl border border-white/10 bg-[#0e0e1a]/80 backdrop-blur-xl custom-scrollbar shadow-2xl">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 h-full min-h-[400px]">
                                <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
                                <p className="text-gray-400 font-medium animate-pulse">Loading deployments...</p>
                            </div>
                        ) : deployments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                    <Layers className="w-10 h-10 text-gray-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">No Deployments Yet</h3>
                                <p className="text-gray-400 max-w-md">
                                    Click "New Deployment" to create your first deployment note for {activeFolder.name}.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5 uppercase text-xs font-black text-gray-400 tracking-wider">
                                        <th className="p-4 rounded-tl-xl whitespace-nowrap">Type</th>
                                        <th className="p-4">Instructions</th>
                                        <th className="p-4 whitespace-nowrap">Price</th>
                                        <th className="p-4 whitespace-nowrap">Deadline</th>
                                        <th className="p-4 whitespace-nowrap">Raw Video</th>
                                        <th className="p-4 whitespace-nowrap">Status</th>
                                        <th className="p-4 rounded-tr-xl text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {deployments.map((note) => (
                                        <motion.tr
                                            key={note.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="hover:bg-white/5 transition-colors group"
                                        >
                                            <td className="p-4 align-top">
                                                <span className="px-3 py-1 rounded-full bg-white/10 text-gray-300 text-xs font-bold font-mono">
                                                    {note.video_type}
                                                </span>
                                            </td>
                                            <td className="p-4 align-top max-w-[300px]">
                                                <p
                                                    className="text-sm text-gray-400 line-clamp-2 leading-relaxed"
                                                    title={note.instructions ? stripHtmlToPlainText(note.instructions) : undefined}
                                                >
                                                    {note.instructions ? (
                                                        stripHtmlToPlainText(note.instructions)
                                                    ) : (
                                                        <span className="text-gray-600 italic">No instructions provided.</span>
                                                    )}
                                                </p>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="flex items-center gap-1 text-emerald-400 font-bold font-mono text-sm bg-emerald-500/10 px-2 py-1 rounded-md w-fit">
                                                    <DollarSign className="w-3 h-3" />
                                                    {note.price || '0.00'}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                {note.deadline ? (
                                                    <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
                                                        <CalendarIcon className="w-4 h-4 text-violet-400" />
                                                        {new Date(note.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600 text-sm italic">No deadline</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-top">
                                                {note.raw_video_link ? (
                                                    <a
                                                        href={note.raw_video_link.startsWith('http') ? note.raw_video_link : `https://${note.raw_video_link}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 rounded-lg text-xs font-bold transition-colors group/link"
                                                    >
                                                        View Asset
                                                        <ExternalLink className="w-3.5 h-3.5 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 transition-transform" />
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-600 text-sm italic">No link</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-top">
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide border ${getStatusColor(note.status)}`}>
                                                    {note.status}
                                                </span>
                                            </td>
                                            <td className="p-4 align-top text-right">
                                                {(isSuperAdmin || isAdmin) && (
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleOpenModal(note)}
                                                            className="p-2 bg-white/5 hover:bg-violet-500/20 text-gray-400 hover:text-violet-400 border border-transparent hover:border-violet-500/30 rounded-lg transition-all"
                                                            title="Edit Note"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => note.id && handleDelete(note.id)}
                                                            className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-transparent hover:border-red-500/30 rounded-lg transition-all"
                                                            title="Delete Note"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {
                    isModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-[#0e0e1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                            >
                                <div className="flex items-center justify-between p-6 border-b border-white/10">
                                    <h2 className="text-2xl font-black text-white">
                                        {editingNote ? 'Edit Deployment' : 'New Deployment'}
                                    </h2>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSave} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full bg-[#07070f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium appearance-none"
                                            >
                                                <option value="Ready for Deployment">Ready for Deployment</option>
                                                <option value="Deployed">Deployed</option>
                                                <option value="Draft">Draft (Hold)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Video Type</label>
                                            <select
                                                value={formData.video_type}
                                                onChange={(e) => setFormData({ ...formData, video_type: e.target.value })}
                                                className="w-full bg-[#07070f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium appearance-none"
                                            >
                                                <option value="Short Form">Short Form</option>
                                                <option value="Long Form">Long Form</option>
                                                <option value="Ad Creative">Ad Creative</option>
                                                <option value="Podcast">Podcast</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Deadline</label>
                                            <input
                                                type="date"
                                                value={formData.deadline || ''}
                                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                                className="w-full bg-[#07070f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium min-h-[50px] [color-scheme:dark]"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Raw Video Link</label>
                                            <input
                                                type="url"
                                                value={formData.raw_video_link}
                                                onChange={(e) => setFormData({ ...formData, raw_video_link: e.target.value })}
                                                className="w-full bg-[#07070f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-gray-600 font-medium"
                                                placeholder="https://drive.google.com/..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Price (₱)</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                    className="w-full bg-[#07070f] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-gray-600 font-medium font-mono"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                    </div>

                                    <div className="space-y-2 mt-6">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Deployment Instructions</label>
                                        <RichTextEditor
                                            value={formData.instructions || ''}
                                            onChange={val => setFormData(f => ({ ...f, instructions: val }))}
                                            placeholder="Add specific posting instructions, captions, hooks, tags..."
                                            className="min-h-[140px] text-sm text-white border border-white/10"
                                        />
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-[#0e0e1a] pb-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold tracking-wide shadow-lg shadow-violet-500/25 border border-violet-500/50 transition-all flex items-center justify-center min-w-[140px]"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                editingNote ? 'Save Changes' : 'Create Deployment'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )
                }

                {/* Folder Form Modal */}
                {
                    isFolderModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-[#0e0e1a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl"
                            >
                                <div className="flex items-center justify-between p-6 border-b border-white/10">
                                    <h2 className="text-2xl font-black text-white">
                                        {editingFolder ? 'Rename Folder' : 'New Client Folder'}
                                    </h2>
                                    <button
                                        onClick={() => setIsFolderModalOpen(false)}
                                        className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleFolderSave} className="p-6 flex-1 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Folder / Client Name *</label>
                                        <input
                                            required
                                            autoFocus
                                            type="text"
                                            value={folderName}
                                            onChange={(e) => setFolderName(e.target.value)}
                                            className="w-full bg-[#07070f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-gray-600 font-medium"
                                            placeholder="e.g. Apple MKBHD Collab"
                                        />
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-white/10 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsFolderModalOpen(false)}
                                            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isFolderSaving}
                                            className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold tracking-wide shadow-lg shadow-violet-500/25 border border-violet-500/50 transition-all flex items-center justify-center min-w-[140px]"
                                        >
                                            {isFolderSaving ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                editingFolder ? 'Save' : 'Create'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>
        </div>
    );
}
