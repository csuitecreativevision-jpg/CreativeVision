import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
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
    ChevronLeft,
    ChevronDown,
    ChevronRight,
    Users,
    Shield,
    FileText,
    Sparkles,
    RefreshCw,
    ExternalLink,
    ListChecks,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllBoards, getAllFolders, getBoardColumns, getBoardGroups, submitProjectAssignment } from '../../services/mondayService';
import { useRefresh } from '../../contexts/RefreshContext';
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
import {
    deriveTitleFromVideoUrl,
    extractGoogleDriveFileId,
    fetchGoogleDriveFileTitle,
} from '../../services/googleDriveLinkService';
import {
    buildManilaDeadline,
    formatDeadlineInManila,
    manilaPickerPartsFromDate,
    parseManilaDeadlineForPicker,
    parseYmdToNoonManila,
    todaysYmdManila,
    ymdInManila,
} from '../../lib/philippinesTime';

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

/** 01–12 for 12h deadline pickers. */
const DEADLINE_PICKER_HOUR_VALUES = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
/** 00–59. */
const DEADLINE_PICKER_MINUTE_VALUES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

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
        className="w-full flex items-center gap-2.5 sm:gap-4 px-3 py-2.5 sm:px-5 sm:py-4 rounded-2xl border transition-all duration-150 text-left group"
        style={{
            background: value ? `${color}08` : 'transparent',
            borderColor: value ? `${color}30` : 'rgba(255,255,255,0.06)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = `${color}50`)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = value ? `${color}30` : 'rgba(255,255,255,0.06)')}
    >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
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
            className={`w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-colors ${props.className ?? ''}`}
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
/** Match Admin → Clients display names from fulfillment board titles. */
function cleanClientBoardName(name: string): string {
    return name
        .replace(/fulfillment board/i, '')
        .replace(/fullfilment board/i, '')
        .replace(/\(inactive\)/i, '')
        .replace(/\(CF.*?\)/i, '')
        .replace(/\(C-F.*?\)/i, '')
        .replace(/-/g, ' ')
        .trim();
}

export default function AdminProjectAssignment() {
    const navigate = useNavigate();
    const { refreshKey } = useRefresh();
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
    const [isAvailabilityCalendarOpen, setIsAvailabilityCalendarOpen] = useState(false);
    const [availabilityCalendarMonth, setAvailabilityCalendarMonth] = useState<Date>(() => {
        const a = parseYmdToNoonManila(todaysYmdManila());
        return new Date(a.getFullYear(), a.getMonth(), 1, 12, 0, 0, 0);
    });
    const availabilityCalendarRef = useRef<HTMLDivElement>(null);
    const [isDeadlinePickerOpen, setIsDeadlinePickerOpen] = useState(false);
    const [deadlinePickerMonth, setDeadlinePickerMonth] = useState<Date>(() => {
        const a = parseYmdToNoonManila(todaysYmdManila());
        return new Date(a.getFullYear(), a.getMonth(), 1, 12, 0, 0, 0);
    });
    const [deadlinePickerYmd, setDeadlinePickerYmd] = useState(todaysYmdManila());
    const [deadlinePickerHour, setDeadlinePickerHour] = useState('12');
    const [deadlinePickerMinute, setDeadlinePickerMinute] = useState('00');
    const [deadlinePickerAmPm, setDeadlinePickerAmPm] = useState<'AM' | 'PM'>('PM');
    /** Scroll list for hour/minute; replaces fragile numeric text inputs on touch / mixed IME. */
    const [timeListOpen, setTimeListOpen] = useState<null | 'hour' | 'minute'>(null);
    const timeHourListRef = useRef<HTMLDivElement>(null);
    const timeMinuteListRef = useRef<HTMLDivElement>(null);
    const deadlinePickerRef = useRef<HTMLDivElement>(null);
    /** Avoid re-applying Monday defaults when refreshKey refetches lists mid-form. */
    const didApplyMondayDefaultsRef = useRef(false);

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

    /** Match deployment board: autofill name from Google Drive (API key) or best-effort URL. Only when project name is still empty. */
    const tryAutofillProjectNameFromDrive = useCallback(async (projectIndex: number, url: string) => {
        const cleanUrl = url.trim();
        if (!cleanUrl) return;
        let title: string | null = null;
        const fileId = extractGoogleDriveFileId(cleanUrl);
        if (fileId) {
            title = await fetchGoogleDriveFileTitle(fileId);
        }
        if (!title) {
            title = deriveTitleFromVideoUrl(cleanUrl);
        }
        const clean = title?.trim();
        if (!clean) return;
        setProjects(prev => {
            const p = prev[projectIndex];
            if (!p) return prev;
            if (p.projectName?.trim() !== '') return prev;
            if (p.rawVideoLink?.trim() !== cleanUrl) return prev;
            return prev.map((row, j) => (j === projectIndex ? { ...row, projectName: clean } : row));
        });
    }, []);

    const rawVideoNameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scheduleProjectNameFromDrive = useCallback(
        (rawUrl: string) => {
            if (rawVideoNameTimerRef.current) {
                clearTimeout(rawVideoNameTimerRef.current);
                rawVideoNameTimerRef.current = null;
            }
            const projectIndex = activeProjectIndex;
            const urlSnapshot = rawUrl.trim();
            if (!urlSnapshot) return;
            rawVideoNameTimerRef.current = setTimeout(() => {
                rawVideoNameTimerRef.current = null;
                void tryAutofillProjectNameFromDrive(projectIndex, urlSnapshot);
            }, 850);
        },
        [activeProjectIndex, tryAutofillProjectNameFromDrive]
    );

    useEffect(() => {
        return () => {
            if (rawVideoNameTimerRef.current) clearTimeout(rawVideoNameTimerRef.current);
        };
    }, []);

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
            const forceMondaySync = refreshKey > 0;
            const shouldApplyDefaults = !didApplyMondayDefaultsRef.current;
            try {
                const [boards, folders] = await Promise.all([getAllBoards(forceMondaySync), getAllFolders(forceMondaySync)]);
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
                        if (shouldApplyDefaults) updateCurrentProject({ projectStatus: val });
                    }
                    const typeCol = columns.find((c: any) => c.title.toLowerCase() === 'type' || c.title.toLowerCase() === 'project type');
                    if (typeCol?.settings_str) {
                        const labels = parseLabels(typeCol.settings_str);
                        if (labels.length > 0) {
                            setProjectTypes(labels);
                            if (shouldApplyDefaults) updateCurrentProject({ projectType: labels[0] });
                        }
                    }
                    const priorityCol = columns.find((c: any) => c.title.toLowerCase() === 'priority');
                    if (priorityCol?.settings_str) {
                        const labels = parseLabels(priorityCol.settings_str);
                        if (labels.length > 0) {
                            setProjectPriorities(labels);
                            if (shouldApplyDefaults) updateCurrentProject({ priority: labels[0] });
                        }
                    }
                    const clientCol = columns.find((c: any) => c.title.toLowerCase() === 'client');
                    const labelClients = clientCol?.settings_str ? parseLabels(clientCol.settings_str) : [];
                    const activeFolder = folders?.find((f: any) => f.name.toLowerCase().trim() === 'active clients');
                    const inactiveFolder = folders?.find((f: any) => f.name.toLowerCase().trim() === 'inactive clients');
                    const activeBoardIds = new Set((activeFolder?.children || []).map((c: any) => String(c.id)));
                    const inactiveBoardIds = new Set((inactiveFolder?.children || []).map((c: any) => String(c.id)));
                    const fromFolders = (boards || [])
                        .filter((b: any) => {
                            const n = b.name.toLowerCase();
                            const isFulfillment = n.includes('fulfillment board') || n.includes('fullfilment board');
                            const isSubitem =
                                b.type === 'sub_items_board' || n.startsWith('subitems') || n.includes('subitems');
                            const id = String(b.id);
                            return isFulfillment && !isSubitem && activeBoardIds.has(id) && !inactiveBoardIds.has(id);
                        })
                        .map((b: any) => cleanClientBoardName(b.name))
                        .filter((n: string) => n.length > 0);
                    const seen = new Set<string>();
                    const mergedClients: string[] = [];
                    const pushUnique = (s: string) => {
                        const t = s.trim();
                        if (!t) return;
                        const key = t.toLowerCase();
                        if (seen.has(key)) return;
                        seen.add(key);
                        mergedClients.push(t);
                    };
                    labelClients.forEach(pushUnique);
                    fromFolders.forEach(pushUnique);
                    mergedClients.sort((a, b) => a.localeCompare(b));
                    if (mergedClients.length > 0) setAvailableClients(mergedClients);
                    try {
                        const groups = await getBoardGroups(projectBoard.id);
                        if (groups) setVeBoardGroups(groups);
                    } catch { }
                    didApplyMondayDefaultsRef.current = true;
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
    }, [refreshKey]);

    /** Manual pick wins, then project deadline, then today (always a valid day). */
    const availabilityQueryDay = useMemo(() => {
        if (availabilityPickDate && /^\d{4}-\d{2}-\d{2}$/.test(availabilityPickDate)) return availabilityPickDate;
        const fromDeadline = deadlineToYyyyMmDd(activeProject.deadline);
        if (fromDeadline) return fromDeadline;
        return todaysYmdManila();
    }, [activeProject.deadline, availabilityPickDate]);

    const availabilityWeekStrip = useMemo(() => {
        const start = startOfWeekMondayLocal(parseYmdToNoonManila(availabilityQueryDay));
        return Array.from({ length: 7 }, (_, i) => {
            const d = addDaysLocal(start, i);
            return { ymd: ymdInManila(d), date: d };
        });
    }, [availabilityQueryDay]);

    const todayYmd = todaysYmdManila();

    const availabilityDayLabel = new Date(`${availabilityQueryDay}T12:00:00+08:00`).toLocaleDateString('en-PH', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Asia/Manila',
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
        const anchor = parseYmdToNoonManila(availabilityPickDate || availabilityQueryDay);
        setAvailabilityCalendarMonth(new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12, 0, 0, 0));
        setIsAvailabilityCalendarOpen(prev => !prev);
    };

    const openDeadlinePicker = () => {
        const parsed = parseManilaDeadlineForPicker(activeProject.deadline || '');
        setDeadlinePickerYmd(parsed.ymd);
        setDeadlinePickerHour(parsed.hour12);
        setDeadlinePickerMinute(parsed.minute);
        setDeadlinePickerAmPm(parsed.ampm);
        const d = parseYmdToNoonManila(parsed.ymd);
        setDeadlinePickerMonth(new Date(d.getFullYear(), d.getMonth(), 1, 12, 0, 0, 0));
        setTimeListOpen(null);
        setIsDeadlinePickerOpen(prev => !prev);
    };

    const applyDeadlinePicker = () => {
        const value = buildManilaDeadline(deadlinePickerYmd, deadlinePickerHour, deadlinePickerMinute, deadlinePickerAmPm);
        updateCurrentProject({ deadline: value });
        setTimeListOpen(null);
        setIsDeadlinePickerOpen(false);
    };

    useEffect(() => {
        if (!isDeadlinePickerOpen) setTimeListOpen(null);
    }, [isDeadlinePickerOpen]);

    useLayoutEffect(() => {
        if (timeListOpen === 'hour' && timeHourListRef.current) {
            const el = timeHourListRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
            el?.scrollIntoView({ block: 'center' });
        }
    }, [timeListOpen, deadlinePickerHour, isDeadlinePickerOpen]);

    useLayoutEffect(() => {
        if (timeListOpen === 'minute' && timeMinuteListRef.current) {
            const el = timeMinuteListRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
            el?.scrollIntoView({ block: 'center' });
        }
    }, [timeListOpen, deadlinePickerMinute, isDeadlinePickerOpen]);

    useEffect(() => {
        if (!isAvailabilityCalendarOpen) return;
        const onClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!availabilityCalendarRef.current?.contains(target)) {
                setIsAvailabilityCalendarOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [isAvailabilityCalendarOpen]);

    useEffect(() => {
        if (!isDeadlinePickerOpen) return;
        const onClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!deadlinePickerRef.current?.contains(target)) {
                setIsDeadlinePickerOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [isDeadlinePickerOpen]);

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
                        deadline: project.deadline ? formatDeadlineInManila(project.deadline) : undefined,
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
                                    const deadlineStr = project.deadline ? ` | Deadline: ${formatDeadlineInManila(project.deadline, false)}` : '';
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
                <div className="flex flex-col xl:flex-row native:flex-col native:items-stretch xl:items-start gap-6 xl:gap-10">
                    <div className="flex-1 min-w-0 w-full xl:max-w-none">

                {/* ── Step indicator (scrollable on narrow screens) ── */}
                <div className="w-full overflow-x-auto pb-2 mb-6 lg:mb-10 -mx-0.5 px-0.5">
                    <div className="flex items-center justify-start sm:justify-center gap-0 min-w-min">
                    {STEPS.map((s, i) => {
                        const n = i + 1;
                        const done = step > n;
                        const active = step === n;
                        return (
                            <div key={n} className="flex items-center flex-shrink-0">
                                <div className="flex flex-col items-center gap-1 sm:gap-1.5">
                                    <div
                                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                            done ? 'bg-emerald-500 text-white' :
                                            active ? 'bg-violet-500 text-white ring-2 sm:ring-4 ring-violet-500/20' :
                                            'bg-white/[0.04] border border-white/[0.08] text-white/25'
                                        }`}
                                    >
                                        {done ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : s.icon}
                                    </div>
                                    <span className={`text-[9px] sm:text-[10px] font-bold tracking-wide sm:tracking-widest uppercase transition-colors whitespace-nowrap ${active ? 'text-violet-400' : done ? 'text-emerald-400' : 'text-white/20'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`w-6 sm:w-10 md:w-14 lg:w-16 h-[1px] mx-1.5 sm:mx-2 lg:mx-3 mb-4 sm:mb-5 rounded-full transition-all duration-300 flex-shrink-0 ${step > n ? 'bg-emerald-500/60' : 'bg-white/[0.06]'}`} />
                                )}
                            </div>
                        );
                    })}
                    </div>
                </div>

                {/* ── Mode toggle ── */}
                <div className="flex justify-center mb-5 sm:mb-6">
                    <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-xl p-0.5 max-w-[calc(100vw-1.5rem)]">
                        {['Single Project', 'Bulk Assignment'].map((label, i) => (
                            <button
                                key={label}
                                onClick={() => { if (i === 0) { setIsBulkMode(false); setActiveProjectIndex(0); setProjects([projects[0]]); } else setIsBulkMode(true); }}
                                className={`px-3 py-1.5 sm:px-5 sm:py-2 rounded-[10px] text-[11px] sm:text-xs font-bold transition-all duration-150 whitespace-nowrap ${
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
                <div className="bg-white/[0.018] border border-white/[0.06] rounded-2xl overflow-visible">
                    <AnimatePresence mode="wait">

                        {/* Step 1 — Project Details */}
                        {step === 1 && (
                            <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
                                className="p-4 sm:p-6 lg:p-7 space-y-4 sm:space-y-5 lg:space-y-6">
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
                                    <div className="space-y-2 relative" ref={deadlinePickerRef}>
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-white/30">Deadline</label>
                                        <button
                                            type="button"
                                            onClick={openDeadlinePicker}
                                            className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm text-left text-white hover:border-violet-500/50 transition-colors flex items-center justify-between"
                                        >
                                            <span className={activeProject.deadline ? 'text-white' : 'text-white/25'}>
                                                {activeProject.deadline
                                                    ? formatDeadlineInManila(activeProject.deadline, true)
                                                    : 'mm/dd/yyyy --:-- -- (PH)'}
                                            </span>
                                            <Calendar className="w-4 h-4 text-white/55" />
                                        </button>

                                        {isDeadlinePickerOpen && (
                                            <div className="absolute z-[90] mt-2 w-[20rem] max-w-[calc(100vw-2rem)] rounded-xl border border-white/[0.12] bg-[#121425] p-2.5 space-y-2 shadow-2xl">
                                                <div
                                                    className="flex items-center justify-between gap-2"
                                                    onMouseDown={() => setTimeListOpen(null)}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const p = manilaPickerPartsFromDate(new Date());
                                                            setDeadlinePickerYmd(p.ymd);
                                                            setDeadlinePickerHour(p.hour12);
                                                            setDeadlinePickerMinute(p.minute);
                                                            setDeadlinePickerAmPm(p.ampm);
                                                            const a = parseYmdToNoonManila(p.ymd);
                                                            setDeadlinePickerMonth(new Date(a.getFullYear(), a.getMonth(), 1, 12, 0, 0, 0));
                                                            setTimeListOpen(null);
                                                        }}
                                                        className="px-2 py-1 rounded-md border border-white/[0.14] bg-white/[0.03] text-[10px] font-bold text-white/75 hover:text-white hover:bg-white/[0.07] transition-colors"
                                                    >
                                                        Today
                                                    </button>
                                                    <div className="text-[10px] text-white/40 font-semibold">
                                                        {deadlinePickerYmd}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-1.5">
                                                    <div
                                                        className="flex items-center gap-1 min-w-0"
                                                        onMouseDown={() => setTimeListOpen(null)}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeadlinePickerMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1, 12, 0, 0, 0))}
                                                            className="h-6 w-6 rounded-md border border-white/[0.12] bg-white/[0.02] text-white/70 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                                                        >
                                                            <ChevronLeft className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeadlinePickerMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1, 12, 0, 0, 0))}
                                                            className="h-6 w-6 rounded-md border border-white/[0.12] bg-white/[0.02] text-white/70 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                                                        >
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </button>
                                                        <div className="text-[11px] font-bold text-white/85 tracking-wide ml-1.5 leading-tight">
                                                            {deadlinePickerMonth.toLocaleDateString('en-PH', {
                                                                month: 'long',
                                                                year: 'numeric',
                                                                timeZone: 'Asia/Manila',
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className="relative h-7 rounded-md border border-white/[0.12] bg-white/[0.03]">
                                                        <button
                                                            type="button"
                                                            onClick={() => setTimeListOpen(t => (t === 'hour' ? null : 'hour'))}
                                                            className="h-7 w-full min-w-[3rem] pl-1.5 pr-1 flex items-center justify-center gap-0.5 text-[11px] font-semibold text-white outline-none rounded-md hover:bg-white/[0.05] focus-visible:ring-1 focus-visible:ring-violet-500/60"
                                                            aria-haspopup="listbox"
                                                            aria-expanded={timeListOpen === 'hour'}
                                                            aria-label="Hour"
                                                        >
                                                            <span className="tabular-nums">{deadlinePickerHour}</span>
                                                            <ChevronDown className="w-3 h-3 text-white/45 shrink-0 pointer-events-none" />
                                                        </button>
                                                        {timeListOpen === 'hour' && (
                                                            <div
                                                                ref={timeHourListRef}
                                                                role="listbox"
                                                                className="absolute left-0 top-full z-[100] mt-0.5 w-full min-w-[3.25rem] max-h-36 overflow-y-auto overscroll-y-contain rounded-md border border-violet-500/30 bg-[#0d1020] py-0.5 shadow-lg"
                                                            >
                                                                {DEADLINE_PICKER_HOUR_VALUES.map(h => (
                                                                    <button
                                                                        key={h}
                                                                        type="button"
                                                                        role="option"
                                                                        data-active={deadlinePickerHour === h ? 'true' : undefined}
                                                                        aria-selected={deadlinePickerHour === h}
                                                                        onClick={() => { setDeadlinePickerHour(h); setTimeListOpen(null); }}
                                                                        className={`w-full py-1 text-center text-[11px] font-semibold tabular-nums transition-colors ${
                                                                            deadlinePickerHour === h
                                                                                ? 'bg-violet-500/30 text-white'
                                                                                : 'text-white/75 hover:bg-white/[0.08] hover:text-white'
                                                                        }`}
                                                                    >
                                                                        {h}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="relative h-7 rounded-md border border-white/[0.12] bg-white/[0.03]">
                                                        <button
                                                            type="button"
                                                            onClick={() => setTimeListOpen(t => (t === 'minute' ? null : 'minute'))}
                                                            className="h-7 w-full min-w-[3rem] pl-1.5 pr-1 flex items-center justify-center gap-0.5 text-[11px] font-semibold text-white outline-none rounded-md hover:bg-white/[0.05] focus-visible:ring-1 focus-visible:ring-violet-500/60"
                                                            aria-haspopup="listbox"
                                                            aria-expanded={timeListOpen === 'minute'}
                                                            aria-label="Minute"
                                                        >
                                                            <span className="tabular-nums">{deadlinePickerMinute}</span>
                                                            <ChevronDown className="w-3 h-3 text-white/45 shrink-0 pointer-events-none" />
                                                        </button>
                                                        {timeListOpen === 'minute' && (
                                                            <div
                                                                ref={timeMinuteListRef}
                                                                role="listbox"
                                                                className="absolute left-0 right-0 top-full z-[100] mt-0.5 w-full min-w-[3.25rem] max-h-36 overflow-y-auto overscroll-y-contain rounded-md border border-violet-500/30 bg-[#0d1020] py-0.5 shadow-lg"
                                                            >
                                                                {DEADLINE_PICKER_MINUTE_VALUES.map(m => (
                                                                    <button
                                                                        key={m}
                                                                        type="button"
                                                                        role="option"
                                                                        data-active={deadlinePickerMinute === m ? 'true' : undefined}
                                                                        aria-selected={deadlinePickerMinute === m}
                                                                        onClick={() => { setDeadlinePickerMinute(m); setTimeListOpen(null); }}
                                                                        className={`w-full py-1 text-center text-[11px] font-semibold tabular-nums transition-colors ${
                                                                            deadlinePickerMinute === m
                                                                                ? 'bg-violet-500/30 text-white'
                                                                                : 'text-white/75 hover:bg-white/[0.08] hover:text-white'
                                                                        }`}
                                                                    >
                                                                        {m}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setTimeListOpen(null);
                                                            setDeadlinePickerAmPm(prev => (prev === 'AM' ? 'PM' : 'AM'));
                                                        }}
                                                        className="h-7 min-w-[2.75rem] rounded-md border border-white/[0.12] bg-white/[0.03] text-white text-[11px] font-semibold hover:bg-white/[0.08] transition-colors"
                                                    >
                                                        {deadlinePickerAmPm}
                                                    </button>
                                                </div>

                                                <div
                                                    className="grid grid-cols-7 gap-1"
                                                    onMouseDown={() => setTimeListOpen(null)}
                                                >
                                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                                        <div key={d} className="h-5 flex items-center justify-center text-[10px] font-bold text-white/35">{d}</div>
                                                    ))}
                                                    {(() => {
                                                        const first = new Date(deadlinePickerMonth.getFullYear(), deadlinePickerMonth.getMonth(), 1, 12, 0, 0, 0);
                                                        const startIdx = first.getDay();
                                                        const gridStart = addDaysLocal(first, -startIdx);
                                                        return Array.from({ length: 42 }, (_, idx) => {
                                                            const d = addDaysLocal(gridStart, idx);
                                                            const ymd = ymdInManila(d);
                                                            const inMonth = d.getMonth() === deadlinePickerMonth.getMonth();
                                                            const isSelected = ymd === deadlinePickerYmd;
                                                            return (
                                                                <button
                                                                    key={ymd}
                                                                    type="button"
                                                                    onClick={() => setDeadlinePickerYmd(ymd)}
                                                                    className={`h-7 rounded-md text-[11px] font-semibold border transition-colors ${
                                                                        isSelected
                                                                            ? 'border-violet-400/70 bg-violet-500/25 text-white'
                                                                            : inMonth
                                                                                ? 'border-white/[0.08] bg-white/[0.02] text-white/65 hover:bg-white/[0.08] hover:text-white'
                                                                                : 'border-transparent text-white/20 hover:text-white/40'
                                                                    }`}
                                                                >
                                                                    {d.getDate()}
                                                                </button>
                                                            );
                                                        });
                                                    })()}
                                                </div>

                                                <div className="flex justify-end gap-1.5 pt-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsDeadlinePickerOpen(false)}
                                                        className="px-2.5 py-1.5 rounded-md text-[11px] border border-white/[0.12] text-white/70 hover:text-white hover:bg-white/[0.06]"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={applyDeadlinePicker}
                                                        className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-violet-600 hover:bg-violet-500 text-white"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Field label="Raw Video Link">
                                    <div className="relative">
                                        <Link className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                        <input
                                            type="url"
                                            value={activeProject.rawVideoLink}
                                            onChange={e => {
                                                const v = e.target.value;
                                                updateCurrentProject({ rawVideoLink: v });
                                                scheduleProjectNameFromDrive(v);
                                            }}
                                            onBlur={e => {
                                                if (rawVideoNameTimerRef.current) {
                                                    clearTimeout(rawVideoNameTimerRef.current);
                                                    rawVideoNameTimerRef.current = null;
                                                }
                                                void tryAutofillProjectNameFromDrive(activeProjectIndex, e.target.value);
                                            }}
                                            placeholder="https://drive.google.com/..."
                                            className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
                                        />
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
                                className="p-4 sm:p-6 lg:p-7 space-y-4 sm:space-y-5 lg:space-y-6">
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
                                            className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl pl-9 pr-4 py-2 sm:py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono" />
                                    </div>
                                </Field>
                            </motion.div>
                        )}

                        {/* Step 3 — Team */}
                        {step === 3 && (
                            <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
                                className="p-4 sm:p-6 lg:p-7 space-y-4 sm:space-y-4 lg:space-y-5">
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
                                    <div className="rounded-2xl border border-white/[0.07] bg-cyan-500/[0.04] p-3 sm:p-4 space-y-2">
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
                                                        className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold border transition-colors ${
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
                                className="p-4 sm:p-6 lg:p-7 space-y-4 sm:space-y-4 lg:space-y-5">
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
                        className="w-full xl:w-[28rem] flex-shrink-0 space-y-4 xl:sticky xl:top-6 xl:self-start pb-8 xl:pb-0"
                    >
                        <DeploymentBoardPanel variant="sidebar" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-0.5 hidden xl:block">Live from Monday</p>
                        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 sm:p-4 space-y-2 sm:space-y-3">
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

                            {isAvailabilityCalendarOpen && (
                                <div ref={availabilityCalendarRef} className="rounded-2xl border border-white/[0.12] bg-[#121425] p-3 space-y-3 shadow-2xl">
                                    <div className="flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAvailabilityPickDate(todayYmd)}
                                            className="px-2.5 py-1 rounded-lg border border-white/[0.14] bg-white/[0.03] text-[10px] font-bold text-white/75 hover:text-white hover:bg-white/[0.07] transition-colors"
                                        >
                                            Today
                                        </button>
                                        <div className="text-[10px] text-white/40 font-semibold">{availabilityDayLabel}</div>
                                    </div>

                                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setAvailabilityCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1, 12, 0, 0, 0))}
                                                className="h-7 w-7 rounded-lg border border-white/[0.12] bg-white/[0.02] text-white/70 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                                                aria-label="Previous month"
                                            >
                                                <ChevronLeft className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAvailabilityCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1, 12, 0, 0, 0))}
                                                className="h-7 w-7 rounded-lg border border-white/[0.12] bg-white/[0.02] text-white/70 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                                                aria-label="Next month"
                                            >
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="justify-self-center text-xs font-bold text-white/85 tracking-wide">
                                            {availabilityCalendarMonth.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                        </div>
                                        <div className="justify-self-end">
                                            <span className="inline-flex items-center gap-1 text-[10px] text-white/40">
                                                Pick day <ChevronDown className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1">
                                        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                                            <div key={d} className="h-6 flex items-center justify-center text-[10px] font-bold text-white/35">{d}</div>
                                        ))}
                                        {(() => {
                                            const monthStart = new Date(
                                                availabilityCalendarMonth.getFullYear(),
                                                availabilityCalendarMonth.getMonth(),
                                                1,
                                                12,
                                                0,
                                                0,
                                                0
                                            );
                                            const dow = monthStart.getDay();
                                            const mondayIndex = dow === 0 ? 6 : dow - 1;
                                            const gridStart = addDaysLocal(monthStart, -mondayIndex);
                                            return Array.from({ length: 42 }, (_, idx) => {
                                                const d = addDaysLocal(gridStart, idx);
                                                const ymd = ymdInManila(d);
                                                const inMonth = d.getMonth() === availabilityCalendarMonth.getMonth();
                                                const isSelected = ymd === availabilityQueryDay;
                                                const isToday = ymd === todayYmd;
                                                return (
                                                    <button
                                                        key={ymd}
                                                        type="button"
                                                        onClick={() => {
                                                            setAvailabilityPickDate(ymd);
                                                            setIsAvailabilityCalendarOpen(false);
                                                        }}
                                                        className={`h-8 rounded-lg text-[11px] font-semibold border transition-colors ${
                                                            isSelected
                                                                ? 'border-cyan-400/70 bg-cyan-500/25 text-white'
                                                                : isToday
                                                                  ? 'border-white/30 bg-white/[0.08] text-white/90'
                                                                  : inMonth
                                                                    ? 'border-white/[0.08] bg-white/[0.02] text-white/65 hover:bg-white/[0.08] hover:text-white'
                                                                    : 'border-transparent text-white/20 hover:text-white/40'
                                                        }`}
                                                    >
                                                        {d.getDate()}
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}

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
                                                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold border border-cyan-500/25 bg-cyan-500/10 text-cyan-200/90 hover:bg-cyan-500/20 transition-colors"
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
                options={projectStatuses} selected={activeProject.projectStatus} onSelect={val => updateCurrentProject({ projectStatus: val })} icon={ListChecks} />
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
