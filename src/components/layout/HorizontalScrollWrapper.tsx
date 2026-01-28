import { useRef, ReactNode, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface HorizontalScrollWrapperProps {
    children: ReactNode;
    contentWidth?: string;
    overrideIndex: number | null;
}

export const HorizontalScrollWrapper = ({ children, overrideIndex }: HorizontalScrollWrapperProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const { scrollYProgress } = useScroll({
        target: scrollRef,
        offset: ["start start", "end end"]
    });

    const visibleSlides = 6; // Hero, Trust, About, Services, Portfolio, Booking

    // Normal scroll logic for DESKTOP
    const finalVisibleX = `-${(visibleSlides - 1) * 100}vw`;
    const scrollX = useTransform(scrollYProgress, [0, 1], ["0%", finalVisibleX]);

    // MOBILE IMPLEMENTATION:
    // We used to return a vertical layout here. Now we return a horizontal container
    // with overflow-x-auto and snap-x.
    // Mobile container ref
    const mobileRef = useRef<HTMLDivElement>(null);

    // Handle overrideIndex for MOBILE
    useEffect(() => {
        if (isMobile && overrideIndex !== null && mobileRef.current) {
            const width = window.innerWidth;
            mobileRef.current.scrollTo({
                left: overrideIndex * width,
                behavior: 'smooth'
            });
        }
    }, [isMobile, overrideIndex]);

    if (isMobile) {
        return (
            <div
                ref={mobileRef}
                className="fixed inset-0 w-screen h-[100svh] overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex flex-row flex-nowrap bg-custom-bg text-white z-50 touch-pan-x pointer-events-auto"
                style={{ WebkitOverflowScrolling: 'touch' }} // iOS momentum scroll
            >
                {/* 
                   We need to ensure children are treated as horizontal items.
                   Since children are passed as a fragment from HomePage, we might need to wrap them 
                   or ensure they have the right classes.
                */}
                {children}
            </div>
        );
    }

    // DESKTOP IMPLEMENTATION (unchanged mostly, but ensured sticky/overflow)
    return (
        <div ref={scrollRef} style={{ height: `${visibleSlides * 100}vh` }} className="relative bg-custom-bg w-full">
            {/* Snap points for desktop feeling (optional, helping the scroll progress) */}
            <div className="absolute inset-0 flex flex-col pointer-events-none">
                {Array.from({ length: visibleSlides }).map((_, i) => (
                    <div key={i} className="h-[100vh] w-full snap-center" />
                ))}
            </div>

            <div className="sticky top-0 h-screen w-screen overflow-hidden">
                <motion.div
                    className={`flex h-full w-max ${overrideIndex !== null ? 'transition-transform duration-1000 ease-in-out' : ''}`}
                    style={{ x: overrideIndex !== null ? `-${overrideIndex * 100}vw` : scrollX }}
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
};
