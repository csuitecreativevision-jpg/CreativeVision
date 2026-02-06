import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className = '', hoverEffect = false }: GlassCardProps) {
    return (
        <div
            className={`
                bg-[#0E0E1A]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden
                ${hoverEffect ? 'group hover:border-white/10 transition-colors' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
}
