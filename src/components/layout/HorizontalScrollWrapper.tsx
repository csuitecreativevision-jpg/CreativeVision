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
    // We only create scroll height for the VISIBLE slides.
    // The others are waiting off-screen.

    // Normal scroll logic
    const finalVisibleX = `-${(visibleSlides - 1) * 100}vw`;
    const scrollX = useTransform(scrollYProgress, [0, 1], ["0%", finalVisibleX]);

    // Construct the transform style
    // IF overrideIndex is set, ignore scrollX and manually set translate
    // We can't use useState for MotionValues. We rely on the layout.
    // When overrideIndex is !== null, we force the style.

    if (isMobile) {
        return (
            <div className="relative w-full overflow-hidden bg-custom-bg text-white">
                <main className="flex flex-col w-full">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div ref={scrollRef} style={{ height: `${visibleSlides * 100}vh` }} className="relative bg-custom-bg">
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
