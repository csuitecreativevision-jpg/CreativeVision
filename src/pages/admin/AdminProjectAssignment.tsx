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
    Layers,
    Plus,
    X,
    Copy
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [veProjectBoardId, setVeProjectBoardId] = useState<string | null>(null);


    // Form State
    const initialProjectState = {
        projectName: '',
        projectStatus: 'Unassigned',
        projectType: '',
        client: '',
        price: '',
        editor: '',
        deadline: '',
        priority: '',
        instructions: '',
        rawVideoLink: ''
    };

    const [projects, setProjects] = useState([initialProjectState]);
    const [activeProjectIndex, setActiveProjectIndex] = useState(0);

    const [isBulkMode, setIsBulkMode] = useState(false);
    const [sharedClient, setSharedClient] = useState(true);
    const [sharedEditor, setSharedEditor] = useState(true);

    const activeProject = projects[activeProjectIndex];

    const updateCurrentProject = (updates: any) => {
        setProjects(prev => {
            const next = [...prev];
            next[activeProjectIndex] = { ...next[activeProjectIndex], ...updates };
            return next;
        });
    };



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

                    // Helper to Parse Labels Securely
                    const parseLabels = (settingsStr: string): string[] => {
                        try {
                            const settings = JSON.parse(settingsStr);
                            let labels: string[] = [];
                            if (settings.labels && !Array.isArray(settings.labels) && typeof settings.labels === 'object') {
                                labels = Object.values<any>(settings.labels).map(l => typeof l === 'string' ? l : l.name || '');
                            } else if (settings.labels && Array.isArray(settings.labels)) {
                                labels = settings.labels.map((l: any) => l.name || l);
                            }
                            return labels.filter(l => l && typeof l === 'string' && l.trim().length > 0 && l.toLowerCase() !== 'default');
                        } catch (e) {
                            return [];
                        }
                    };

                    // 1. Project Status
                    const statusCol = columns.find((c: any) =>
                        c.title.toLowerCase() === 'project status' ||
                        (c.title.toLowerCase() === 'status' && c.id !== 'status')
                    );
                    if (statusCol && statusCol.settings_str) {
                        const labels = parseLabels(statusCol.settings_str);
                        const filtered = labels.filter(l => l.toLowerCase().includes('unassigned'));
                        if (filtered.length > 0) {
                            setProjectStatuses(filtered);
                            updateCurrentProject({ projectStatus: filtered[0] });
                        } else {
                            setProjectStatuses(['Unassigned (cv)']);
                            updateCurrentProject({ projectStatus: 'Unassigned (cv)' });
                        }
                    }

                    // 2. Project Type
                    const typeCol = columns.find((c: any) => c.title.toLowerCase() === 'type' || c.title.toLowerCase() === 'project type');
                    if (typeCol && typeCol.settings_str) {
                        const labels = parseLabels(typeCol.settings_str);
                        if (labels.length > 0) {
                            setProjectTypes(labels);
                            updateCurrentProject({ projectType: labels[0] });
                        }
                    }

                    // 3. Priority
                    const priorityCol = columns.find((c: any) => c.title.toLowerCase() === 'priority');
                    if (priorityCol && priorityCol.settings_str) {
                        const labels = parseLabels(priorityCol.settings_str);
                        if (labels.length > 0) {
                            setProjectPriorities(labels);
                            updateCurrentProject({ priority: labels[0] });
                        }
                    }

                    // 4. Clients (from VE Project Board)
                    const clientCol = columns.find((c: any) => c.title.toLowerCase() === 'client');
                    if (clientCol && clientCol.settings_str) {
                        const labels = parseLabels(clientCol.settings_str);
                        if (labels.length > 0) {
                            const uniqueClients = Array.from(new Set(labels)).sort();
                            setAvailableClients(uniqueClients);
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

        setIsSubmitting(true);
        try {
            // Find Group ID using the first project's client (or active if single)
            // In a real bulk scenario where clients differ per project, we should find the group *per project*.

            // Filter out empty projects
            const validProjects = projects.filter(p => p.projectName.trim() !== '');
            if (validProjects.length === 0) {
                alert("Please enter at least one project name.");
                setIsSubmitting(false);
                return;
            }

            for (const project of validProjects) {
                const targetGroup = veBoardGroups.find(g => g.title.toLowerCase() === project.client.toLowerCase());
                const groupId = targetGroup ? targetGroup.id : 'topics'; // Default to top group if mismatch
                if (!targetGroup) console.warn(`Group not found for client: ${project.client}. Using default.`);

                await submitProjectAssignment(veProjectBoardId, groupId, {
                    itemName: project.projectName,
                    status: project.projectStatus,
                    type: project.projectType,
                    editor: project.editor,
                    price: project.price,
                    timeline: project.deadline,
                    priority: project.priority,
                    instructions: project.instructions,
                    rawVideoLink: project.rawVideoLink
                });
            }

            alert(`Successfully assigned ${validProjects.length} project(s)!`);
            navigate('/admin-portal/management');
        } catch (error) {
            console.error(error);
            alert("Failed to create assignment(s). Check console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddProject = () => {
        setProjects(prev => [...prev, { ...initialProjectState, client: sharedClient ? projects[0].client : '' }]);
        setActiveProjectIndex(projects.length);
    };

    const handleRemoveProject = (index: number) => {
        if (projects.length <= 1) return;
        setProjects(prev => prev.filter((_, i) => i !== index));
        if (activeProjectIndex >= index && activeProjectIndex > 0) {
            setActiveProjectIndex(prev => prev - 1);
        }
    };

    const handleCopyProject = (index: number) => {
        const projectToCopy = projects[index];
        setProjects(prev => [...prev, { ...projectToCopy, projectName: `${projectToCopy.projectName} (Copy)` }]);
        setActiveProjectIndex(projects.length);
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-12">
            {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                        ${step === s ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30 scale-110' :
                            step > s ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-500'}
                    `}>
                        {step > s ? <Check className="w-5 h-5" /> : s}
                    </div>
                    {s < 4 && (
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

                {/* Bulk Mode Toggle */}
                <div className="flex justify-center mb-8">
                    <div className="bg-[#151523]/80 border border-white/10 rounded-full p-1 flex">
                        <button
                            onClick={() => { setIsBulkMode(false); setActiveProjectIndex(0); setProjects([projects[0]]); }}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${!isBulkMode ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25' : 'text-gray-400 hover:text-white'}`}
                        >
                            Single Project
                        </button>
                        <button
                            onClick={() => setIsBulkMode(true)}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${isBulkMode ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25' : 'text-gray-400 hover:text-white'}`}
                        >
                            Bulk Assignment
                        </button>
                    </div>
                </div>

                <GlassCard className="p-8 relative overflow-hidden border border-white/10 !bg-[#151523]/90">

                    {/* Bulk Navigation Tabs */}
                    {isBulkMode && (
                        <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-white/5">
                            {projects.map((p, i) => {
                                const isFinalStep = step === 4;
                                const isActive = activeProjectIndex === i;

                                // On step 3, give a "success/finalize" glow, otherwise regular active styling.
                                const borderClass = isFinalStep
                                    ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]' // Step 3 Glow
                                    : (isActive ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-white/5 hover:border-white/20');

                                const textClass = isFinalStep
                                    ? 'text-emerald-400 font-bold'
                                    : (isActive ? 'text-violet-400 font-bold' : 'text-gray-400');

                                return (
                                    <div key={i} className={`flex items-center rounded-xl border transition-all duration-300 ${borderClass}`}>
                                        <button
                                            onClick={() => setActiveProjectIndex(i)}
                                            className={`px-4 py-2 text-sm transition-colors ${textClass}`}
                                        >
                                            {p.projectName || `Project ${i + 1}`}
                                        </button>

                                        <div className="flex items-center pr-2 border-l border-white/10 pl-2 gap-1">
                                            <button onClick={() => handleCopyProject(i)} className="p-1 text-gray-500 hover:text-blue-400 transition-colors" title="Duplicate">
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                            {projects.length > 1 && (
                                                <button onClick={() => handleRemoveProject(i)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Remove">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <button
                                onClick={handleAddProject}
                                className="flex items-center px-4 py-2 rounded-xl border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all text-sm font-medium"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Project
                            </button>
                        </div>
                    )}
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
                                            value={activeProject.projectName}
                                            onChange={(e) => updateCurrentProject({ projectName: e.target.value })}
                                            placeholder="e.g. Nike Commercial Edit Q1"
                                            className="w-full bg-[#0E0E1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
                                        />
                                    </div>

                                    {/* Raw Video Link */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Raw Video Link</label>
                                        <input
                                            type="url"
                                            value={activeProject.rawVideoLink}
                                            onChange={(e) => updateCurrentProject({ rawVideoLink: e.target.value })}
                                            placeholder="https://drive.google.com/..."
                                            className="w-full bg-[#0E0E1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
                                        />
                                    </div>

                                    {/* Deadline */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Deadline</label>
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                value={activeProject.deadline}
                                                onChange={(e) => updateCurrentProject({ deadline: e.target.value })}
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
                                            value={activeProject.instructions || ''}
                                            onChange={(val) => updateCurrentProject({ instructions: val })}
                                            placeholder="Enter project instructions..."
                                            className="min-h-[150px] text-white"
                                        />
                                    </div>
                                </div>

                                {/* MODAL SELECTION SECTION */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                    {activeProject.projectType || 'Select Type...'}
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
                                                    {activeProject.priority || 'Select Priority...'}
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
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-white flex items-center">
                                            <DollarSign className="w-5 h-5 mr-3 text-emerald-400" />
                                            Client & Pricing
                                        </h3>

                                        {isBulkMode && (
                                            <label className="flex items-center cursor-pointer group">
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={sharedClient}
                                                        onChange={(e) => {
                                                            setSharedClient(e.target.checked);
                                                            if (e.target.checked) {
                                                                // Apply current client to all immediately
                                                                setProjects(prev => prev.map(p => ({ ...p, client: activeProject.client })));
                                                            }
                                                        }}
                                                    />
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-300 ${sharedClient ? 'bg-emerald-500 border-emerald-500' : 'bg-transparent border-gray-500 group-hover:border-emerald-400'}`}>
                                                        <Check className={`w-3.5 h-3.5 text-white transition-opacity duration-300 ${sharedClient ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                                                    </div>
                                                </div>
                                                <span className="ml-3 text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Apply client to all projects</span>
                                            </label>
                                        )}
                                    </div>

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
                                                    {activeProject.client || 'Select Client...'}
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
                                                value={activeProject.price}
                                                onChange={(e) => updateCurrentProject({ price: e.target.value })}
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
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-white flex items-center">
                                            <User className="w-5 h-5 mr-3 text-blue-400" />
                                            Assign to Team
                                        </h3>

                                        {isBulkMode && (
                                            <label className="flex items-center cursor-pointer group">
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={sharedEditor}
                                                        onChange={(e) => {
                                                            setSharedEditor(e.target.checked);
                                                            if (e.target.checked && activeProject.editor) {
                                                                // Apply current editor to all immediately
                                                                setProjects(prev => prev.map(p => ({ ...p, editor: activeProject.editor })));
                                                            }
                                                        }}
                                                    />
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-300 ${sharedEditor ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-gray-500 group-hover:border-blue-400'}`}>
                                                        <Check className={`w-3.5 h-3.5 text-white transition-opacity duration-300 ${sharedEditor ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                                                    </div>
                                                </div>
                                                <span className="ml-3 text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Apply team member to all projects</span>
                                            </label>
                                        )}
                                    </div>

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
                                                    {activeProject.editor || 'Select Team Member...'}
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

                        {
                            step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-xl font-bold text-emerald-400 flex items-center mb-6">
                                        <Check className="w-5 h-5 mr-3" />
                                        Review & Finalize
                                    </h3>

                                    <div className="bg-[#151525] p-6 rounded-2xl border border-white/10">
                                        <p className="text-gray-400 mb-4 font-medium">You are about to create {projects.length} assignment{projects.length > 1 ? 's' : ''}.</p>
                                        <div className="space-y-3">
                                            {projects.map((p, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                                    <div>
                                                        <p className="font-bold text-white">{p.projectName || `Project ${idx + 1}`}</p>
                                                        <p className="text-sm text-gray-400 flex gap-2 items-center mt-1">
                                                            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                                                            {p.client || 'No Client'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-emerald-400 uppercase tracking-wider font-bold mb-1">Assigned Editor</p>
                                                        <p className="text-sm font-bold text-white">{p.editor || 'Unassigned'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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
                            onClick={step === 4 ? handleSubmit : handleNext}
                            disabled={isSubmitting || loadingClients}
                            className={`px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-custom-bright hover:text-white transition-all flex items-center gap-2 ${isSubmitting || loadingClients ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? 'Processing...' : (loadingClients ? 'Loading...' : (step === 4 ? (isBulkMode ? `Create ${projects.length} Assignments` : 'Create Assignment') : 'Continue'))}

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
                selected={activeProject.projectStatus}
                onSelect={(val) => updateCurrentProject({ projectStatus: val })}
                icon={Layers}
            />
            <SelectionModal
                isOpen={activeModal === 'type'}
                onClose={() => setActiveModal(null)}
                title="Select Project Type"
                options={projectTypes}
                selected={activeProject.projectType}
                onSelect={(val) => updateCurrentProject({ projectType: val })}
                icon={BookOpen}
            />
            <SelectionModal
                isOpen={activeModal === 'priority'}
                onClose={() => setActiveModal(null)}
                title="Select Priority"
                options={projectPriorities}
                selected={activeProject.priority}
                onSelect={(val) => updateCurrentProject({ priority: val })}
                icon={Layers}
            />
            <SelectionModal
                isOpen={activeModal === 'client'}
                onClose={() => setActiveModal(null)}
                title="Select Client"
                options={availableClients}
                selected={activeProject.client}
                onSelect={(val) => {
                    if (isBulkMode && sharedClient) {
                        // Apply to all
                        setProjects(prev => prev.map(p => ({ ...p, client: val })));
                    } else {
                        updateCurrentProject({ client: val });
                    }
                }}
                icon={User}
            />
            <SelectionModal
                isOpen={activeModal === 'team'}
                onClose={() => setActiveModal(null)}
                title="Select Team Member"
                options={availableTeam.map(u => u.name)}
                selected={activeProject.editor}
                onSelect={(val) => {
                    if (isBulkMode && sharedEditor) {
                        setProjects(prev => prev.map(p => ({ ...p, editor: val })));
                    } else {
                        updateCurrentProject({ editor: val });
                    }
                }}
                icon={User}
            />
        </AdminPageLayout>
    );
}
