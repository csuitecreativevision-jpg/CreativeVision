import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

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

            {/* Nav items */}
            <div className="flex-1 overflow-y-auto px-3 pt-5 pb-3 space-y-0.5 custom-scrollbar">
                {sidebarContent}
            </div>

            {/* Footer */}
            {sidebarFooter && (
                <div className="flex-shrink-0 px-3 pb-4 pt-2 border-t border-white/[0.05]">
                    {sidebarFooter}
                </div>
            )}
        </div>
    );

    return (
        <div className="relative min-h-screen bg-[#050511]">
            <div className="flex h-screen relative z-10 overflow-hidden">

                {/* Desktop Sidebar */}
                <div className="hidden lg:flex w-64 flex-shrink-0 flex-col relative z-20 bg-[#0c0c1a] border-r border-white/[0.05]">
                    {/* Subtle ambient glow top */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-violet-900/10 to-transparent pointer-events-none" />
                    {/* Subtle ambient glow bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-violet-900/5 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex flex-col h-full">
                        <SidebarInner />
                    </div>
                </div>

                {/* Mobile Sidebar (Drawer) */}
                <AnimatePresence>
                    {isMobileSidebarOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={onMobileSidebarClose}
                                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
                            />

                            {/* Drawer */}
                            <motion.div
                                initial={{ x: -280 }}
                                animate={{ x: 0 }}
                                exit={{ x: -280 }}
                                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                                className="fixed inset-y-0 left-0 w-64 bg-[#0c0c1a] border-r border-white/[0.07] z-50 flex flex-col lg:hidden"
                            >
                                <button
                                    onClick={onMobileSidebarClose}
                                    className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <SidebarInner />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#050511] relative z-30">
                    {mainContent}
                </div>
            </div>
        </div>
    );
};
