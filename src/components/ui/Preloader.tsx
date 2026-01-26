import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Preloader = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate a premium "boot up" sequence
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3500); // 3.5s total duration

        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence mode="wait">
            {isLoading && (
                <motion.div
                    className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                >
                    {/* Cinematic Content Container */}
                    <div className="relative flex flex-col items-center">

                        {/* Logo/Text Reveal */}
                        <div className="overflow-hidden mb-6">
                            <motion.h1
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 1, ease: [0.33, 1, 0.68, 1], delay: 0.2 }}
                                className="text-4xl md:text-6xl font-bold text-white tracking-tighter"
                            >
                                CREATIVE VISION
                            </motion.h1>
                        </div>

                        {/* Subline / Status */}
                        <div className="overflow-hidden">
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
                                className="text-xs md:text-sm text-gray-400 uppercase tracking-[0.3em]"
                            >
                                System Initialization
                            </motion.p>
                        </div>

                        {/* Progress Line */}
                        <motion.div
                            className="mt-8 h-[1px] bg-white/20 w-48 overflow-hidden relative"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                        >
                            <motion.div
                                className="absolute inset-0 bg-white"
                                initial={{ x: "-100%" }}
                                animate={{ x: "0%" }}
                                transition={{ duration: 1.5, ease: "easeInOut", delay: 1 }}
                            />
                        </motion.div>
                    </div>

                    {/* Background Texture for "Grain" feel specific to loader */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
