import React from "react";
import { useSpring, useMotionTemplate } from "framer-motion";
import { cn } from "../../lib/utils";

export const SpotlightCard = ({
    children,
    className = "",
    spotlightColor = "rgba(116, 36, 245, 0.25)"
}: {
    children: React.ReactNode;
    className?: string;
    spotlightColor?: string;
}) => {
    const mouseX = useSpring(0, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(0, { stiffness: 500, damping: 100 });

    function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const maskImage = useMotionTemplate`radial-gradient(240px circle at ${mouseX}px ${mouseY}px, white, transparent)`;


    return (
        <div
            onMouseMove={onMouseMove}
            style={{ maskImage, WebkitMaskImage: maskImage }}
            className={cn(
                "relative group border border-white/10 overflow-hidden",
                className
            )}
        >
            <div className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-10"
                style={{ background: spotlightColor }}
            />

            {children}
        </div>
    );
};
