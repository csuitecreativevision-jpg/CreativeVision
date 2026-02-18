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
        <>
            <div className="p-8 pb-4">
                <div className="flex items-center gap-3 mb-1">
                    {/* Logo */}
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 text-white font-bold tracking-tighter">
                        CV
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">CreativeVision</span>
                </div>
                <div className="pl-11">
                    <span className="text-[10px] font-bold text-violet-500 uppercase tracking-[0.2em]">Admin Console</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 custom-scrollbar">
                {sidebarContent}
            </div>

            {sidebarFooter && (
                <div className="px-4 pb-4 pt-2">
                    {sidebarFooter}
                </div>
            )}
        </>
    );

    return (
        <div className="relative min-h-screen bg-[#050511]">
            <div className="flex h-screen relative z-10 overflow-hidden">

                {/* Desktop Sidebar */}
                <div className="hidden lg:flex w-72 flex-shrink-0 border-r border-white/5 bg-gradient-to-b from-[#131322] to-[#050511] flex-col relative z-20">
                    <SidebarInner />
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
                                onClick={onMobileSidebarClose}
                                className="fixed inset-0 bg-black/80 z-40 lg:hidden"
                            />

                            {/* Drawer */}
                            <motion.div
                                initial={{ x: -300 }}
                                animate={{ x: 0 }}
                                exit={{ x: -300 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-[#131322] to-[#050511] border-r border-white/10 z-50 flex flex-col lg:hidden"
                            >
                                <div className="absolute top-4 right-4">
                                    <button
                                        onClick={onMobileSidebarClose}
                                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
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
