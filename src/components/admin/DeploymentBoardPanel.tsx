import { useState, useEffect, useCallback, useRef } from 'react';
import { usePortalTheme } from '../../contexts/PortalThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { fireCvSwal } from '../../lib/swalTheme';
import {
    deploymentBoardService,
    DeploymentBoardMain,
    DeploymentBoardVideo,
    DeploymentMainStatus,
    DeploymentVideoStatus,
} from '../../services/deploymentBoardService';
import {
    deriveTitleFromVideoUrl,
    extractGoogleDriveFileId,
    fetchGoogleDriveFileTitle,
} from '../../services/googleDriveLinkService';
import { LinkifiedInstructionBody, stripHtmlToPlainText } from '../../lib/instructionLinkify';
import {
    Plus,
    Trash2,
    ExternalLink,
    Loader2,
    ChevronDown,
    Pencil,
    Link2,
    FolderOpen,
    Clapperboard,
    RefreshCw,
    Rocket,
    Copy,
    X,
} from 'lucide-react';

const MAIN_STATUSES: DeploymentMainStatus[] = ['Working on it', 'Deployed'];
const VIDEO_STATUSES: DeploymentVideoStatus[] = ['Ready for Deployment', 'Deployed'];

function InstructionsBlock({ text, sidebar }: { text: string; sidebar: boolean }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [copyHint, setCopyHint] = useState<null | 'success' | 'error'>(null);
    const hintClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!copyHint) return;
        if (hintClearRef.current) clearTimeout(hintClearRef.current);
        hintClearRef.current = setTimeout(() => {
            setCopyHint(null);
            hintClearRef.current = null;
        }, 2000);
        return () => {
            if (hintClearRef.current) clearTimeout(hintClearRef.current);
        };
    }, [copyHint]);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(stripHtmlToPlainText(text));
            setCopyHint('success');
        } catch {
            setCopyHint('error');
        }
    };

    return (
        <>
            <div
                className={`rounded-xl border border-white/[0.08] bg-black/25 flex items-center justify-between gap-2 ${
                    sidebar ? 'mt-0.5 px-2 py-1.5' : 'mt-1 px-3 py-2'
                }`}
            >
                <span
                    className={`font-bold uppercase tracking-wider text-white/40 ${
                        sidebar ? 'text-[9px]' : 'text-[10px]'
                    }`}
                >
                    Instructions
                </span>
                <div className="flex items-center justify-end gap-1.5 flex-shrink-0 min-w-0">
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className={`rounded-lg border border-violet-500/35 bg-violet-500/10 font-semibold text-violet-200 hover:bg-violet-500/20 transition-colors ${
                            sidebar ? 'px-2 py-1 text-[9px]' : 'px-2.5 py-1.5 text-[10px]'
                        }`}
                    >
                        Open
                    </button>
                    <AnimatePresence mode="wait">
                        {copyHint === 'success' && (
                            <motion.span
                                key="ok"
                                role="status"
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 4 }}
                                transition={{ duration: 0.15 }}
                                className={`whitespace-nowrap rounded-md border border-emerald-500/35 bg-emerald-500/15 text-emerald-200/95 font-semibold ${
                                    sidebar ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[10px]'
                                }`}
                            >
                                Copied
                            </motion.span>
                        )}
                        {copyHint === 'error' && (
                            <motion.span
                                key="err"
                                role="status"
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 4 }}
                                transition={{ duration: 0.15 }}
                                className={`whitespace-nowrap rounded-md border border-red-500/35 bg-red-500/10 text-red-200/95 font-semibold ${
                                    sidebar ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[10px]'
                                }`}
                            >
                                Copy failed
                            </motion.span>
                        )}
                    </AnimatePresence>
                    <button
                        type="button"
                        onClick={() => copy()}
                        title="Copy instructions to clipboard"
                        className="p-1.5 rounded-lg text-white/45 hover:text-violet-300 hover:bg-white/[0.06] transition-colors flex-shrink-0"
                    >
                        <Copy className={sidebar ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70"
                        onClick={() => setModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.96, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-lg max-h-[min(85vh,40rem)] flex flex-col rounded-2xl border border-white/[0.1] bg-[#0c0c10] shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.08] flex-shrink-0">
                                <h4 className="text-sm font-bold text-white">Instructions</h4>
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                                    title="Close"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <LinkifiedInstructionBody
                                text={text}
                                className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-3 text-white/85 whitespace-pre-wrap break-words [overflow-wrap:anywhere] select-text ${
                                    sidebar ? 'text-[11px] leading-relaxed' : 'text-sm leading-relaxed'
                                }`}
                            />
                            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/[0.08] flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => copy()}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.12] text-white/80 text-xs font-semibold hover:bg-white/[0.06] transition-colors"
                                >
                                    <Copy className="w-3.5 h-3.5" /> Copy
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-3 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function videoFieldLabel(sidebar: boolean, text: string) {
    return (
        <span
            className={`flex-shrink-0 font-bold uppercase tracking-wider text-white/40 ${
                sidebar ? 'w-[3.75rem] text-[8px]' : 'w-[4.5rem] text-[9px]'
            }`}
        >
            {text}
        </span>
    );
}

function statusPillClass(isDark: boolean, kind: 'main' | 'video', value: string) {
    if (kind === 'main') {
        if (value === 'Deployed') return isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35' : 'bg-emerald-100 text-emerald-800 border-emerald-200';
        return isDark ? 'bg-amber-500/20 text-amber-200 border-amber-500/35' : 'bg-amber-50 text-amber-900 border-amber-200';
    }
    if (value === 'Deployed') return isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35' : 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return isDark ? 'bg-rose-500/15 text-rose-200 border-rose-500/30' : 'bg-rose-50 text-rose-900 border-rose-200';
}

export type DeploymentBoardPanelVariant = 'full' | 'sidebar';

export function DeploymentBoardPanel({ variant }: { variant: DeploymentBoardPanelVariant }) {
    const { isDark } = usePortalTheme();
    const sidebar = variant === 'sidebar';

    const [mains, setMains] = useState<DeploymentBoardMain[]>([]);
    const [videosByMain, setVideosByMain] = useState<Record<string, DeploymentBoardVideo[]>>({});
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    /** Per-video: show Link + Due fields */
    const [videoRowExpanded, setVideoRowExpanded] = useState<Record<string, boolean>>({});
    const videosByMainRef = useRef(videosByMain);
    const driveAutofillTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    /** Per batch: expanded video queues (default collapsed when the section has rows). */
    const [readyVideosFoldOpen, setReadyVideosFoldOpen] = useState<Record<string, boolean>>({});
    const [deployedVideosFoldOpen, setDeployedVideosFoldOpen] = useState<Record<string, boolean>>({});

    const [mainModal, setMainModal] = useState<DeploymentBoardMain | 'new' | null>(null);
    const [mainForm, setMainForm] = useState({
        title: '',
        instructions: '',
        drive_folder_link: '',
        status: 'Working on it' as DeploymentMainStatus,
    });

    const fireErrorSwal = useCallback(async (title: string, text: string) => {
        await fireCvSwal({
            icon: 'error',
            title,
            text,
            confirmButtonText: 'OK',
        });
    }, []);

    /** Fill empty `name` from Drive metadata or URL after load so reloads show a title. */
    const hydrateMissingVideoTitles = useCallback(async (byMain: Record<string, DeploymentBoardVideo[]>) => {
        for (const [mainId, rows] of Object.entries(byMain)) {
            for (const vid of rows) {
                if (String(vid.name ?? '').trim()) continue;
                const link = String(vid.video_link ?? '').trim();
                if (!link) continue;
                let title: string | null = null;
                const fileId = extractGoogleDriveFileId(link);
                if (fileId) {
                    title = await fetchGoogleDriveFileTitle(fileId);
                }
                if (!title) {
                    title = deriveTitleFromVideoUrl(link);
                }
                const clean = title?.trim();
                if (!clean) continue;
                try {
                    const updated = await deploymentBoardService.updateVideo(vid.id, { name: clean });
                    setVideosByMain(prev => ({
                        ...prev,
                        [mainId]: (prev[mainId] || []).map(x => (x.id === vid.id ? { ...x, ...updated } : x)),
                    }));
                } catch (e) {
                    console.error('[Deployment] hydrate video title', e);
                }
            }
        }
    }, []);

    const loadAll = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const list = await deploymentBoardService.listMains();
            setMains(list);
            const v: Record<string, DeploymentBoardVideo[]> = {};
            await Promise.all(
                list.map(async m => {
                    v[m.id] = await deploymentBoardService.listVideos(m.id);
                })
            );
            setVideosByMain(v);
            setExpanded(prev => {
                const next = { ...prev };
                for (const m of list) {
                    if (next[m.id] === undefined) next[m.id] = false;
                }
                return next;
            });
            void hydrateMissingVideoTitles(v);
        } catch (e) {
            console.error(e);
            const msg = e instanceof Error ? e.message : 'Unknown error';
            setMains([]);
            setVideosByMain({});
            setLoadError(msg);
        } finally {
            setLoading(false);
        }
    }, [hydrateMissingVideoTitles]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    useEffect(() => {
        videosByMainRef.current = videosByMain;
    }, [videosByMain]);

    const openNewMain = () => {
        setMainForm({
            title: '',
            instructions: '',
            drive_folder_link: '',
            status: 'Working on it',
        });
        setMainModal('new');
    };

    const openEditMain = (m: DeploymentBoardMain) => {
        setMainForm({
            title: m.title,
            instructions: m.instructions || '',
            drive_folder_link: m.drive_folder_link || '',
            status: m.status,
        });
        setMainModal(m);
    };

    const saveMain = async () => {
        setSaving(true);
        try {
            if (mainModal === 'new') {
                await deploymentBoardService.createMain(mainForm);
            } else if (mainModal && mainModal !== 'new') {
                await deploymentBoardService.updateMain(mainModal.id, mainForm);
            }
            setMainModal(null);
            await loadAll();
        } catch (e) {
            console.error(e);
            await fireErrorSwal('Save failed', 'Could not save this batch. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const deleteMain = async (id: string) => {
        const confirm = await fireCvSwal({
            icon: 'warning',
            iconColor: '#fb923c',
            iconHtml: '<span class="cv-swal-trash-can">🗑️</span>',
            title: 'Delete batch?',
            text: 'Delete this batch and all its videos?',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626',
            customClass: {
                confirmButton:
                    '!rounded-xl !px-5 !py-2.5 !font-semibold !text-white !bg-red-600 hover:!bg-red-500 focus:!outline-none',
            },
        });
        if (!confirm.isConfirmed) return;
        try {
            await deploymentBoardService.deleteMain(id);
            await loadAll();
        } catch (e) {
            console.error(e);
            await fireErrorSwal('Delete failed', 'Could not delete this batch. Please try again.');
        }
    };

    const addVideo = async (mainId: string) => {
        try {
            const current = videosByMainRef.current[mainId] || [];
            const nextOrder = current.length > 0 ? Math.max(...current.map(v => v.sort_order)) + 1 : 0;
            const newVideo = await deploymentBoardService.createVideo(mainId, { sort_order: nextOrder });
            // Append only — do not re-fetch the full list (that was clearing other rows' in-memory names).
            setVideosByMain(prev => ({
                ...prev,
                [mainId]: [...(prev[mainId] || []), newVideo],
            }));
        } catch (e) {
            console.error(e);
            const msg = e instanceof Error ? e.message : String(e);
            await fireErrorSwal(
                'Could not add video row',
                `${msg}\n\nIf your database was created before video "name" existed, run alter_deployment_board_videos_name_deadline.sql in Supabase (repo root).`
            );
        }
    };

    const updateVideoField = async (mainId: string, vid: DeploymentBoardVideo, patch: Partial<DeploymentBoardVideo>) => {
        try {
            await flushVideoPersist(vid.id);
            const updated = await deploymentBoardService.updateVideo(vid.id, patch);
            setVideosByMain(prev => ({
                ...prev,
                [mainId]: (prev[mainId] || []).map(x => (x.id === vid.id ? { ...x, ...updated } : x)),
            }));
        } catch (e) {
            console.error(e);
        }
    };

    const patchVideoLocal = (
        mainId: string,
        videoId: string,
        patch: Partial<Pick<DeploymentBoardVideo, 'name' | 'video_link' | 'deadline'>>
    ) => {
        setVideosByMain(prev => ({
            ...prev,
            [mainId]: (prev[mainId] || []).map(x => (x.id === videoId ? { ...x, ...patch } : x)),
        }));
    };

    const videoPersistQueueRef = useRef<Record<string, Partial<Pick<DeploymentBoardVideo, 'name' | 'video_link' | 'deadline'>>>>({});
    const videoPersistTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    /** Short enough to feel instant; flushes on tab hide / unload still catch quick refreshes. */
    const VIDEO_AUTOSAVE_MS = 280;

    const flushAllPendingVideoPersists = useCallback(async () => {
        const ids = new Set([
            ...Object.keys(videoPersistTimerRef.current),
            ...Object.keys(videoPersistQueueRef.current),
        ]);
        await Promise.all(
            [...ids].map(async videoId => {
                if (videoPersistTimerRef.current[videoId]) {
                    clearTimeout(videoPersistTimerRef.current[videoId]);
                    delete videoPersistTimerRef.current[videoId];
                }
                const queued = videoPersistQueueRef.current[videoId];
                delete videoPersistQueueRef.current[videoId];
                if (!queued || !Object.keys(queued).length) return;
                const merged: Partial<DeploymentBoardVideo> = { ...queued };
                if (merged.name !== undefined) merged.name = String(merged.name).trim();
                try {
                    await deploymentBoardService.updateVideo(videoId, merged);
                } catch (err) {
                    console.error('[Deployment] flush pending video fields', err);
                }
            })
        );
    }, []);

    const queueVideoPersist = useCallback(
        (videoId: string, patch: Partial<Pick<DeploymentBoardVideo, 'name' | 'video_link' | 'deadline'>>) => {
            const prevQ = videoPersistQueueRef.current[videoId] || {};
            videoPersistQueueRef.current[videoId] = { ...prevQ, ...patch };
            if (videoPersistTimerRef.current[videoId]) clearTimeout(videoPersistTimerRef.current[videoId]);
            videoPersistTimerRef.current[videoId] = setTimeout(() => {
                const merged = videoPersistQueueRef.current[videoId];
                delete videoPersistQueueRef.current[videoId];
                delete videoPersistTimerRef.current[videoId];
                if (!merged || !Object.keys(merged).length) return;
                const payload: Partial<DeploymentBoardVideo> = { ...merged };
                if (payload.name !== undefined) payload.name = String(payload.name).trim();
                deploymentBoardService
                    .updateVideo(videoId, payload)
                    .then(updated => {
                        setVideosByMain(prev => {
                            const mainId = Object.keys(prev).find(mid => (prev[mid] || []).some(r => r.id === videoId));
                            if (!mainId) return prev;
                            return {
                                ...prev,
                                [mainId]: (prev[mainId] || []).map(r => (r.id === videoId ? { ...r, ...updated } : r)),
                            };
                        });
                    })
                    .catch(err => console.error('[Deployment] video autosave', err));
            }, VIDEO_AUTOSAVE_MS);
        },
        []
    );

    const flushVideoPersist = useCallback(
        async (videoId: string, finalPatch?: Partial<Pick<DeploymentBoardVideo, 'name' | 'video_link' | 'deadline'>>) => {
            if (videoPersistTimerRef.current[videoId]) {
                clearTimeout(videoPersistTimerRef.current[videoId]);
                delete videoPersistTimerRef.current[videoId];
            }
            const queued = videoPersistQueueRef.current[videoId] || {};
            delete videoPersistQueueRef.current[videoId];
            const merged: Partial<DeploymentBoardVideo> = { ...queued, ...finalPatch };
            if (!Object.keys(merged).length) return;
            if (merged.name !== undefined) merged.name = String(merged.name).trim();
            try {
                const updated = await deploymentBoardService.updateVideo(videoId, merged);
                setVideosByMain(prev => {
                    const mainId = Object.keys(prev).find(mid => (prev[mid] || []).some(r => r.id === videoId));
                    if (!mainId) return prev;
                    return {
                        ...prev,
                        [mainId]: (prev[mainId] || []).map(r => (r.id === videoId ? { ...r, ...updated } : r)),
                    };
                });
            } catch (err) {
                console.error('[Deployment] video save', err);
            }
        },
        []
    );

    const maybeAutofillVideoNameFromDrive = useCallback(async (mainId: string, videoId: string, driveUrl: string) => {
        const row = videosByMainRef.current[mainId]?.find(x => x.id === videoId);
        if ((row?.name ?? '').trim() !== '') return;
        const fileId = extractGoogleDriveFileId(driveUrl);
        if (!fileId) return;
        const title = await fetchGoogleDriveFileTitle(fileId);
        const clean = title?.trim();
        if (!clean) return;
        setVideosByMain(prev => {
            const r = prev[mainId]?.find(x => x.id === videoId);
            if ((r?.name ?? '').trim() !== '') return prev;
            return {
                ...prev,
                [mainId]: (prev[mainId] || []).map(x => (x.id === videoId ? { ...x, name: clean } : x)),
            };
        });
        try {
            await deploymentBoardService.updateVideo(videoId, { name: clean });
        } catch (e) {
            console.error('[Deployment] Drive name autofill save failed', e);
        }
    }, []);

    const scheduleDriveNameAutofill = useCallback(
        (mainId: string, videoId: string, url: string) => {
            if (!extractGoogleDriveFileId(url)) return;
            const row = videosByMainRef.current[mainId]?.find(x => x.id === videoId);
            if ((row?.name ?? '').trim() !== '') return;
            if (driveAutofillTimerRef.current[videoId]) clearTimeout(driveAutofillTimerRef.current[videoId]);
            driveAutofillTimerRef.current[videoId] = setTimeout(() => {
                delete driveAutofillTimerRef.current[videoId];
                void maybeAutofillVideoNameFromDrive(mainId, videoId, url);
            }, 850);
        },
        [maybeAutofillVideoNameFromDrive]
    );

    useEffect(() => {
        const flush = () => {
            void flushAllPendingVideoPersists();
        };
        const onVisibility = () => {
            if (document.visibilityState === 'hidden') flush();
        };
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('pagehide', flush);
        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('pagehide', flush);
        };
    }, [flushAllPendingVideoPersists]);

    useEffect(() => {
        return () => {
            Object.keys(driveAutofillTimerRef.current).forEach(id => clearTimeout(driveAutofillTimerRef.current[id]));
            driveAutofillTimerRef.current = {};
            void flushAllPendingVideoPersists();
        };
    }, [flushAllPendingVideoPersists]);

    const deleteVideo = async (mainId: string, vid: string) => {
        const confirm = await fireCvSwal({
            icon: 'warning',
            iconColor: '#fb923c',
            iconHtml: '<span class="cv-swal-trash-can">🗑️</span>',
            title: 'Remove video row?',
            text: 'This will delete the selected video row.',
            showCancelButton: true,
            confirmButtonText: 'Remove',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626',
            customClass: {
                confirmButton:
                    '!rounded-xl !px-5 !py-2.5 !font-semibold !text-white !bg-red-600 hover:!bg-red-500 focus:!outline-none',
            },
        });
        if (!confirm.isConfirmed) return;
        if (driveAutofillTimerRef.current[vid]) {
            clearTimeout(driveAutofillTimerRef.current[vid]);
            delete driveAutofillTimerRef.current[vid];
        }
        await flushVideoPersist(vid);
        try {
            await deploymentBoardService.deleteVideo(vid);
            setVideosByMain(prev => ({
                ...prev,
                [mainId]: (prev[mainId] || []).filter(x => x.id !== vid),
            }));
        } catch (e) {
            console.error(e);
        }
    };

    const renderMainBatchCard = (m: DeploymentBoardMain) => {
        const vids = videosByMain[m.id] || [];
        const readyVids = vids.filter(v => v.status === 'Ready for Deployment');
        const deployedVids = vids.filter(v => v.status === 'Deployed');
        const open = expanded[m.id] !== false;

        const renderVideoRow = (v: DeploymentBoardVideo) => {
            const detailsOpen = videoRowExpanded[v.id] === true;
            return (
                <div
                    key={v.id}
                    className={`flex flex-col rounded-xl bg-white/[0.03] border border-white/[0.06] ${sidebar ? 'p-2' : 'p-3'}`}
                >
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 min-w-0">
                        <button
                            type="button"
                            aria-expanded={detailsOpen}
                            aria-label={detailsOpen ? 'Hide link and deadline' : 'Show link and deadline'}
                            onClick={() =>
                                setVideoRowExpanded(prev => ({
                                    ...prev,
                                    [v.id]: !prev[v.id],
                                }))
                            }
                            className="flex-shrink-0 p-1 rounded-md text-violet-400/85 hover:bg-white/[0.06] transition-colors"
                        >
                            <ChevronDown className={`w-4 h-4 transition-transform ${detailsOpen ? '' : '-rotate-90'}`} />
                        </button>
                        <label className="flex items-center gap-2 min-w-0 flex-1 basis-[min(100%,14rem)]">
                            {videoFieldLabel(sidebar, 'Name')}
                            <input
                                type="text"
                                value={v.name ?? ''}
                                onChange={e => {
                                    patchVideoLocal(m.id, v.id, {
                                        name: e.target.value,
                                    });
                                    queueVideoPersist(v.id, { name: e.target.value });
                                }}
                                onBlur={e =>
                                    void flushVideoPersist(v.id, {
                                        name: e.target.value.trim(),
                                    })
                                }
                                placeholder="Video title"
                                className="flex-1 min-w-0 bg-transparent border border-white/[0.08] rounded-lg px-2 py-1.5 text-[10px] text-white placeholder-white/20 focus:outline-none focus:border-violet-500/40"
                            />
                        </label>
                        <label className="flex items-center gap-2 min-w-0 flex-shrink-0">
                            {videoFieldLabel(sidebar, 'Status')}
                            <select
                                value={v.status}
                                onChange={e =>
                                    updateVideoField(m.id, v, {
                                        status: e.target.value as DeploymentVideoStatus,
                                    })
                                }
                                className={`min-w-[7.5rem] text-[10px] font-semibold rounded-lg border px-1.5 py-1.5 bg-transparent cursor-pointer focus:outline-none ${statusPillClass(isDark, 'video', v.status)}`}
                            >
                                {VIDEO_STATUSES.map(s => (
                                    <option key={s} value={s} className="bg-zinc-900 text-white">
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={() => deleteVideo(m.id, v.id)}
                            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 transition-colors flex-shrink-0"
                            title="Remove row"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <AnimatePresence initial={false}>
                        {detailsOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="flex flex-col gap-2 pt-2 mt-2 border-t border-white/[0.06]">
                                    <label className="flex items-center gap-2 min-w-0">
                                        {videoFieldLabel(sidebar, 'Link')}
                                        <Link2 className="w-3.5 h-3.5 text-white/25 flex-shrink-0" aria-hidden />
                                        <input
                                            type="url"
                                            value={v.video_link}
                                            onChange={e => {
                                                const url = e.target.value;
                                                patchVideoLocal(m.id, v.id, {
                                                    video_link: url,
                                                });
                                                queueVideoPersist(v.id, {
                                                    video_link: url,
                                                });
                                                scheduleDriveNameAutofill(m.id, v.id, url);
                                            }}
                                            onBlur={async e => {
                                                const url = e.target.value;
                                                await flushVideoPersist(v.id, {
                                                    video_link: url,
                                                });
                                                await maybeAutofillVideoNameFromDrive(m.id, v.id, url);
                                            }}
                                            placeholder="https://…"
                                            className="flex-1 min-w-0 bg-transparent border border-white/[0.08] rounded-lg px-2 py-1.5 text-[10px] text-white placeholder-white/20 focus:outline-none focus:border-violet-500/40"
                                        />
                                    </label>
                                    <label className="flex items-center gap-2 min-w-0 max-w-full">
                                        {videoFieldLabel(sidebar, sidebar ? 'Due' : 'Deadline')}
                                        <input
                                            type="date"
                                            value={v.deadline ?? ''}
                                            onChange={e => {
                                                const d = e.target.value || null;
                                                patchVideoLocal(m.id, v.id, {
                                                    deadline: d,
                                                });
                                                queueVideoPersist(v.id, { deadline: d });
                                            }}
                                            onBlur={e =>
                                                void flushVideoPersist(v.id, {
                                                    deadline: e.target.value || null,
                                                })
                                            }
                                            className="flex-1 min-w-0 min-h-[2rem] max-w-full bg-transparent border border-white/[0.08] rounded-lg px-2 py-1.5 text-[10px] text-white [&::-webkit-calendar-picker-indicator]:invert"
                                        />
                                    </label>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        };

        return (
            <motion.div
                key={m.id}
                layout={!sidebar}
                className={`rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden ${sidebar ? 'text-[11px]' : ''}`}
            >
                <div className={`flex flex-col gap-3 ${sidebar ? 'p-3' : 'p-5 lg:flex-row lg:items-start lg:gap-4'}`}>
                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                        <button
                            type="button"
                            onClick={() => setExpanded(prev => ({ ...prev, [m.id]: !open }))}
                            className="flex items-start gap-2 text-left w-full min-w-0 rounded-lg hover:bg-white/[0.03] -mx-1 px-1 py-0.5 transition-colors group"
                        >
                            <ChevronDown
                                className={`${sidebar ? 'w-4 h-4 mt-0.5' : 'w-5 h-5 mt-0.5'} text-violet-400/70 flex-shrink-0 transition-transform ${
                                    open ? '' : '-rotate-90'
                                }`}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5 gap-y-1">
                                    <h3 className={`font-bold text-white/90 ${sidebar ? 'text-[12px] leading-snug' : 'text-base'}`}>{m.title}</h3>
                                    <span
                                        className={`${sidebar ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'} font-bold uppercase tracking-wider rounded-lg border ${statusPillClass(isDark, 'main', m.status)}`}
                                    >
                                        {m.status}
                                    </span>
                                    <span className={`${sidebar ? 'text-[10px]' : 'text-[11px]'} text-white/35`}>
                                        {vids.length} video{vids.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </button>
                        {m.drive_folder_link ? (
                            <a
                                href={m.drive_folder_link}
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex items-center gap-1 text-sky-400/90 hover:underline w-fit ${sidebar ? 'text-[10px]' : 'text-xs'}`}
                            >
                                <FolderOpen className={sidebar ? 'w-3 h-3' : 'w-3.5 h-3.5'} /> Drive folder
                                <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                        ) : (
                            <p className={`text-white/25 ${sidebar ? 'text-[10px]' : 'text-[11px]'}`}>No Drive folder link</p>
                        )}
                        {m.instructions ? <InstructionsBlock text={m.instructions} sidebar={sidebar} /> : null}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 justify-end lg:self-start">
                        <button
                            type="button"
                            onClick={() => openEditMain(m)}
                            className="p-2 rounded-lg border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20 transition-colors"
                            title="Edit main item"
                        >
                            <Pencil className={sidebar ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                        </button>
                        <button
                            type="button"
                            onClick={() => deleteMain(m.id)}
                            className="p-2 rounded-lg border border-white/[0.08] text-white/50 hover:text-red-400 hover:border-red-500/30 transition-colors"
                            title="Delete batch"
                        >
                            <Trash2 className={sidebar ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-white/[0.06] bg-black/25"
                        >
                            <div className={sidebar ? 'p-2.5 space-y-0' : 'p-4 space-y-0'}>
                                <div className={sidebar ? 'space-y-2 mb-2' : 'space-y-2 mb-3'}>
                                    {readyVids.length === 0 ? (
                                        <>
                                            <div className="flex items-center justify-between gap-2">
                                                <p
                                                    className={`${sidebar ? 'text-[9px]' : 'text-[10px]'} font-bold uppercase tracking-widest text-amber-200/55 flex items-center gap-1.5`}
                                                >
                                                    <Clapperboard className={sidebar ? 'w-3 h-3' : 'w-3.5 h-3.5'} /> Ready for Deployment videos
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => addVideo(m.id)}
                                                    className={`${sidebar ? 'text-[10px]' : 'text-[11px]'} font-semibold text-violet-300 hover:text-violet-200 flex items-center gap-1 flex-shrink-0`}
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Add video
                                                </button>
                                            </div>
                                            <p className={`text-white/30 ${sidebar ? 'text-[10px] py-1' : 'text-xs py-2'}`}>
                                                {vids.length === 0
                                                    ? 'No videos yet. Add a row — name and status show first; use the arrow to add link and deadline.'
                                                    : "No videos in this queue. Change a row's status to Ready for Deployment, or add a new video."}
                                            </p>
                                        </>
                                    ) : (
                                        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] overflow-hidden">
                                            <div
                                                className={`flex items-stretch gap-1 ${sidebar ? 'min-h-[2.5rem]' : 'min-h-[2.75rem]'} border-b border-white/[0.06]`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setReadyVideosFoldOpen(prev => ({
                                                            ...prev,
                                                            [m.id]: !prev[m.id],
                                                        }))
                                                    }
                                                    className={`flex flex-1 min-w-0 items-center gap-2 text-left ${sidebar ? 'px-2 py-2' : 'px-3 py-2.5'} hover:bg-white/[0.04] transition-colors`}
                                                    aria-expanded={readyVideosFoldOpen[m.id] === true}
                                                >
                                                    <ChevronDown
                                                        className={`${sidebar ? 'w-4 h-4' : 'w-4 h-4'} text-amber-300/90 flex-shrink-0 transition-transform ${
                                                            readyVideosFoldOpen[m.id] === true ? '' : '-rotate-90'
                                                        }`}
                                                    />
                                                    <span
                                                        className={`font-bold uppercase tracking-wider text-amber-200/90 ${sidebar ? 'text-[9px]' : 'text-[10px]'}`}
                                                    >
                                                        Ready for Deployment videos
                                                    </span>
                                                    <span className={`text-white/40 ${sidebar ? 'text-[10px]' : 'text-[11px]'}`}>
                                                        {readyVids.length} video{readyVids.length !== 1 ? 's' : ''}
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => addVideo(m.id)}
                                                    className={`flex-shrink-0 self-center ${sidebar ? 'pr-2 pl-1' : 'pr-3 pl-1'} ${sidebar ? 'text-[10px]' : 'text-[11px]'} font-semibold text-violet-300 hover:text-violet-200 flex items-center gap-1`}
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Add video
                                                </button>
                                            </div>
                                            <AnimatePresence initial={false}>
                                                {readyVideosFoldOpen[m.id] === true && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className={sidebar ? 'space-y-2 p-2' : 'space-y-2 p-3'}>
                                                            {readyVids.map(renderVideoRow)}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>

                                <div
                                    className={`space-y-2 border-t border-white/[0.08] ${sidebar ? 'pt-2.5' : 'pt-3'}`}
                                >
                                    {deployedVids.length === 0 ? (
                                        <>
                                            <p
                                                className={`${sidebar ? 'text-[9px]' : 'text-[10px]'} font-bold uppercase tracking-widest text-emerald-300/70 flex items-center gap-1.5`}
                                            >
                                                <Clapperboard className={sidebar ? 'w-3 h-3' : 'w-3.5 h-3.5'} /> Deployed videos
                                            </p>
                                            <p className={`text-white/30 ${sidebar ? 'text-[10px] py-1' : 'text-xs py-2'}`}>
                                                {`None yet. Set a video's status to `}
                                                <span className="text-white/45">Deployed</span>
                                                {` to move it here.`}
                                            </p>
                                        </>
                                    ) : (
                                        <div className="rounded-xl border border-emerald-500/22 bg-emerald-500/[0.05] overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setDeployedVideosFoldOpen(prev => ({
                                                        ...prev,
                                                        [m.id]: !prev[m.id],
                                                    }))
                                                }
                                                className={`w-full flex items-center gap-2 text-left ${sidebar ? 'px-2 py-2' : 'px-3 py-2.5'} hover:bg-white/[0.04] transition-colors`}
                                                aria-expanded={deployedVideosFoldOpen[m.id] === true}
                                            >
                                                <ChevronDown
                                                    className={`${sidebar ? 'w-4 h-4' : 'w-4 h-4'} text-emerald-400/90 flex-shrink-0 transition-transform ${
                                                        deployedVideosFoldOpen[m.id] === true ? '' : '-rotate-90'
                                                    }`}
                                                />
                                                <span
                                                    className={`font-bold uppercase tracking-wider text-emerald-300/85 ${sidebar ? 'text-[9px]' : 'text-[10px]'}`}
                                                >
                                                    Deployed videos
                                                </span>
                                                <span className={`text-white/40 ${sidebar ? 'text-[10px]' : 'text-[11px]'}`}>
                                                    {deployedVids.length} video{deployedVids.length !== 1 ? 's' : ''}
                                                </span>
                                            </button>
                                            <AnimatePresence initial={false}>
                                                {deployedVideosFoldOpen[m.id] === true && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="border-t border-white/[0.08] overflow-hidden"
                                                    >
                                                        <div className={sidebar ? 'space-y-2 p-2' : 'space-y-2 p-3'}>
                                                            {deployedVids.map(renderVideoRow)}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    const body = (
        <>
            {!sidebar && (
                <div className="flex justify-end mb-4">
                    <button
                        type="button"
                        onClick={openNewMain}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold transition-colors"
                    >
                        <Plus className="w-4 h-4" /> New main item
                    </button>
                </div>
            )}

            <div className={sidebar ? 'space-y-3' : 'space-y-6'}>
                {loadError ? (
                    <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 space-y-2 text-[11px] text-amber-100/95 leading-snug">
                        <p className="font-bold text-amber-200/95">Database setup needed</p>
                        <p className="text-white/45">
                            {loadError.includes('relation') || loadError.includes('does not exist')
                                ? 'The deployment board tables are not in your Supabase project yet.'
                                : loadError}
                        </p>
                        <p className="text-white/50">
                            In the Supabase dashboard, open <span className="text-white/70">SQL Editor</span>, paste the contents of{' '}
                            <code className="text-violet-300/90 bg-black/30 px-1 rounded">create_deployment_board_tables.sql</code> from the
                            repo root, run it, then use Reload above.
                        </p>
                        <button
                            type="button"
                            onClick={() => loadAll()}
                            className="mt-1 px-3 py-1.5 rounded-lg bg-amber-500/25 border border-amber-500/40 text-amber-100 text-[11px] font-semibold hover:bg-amber-500/35 transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                ) : loading ? (
                    <div className={`flex items-center gap-2 text-white/40 text-sm justify-center ${sidebar ? 'py-6' : 'py-12'}`}>
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
                    </div>
                ) : mains.length === 0 ? (
                    <div
                        className={`rounded-2xl border border-white/[0.08] bg-white/[0.02] text-center text-white/40 text-sm ${
                            sidebar ? 'p-5' : 'p-10'
                        }`}
                    >
                        {sidebar ? (
                            <>
                                No batches yet. Tap <span className="text-violet-300">+</span> to add a main item (instructions, Drive folder, status).
                            </>
                        ) : (
                            <>
                                No batches yet. Create a <span className="text-violet-300">New main item</span> to add instructions, a Drive folder, and
                                videos.
                            </>
                        )}
                    </div>
                ) : (
                    <div className={sidebar ? 'space-y-2' : 'space-y-4'}>{mains.map(m => renderMainBatchCard(m))}</div>
                )}
            </div>
        </>
    );

    return (
        <>
            {sidebar ? (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0">
                                <Rocket className="w-4 h-4 text-violet-400" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-[12px] font-bold text-white/85">Deployment board</h4>
                                <p className="text-[10px] text-white/35 leading-snug">
                                    Main items: instructions, Drive folder, status. Subitems: video links and deploy status.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => loadAll()}
                                disabled={loading}
                                className="p-2 rounded-lg border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 transition-colors disabled:opacity-40"
                                title="Reload"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                type="button"
                                onClick={openNewMain}
                                className="flex items-center gap-1 px-2.5 py-2 rounded-lg border border-violet-500/35 bg-violet-500/15 text-violet-200 text-[10px] font-bold hover:bg-violet-500/25 transition-colors"
                                title="New main item"
                            >
                                <Plus className="w-3.5 h-3.5" /> New
                            </button>
                        </div>
                    </div>
                    {body}
                </div>
            ) : (
                body
            )}

            <AnimatePresence>
                {mainModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
                        onClick={() => !saving && setMainModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.96, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0c0c10] p-6 space-y-4 shadow-2xl"
                        >
                            <h4 className="text-lg font-bold text-white">
                                {mainModal === 'new' ? 'New main item' : 'Edit main item'}
                            </h4>
                            <div className="space-y-3">
                                <label className="block space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">Title</span>
                                    <input
                                        value={mainForm.title}
                                        onChange={e => setMainForm(f => ({ ...f, title: e.target.value }))}
                                        className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-white"
                                        placeholder="e.g. Client batch — April"
                                    />
                                </label>
                                <label className="block space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">Drive folder</span>
                                    <input
                                        type="url"
                                        value={mainForm.drive_folder_link}
                                        onChange={e => setMainForm(f => ({ ...f, drive_folder_link: e.target.value }))}
                                        className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-white"
                                        placeholder="https://drive.google.com/..."
                                    />
                                </label>
                                <label className="block space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">Instructions</span>
                                    <textarea
                                        value={mainForm.instructions}
                                        onChange={e => setMainForm(f => ({ ...f, instructions: e.target.value }))}
                                        rows={5}
                                        className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-white resize-y"
                                        placeholder="Deployment notes, Loom links, client context…"
                                    />
                                </label>
                                <label className="block space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">Status</span>
                                    <select
                                        value={mainForm.status}
                                        onChange={e => setMainForm(f => ({ ...f, status: e.target.value as DeploymentMainStatus }))}
                                        className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-white"
                                    >
                                        {MAIN_STATUSES.map(s => (
                                            <option key={s} value={s} className="bg-zinc-900">
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setMainModal(null)}
                                    disabled={saving}
                                    className="px-4 py-2 text-sm text-white/50 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={saveMain}
                                    disabled={saving || !mainForm.title.trim()}
                                    className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold disabled:opacity-40"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Save'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
