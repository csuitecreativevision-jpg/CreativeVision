import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { packages } from '../data/pricingData';
import PricingSection from '../components/PricingSection';
import PlanShowcase from '../components/PlanShowcase';
import PricingGrid from '../components/PricingGrid';

interface StartProjectPageProps {
    onBack: () => void;
}

export default function StartProjectPage({ onBack }: StartProjectPageProps) {
    const [step, setStep] = useState(0);
    const navScrollRef = useRef<HTMLDivElement>(null);
    const activePillRef = useRef<HTMLButtonElement>(null);

    // Auto-scroll the top navigation container so the active pill is centered
    useEffect(() => {
        if (activePillRef.current && navScrollRef.current) {
            const container = navScrollRef.current;
            const element = activePillRef.current;
            const scrollLeft = element.offsetLeft - (container.clientWidth / 2) + (element.clientWidth / 2);
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
    }, [step]);

    const handleBack = () => {
        if (step === 0) {
            onBack();
        } else {
            setStep(0);
        }
    };

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handleSelectPackage = () => {
        // Jump to grid (last step)
        setStep(packages.length + 1);
    };

    // Determine current content
    let content;
    if (step === 0) {
        // Intro
        content = (
            <PricingSection
                className="h-full"
                onShortFormSelect={handleNext}
            />
        );
    } else if (step > 0 && step <= packages.length) {
        // Plan Showcase
        const packageIndex = step - 1;
        const pkg = packages[packageIndex];
        content = (
            <PlanShowcase
                packageData={pkg}
                onNext={handleNext}
                onSelect={handleSelectPackage}
            />
        );
    } else {
        // Grid
        content = <PricingGrid />;
    }

    return (
        <div className="min-h-screen bg-[#050511] text-white relative flex flex-col">
            {/* Top Navigation Bar */}
            <div className="fixed top-4 md:top-8 left-0 right-0 z-50 flex justify-center px-4 md:px-8 pointer-events-none">
                <div className="w-full max-w-7xl flex items-center justify-between gap-3 pointer-events-auto">
                    {/* Back Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBack}
                        className="shrink-0 flex items-center justify-center gap-2 w-11 h-11 md:w-auto md:px-5 md:h-11 bg-white/5 text-white/90 rounded-full border border-white/10 hover:bg-white/10 hover:text-white transition-colors backdrop-blur-xl uppercase text-xs md:text-sm tracking-widest font-bold shadow-lg"
                    >
                        <span className="text-lg leading-none mb-[2px]">←</span>
                        <span className="hidden md:block whitespace-nowrap">Previous Page</span>
                    </motion.button>

                    {/* Plans Navigation Wrapper */}
                    <div className="min-w-0 flex-1 flex justify-end md:justify-center relative">
                        {/* Gradient mask for edge fading on scroll */}
                        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#050511] to-transparent pointer-events-none z-10 md:hidden rounded-r-full" />

                        <AnimatePresence>
                            {step > 0 && (
                                <motion.div
                                    ref={navScrollRef}
                                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className="flex items-center p-1.5 bg-[#050511]/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl overflow-x-auto no-scrollbar max-w-full"
                                >
                                    {packages.map((pkg, idx) => (
                                        <motion.button
                                            key={pkg.name}
                                            ref={step === idx + 1 ? activePillRef as any : null}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setStep(idx + 1)}
                                            className={`shrink-0 px-4 md:px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 relative group ${step === idx + 1
                                                ? 'text-white'
                                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            {step === idx + 1 && (
                                                <motion.div
                                                    layoutId="active-plan-pill"
                                                    className="absolute inset-0 rounded-full z-0"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${pkg.themeColor}50, ${pkg.themeColor}10)`,
                                                        boxShadow: `0 0 20px ${pkg.themeColor}40, inset 0 0 10px ${pkg.themeColor}20`,
                                                        border: `1px solid ${pkg.themeColor}60`
                                                    }}
                                                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                                />
                                            )}
                                            <span className="relative z-10">{pkg.name}</span>
                                        </motion.button>
                                    ))}

                                    <div className="shrink-0 w-px h-6 bg-white/15 mx-1 md:mx-2" />

                                    <motion.button
                                        ref={step === packages.length + 1 ? activePillRef as any : null}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setStep(packages.length + 1)}
                                        className={`shrink-0 px-4 md:px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 relative ${step === packages.length + 1
                                            ? 'text-white'
                                            : 'text-white/60 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {step === packages.length + 1 && (
                                            <motion.div
                                                layoutId="active-plan-pill"
                                                className="absolute inset-0 rounded-full z-0 border border-white/30 bg-white/15 backdrop-blur-md"
                                                style={{ boxShadow: "0 0 20px rgba(255,255,255,0.2)" }}
                                                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                            />
                                        )}
                                        <span className="relative z-10">Compare</span>
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Invisible spacer for flex balance on desktop */}
                    <div className="w-[100px] hidden md:block shrink-0 opacity-0 pointer-events-none"></div>
                </div>
            </div>

            {/* Background Glows - Full Screen Coverage */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-custom-purple/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-custom-blue/10 rounded-full blur-[150px]" />
            </div>

            <main className="flex-grow relative w-full h-full min-h-screen z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5, ease: "circOut" }}
                        className="w-full h-full min-h-screen flex flex-col items-center justify-center"
                    >
                        {content}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
