import { ReactNode } from 'react';
import { BackgroundLayout } from '../layout/BackgroundLayout';
import { CinematicOverlay } from '../ui/CinematicOverlay';

interface PortalLayoutProps {
    sidebarContent: ReactNode;
    mainContent: ReactNode;
    userProfile?: ReactNode;
    sidebarFooter?: ReactNode;
}

export const PortalLayout = ({ sidebarContent, mainContent, userProfile, sidebarFooter }: PortalLayoutProps) => {
    return (
        <BackgroundLayout>
            <CinematicOverlay />
            <div className="flex h-screen relative z-10 overflow-hidden">
                {/* Sidebar */}
                <div className="w-72 flex-shrink-0 border-r border-white/5 bg-[#050511]/80 backdrop-blur-2xl flex flex-col relative z-20">
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
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-black/20 to-custom-purple/5">
                    {mainContent}
                </div>
            </div>
        </BackgroundLayout>
    );
};
