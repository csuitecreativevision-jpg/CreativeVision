import { useRef, ReactNode, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

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

    // Smooth out the scroll progress for a "weighty" feel
    const springScroll = useSpring(scrollYProgress, {
        stiffness: 50,
        damping: 30,
        mass: 1.2,
        restDelta: 0.001
    });

    // We map 0-1 progress to the total horizontal scrolling distance.
    const totalSlides = 7; // We know we have 7 slides: Hero, Trust, About, Services, Portfolio, Pricing, Careers
    // The total width of content is totalSlides * 100vw
    // We want to translate from 0 to -(totalSlides - 1) * 100vw
    const finalX = `-${(totalSlides - 1) * 100}vw`;

    const x = useTransform(springScroll, [0, 1], ["0%", finalX]);

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
        This outer container provides the HEIGHT to allow vertical scrolling.
        We use 'vh' to ensure consistent scroll length regardless of screen width.
        300vh - 400vh is usually good to control speed. 
        Length should remain proportional to number of slides.
      */}
            <div ref={scrollRef} style={{ height: contentWidth }} className="relative bg-custom-bg">
                <div className="sticky top-0 h-screen w-screen overflow-hidden">
                    <motion.div style={{ x }} className="flex h-full w-max">
                        {children}
                    </motion.div>
                </div>
            </div>
        </>
    );
};
