import { useEffect, useState, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

interface CountingNumberProps {
    value: number;
    suffix?: string;
    prefix?: string;
    duration?: number;
    className?: string;
}

export const CountingNumber = ({ value, suffix = '', prefix = '', duration = 1.5, className = '' }: CountingNumberProps) => {
    const ref = useRef(null);
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        damping: 30,
        stiffness: 100,
        duration: duration * 1000
    });
    const isInView = useInView(ref, { once: false, margin: "-10%" });
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        if (isInView) {
            motionValue.set(value);
        } else {
            motionValue.set(0);
        }
    }, [isInView, value, motionValue]);

    useEffect(() => {
        springValue.on("change", (latest) => {
            // If value is small (like 3 or 10), show decimals only if needed? 
            // For now, let's round to integer for clean look
            setDisplayValue(Math.round(latest));
        });
    }, [springValue]);

    return (
        <span ref={ref} className={className}>
            {prefix}{displayValue}{suffix}
        </span>
    );
};
