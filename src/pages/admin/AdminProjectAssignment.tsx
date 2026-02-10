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
    BookOpen,
    Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllBoards, getBoardColumns, getBoardGroups, submitProjectAssignment } from '../../services/mondayService';
import { RichTextEditor } from '../../components/ui/RichTextEditor';

import { SelectionModal } from '../../components/ui/SelectionModal';

export default function AdminProjectAssignment() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [activeModal, setActiveModal] = useState<'status' | 'type' | 'priority' | 'client' | 'team' | null>(null);

    // Data State
    const [availableClients, setAvailableClients] = useState<string[]>([]); // Active Clients (Fulfillment Boards)
    const [veBoardGroups, setVeBoardGroups] = useState<{ id: string, title: string }[]>([]); // For Submission Mapping
    const [availableTeam, setAvailableTeam] = useState<{ name: string, id: string }[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [veProjectBoardId, setVeProjectBoardId] = useState<string | null>(null);


    // Form State
    const [formData, setFormData] = useState({
        projectName: '',
        projectStatus: '',
        projectType: '',
        client: '',
        price: '',
        editor: '',
        deadline: '',
        priority: '',
        instructions: ''
    });



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

                    // 4. Clients (from VE Project Board)
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
                                const uniqueClients = Array.from(new Set(labels)).sort();
                                setAvailableClients(uniqueClients);
                            }
                        } catch (e) {
                            console.error("Failed to fetch clients from VE Board", e);
                        }
                    }

                    // B. Fetch Groups for Submission Mapping
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

                                {/* MODAL SELECTION SECTION */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Project Status */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Project Status</label>
                                        <button
                                            onClick={() => setActiveModal('status')}
                                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/50 transition-all text-left flex items-center justify-between group"
                                        >
                                            <div>
                                                <span className="text-xs text-violet-400 uppercase tracking-wider font-bold mb-1 block">Current Status</span>
                                                <span className="text-lg font-bold text-white block truncate">
                                                    {formData.projectStatus || 'Select Status...'}
                                                </span>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-colors">
                                                <Layers className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                            </div>
                                        </button>
                                    </div>

                                    {/* Project Type */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Project Type</label>
                                        <button
                                            onClick={() => setActiveModal('type')}
                                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all text-left flex items-center justify-between group"
                                        >
                                            <div>
                                                <span className="text-xs text-blue-400 uppercase tracking-wider font-bold mb-1 block">Type</span>
                                                <span className="text-lg font-bold text-white block truncate">
                                                    {formData.projectType || 'Select Type...'}
                                                </span>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                            </div>
                                        </button>
                                    </div>

                                    {/* Priority */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Priority</label>
                                        <button
                                            onClick={() => setActiveModal('priority')}
                                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/50 transition-all text-left flex items-center justify-between group"
                                        >
                                            <div>
                                                <span className="text-xs text-red-400 uppercase tracking-wider font-bold mb-1 block">Priority</span>
                                                <span className="text-lg font-bold text-white block truncate">
                                                    {formData.priority || 'Select Priority...'}
                                                </span>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                                                <Layers className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )
                        }

                        {
                            step === 2 && (
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

                                    {/* Client Selection Card */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Select Client</label>
                                        <button
                                            onClick={() => setActiveModal('client')}
                                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/50 transition-all text-left flex items-center justify-between group"
                                        >
                                            <div>
                                                <span className="text-xs text-emerald-400 uppercase tracking-wider font-bold mb-1 block">Client</span>
                                                <span className="text-lg font-bold text-white block truncate">
                                                    {formData.client || 'Select Client...'}
                                                </span>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                <User className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                            </div>
                                        </button>
                                    </div>

                                    {/* Price */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Project Budget / Price (PHP)</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₱</div>
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
                            )
                        }

                        {
                            step === 3 && (
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

                                    {/* Team Member Selection Card */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Select Team Member</label>
                                        <button
                                            onClick={() => setActiveModal('team')}
                                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all text-left flex items-center justify-between group"
                                        >
                                            <div>
                                                <span className="text-xs text-blue-400 uppercase tracking-wider font-bold mb-1 block">Team Member</span>
                                                <span className="text-lg font-bold text-white block truncate">
                                                    {formData.editor || 'Select Team Member...'}
                                                </span>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                <User className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                            </div>
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        }
                    </AnimatePresence >

                    {/* Navigation Buttons */}
                    < div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5" >
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
                    </div >
                </GlassCard >
            </div>

            {/* Selection Modals */}
            <SelectionModal
                isOpen={activeModal === 'status'}
                onClose={() => setActiveModal(null)}
                title="Select Project Status"
                options={projectStatuses}
                selected={formData.projectStatus}
                onSelect={(val) => setFormData({ ...formData, projectStatus: val })}
                icon={Layers}
            />
            <SelectionModal
                isOpen={activeModal === 'type'}
                onClose={() => setActiveModal(null)}
                title="Select Project Type"
                options={projectTypes}
                selected={formData.projectType}
                onSelect={(val) => setFormData({ ...formData, projectType: val })}
                icon={BookOpen}
            />
            <SelectionModal
                isOpen={activeModal === 'priority'}
                onClose={() => setActiveModal(null)}
                title="Select Priority"
                options={projectPriorities}
                selected={formData.priority}
                onSelect={(val) => setFormData({ ...formData, priority: val })}
                icon={Layers}
            />
            <SelectionModal
                isOpen={activeModal === 'client'}
                onClose={() => setActiveModal(null)}
                title="Select Client"
                options={availableClients}
                selected={formData.client}
                onSelect={(val) => setFormData({ ...formData, client: val })}
                icon={User}
            />
            <SelectionModal
                isOpen={activeModal === 'team'}
                onClose={() => setActiveModal(null)}
                title="Select Team Member"
                options={availableTeam.map(u => u.name)}
                selected={formData.editor}
                onSelect={(val) => setFormData({ ...formData, editor: val })}
                icon={User}
            />
        </AdminPageLayout>
    );
}
