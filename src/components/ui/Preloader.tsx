import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Preloader = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simple 2.5s logo lockup, no external image loading
        const endTimer = setTimeout(() => {
            setIsLoading(false);
        }, 2500);

        return () => clearTimeout(endTimer);
    }, []);

    return (
        <AnimatePresence mode="wait">
            {isLoading && (
                <motion.div
                    className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black overflow-hidden"
                    initial={{ opacity: 1 }}
                    exit={{ y: "-100%", transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } }}
                >
                    <motion.div
                        className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6"
                    >
                        {/* Logo */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <img
                                src="/Untitled design (3).png"
                                alt="Logo"
                                className="w-16 h-16 md:w-20 md:h-20 object-contain"
                                width="80"
                                height="80"
                            />
                        </motion.div>

                        {/* Text */}
                        <div className="overflow-hidden">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                                className="text-xl md:text-2xl font-bold tracking-[0.2em] text-white whitespace-nowrap"
                            >
                                CREATIVE VISION
                            </motion.h1>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
