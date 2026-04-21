import { useState, useEffect, useMemo, useRef } from 'react';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { fireCvSwal } from '../../lib/swalTheme';
import {
    User,
    Briefcase,
    Check,
    BookOpen,
    Layers,
    Plus,
    X,
    Copy,
    Loader2,
    Link,
    Calendar,
    ChevronRight,
    Users,
    Shield,
    FileText,
    Sparkles,
    RefreshCw,
    ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllBoards, getBoardColumns, getBoardGroups, submitProjectAssignment } from '../../services/mondayService';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { announceAssignment } from '../../services/discordService';
import { getAllCheckers, Checker } from '../../services/boardsService';
import { createNotification } from '../../services/notificationService';
import { supabase } from '../../lib/supabaseClient';
import { SelectionModal } from '../../components/ui/SelectionModal';
import {
    ASSIGN_PROJECT_MONDAY_BOARD_IDS,
    deadlineToYyyyMmDd,
    fetchEditorsAvailableForDate,
} from '../../services/assignProjectMondayIntegration';
import { DeploymentBoardPanel } from '../../components/admin/DeploymentBoardPanel';

const MONDAY_AVAILABILITY_URL = `https://creative-vision-unit.monday.com/boards/${ASSIGN_PROJECT_MONDAY_BOARD_IDS.availability}/views`;

/** Compact labels for Mon–Sun week strip (matches availability board day columns). */
const WEEKDAY_PICKER: { label: string; title: string }[] = [
    { label: 'M', title: 'Monday' },
    { label: 'T', title: 'Tuesday' },
    { label: 'W', title: 'Wednesday' },
    { label: 'TH', title: 'Thursday' },
    { label: 'F', title: 'Friday' },
    { label: 'S', title: 'Saturday' },
    { label: 'Sun', title: 'Sunday' },
];

function yyyyMmDdLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function parseLocalYmd(ymd: string): Date {
    const [y, mo, d] = ymd.split('-').map(Number);
    return new Date(y, mo - 1, d, 12, 0, 0, 0);
}

function startOfWeekMondayLocal(d: Date): Date {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
    const dow = x.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    x.setDate(x.getDate() + diff);
    return x;
}

function addDaysLocal(d: Date, n: number): Date {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
    x.setDate(x.getDate() + n);
    return x;
}

// ── Field wrapper ────────────────────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-widest text-white/30">{label}</label>
        {children}
    </div>
);

// ── Select pill button ───────────────────────────────────────────────────────
const SelectPill = ({
    label, value, placeholder, color = '#8b5cf6', icon, onClick,
}: {
    label: string; value: string; placeholder: string; color?: string; icon: React.ReactNode; onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-150 text-left group"
        style={{
            background: value ? `${color}08` : 'transparent',
            borderColor: value ? `${color}30` : 'rgba(255,255,255,0.06)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = `${color}50`)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = value ? `${color}30` : 'rgba(255,255,255,0.06)')}
    >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: `${color}90` }}>{label}</div>
            <div className={`text-[14px] font-semibold truncate ${value ? 'text-white' : 'text-white/25'}`}>
                {value || placeholder}
            </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 flex-shrink-0 transition-colors" />
    </button>
);

// ── Input ────────────────────────────────────────────────────────────────────
const Input = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
    <div className="space-y-2">
        {label && <label className="text-[11px] font-bold uppercase tracking-widest text-white/30">{label}</label>}
        <input
            {...props}
            className={`w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-colors ${props.className ?? ''}`}
        />
    </div>
);

// ── Shared toggle ────────────────────────────────────────────────────────────
const BulkToggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center gap-2 cursor-pointer">
        <div
            onClick={() => onChange(!checked)}
            className={`w-8 h-4 rounded-full transition-all duration-200 relative flex-shrink-0 ${checked ? 'bg-violet-500' : 'bg-white/10'}`}
        >
            <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all duration-200 ${checked ? 'left-4' : 'left-0.5'}`} />
        </div>
        <span className="text-[11px] text-white/40 font-medium">{label}</span>
    </label>
);

// ────────────────────────────────────────────────────────────────────────────
export default function AdminProjectAssignment() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [activeModal, setActiveModal] = useState<'status' | 'type' | 'priority' | 'client' | 'team' | 'checker' | null>(null);

    const [availableClients, setAvailableClients] = useState<string[]>([]);
    const [veBoardGroups, setVeBoardGroups] = useState<{ id: string, title: string }[]>([]);
    const [availableTeam, setAvailableTeam] = useState<{ name: string, id: string }[]>([]);
    const [availableCheckers, setAvailableCheckers] = useState<Checker[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [veProjectBoardId, setVeProjectBoardId] = useState<string | null>(null);

    const [availabilityEditors, setAvailabilityEditors] = useState<string[]>([]);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    /** Explicit day override (week dots or calendar); empty = use deadline or today. */
    const [availabilityPickDate, setAvailabilityPickDate] = useState('');
    const availabilityDateInputRef = useRef<HTMLInputElement>(null);

    const initialProjectState = {
        projectName: '', projectStatus: 'Unassigned', projectType: '', client: '',
        price: '', editor: '', checkerName: '', deadline: '', priority: '',
        instructions: '', rawVideoLink: ''
    };

    const [projects, setProjects] = useState([initialProjectState]);
    const [activeProjectIndex, setActiveProjectIndex] = useState(0);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [sharedClient, setSharedClient] = useState(true);
    const [sharedEditor, setSharedEditor] = useState(true);
    const [sharedChecker, setSharedChecker] = useState(true);

    const [projectStatuses, setProjectStatuses] = useState<string[]>([]);
    const [projectTypes, setProjectTypes] = useState<string[]>([]);
    const [projectPriorities, setProjectPriorities] = useState<string[]>([]);

    const normalizePersonName = (value: string) =>
        value
            .toLowerCase()
            .replace(/\(.*?\)/g, '')
            .replace(/[^a-z0-9]+/g, '')
            .trim();

    const normalizeClientName = (value: string) =>
        value
            .toLowerCase()
            .replace(/\(.*?\)/g, '')
            .replace(/\bclient\b/g, '')
            .replace(/\bcv\b/g, '')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();

    const resolveClientGroupId = (clientName: string): string | null => {
        const cleanClient = normalizeClientName(clientName || '');
        if (!cleanClient) return null;

        // Exact normalized match first.
        const exact = veBoardGroups.find(g => normalizeClientName(g.title) === cleanClient);
        if (exact?.id) return exact.id;

        // Then relaxed include match for small title variations.
        const partial = veBoardGroups.find(g => {
            const gt = normalizeClientName(g.title);
            return gt.includes(cleanClient) || cleanClient.includes(gt);
        });
        return partial?.id || null;
    };

    const resolveEditorFromMondayLabel = (label: string) => {
        const n = normalizePersonName(label);
        const exact = availableTeam.find(t => normalizePersonName(t.name) === n);
        if (exact) return exact.name;
        const partial = availableTeam.find(t => {
            const tn = normalizePersonName(t.name);
            return tn.includes(n) || n.includes(tn);
        });
        if (partial) return partial.name;
        return label.trim();
    };

    const activeProject = projects[activeProjectIndex];

    const updateCurrentProject = (updates: any) => {
        setProjects(prev => {
            const next = [...prev];
            next[activeProjectIndex] = { ...next[activeProjectIndex], ...updates };
            return next;
        });
    };

    const setEditorFromQuickPick = (label: string) => {
        const resolved = resolveEditorFromMondayLabel(label);
        if (isBulkMode && sharedEditor) {
            setProjects(prev => prev.map(p => ({ ...p, editor: resolved })));
        } else {
            updateCurrentProject({ editor: resolved });
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoadingClients(true);
            try {
                const boards = await getAllBoards();
                const teamBoards = boards.filter((b: any) =>
                    b.name.toLowerCase().includes(' - workspace') && !b.name.startsWith('Subitems')
                );
                const teamMembers = teamBoards.map((b: any) => ({
                    name: b.name.replace(/ - Workspace/i, '').replace(/\s*\(.*?\)\s*/g, '').trim(),
                    id: b.id
                }));
                teamMembers.sort((a: any, b: any) => a.name.localeCompare(b.name));
                setAvailableTeam(teamMembers);

                const projectBoard = boards.find((b: any) =>
                    (b.name.toLowerCase().includes('ve project board') || b.name.toLowerCase().includes('video editing project'))
                    && !b.name.toLowerCase().startsWith('subitems')
                );

                if (projectBoard) {
                    setVeProjectBoardId(projectBoard.id);
                    const columns = await getBoardColumns(projectBoard.id);
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
                        } catch { return []; }
                    };

                    const statusCol = columns.find((c: any) => c.title.toLowerCase() === 'project status' || (c.title.toLowerCase() === 'status' && c.id !== 'status'));
                    if (statusCol?.settings_str) {
                        const labels = parseLabels(statusCol.settings_str);
                        const filtered = labels.filter(l => l.toLowerCase().includes('unassigned'));
                        const val = filtered.length > 0 ? filtered[0] : 'Unassigned (cv)';
                        setProjectStatuses(filtered.length > 0 ? filtered : ['Unassigned (cv)']);
                        updateCurrentProject({ projectStatus: val });
                    }
                    const typeCol = columns.find((c: any) => c.title.toLowerCase() === 'type' || c.title.toLowerCase() === 'project type');
                    if (typeCol?.settings_str) {
                        const labels = parseLabels(typeCol.settings_str);
                        if (labels.length > 0) { setProjectTypes(labels); updateCurrentProject({ projectType: labels[0] }); }
                    }
                    const priorityCol = columns.find((c: any) => c.title.toLowerCase() === 'priority');
                    if (priorityCol?.settings_str) {
                        const labels = parseLabels(priorityCol.settings_str);
                        if (labels.length > 0) { setProjectPriorities(labels); updateCurrentProject({ priority: labels[0] }); }
                    }
                    const clientCol = columns.find((c: any) => c.title.toLowerCase() === 'client');
                    if (clientCol?.settings_str) {
                        const labels = parseLabels(clientCol.settings_str);
                        if (labels.length > 0) setAvailableClients(Array.from(new Set(labels)).sort());
                    }
                    try {
                        const groups = await getBoardGroups(projectBoard.id);
                        if (groups) setVeBoardGroups(groups);
                    } catch { }
                }
            } catch (error: any) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoadingClients(false);
            }

            try {
                const checkersRes = await getAllCheckers();
                if (checkersRes.success && checkersRes.data) setAvailableCheckers(checkersRes.data);
            } catch { }
        };
        fetchData();
    }, []);

    /** Manual pick wins, then project deadline, then today (always a valid day). */
    const availabilityQueryDay = useMemo(() => {
        if (availabilityPickDate && /^\d{4}-\d{2}-\d{2}$/.test(availabilityPickDate)) return availabilityPickDate;
        const fromDeadline = deadlineToYyyyMmDd(activeProject.deadline);
        if (fromDeadline) return fromDeadline;
        return yyyyMmDdLocal(new Date());
    }, [activeProject.deadline, availabilityPickDate]);

    const availabilityWeekStrip = useMemo(() => {
        const start = startOfWeekMondayLocal(parseLocalYmd(availabilityQueryDay));
        return Array.from({ length: 7 }, (_, i) => {
            const d = addDaysLocal(start, i);
            return { ymd: yyyyMmDdLocal(d), date: d };
        });
    }, [availabilityQueryDay]);

    const todayYmd = yyyyMmDdLocal(new Date());

    const availabilityDayLabel = new Date(`${availabilityQueryDay}T12:00:00`).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    useEffect(() => {
        let cancelled = false;
        const day = availabilityQueryDay;
        (async () => {
            setAvailabilityLoading(true);
            try {
                const names = await fetchEditorsAvailableForDate(day, false);
                if (!cancelled) setAvailabilityEditors(names);
            } catch (e) {
                console.error('Availability board load failed', e);
                if (!cancelled) setAvailabilityEditors([]);
            } finally {
                if (!cancelled) setAvailabilityLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [availabilityQueryDay]);

    const refreshAvailabilityBoard = async () => {
        setAvailabilityLoading(true);
        try {
            const names = await fetchEditorsAvailableForDate(availabilityQueryDay, true);
            setAvailabilityEditors(names);
        } catch (e) {
            console.error(e);
        } finally {
            setAvailabilityLoading(false);
        }
    };

    const openAvailabilityDatePicker = () => {
        const el = availabilityDateInputRef.current;
        if (el && typeof el.showPicker === 'function') {
            try {
                el.showPicker();
                return;
            } catch {
                /* Safari / older */
            }
        }
        el?.click();
    };

    const handleSubmit = async () => {
        if (!veProjectBoardId) { alert('Configuration Error: VE Project Board not found.'); return; }
        setIsSubmitting(true);
        try {
            const validProjects = projects.filter(p => p.projectName.trim() !== '');
            if (validProjects.length === 0) { alert('Please enter at least one project name.'); setIsSubmitting(false); return; }

            const unmappedClients = Array.from(
                new Set(
                    validProjects
                        .map(p => p.client?.trim() || '')
                        .filter(Boolean)
                        .filter(c => !resolveClientGroupId(c))
                )
            );
            if (unmappedClients.length > 0) {
                await fireCvSwal({
                    icon: 'error',
                    title: 'Client mapping issue',
                    html: `Could not match these client group(s) in Monday:<br/><br/><b>${unmappedClients.map(c => c.replace(/</g, '&lt;')).join('<br/>')}</b><br/><br/>Please select the exact client from the list before assigning.`,
                    confirmButtonText: 'OK',
                });
                setIsSubmitting(false);
                return;
            }

            for (const project of validProjects) {
                const groupId = resolveClientGroupId(project.client);
                if (!groupId) throw new Error(`No Monday group match for client: ${project.client}`);

                await submitProjectAssignment(veProjectBoardId, groupId, {
                    itemName: project.projectName, status: project.projectStatus, type: project.projectType,
                    editor: project.editor, price: project.price, timeline: project.deadline,
                    priority: project.priority, instructions: project.instructions, rawVideoLink: project.rawVideoLink
                });

                if (project.editor) {
                    announceAssignment({
                        projectName: project.projectName, clientName: project.client || 'N/A',
                        editorName: project.editor, checkerName: project.checkerName, price: project.price,
                        deadline: project.deadline ? new Date(project.deadline).toLocaleString() : undefined,
                        instructions: project.instructions
                    }).catch(err => console.error('Discord failed', err));

                    try {
                        const teamEntry = availableTeam.find(t => t.name === project.editor.trim());
                        if (teamEntry?.id) {
                            const { data: allEditorUsers, error: fetchErr } = await supabase
                                .from('users').select('email, name, allowed_board_ids').eq('role', 'editor');
                            if (!fetchErr) {
                                const matchedUser = allEditorUsers?.find(u => {
                                    const allowedBoardMatch = u.allowed_board_ids?.includes(teamEntry.id);
                                    const nameMatch = normalizePersonName(u.name || '') === normalizePersonName(project.editor);
                                    return allowedBoardMatch || nameMatch;
                                });
                                if (matchedUser?.email) {
                                    const deadlineStr = project.deadline ? ` | Deadline: ${new Date(project.deadline).toLocaleDateString()}` : '';
                                    const checkerStr = project.checkerName ? ` | Checker: ${project.checkerName}` : '';
                                    const typeStr = project.projectType ? ` | Type: ${project.projectType}` : '';
                                    await createNotification({
                                        user_email: matchedUser.email, type: 'assignment',
                                        title: 'New Project Assigned',
                                        message: `You've been assigned "${project.projectName}" for ${project.client || 'N/A'}${typeStr}${deadlineStr}${checkerStr}.`,
                                        source_type: 'project', source_id: project.projectName
                                    });
                                }
                            }
                        }
                    } catch (notifErr) { console.error('Notification failed', notifErr); }
                }
            }

            await fireCvSwal({
                icon: 'success',
                title: 'Project assigned',
                text: `Successfully assigned ${validProjects.length} project(s)!`,
                confirmButtonText: 'OK',
            });
            navigate('/admin-portal/management');
        } catch (error) {
            console.error(error);
            alert('Failed to create assignment(s). Check console.');
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
        if (activeProjectIndex >= index && activeProjectIndex > 0) setActiveProjectIndex(prev => prev - 1);
    };
    const handleCopyProject = (index: number) => {
        const p = projects[index];
        setProjects(prev => [...prev, { ...p, projectName: `${p.projectName} (Copy)` }]);
        setActiveProjectIndex(projects.length);
    };

    const STEPS = [
        { label: 'Details', icon: <FileText className="w-3.5 h-3.5" /> },
        { label: 'Client', icon: <Briefcase className="w-3.5 h-3.5" /> },
        { label: 'Team', icon: <Users className="w-3.5 h-3.5" /> },
        { label: 'Review', icon: <Check className="w-3.5 h-3.5" /> },
    ];

    return (
        <AdminPageLayout
            label="Admin"
            title="Assign Project"
            subtitle="Configure and assign new projects to your team"
        >
            <div className="w-full max-w-[90rem] mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-10">
                    <div className="flex-1 min-w-0 w-full max-w-2xl mx-auto lg:mx-0">

                {/* ── Step indicator ── */}
                <div className="flex items-center justify-center gap-0 mb-10">
                    {STEPS.map((s, i) => {
                        const n = i + 1;
                        const done = step > n;
                        const active = step === n;
                        return (
                            <div key={n} className="flex items-center">
                                <div className="flex flex-col items-center gap-1.5">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                            done ? 'bg-emerald-500 text-white' :
                                            active ? 'bg-violet-500 text-white ring-4 ring-violet-500/20' :
                                            'bg-white/[0.04] border border-white/[0.08] text-white/25'
                                        }`}
                                    >
                                        {done ? <Check className="w-3.5 h-3.5" /> : s.icon}
                                    </div>
                                    <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${active ? 'text-violet-400' : done ? 'text-emerald-400' : 'text-white/20'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`w-16 h-[1px] mx-3 mb-5 rounded-full transition-all duration-300 ${step > n ? 'bg-emerald-500/60' : 'bg-white/[0.06]'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── Mode toggle ── */}
                <div className="flex justify-center mb-6">
                    <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-xl p-0.5">
                        {['Single Project', 'Bulk Assignment'].map((label, i) => (
                            <button
                                key={label}
                                onClick={() => { if (i === 0) { setIsBulkMode(false); setActiveProjectIndex(0); setProjects([projects[0]]); } else setIsBulkMode(true); }}
                                className={`px-5 py-2 rounded-[10px] text-xs font-bold transition-all duration-150 ${
                                    isBulkMode === (i === 1) ? 'bg-violet-500 text-white shadow-md' : 'text-white/35 hover:text-white'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Bulk project tabs ── */}
                {isBulkMode && (
                    <div className="flex flex-wrap gap-2 mb-5 p-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                        {projects.map((p, i) => {
                            const isActive = activeProjectIndex === i;
                            return (
                                <div key={i} className={`flex items-center rounded-xl border transition-all duration-200 ${isActive ? 'bg-violet-500/10 border-violet-500/30' : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]'}`}>
                                    <button onClick={() => setActiveProjectIndex(i)} className={`px-3.5 py-2 text-xs font-semibold transition-colors ${isActive ? 'text-violet-300' : 'text-white/40'}`}>
                                        {p.projectName || `Project ${i + 1}`}
                                    </button>
                                    <div className="flex items-center px-2 border-l border-white/[0.06] gap-1">
                                        <button onClick={() => handleCopyProject(i)} className="p-1 text-white/20 hover:text-blue-400 transition-colors"><Copy className="w-3 h-3" /></button>
                                        {projects.length > 1 && (
                                            <button onClick={() => handleRemoveProject(i)} className="p-1 text-white/20 hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <button
                            onClick={handleAddProject}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-dashed border-white/[0.08] text-white/30 hover:text-white hover:border-white/20 transition-all text-xs font-medium"
                        >
                            <Plus className="w-3 h-3" /> Add Project
                        </button>
                    </div>
                )}

                {/* ── Step content ── */}
                <div className="bg-white/[0.018] border border-white/[0.06] rounded-2xl overflow-hidden">
                    <AnimatePresence mode="wait">

                        {/* Step 1 — Project Details */}
                        {step === 1 && (
                            <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
                                className="p-7 space-y-6">
                                <div className="flex items-center gap-2.5 mb-2">
                                    <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                                        <FileText className="w-3.5 h-3.5 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-[13px] font-bold text-white/80">Project Details</h3>
                                        <p className="text-[10px] text-white/25">Name, deadline, type and priority</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input label="Project Name" type="text" value={activeProject.projectName}
                                        onChange={e => updateCurrentProject({ projectName: e.target.value })}
                                        placeholder="e.g. Nike Q1 Commercial" />
                                    <Input label="Deadline" type="datetime-local" value={activeProject.deadline}
                                        onChange={e => updateCurrentProject({ deadline: e.target.value })}
                                        className="[&::-webkit-calendar-picker-indicator]:invert" />
                                </div>

                                <Field label="Raw Video Link">
                                    <div className="relative">
                                        <Link className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                        <input type="url" value={activeProject.rawVideoLink}
                                            onChange={e => updateCurrentProject({ rawVideoLink: e.target.value })}
                                            placeholder="https://drive.google.com/..."
                                            className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-colors" />
                                    </div>
                                </Field>

                                <Field label="Instructions / Notes">
                                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
                                        <RichTextEditor value={activeProject.instructions || ''} onChange={val => updateCurrentProject({ instructions: val })}
                                            placeholder="Enter project instructions..." className="min-h-[120px] text-white" />
                                    </div>
                                </Field>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <SelectPill label="Project Type" value={activeProject.projectType} placeholder="Select type…"
                                        color="#3b82f6" icon={<BookOpen className="w-4 h-4" />} onClick={() => setActiveModal('type')} />
                                    <SelectPill label="Priority" value={activeProject.priority} placeholder="Select priority…"
                                        color="#ef4444" icon={<Layers className="w-4 h-4" />} onClick={() => setActiveModal('priority')} />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2 — Client & Pricing */}
                        {step === 2 && (
                            <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
                                className="p-7 space-y-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                                            <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-[13px] font-bold text-white/80">Client & Pricing</h3>
                                            <p className="text-[10px] text-white/25">Who is this project for?</p>
                                        </div>
                                    </div>
                                    {isBulkMode && <BulkToggle label="Apply to all" checked={sharedClient} onChange={v => { setSharedClient(v); if (v) setProjects(prev => prev.map(p => ({ ...p, client: activeProject.client }))); }} />}
                                </div>

                                <SelectPill label="Client" value={activeProject.client} placeholder="Select client…"
                                    color="#10b981" icon={<User className="w-4 h-4" />} onClick={() => setActiveModal('client')} />

                                <Field label="Project Budget / Price (PHP)">
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white/30">₱</span>
                                        <input type="number" value={activeProject.price}
                                            onChange={e => updateCurrentProject({ price: e.target.value })}
                                            placeholder="0.00"
                                            className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono" />
                                    </div>
                                </Field>
                            </motion.div>
                        )}

                        {/* Step 3 — Team */}
                        {step === 3 && (
                            <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
                                className="p-7 space-y-5">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                                            <Users className="w-3.5 h-3.5 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-[13px] font-bold text-white/80">Assign to Team</h3>
                                            <p className="text-[10px] text-white/25">Editor and quality checker</p>
                                        </div>
                                    </div>
                                    {isBulkMode && <BulkToggle label="Apply editor to all" checked={sharedEditor} onChange={v => { setSharedEditor(v); if (v && activeProject.editor) setProjects(prev => prev.map(p => ({ ...p, editor: activeProject.editor }))); }} />}
                                </div>

                                <SelectPill label="Team Member (Editor)" value={activeProject.editor} placeholder="Select editor…"
                                    color="#3b82f6" icon={<User className="w-4 h-4" />} onClick={() => setActiveModal('team')} />

                                {availabilityEditors.length > 0 && (
                                    <div className="rounded-2xl border border-white/[0.07] bg-cyan-500/[0.04] p-4 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-500/70">Available — {availabilityDayLabel}</p>
                                            <button
                                                type="button"
                                                onClick={refreshAvailabilityBoard}
                                                disabled={availabilityLoading}
                                                className="p-1.5 rounded-lg text-cyan-400/50 hover:text-cyan-300 transition-colors disabled:opacity-40"
                                                title="Refresh availability"
                                            >
                                                <RefreshCw className={`w-3 h-3 ${availabilityLoading ? 'animate-spin' : ''}`} />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {availabilityEditors.map(name => {
                                                const resolved = resolveEditorFromMondayLabel(name);
                                                const active = activeProject.editor === resolved;
                                                return (
                                                    <button
                                                        key={name}
                                                        type="button"
                                                        onClick={() => setEditorFromQuickPick(name)}
                                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                                                            active
                                                                ? 'border-cyan-400/50 bg-cyan-500/25 text-white'
                                                                : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200/90 hover:bg-cyan-500/20'
                                                        }`}
                                                    >
                                                        {resolved}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <SelectPill label="Checker of the Day" value={activeProject.checkerName} placeholder="Select checker…"
                                        color="#f59e0b" icon={<Shield className="w-4 h-4" />} onClick={() => setActiveModal('checker')} />
                                </div>
                                {isBulkMode && (
                                    <div className="flex justify-end">
                                        <BulkToggle label="Apply checker to all" checked={sharedChecker} onChange={v => { setSharedChecker(v); if (v && activeProject.checkerName) setProjects(prev => prev.map(p => ({ ...p, checkerName: activeProject.checkerName }))); }} />
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Step 4 — Review */}
                        {step === 4 && (
                            <motion.div key="s4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
                                className="p-7 space-y-5">
                                <div className="flex items-center gap-2.5 mb-2">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-[13px] font-bold text-white/80">Review & Confirm</h3>
                                        <p className="text-[10px] text-white/25">{projects.length} assignment{projects.length > 1 ? 's' : ''} ready to submit</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {projects.map((p, idx) => (
                                        <div key={idx} className="flex items-center gap-4 px-5 py-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                                            {/* Left */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[14px] font-bold text-white truncate">{p.projectName || `Project ${idx + 1}`}</p>
                                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                                                    {p.client && <span className="text-[10px] text-emerald-400 font-semibold">{p.client}</span>}
                                                    {p.projectType && <span className="text-[10px] text-blue-400 font-semibold">{p.projectType}</span>}
                                                    {p.price && <span className="text-[10px] text-white/30 font-semibold">₱{p.price}</span>}
                                                </div>
                                            </div>
                                            {/* Right */}
                                            <div className="flex items-center gap-4 text-right flex-shrink-0">
                                                {p.checkerName && (
                                                    <div>
                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-500/60">Checker</p>
                                                        <p className="text-[12px] font-semibold text-white/70">{p.checkerName}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400/60">Editor</p>
                                                    <p className="text-[12px] font-semibold text-white/70">{p.editor || 'Unassigned'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {/* ── Navigation ── */}
                    <div className="flex items-center justify-between px-7 py-5 border-t border-white/[0.05]">
                        <button
                            onClick={step === 1 ? () => navigate('/admin-portal/management') : () => setStep(s => s - 1)}
                            className="px-4 py-2 text-xs font-semibold text-white/35 hover:text-white transition-colors"
                        >
                            {step === 1 ? 'Cancel' : '← Back'}
                        </button>

                        <button
                            onClick={step === 4 ? handleSubmit : () => setStep(s => s + 1)}
                            disabled={isSubmitting || loadingClients}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${
                                step === 4
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                                    : 'bg-violet-500 hover:bg-violet-400 text-white'
                            } ${isSubmitting || loadingClients ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</>
                            ) : loadingClients ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</>
                            ) : step === 4 ? (
                                isBulkMode ? `Create ${projects.length} Assignments` : 'Create Assignment'
                            ) : (
                                <>Continue <ChevronRight className="w-3.5 h-3.5" /></>
                            )}
                        </button>
                    </div>
                </div>
                    </div>

                    <aside
                        aria-label="Deployment board and Monday.com editor availability"
                        className="w-full lg:w-[min(100%,26rem)] xl:w-[28rem] flex-shrink-0 space-y-4 lg:sticky lg:top-6 lg:self-start pb-8 lg:pb-0"
                    >
                        <DeploymentBoardPanel variant="sidebar" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-0.5 hidden lg:block">Live from Monday</p>
                        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-4 h-4 text-cyan-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[12px] font-bold text-white/85">Editor availability</h4>
                                        <p className="text-[10px] text-white/35 leading-snug">
                                            Defaults to today; uses project deadline when set. Tap a day this week or the calendar for other dates.{' '}
                                            <a href={MONDAY_AVAILABILITY_URL} target="_blank" rel="noreferrer" className="text-cyan-400/90 hover:underline inline-flex items-center gap-0.5">
                                                Open board <ExternalLink className="w-2.5 h-2.5 inline opacity-70" />
                                            </a>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={refreshAvailabilityBoard}
                                    disabled={availabilityLoading}
                                    className="flex-shrink-0 p-2 rounded-lg border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 transition-colors disabled:opacity-40"
                                    title="Refresh from Monday"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${availabilityLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            <input
                                ref={availabilityDateInputRef}
                                type="date"
                                className="sr-only"
                                tabIndex={-1}
                                aria-hidden
                                value={availabilityPickDate || availabilityQueryDay}
                                onChange={e => setAvailabilityPickDate(e.target.value)}
                            />

                            <div className="flex flex-wrap items-center gap-1">
                                {availabilityWeekStrip.map(({ ymd }, i) => {
                                    const meta = WEEKDAY_PICKER[i];
                                    const selected = ymd === availabilityQueryDay;
                                    const isToday = ymd === todayYmd;
                                    const labelSize =
                                        meta.label.length >= 3 ? 'text-[7px]' : meta.label.length === 2 ? 'text-[8px]' : 'text-[10px]';
                                    return (
                                        <button
                                            key={ymd}
                                            type="button"
                                            title={`${meta.title} — ${ymd}`}
                                            onClick={() => setAvailabilityPickDate(ymd)}
                                            className={`h-8 min-w-[2rem] px-1 rounded-full border font-bold transition-colors flex items-center justify-center ${labelSize} ${
                                                selected
                                                    ? 'border-cyan-400/60 bg-cyan-500/25 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.35)]'
                                                    : isToday
                                                      ? 'border-white/25 bg-white/[0.06] text-white/90'
                                                      : 'border-white/[0.1] bg-white/[0.03] text-white/55 hover:bg-white/[0.07] hover:text-white/80'
                                            }`}
                                        >
                                            {meta.label}
                                        </button>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={openAvailabilityDatePicker}
                                    className="h-8 w-8 rounded-full border border-white/[0.12] bg-white/[0.04] text-cyan-400/90 hover:bg-cyan-500/15 hover:border-cyan-500/35 flex items-center justify-center flex-shrink-0 transition-colors"
                                    title="Choose any date"
                                    aria-label="Open calendar to choose a date"
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {availabilityLoading && availabilityEditors.length === 0 ? (
                                <div className="flex items-center gap-2 text-[11px] text-white/35 py-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading {availabilityDayLabel}…
                                </div>
                            ) : availabilityEditors.length === 0 ? (
                                <p className="text-[11px] text-white/30 py-1">
                                    No editors listed for <span className="text-white/50">{availabilityDayLabel}</span>. Check the board and refresh.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-500/60">Available — {availabilityDayLabel}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {availabilityEditors.map(name => (
                                            <button
                                                key={name}
                                                type="button"
                                                onClick={() => setEditorFromQuickPick(name)}
                                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-cyan-500/25 bg-cyan-500/10 text-cyan-200/90 hover:bg-cyan-500/20 transition-colors"
                                            >
                                                {resolveEditorFromMondayLabel(name)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            {/* Selection Modals */}
            <SelectionModal isOpen={activeModal === 'status'} onClose={() => setActiveModal(null)} title="Select Project Status"
                options={projectStatuses} selected={activeProject.projectStatus} onSelect={val => updateCurrentProject({ projectStatus: val })} icon={Layers} />
            <SelectionModal isOpen={activeModal === 'type'} onClose={() => setActiveModal(null)} title="Select Project Type"
                options={projectTypes} selected={activeProject.projectType} onSelect={val => updateCurrentProject({ projectType: val })} icon={BookOpen} />
            <SelectionModal isOpen={activeModal === 'priority'} onClose={() => setActiveModal(null)} title="Select Priority"
                options={projectPriorities} selected={activeProject.priority} onSelect={val => updateCurrentProject({ priority: val })} icon={Layers} />
            <SelectionModal isOpen={activeModal === 'client'} onClose={() => setActiveModal(null)} title="Select Client"
                options={availableClients} selected={activeProject.client}
                onSelect={val => isBulkMode && sharedClient ? setProjects(prev => prev.map(p => ({ ...p, client: val }))) : updateCurrentProject({ client: val })}
                icon={User} />
            <SelectionModal isOpen={activeModal === 'team'} onClose={() => setActiveModal(null)} title="Select Team Member"
                options={availableTeam.map(u => u.name)} selected={activeProject.editor}
                onSelect={val => isBulkMode && sharedEditor ? setProjects(prev => prev.map(p => ({ ...p, editor: val }))) : updateCurrentProject({ editor: val })}
                icon={User} />
            <SelectionModal isOpen={activeModal === 'checker'} onClose={() => setActiveModal(null)} title="Select Checker of the Day"
                options={availableCheckers.filter(c => c.is_active).map(c => c.name)} selected={activeProject.checkerName}
                onSelect={val => isBulkMode && sharedChecker ? setProjects(prev => prev.map(p => ({ ...p, checkerName: val }))) : updateCurrentProject({ checkerName: val })}
                icon={Check} />
        </AdminPageLayout>
    );
}
