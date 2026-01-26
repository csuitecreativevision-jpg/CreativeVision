import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TextRotatorProps {
    words: string[];
    className?: string;         // For the container or text style
    wrapperClassName?: string;
}

export const TextRotator = ({ words, className, wrapperClassName }: TextRotatorProps) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, 2000); // 2 seconds per word

        return () => clearInterval(interval);
    }, [words.length]);

    return (
        <div className={`inline-flex flex-col h-[1.1em] overflow-hidden align-top relative ${wrapperClassName}`}>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={index}
                    initial={{ y: "120%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    exit={{ y: "-120%", opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} // Elegant easeOutExpo-ish curve
                    className={`block absolute top-0 left-0 whitespace-nowrap ${className}`}
                >
                    {words[index]}
                </motion.span>
                {/* Invisible spacer to maintain width based on longest word, or let it resize naturally if width isn't constrained. 
                    For simplest 'in place' feel with variable width, we might need a width animation or just accept the width change.
                    Given "in place", absolute positioning is good for the transition, but we need the container to have size.
                */}
                <span className={`block opacity-0 pointer-events-none whitespace-nowrap ${className}`}>
                    {words[index]}
                </span>
            </AnimatePresence>
        </div>
    );
};
