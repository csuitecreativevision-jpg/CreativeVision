import React from "react";
import { cn } from "../../lib/utils";

export const SpotlightCard = ({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
    spotlightColor?: string;
}) => {
    return (
        <div
            className={cn(
                "relative group border border-white/10 overflow-hidden",
                className
            )}
        >
            {/* Spotlight effect on hover */}
            <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-0 bg-gradient-radial from-purple-500/20 to-transparent"
            />

            {children}
        </div>
    );
};
