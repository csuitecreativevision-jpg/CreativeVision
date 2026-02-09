import { useState, useEffect } from 'react';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Briefcase,
    Check,
    ArrowLeft,
    DollarSign,
    Search,
    BookOpen,
    Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllBoards, getBoardColumns, getBoardGroups, submitProjectAssignment } from '../../services/mondayService';
import { RichTextEditor } from '../../components/ui/RichTextEditor';

export default function AdminProjectAssignment() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Data State
    const [availableClients, setAvailableClients] = useState<string[]>([]); // Source 1: Active Clients (Boards)
    const [veBoardClients, setVeBoardClients] = useState<string[]>([]);     // Source 2: VE Project Board (Labels)
    const [veBoardGroups, setVeBoardGroups] = useState<{ id: string, title: string }[]>([]); // For Submission Mapping
    const [availableTeam, setAvailableTeam] = useState<{ name: string, id: string }[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [veProjectBoardId, setVeProjectBoardId] = useState<string | null>(null);


    // Form State
    const [formData, setFormData] = useState({
        projectName: '',
        projectStatus: '',
        projectType: '',
        clientSource: 'active_clients', // 'active_clients' | 've_board'
        client: '',
        price: '',
        editor: '',
        deadline: '',
        priority: '',
        instructions: ''
    });

    const [teamSearch, setTeamSearch] = useState('');
    const [clientSearch, setClientSearch] = useState('');

    // Dynamic Options State
    const [projectStatuses, setProjectStatuses] = useState<string[]>([]);
    const [projectTypes, setProjectTypes] = useState<string[]>([]);
    const [projectPriorities, setProjectPriorities] = useState<string[]>([]);


    // Fetch Clients & Team & Board Data Logic
    useEffect(() => {
        const fetchData = async () => {
            setLoadingClients(true);
            try {
                // 1. Fetch All Boards
                const boards = await getAllBoards();

                // --- FETCH CLIENTS (Source 1: Active Clients / Fulfillment Boards) ---
                const clientBoards = boards.filter((b: any) =>
                    (b.name.toLowerCase().includes('fulfillment board') ||
                        b.name.toLowerCase().includes('fullfillment board')) &&
                    !b.name.startsWith("Subitems")
                );

                const clients = clientBoards.map((b: any) => {
                    return b.name.replace(/ - ?Full?fillment Board/i, "").trim();
                });
                const uniqueClients = Array.from(new Set(clients)).sort() as string[];
                setAvailableClients(uniqueClients);


                // --- FETCH TEAM ---
                const teamBoards = boards.filter((b: any) =>
                    b.name.toLowerCase().includes(' - workspace') &&
                    !b.name.startsWith("Subitems")
                );

                const teamMembers = teamBoards.map((b: any) => {
                    // Extract name: "John Mark Ormido (C-W-3)" -> "John Mark Ormido"
                    // Also handle "John Name - Workspace"
                    let cleanName = b.name.replace(/ - Workspace/i, "").trim();
                    cleanName = cleanName.replace(/\s*\(.*?\)\s*/g, "").trim(); // Remove (...) content

                    return {
                        name: cleanName,
                        id: b.id
                    };
                });
                // Unique by name, prefer ones with ID if duplicates (imperfect but simple)
                // Actually map returns objects, let's just sort by name
                teamMembers.sort((a: any, b: any) => a.name.localeCompare(b.name));
                setAvailableTeam(teamMembers);

                // --- FETCH VE PROJECT BOARD (Source 2 & Status/Type) ---
                const projectBoard = boards.find((b: any) =>
                    (b.name.toLowerCase().includes('ve project board') ||
                        b.name.toLowerCase().includes('video editing project')) &&
                    !b.name.toLowerCase().startsWith("subitems")
                );

                if (projectBoard) {
                    setVeProjectBoardId(projectBoard.id);

                    // A. Fetch Columns for Status/Type
                    const columns = await getBoardColumns(projectBoard.id);

                    // 1. Project Status
                    const statusCol = columns.find((c: any) =>
                        c.title.toLowerCase() === 'project status' ||
                        (c.title.toLowerCase() === 'status' && c.id !== 'status')
                    );
                    if (statusCol && statusCol.settings_str) {
                        try {
                            const settings = JSON.parse(statusCol.settings_str);
                            let labels: string[] = [];
                            if (settings.labels) labels = Object.values(settings.labels);
                            labels = labels.filter(l => l && l.trim().length > 0 && l.toLowerCase() !== 'default');
                            if (labels.length > 0) {
                                setProjectStatuses(labels);
                                setFormData(prev => ({ ...prev, projectStatus: labels[0] }));
                            }
                        } catch (e) { }
                    }

                    // 2. Project Type
                    const typeCol = columns.find((c: any) => c.title.toLowerCase() === 'type' || c.title.toLowerCase() === 'project type');
                    if (typeCol && typeCol.settings_str) {
                        try {
                            const settings = JSON.parse(typeCol.settings_str);
                            let labels: string[] = [];
                            if (settings.labels) labels = Object.values(settings.labels);
                            labels = labels.filter(l => l && l.trim().length > 0 && l.toLowerCase() !== 'default');
                            if (labels.length > 0) {
                                setProjectTypes(labels);
                                setFormData(prev => ({ ...prev, projectType: labels[0] }));
                            }
                            if (labels.length > 0) {
                                setProjectTypes(labels);
                                setFormData(prev => ({ ...prev, projectType: labels[0] }));
                            }
                        } catch (e) { }
                    }

                    // 3. Priority
                    const priorityCol = columns.find((c: any) => c.title.toLowerCase() === 'priority');
                    if (priorityCol && priorityCol.settings_str) {
                        try {
                            const settings = JSON.parse(priorityCol.settings_str);
                            let labels: string[] = [];
                            if (settings.labels) labels = Object.values(settings.labels);
                            labels = labels.filter(l => l && l.trim().length > 0 && l.toLowerCase() !== 'default');
                            if (labels.length > 0) {
                                setProjectPriorities(labels);
                                setFormData(prev => ({ ...prev, priority: labels[0] }));
                            }
                        } catch (e) { }
                    }

                    // B. Fetch Clients from VE Project Board (Source 2)
                    // Strategy: Extract labels from "Client" Status/Dropdown column settings.
                    const clientCol = columns.find((c: any) => c.title.toLowerCase() === 'client');

                    if (clientCol && clientCol.settings_str) {
                        try {
                            const settings = JSON.parse(clientCol.settings_str);
                            let labels: string[] = [];

                            // Handle Status Column (Map: { "0": "Label", ... })
                            if (settings.labels && !Array.isArray(settings.labels) && typeof settings.labels === 'object') {
                                labels = Object.values(settings.labels);
                            }
                            // Handle Dropdown Column (Array: [{name: "Label"}, ...])
                            else if (settings.labels && Array.isArray(settings.labels)) {
                                labels = settings.labels.map((l: any) => l.name);
                            }

                            // Filter valid labels
                            labels = labels.filter(l => l && typeof l === 'string' && l.trim().length > 0 && l.toLowerCase() !== 'default');

                            if (labels.length > 0) {
                                const uniqueVeClients = Array.from(new Set(labels)).sort();
                                setVeBoardClients(uniqueVeClients);
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }

                    // C. Fetch Groups for Submission Mapping
                    try {
                        const groups = await getBoardGroups(projectBoard.id);
                        if (groups) setVeBoardGroups(groups);
                    } catch (e) {
                        console.error("Failed to fetch groups", e);
                    }

                }

            } catch (error: any) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoadingClients(false);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async () => {
        if (!veProjectBoardId) {
            alert("Configuration Error: VE Project Board not found.");
            return;
        }

        setLoadingClients(true);
        try {
            // Find Group ID
            const targetGroup = veBoardGroups.find(g => g.title.toLowerCase() === formData.client.toLowerCase());
            const groupId = targetGroup ? targetGroup.id : 'topics'; // Default to top group if mismatch

            if (!targetGroup) console.warn(`Group not found for client: ${formData.client}. Using default.`);

            await submitProjectAssignment(veProjectBoardId, groupId, {
                itemName: formData.projectName,
                status: formData.projectStatus,
                type: formData.projectType,
                editor: formData.editor,
                price: formData.price,
                timeline: formData.deadline,
                priority: formData.priority,
                instructions: formData.instructions
            });

            alert("Project Assigned Successfully!");
            navigate('/admin-portal/management');
        } catch (error) {
            console.error(error);
            alert("Failed to create assignment. Check console.");
        } finally {
            setLoadingClients(false);
        }
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-12">
            {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                        ${step === s ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30 scale-110' :
                            step > s ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-500'}
                    `}>
                        {step > s ? <Check className="w-5 h-5" /> : s}
                    </div>
                    {s < 3 && (
                        <div className={`w-24 h-1 mx-4 rounded-full transition-all duration-300 ${step > s ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
                    )}
                </div>
            ))}
        </div>
    );

    // Filter clients based on source and search
    const currentClientList = formData.clientSource === 'active_clients' ? availableClients : veBoardClients;
    const filteredClients = currentClientList.filter(c => c.toLowerCase().includes(clientSearch.toLowerCase()));

    return (
        <AdminPageLayout
            title="Project Assignment"
            subtitle="Configure and assign new projects to your team."
        >
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/admin-portal/management')}
                    className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Hub
                </button>

                {renderStepIndicator()}

                <GlassCard className="p-8 relative overflow-hidden border border-white/10 !bg-[#151523]/90">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                    <Briefcase className="w-5 h-5 mr-3 text-violet-400" />
                                    Project Details
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Project Name */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Project Name</label>
                                        <input
                                            type="text"
                                            value={formData.projectName}
                                            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                                            placeholder="e.g. Nike Commercial Edit Q1"
                                            className="w-full bg-[#0E0E1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
                                        />
                                    </div>

                                    {/* Deadline */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Deadline</label>
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                value={formData.deadline}
                                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                                className="w-full bg-[#0E0E1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600 appearance-none [&::-webkit-calendar-picker-indicator]:invert"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Instructions / Notes</label>
                                    <div className="bg-[#0E0E1A] rounded-xl border border-white/10 overflow-hidden">
                                        <RichTextEditor
                                            value={formData.instructions || ''}
                                            onChange={(val) => setFormData({ ...formData, instructions: val })}
                                            placeholder="Enter project instructions..."
                                            className="min-h-[150px] text-white"
                                        />
                                    </div>
                                </div>

                                {/* Project Status */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Project Status</label>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {projectStatuses.length > 0 ? projectStatuses.map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setFormData({ ...formData, projectStatus: status })}
                                                className={`p-4 rounded-xl border text-left transition-all ${formData.projectStatus === status
                                                    ? 'bg-violet-500/20 border-violet-500 text-white'
                                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className="font-bold block text-sm">{status}</span>
                                            </button>
                                        )) : (
                                            <div className="col-span-4 text-gray-500 italic text-sm p-2">Loading Statuses...</div>
                                        )}
                                    </div>
                                </div>

                                {/* Project Type */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Project Type</label>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {projectTypes.length > 0 ? projectTypes.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setFormData({ ...formData, projectType: type })}
                                                className={`p-4 rounded-xl border text-left transition-all ${formData.projectType === type
                                                    ? 'bg-blue-500/20 border-blue-500 text-white'
                                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className="font-bold block text-sm">{type}</span>
                                            </button>
                                        )) : (
                                            <div className="col-span-4 text-gray-500 italic text-sm p-2">Loading Types...</div>
                                        )}
                                    </div>
                                </div>

                                {/* Priority */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Priority</label>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {projectPriorities.length > 0 ? projectPriorities.map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setFormData({ ...formData, priority: p })}
                                                className={`p-4 rounded-xl border text-left transition-all ${formData.priority === p
                                                    ? 'bg-red-500/20 border-red-500 text-white'
                                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className="font-bold block text-sm">{p}</span>
                                            </button>
                                        )) : (
                                            <div className="col-span-4 text-gray-500 italic text-sm p-2">Loading Priorities...</div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                    <DollarSign className="w-5 h-5 mr-3 text-emerald-400" />
                                    Client & Pricing
                                </h3>

                                {/* Source Toggle */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Client Source</label>
                                    <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 w-fit">
                                        <button
                                            onClick={() => setFormData({ ...formData, clientSource: 'active_clients' })}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${formData.clientSource === 'active_clients'
                                                ? 'bg-violet-500 text-white shadow-lg'
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            <Layers className="w-4 h-4" />
                                            Active Clients (Folder)
                                        </button>
                                        <button
                                            onClick={() => setFormData({ ...formData, clientSource: 've_board' })}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${formData.clientSource === 've_board'
                                                ? 'bg-violet-500 text-white shadow-lg'
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            <BookOpen className="w-4 h-4" />
                                            VE Project Board
                                        </button>
                                    </div>
                                </div>


                                {/* Client Selection */}
                                <div className="space-y-2 relative">
                                    <label className="text-sm font-medium text-gray-300">Select Client</label>
                                    <div className="relative mb-4">
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="text"
                                                value={clientSearch}
                                                onChange={(e) => setClientSearch(e.target.value)}
                                                placeholder={`Search in ${formData.clientSource === 'active_clients' ? 'Active Clients' : 'VE Board'}...`}
                                                className="w-full bg-[#0E0E1A] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Client List */}
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {filteredClients.length > 0 ? (
                                            filteredClients.map((client, idx) => (
                                                <button
                                                    key={`${client}-${idx}`}
                                                    onClick={() => setFormData({ ...formData, client: client })}
                                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${formData.client === client
                                                        ? 'bg-violet-500/20 border-violet-500 text-white'
                                                        : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                >
                                                    <span className="font-medium">{client}</span>
                                                    {formData.client === client && <Check className="w-4 h-4 text-violet-400" />}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="text-center py-4 text-gray-500 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                                {loadingClients ? "Loading clients..." : "No clients found in this source."}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Project Budget / Price</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</div>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="0.00"
                                            className="w-full bg-[#0E0E1A] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-600 font-mono"
                                        />
                                    </div>
                                </div>


                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                    <User className="w-5 h-5 mr-3 text-blue-400" />
                                    Assign to Team
                                </h3>

                                {/* Search Team */}
                                <div className="relative mb-4">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        value={teamSearch}
                                        onChange={(e) => setTeamSearch(e.target.value)}
                                        placeholder="Search team members..."
                                        className="w-full bg-[#0E0E1A] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
                                    />
                                </div>

                                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {availableTeam.filter(u => u.name.toLowerCase().includes(teamSearch.toLowerCase())).length > 0 ? (
                                        availableTeam
                                            .filter(u => u.name.toLowerCase().includes(teamSearch.toLowerCase()))
                                            .map(user => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => setFormData({ ...formData, editor: user.name })}
                                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${formData.editor === user.name
                                                        ? 'bg-blue-500/20 border-blue-500'
                                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-white font-bold">{user.name}</p>
                                                            <p className="text-xs text-gray-400">Team Member</p>
                                                        </div>
                                                    </div>
                                                    {formData.editor === user.name && <Check className="w-5 h-5 text-blue-400" />}
                                                </button>
                                            ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            {loadingClients ? "Loading team members..." : "No team members found."}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
                        <button
                            onClick={step === 1 ? () => navigate('/admin-portal/management') : handleBack}
                            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            {step === 1 ? 'Cancel' : 'Back'}
                        </button>

                        <button
                            onClick={step === 3 ? handleSubmit : handleNext}
                            disabled={loadingClients}
                            className={`px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-custom-bright hover:text-white transition-all flex items-center gap-2 ${loadingClients ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loadingClients ? 'Processing...' : (step === 3 ? 'Create Assignment' : 'Continue')}

                        </button>
                    </div>
                </GlassCard>
            </div >
        </AdminPageLayout >
    );
}
