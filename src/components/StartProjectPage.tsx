import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { packages } from '../data/pricingData';
import PricingSection from './PricingSection';
import PlanShowcase from './PlanShowcase';
import PricingGrid from './PricingGrid';
import Footer from './Footer';

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
            {/* Floating Back Button */}
            <button
                onClick={handleBack}
                className="fixed top-8 left-8 z-50 px-6 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md uppercase text-sm tracking-widest font-bold flex items-center gap-2"
            >
                <span>←</span> BACK
            </button>

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

            {step === packages.length + 1 && <Footer />}
        </div>
    );
}
