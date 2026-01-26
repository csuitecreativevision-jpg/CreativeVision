import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';

export const BackgroundLayout = ({ children }: { children: React.ReactNode }) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth mouse movement for the glow effect
    const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
    const smoothX = useSpring(mouseX, springConfig);
    const smoothY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    // Dynamic background gradient following mouse
    const backgroundStyle = useMotionTemplate`radial-gradient(600px circle at ${smoothX}px ${smoothY}px, rgba(116, 36, 245, 0.08), transparent 80%)`;

    return (
        <div className="relative min-h-screen bg-custom-bg selection:bg-custom-purple/30 selection:text-white">
            {/* Fixed Global Background Layer */}
            <div className="fixed inset-0 z-0 pointer-events-none">

                {/* Grain Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

                {/* Mouse Follower Glow */}
                <motion.div
                    className="absolute inset-0 z-0"
                    style={{ background: backgroundStyle }}
                />

                {/* Ambient Animated Blobs (Fixed positions, breathing animation) */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                        rotate: [0, 45, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-custom-purple/10 blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.4, 0.2],
                        rotate: [0, -30, 0]
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-custom-blue/10 blur-[150px]"
                />
            </div>

            {/* Content Layer */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};
