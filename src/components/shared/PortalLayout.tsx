import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers } from 'lucide-react';

interface PortalLayoutProps {
    sidebarContent: ReactNode;
    mainContent: ReactNode;
    userProfile?: ReactNode;
    sidebarFooter?: ReactNode;
    isMobileSidebarOpen?: boolean;
    onMobileSidebarClose?: () => void;
}

export const PortalLayout = ({
    sidebarContent,
    mainContent,
    sidebarFooter,
    isMobileSidebarOpen,
    onMobileSidebarClose
}: PortalLayoutProps) => {

    const SidebarInner = () => (
        <div className="flex flex-col h-full">

            {/* Top accent line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/40 to-transparent flex-shrink-0" />

            {/* Logomark header */}
            <div className="px-5 py-5 flex items-center gap-3 flex-shrink-0 border-b border-white/[0.04]">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600/35 to-violet-900/25 border border-violet-500/25 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.15)]">
                    <Layers className="w-3.5 h-3.5 text-violet-300" />
                </div>
                <div className="min-w-0">
                    <div className="text-white text-[13px] font-semibold tracking-wide leading-tight">CreativeVision</div>
                    <div className="text-[9px] text-white/25 tracking-[0.2em] uppercase font-medium leading-tight mt-0.5">Studio Portal</div>
                </div>
            </div>

            {/* Nav scroll area */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 custom-scrollbar">
                {sidebarContent}
            </div>

            {/* Footer */}
            {sidebarFooter && (
                <div className="flex-shrink-0 border-t border-white/[0.04] px-3 pt-3 pb-4">
                    {sidebarFooter}
                </div>
            )}
        </div>
    );

    return (
        <div className="relative min-h-screen bg-[#020204]">
            {/* Global ambient orbs */}
            <div className="portal-orb-violet w-[40vw] h-[40vw] top-[-10%] left-[-10%] z-0" />
            <div className="portal-orb-fuchsia w-[50vw] h-[50vw] bottom-[-10%] right-[-10%] z-0" />
            <div className="portal-orb-indigo w-[30vw] h-[30vw] top-[40%] left-[40%] z-0" />
            <div className="bg-noise" />

            <div className="flex h-screen relative z-10 overflow-hidden">

                {/* Desktop Sidebar */}
                <div className="hidden lg:flex w-[240px] flex-shrink-0 flex-col relative z-20 bg-[#06060a]/95 border-r border-white/[0.05] backdrop-blur-sm">
                    <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-violet-900/12 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex flex-col h-full">
                        <SidebarInner />
                    </div>
                </div>

                {/* Mobile Sidebar Drawer */}
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
                                className="fixed inset-y-0 left-0 w-[240px] bg-[#06060a]/98 border-r border-white/[0.06] z-50 flex flex-col lg:hidden backdrop-blur-xl"
                            >
                                <button
                                    onClick={onMobileSidebarClose}
                                    className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <SidebarInner />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Main content */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#020204] relative z-30">
                    {mainContent}
                </div>
            </div>
        </div>
    );
};
