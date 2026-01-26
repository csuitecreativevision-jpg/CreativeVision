import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ScrollRevealProps {
    children: React.ReactNode;
    className?: string;
    animation?: 'fade-up' | 'scale-up' | 'slide-in' | 'blur-reveal';
    delay?: number;
    duration?: number;
    threshold?: number;
    enableParallax?: boolean;
    parallaxStrength?: number;
}

export const ScrollReveal = ({
    children,
    className,
    animation = 'fade-up',
    delay = 0,
    duration = 0.8,
    threshold = 0.2,
    enableParallax = false,
    parallaxStrength = 50,
}: ScrollRevealProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: `0px 0px -${threshold * 100}% 0px` });

    // Parallax logic
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, -parallaxStrength]);
    const smoothY = useSpring(y, { stiffness: 100, damping: 20 });

    const variants = {
        'fade-up': {
            hidden: { opacity: 0, y: 60 },
            visible: { opacity: 1, y: 0 }
        },
        'scale-up': {
            hidden: { opacity: 0, scale: 0.8 },
            visible: { opacity: 1, scale: 1 }
        },
        'slide-in': {
            hidden: { opacity: 0, x: -60 },
            visible: { opacity: 1, x: 0 }
        },
        'blur-reveal': {
            hidden: { opacity: 0, filter: 'blur(10px)', scale: 1.05 },
            visible: { opacity: 1, filter: 'blur(0px)', scale: 1 }
        }
    };

    const content = (
        <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={variants[animation]}
            transition={{
                duration,
                delay,
                ease: [0.22, 1, 0.36, 1] // Custom quint-like easing for premium feel
            }}
            className={className}
        >
            {children}
        </motion.div>
    );

    if (enableParallax) {
        return (
            <motion.div ref={ref} style={{ y: smoothY }}>
                {content}
            </motion.div>
        );
    }

    return (
        <div ref={ref}>
            {content}
        </div>
    );
};
