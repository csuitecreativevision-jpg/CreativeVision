import React from 'react';

export const BackgroundLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="relative min-h-screen bg-custom-bg selection:bg-custom-purple/30 selection:text-white">
            {/* Static subtle gradient — no JS, no mouse tracking, no blobs */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-custom-purple/5 via-transparent to-custom-blue/5" />
            </div>

            {/* Content Layer */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};
