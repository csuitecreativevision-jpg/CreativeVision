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
                <div className="w-64 flex-shrink-0 border-r border-white/5 bg-black/20 backdrop-blur-xl flex flex-col">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-8">
                            <img src="/Untitled design (3).png" alt="CV" className="w-8 h-8 object-contain" />
                            <span className="font-bold text-lg tracking-tight text-white">CreativeVision</span>
                        </div>
                        {userProfile}
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 custom-scrollbar">
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
