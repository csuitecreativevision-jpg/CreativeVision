import React from 'react';
import { cn } from '../../lib/utils';

interface MagneticButtonProps {
    children: React.ReactNode;
    className?: string;
}

export const MagneticButton = ({
    children,
    className,
}: MagneticButtonProps) => {
    return (
        <div
            className={cn(
                "relative z-10 inline-block transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]",
                className
            )}
        >
            {children}
        </div>
    );
};
