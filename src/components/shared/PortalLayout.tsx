import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers } from 'lucide-react';
import { PortalThemeProvider, usePortalTheme } from '../../contexts/PortalThemeContext';

interface PortalLayoutProps {
    sidebarContent: ReactNode;
    mainContent: ReactNode;
    userProfile?: ReactNode;
    sidebarFooter?: ReactNode;
    isMobileSidebarOpen?: boolean;
    onMobileSidebarClose?: () => void;
}

function PortalLayoutInner({
    sidebarContent,
    mainContent,
    sidebarFooter,
    isMobileSidebarOpen,
    onMobileSidebarClose
}: PortalLayoutProps) {
    const { isDark } = usePortalTheme();

    const SidebarInner = () => (
        <div className="flex flex-col h-full">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/40 to-transparent flex-shrink-0" />

            <div
                className={`px-5 py-5 flex items-center gap-3 flex-shrink-0 border-b ${
                    isDark ? 'border-white/[0.04]' : 'border-zinc-200'
                }`}
            >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600/35 to-violet-900/25 border border-violet-500/25 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.15)]">
                    <Layers className="w-3.5 h-3.5 text-violet-300" />
                </div>
                <div className="min-w-0">
                    <div
                        className={`text-[13px] font-semibold tracking-wide leading-tight ${
                            isDark ? 'text-white' : 'text-zinc-900'
                        }`}
                    >
                        CreativeVision
                    </div>
                    <div
                        className={`text-[9px] tracking-[0.2em] uppercase font-medium leading-tight mt-0.5 ${
                            isDark ? 'text-white/25' : 'text-zinc-500'
                        }`}
                    >
                        Studio Portal
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 custom-scrollbar">
                {sidebarContent}
            </div>

            {sidebarFooter && (
                <div
                    className={`flex-shrink-0 border-t px-3 pt-3 pb-4 ${
                        isDark ? 'border-white/[0.04]' : 'border-zinc-200'
                    }`}
                >
                    {sidebarFooter}
                </div>
            )}
        </div>
    );

    return (
        <div className={`relative min-h-screen ${isDark ? 'bg-[#020204]' : 'bg-zinc-100'}`}>
            {isDark && (
                <>
                    <div className="portal-orb-violet w-[40vw] h-[40vw] top-[-10%] left-[-10%] z-0" />
                    <div className="portal-orb-fuchsia w-[50vw] h-[50vw] bottom-[-10%] right-[-10%] z-0" />
                    <div className="portal-orb-indigo w-[30vw] h-[30vw] top-[40%] left-[40%] z-0" />
                    <div className="bg-noise" />
                </>
            )}

            <div className="flex h-screen relative z-10 overflow-hidden">
                <div
                    className={`hidden lg:flex w-[240px] flex-shrink-0 flex-col relative z-20 backdrop-blur-sm border-r ${
                        isDark
                            ? 'bg-[#06060a]/95 border-white/[0.05]'
                            : 'bg-white/95 border-zinc-200 shadow-sm'
                    }`}
                >
                    {isDark && (
                        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-violet-900/12 to-transparent pointer-events-none" />
                    )}
                    <div className="relative z-10 flex flex-col h-full">
                        <SidebarInner />
                    </div>
                </div>

                <AnimatePresence>
                    {isMobileSidebarOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={onMobileSidebarClose}
                                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                            />
                            <motion.div
                                initial={{ x: -260 }}
                                animate={{ x: 0 }}
                                exit={{ x: -260 }}
                                transition={{ type: 'spring', damping: 30, stiffness: 240 }}
                                className={`fixed inset-y-0 left-0 w-[240px] border-r z-50 flex flex-col lg:hidden backdrop-blur-xl ${
                                    isDark
                                        ? 'bg-[#06060a]/98 border-white/[0.06]'
                                        : 'bg-white border-zinc-200'
                                }`}
                            >
                                <button
                                    onClick={onMobileSidebarClose}
                                    className={`absolute top-4 right-4 z-10 p-1.5 rounded-lg transition-colors ${
                                        isDark
                                            ? 'bg-white/5 hover:bg-white/10 text-white/30 hover:text-white'
                                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900'
                                    }`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <SidebarInner />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <div
                    className={`flex-1 flex flex-col overflow-hidden relative z-30 ${
                        isDark ? 'bg-[#020204]' : 'bg-zinc-100'
                    }`}
                >
                    {mainContent}
                </div>
            </div>
        </div>
    );
}

export const PortalLayout = (props: PortalLayoutProps) => (
    <PortalThemeProvider>
        <PortalLayoutInner {...props} />
    </PortalThemeProvider>
);
