import { useState } from 'react';
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

    const handleBack = () => {
        if (step === 0) {
            onBack();
        } else {
            setStep(prev => prev - 1);
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
                <div className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto">
                    {/* Back Button */}
                    <button
                        onClick={handleBack}
                        className="self-start md:self-auto px-5 py-2 md:px-6 md:py-2.5 bg-white/5 text-white/90 rounded-full border border-white/10 hover:bg-white/10 hover:text-white transition-all backdrop-blur-xl uppercase text-xs md:text-sm tracking-widest font-bold flex items-center gap-2 shadow-lg group"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span>
                        <span>Back</span>
                    </button>

                    {/* Plans Navigation */}
                    <AnimatePresence>
                        {step > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex items-center p-1 bg-[#050511]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl overflow-x-auto max-w-full no-scrollbar"
                            >
                                {packages.map((pkg, idx) => (
                                    <button
                                        key={pkg.name}
                                        onClick={() => setStep(idx + 1)}
                                        className={`shrink-0 px-4 py-2 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all relative ${step === idx + 1
                                                ? 'text-white'
                                                : 'text-white/50 hover:text-white/90 hover:bg-white/5'
                                            }`}
                                    >
                                        {step === idx + 1 && (
                                            <motion.div
                                                layoutId="active-plan-pill"
                                                className="absolute inset-0 rounded-full z-0 border border-white/20"
                                                style={{
                                                    background: `linear-gradient(135deg, ${pkg.themeColor}33, transparent)`,
                                                    boxShadow: `0 0 20px ${pkg.themeColor}33`
                                                }}
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className="relative z-10">{pkg.name}</span>
                                    </button>
                                ))}

                                <div className="shrink-0 w-px h-6 bg-white/10 mx-1 md:mx-2" />

                                <button
                                    onClick={() => setStep(packages.length + 1)}
                                    className={`shrink-0 px-4 py-2 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all relative ${step === packages.length + 1
                                            ? 'text-white'
                                            : 'text-white/50 hover:text-white/90 hover:bg-white/5'
                                        }`}
                                >
                                    {step === packages.length + 1 && (
                                        <motion.div
                                            layoutId="active-plan-pill"
                                            className="absolute inset-0 rounded-full z-0 border border-white/20 bg-white/10"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10">Compare</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Invisible spacer for flex balance on desktop */}
                    <div className="w-[100px] hidden md:block opacity-0 pointer-events-none"></div>
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
