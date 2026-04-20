import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
    /** Match portal theme from settings */
    tone?: 'dark' | 'light';
}

export function GlassCard({ children, className = '', hoverEffect = false, tone = 'dark' }: GlassCardProps) {
    const surface =
        tone === 'dark'
            ? 'bg-[#0E0E1A]/80 backdrop-blur-md border-white/5'
            : 'bg-white/95 backdrop-blur-md border-zinc-200 shadow-sm';
    const hover =
        tone === 'dark'
            ? 'group hover:border-white/10 transition-colors'
            : 'group hover:border-zinc-300 transition-colors';

    return (
        <div
            className={`border rounded-3xl p-6 relative overflow-hidden ${surface} ${
                hoverEffect ? hover : ''
            } ${className}`}
        >
            {children}
        </div>
    );
}
