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
    Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllBoards, getBoardColumns } from '../../services/mondayService';

export default function AdminProjectAssignment() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Data State
    const [availableClients, setAvailableClients] = useState<string[]>([]);
    const [availableTeam, setAvailableTeam] = useState<string[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);


    // Form State
    const [formData, setFormData] = useState({
        projectName: '',
        projectStatus: '', // Was projectType, now Project Status
        projectType: '',   // NEW: Type column
        client: '',
        price: '',
        editor: '',
        deadline: ''
    });

    const [teamSearch, setTeamSearch] = useState('');
    const [clientSearch, setClientSearch] = useState('');

    // Dynamic Options State
    const [projectStatuses, setProjectStatuses] = useState<string[]>([]);
    const [projectTypes, setProjectTypes] = useState<string[]>([]);


    // Fetch Clients & Team & Board Data Logic
    useEffect(() => {
        const fetchData = async () => {
            setLoadingClients(true);
            const logs: string[] = [];
            try {
                logs.push("Starting data fetch...");

                // 1. Fetch All Boards
                const boards = await getAllBoards();
                logs.push(`Fetched ${boards?.length || 0} total boards.`);

                // --- FETCH CLIENTS ---
                // Pattern: "[Client Name] - Fulfillment Board"
                const clientBoards = boards.filter((b: any) =>
                    (b.name.toLowerCase().includes('fulfillment board') ||
                        b.name.toLowerCase().includes('fullfillment board')) &&
                    !b.name.startsWith("Subitems")
                );

                const clients = clientBoards.map((b: any) => {
                    return b.name.replace(/ - ?Full?fillment Board/i, "").trim();
                });
                const uniqueClients = Array.from(new Set(clients)).sort() as string[];
                logs.push(`Extracted ${uniqueClients.length} unique clients: ${uniqueClients.join(', ')}`);

                setAvailableClients(uniqueClients);


                // --- FETCH TEAM ---
                // Pattern: "[User Name] - Workspace"
                const teamBoards = boards.filter((b: any) =>
                    b.name.toLowerCase().includes(' - workspace') &&
                    !b.name.startsWith("Subitems")
                );

                const teamMembers = teamBoards.map((b: any) => {
                    return b.name.replace(/ - Workspace/i, "").trim();
                });
                const uniqueTeam = Array.from(new Set(teamMembers)).sort() as string[];
                setAvailableTeam(uniqueTeam);
                logs.push(`Found ${uniqueTeam.length} team members: ${uniqueTeam.join(', ')}`);

                // --- FETCH PROJECT DETAILS From "VE Project Board" ---
                // Target: "VE Project Board"
                const projectBoard = boards.find((b: any) =>
                    (b.name.toLowerCase().includes('ve project board') ||
                        b.name.toLowerCase().includes('video editing project')) &&
                    !b.name.toLowerCase().startsWith("subitems")
                );

                if (projectBoard) {
                    logs.push(`Found Project Board: ${projectBoard.name} (${projectBoard.id})`);

                    const columns = await getBoardColumns(projectBoard.id);

                    // DEBUG: Log all columns to help find the right one
                    logs.push(`--- Columns on ${projectBoard.name} ---`);
                    columns.forEach((c: any) => logs.push(`[${c.id}] ${c.title} (${c.type})`));
                    logs.push(`-----------------------------------`);

                    // 1. PROJECT STATUS (formerly Project Type)
                    const statusCol = columns.find((c: any) =>
                        c.title.toLowerCase() === 'project status' ||
                        (c.title.toLowerCase() === 'status' && c.id !== 'status') // prioritized last
                    );

                    if (statusCol && statusCol.settings_str) {
                        try {
                            const settings = JSON.parse(statusCol.settings_str);
                            // Monday.com settings_str structure for status:
                            // { labels: { "0": "Working on it", "1": "Done", ... }, labels_positions_v2: { ... } }
                            // or sometimes just labels map.

                            let labels: string[] = [];
                            if (settings.labels) {
                                labels = Object.values(settings.labels);
                            }

                            // Filter out default/irrelevant labels if needed
                            // For now, take them all, maybe filter empty strings
                            labels = labels.filter(l => l && l.trim().length > 0 && l.toLowerCase() !== 'default'); // 'default' is sometimes a key, sometimes a label? Usually labels are values.

                            if (labels.length > 0) {
                                setProjectStatuses(labels);
                                setFormData(prev => ({ ...prev, projectStatus: labels[0] }));
                                logs.push(`Extracted Statuses: ${labels.join(', ')}`);
                            } else {
                                logs.push("⚠️ No labels found in status column.");
                            }
                        } catch (e) {
                            console.error("Error parsing status column settings", e);
                            logs.push("❌ Error parsing status settings");
                        }
                    } else {
                        logs.push("⚠️ 'Project Status' column not found.");
                    }

                    // 2. PROJECT TYPE (New field from 'Type' column)
                    const typeCol = columns.find((c: any) =>
                        c.title.toLowerCase() === 'type' ||
                        c.title.toLowerCase() === 'project type'
                    );

                    if (typeCol && typeCol.settings_str) {
                        try {
                            const settings = JSON.parse(typeCol.settings_str);
                            let labels: string[] = [];
                            if (settings.labels) labels = Object.values(settings.labels);
                            labels = labels.filter(l => l && l.trim().length > 0 && l.toLowerCase() !== 'default');

                            if (labels.length > 0) {
                                setProjectTypes(labels);
                                setFormData(prev => ({ ...prev, projectType: labels[0] }));
                                logs.push(`Extracted Types: ${labels.join(', ')}`);
                            } else {
                                logs.push("⚠️ No labels found in type column.");
                            }
                        } catch (e) {
                            console.error("Error parsing type column settings", e);
                            logs.push("❌ Error parsing type settings");
                        }
                    } else {
                        logs.push("⚠️ 'Type' column not found.");
                    }

                } else {
                    logs.push("⚠️ 'VE Project Board' not found.");
                }

            } catch (error: any) {
                console.error("Failed to fetch data", error);
                logs.push(`❌ Error: ${error.message || error}`);
            } finally {
                setLoadingClients(false);
                setLoadingClients(false);
            }
        };

        fetchData();
    }, []);

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

                                {/* Project Status (Formerly Project Type) */}
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

                                {/* Project Type (New - from Type column) */}
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

                                {/* Client (Likely from Fulfillment Board) */}
                                <div className="space-y-2 relative">
                                    <label className="text-sm font-medium text-gray-300">Client</label>
                                    {/* Search Client */}
                                    <div className="relative mb-4">
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="text"
                                                value={clientSearch}
                                                onChange={(e) => setClientSearch(e.target.value)}
                                                placeholder="Search or select client..."
                                                className="w-full bg-[#0E0E1A] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Client List */}
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {availableClients.filter(c => c.toLowerCase().includes(clientSearch.toLowerCase())).length > 0 ? (
                                            availableClients
                                                .filter(c => c.toLowerCase().includes(clientSearch.toLowerCase()))
                                                .map((client, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setFormData({ ...formData, client: client })}
                                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${formData.client === client
                                                            ? 'bg-violet-500/20 border border-violet-500 text-white'
                                                            : 'bg-white/5 border border-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                                                            }`}
                                                    >
                                                        <span className="font-medium">{client}</span>
                                                        {formData.client === client && <Check className="w-4 h-4 text-violet-400" />}
                                                    </button>
                                                ))
                                        ) : (
                                            <div className="text-center py-4 text-gray-500 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                                {loadingClients ? "Loading clients..." : "No clients found."}
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
                                    {availableTeam.filter(u => u.toLowerCase().includes(teamSearch.toLowerCase())).length > 0 ? (
                                        availableTeam
                                            .filter(u => u.toLowerCase().includes(teamSearch.toLowerCase()))
                                            .map(user => (
                                                <button
                                                    key={user}
                                                    onClick={() => setFormData({ ...formData, editor: user })}
                                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${formData.editor === user
                                                        ? 'bg-blue-500/20 border-blue-500'
                                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold">
                                                            {user.charAt(0)}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-white font-bold">{user}</p>
                                                            <p className="text-xs text-gray-400">Team Member</p>
                                                        </div>
                                                    </div>
                                                    {formData.editor === user && <Check className="w-5 h-5 text-blue-400" />}
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
                            onClick={step === 3 ? () => console.log('Submit', formData) : handleNext}
                            className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-custom-bright hover:text-white transition-all flex items-center gap-2"
                        >
                            {step === 3 ? 'Create Assignment' : 'Continue'}

                        </button>
                    </div>
                </GlassCard>
            </div>
        </AdminPageLayout>
    );
}
