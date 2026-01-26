import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IMAGES = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop", // Portrait
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop", // Male Portrait
    "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?q=80&w=1000&auto=format&fit=crop", // Architecture
    "https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?q=80&w=1000&auto=format&fit=crop", // Event
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop", // Abstract
    "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1000&auto=format&fit=crop", // Photography
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop", // Tech
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop", // Camera
    "https://images.unsplash.com/photo-1493863641943-9b68992a8d07?q=80&w=1000&auto=format&fit=crop", // Editorial
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop"  // Business
];

export const Preloader = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [showImages, setShowImages] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        // Timeline:
        // 0s: Start
        // 0-2.5s: Logo Lockup
        // 2.5s: Start Image Sequence
        // 2.5s - 4s: Rapid Images
        // 4s: End

        const startImagesTimer = setTimeout(() => {
            setShowImages(true);
        }, 2500);

        const endTimer = setTimeout(() => {
            setIsLoading(false);
        }, 4000);

        return () => {
            clearTimeout(startImagesTimer);
            clearTimeout(endTimer);
        };
    }, []);

    // Image cycler
    useEffect(() => {
        if (!showImages) return;

        const interval = setInterval(() => {
            setCurrentImageIndex(prev => (prev + 1) % IMAGES.length);
        }, 120); // 120ms per image = Rapid flash

        return () => clearInterval(interval);
    }, [showImages]);

    return (
        <AnimatePresence mode="wait">
            {isLoading && (
                <motion.div
                    className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black overflow-hidden"
                    initial={{ opacity: 1 }}
                    exit={{ y: "-100%", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }} // Curtain lift
                >
                    {/* Cinematic Content Container */}
                    <div className="relative w-full h-full flex flex-col items-center justify-center">

                        {!showImages ? (
                            // PHASE 1: LOGO LOCKUP
                            <motion.div
                                className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6"
                                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)", transition: { duration: 0.2 } }}
                            >
                                {/* 1. Logo Animation */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="relative z-10"
                                >
                                    <img
                                        src="/Untitled design (3).png"
                                        alt="Logo"
                                        className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                    />
                                </motion.div>

                                {/* 2. Text Animation */}
                                <div className="overflow-hidden">
                                    <motion.h1
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                                        className="text-xl md:text-2xl font-bold tracking-[0.2em] text-white whitespace-nowrap"
                                    >
                                        CREATIVE VISION
                                    </motion.h1>
                                </div>
                            </motion.div>
                        ) : (
                            // PHASE 2: RAPID IMAGE SEQUENCE
                            <motion.div
                                className="absolute inset-0 z-20"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <img
                                    src={IMAGES[currentImageIndex]}
                                    alt="Visuals"
                                    className="w-full h-full object-cover grayscale contrast-125"
                                />
                                {/* Overlay to keep branding visible/maintain vibe */}
                                <div className="absolute inset-0 bg-black/20 mix-blend-multiply" />
                            </motion.div>
                        )}

                    </div>

                    {/* Preload Images Hidden */}
                    <div className="hidden">
                        {IMAGES.map(src => <img key={src} src={src} alt="preload" />)}
                    </div>

                    {/* Background Texture */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat z-10" />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
