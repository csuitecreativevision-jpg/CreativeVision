import { useRef, ReactNode, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface HorizontalScrollWrapperProps {
    children: ReactNode;
    contentWidth?: string; // e.g. "400vw" for 4 sections
}

export const HorizontalScrollWrapper = ({ children, contentWidth = "400vw" }: HorizontalScrollWrapperProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Check for mobile to disable horizontal scroll if needed for better UX
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

    // We map 0-1 progress to the total horizontal scrolling distance.
    const totalSlides = 9; // Hero, Trust, About, Services, Portfolio, START_PROJECT, Pricing, Booking, Careers
    // The total width of content is totalSlides * 100vw
    // We want to translate from 0 to -(totalSlides - 1) * 100vw
    const finalX = `-${(totalSlides - 1) * 100}vw`;

    // Direct mapping for snappy 1:1 scroll response
    const x = useTransform(scrollYProgress, [0, 1], ["0%", finalX]);

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
        <>
            {/* 
        Length should remain proportional to number of slides.
      */}
            <div ref={scrollRef} style={{ height: `${totalSlides * 100}vh` }} className="relative bg-custom-bg">
                {/* Scroll Snap Points - Center Aligned */}
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                    {Array.from({ length: totalSlides }).map((_, i) => (
                        <div key={i} className="h-[100vh] w-full snap-center" />
                    ))}
                </div>

                <div className="sticky top-0 h-screen w-screen overflow-hidden">
                    <motion.div style={{ x }} className="flex h-full w-max">
                        {children}
                    </motion.div>
                </div>
            </div>
        </>
    );
};
