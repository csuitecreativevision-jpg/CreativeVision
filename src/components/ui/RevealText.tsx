import React, { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { cn } from '../../lib/utils';

interface RevealTextProps {
    children: string;
    className?: string;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    classNameWrapper?: string;
}

export const RevealText = ({
    children,
    className,
    delay = 0,
    direction = 'up',
    classNameWrapper
}: RevealTextProps) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-20%" });
    const controls = useAnimation();

    useEffect(() => {
        if (isInView) {
            controls.start("visible");
        }
    }, [isInView, controls]);

    const variants = {
        hidden: {
            y: direction === 'up' ? 75 : direction === 'down' ? -75 : 0,
            x: direction === 'left' ? 75 : direction === 'right' ? -75 : 0,
            opacity: 0,
            rotate: direction === 'up' || direction === 'down' ? 5 : 0
        },
        visible: {
            y: 0,
            x: 0,
            opacity: 1,
            rotate: 0,
            transition: {
                type: "spring",
                damping: 15,
                stiffness: 70,
                duration: 0.8,
                delay: delay
            }
        }
    };

    return (
        <div ref={ref} className={cn("relative overflow-hidden inline-block", classNameWrapper)}>
            <motion.div
                variants={variants}
                initial="hidden"
                animate={controls}
                className={cn("inline-block transform-style-3d origin-bottom-left", className)}
            >
                {children}
            </motion.div>
        </div>
    );
};
