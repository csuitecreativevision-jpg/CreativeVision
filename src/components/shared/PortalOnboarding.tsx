import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

interface OnboardingStep {
    title: string;
    description: string;
    icon?: React.ReactNode;
    image?: string;
}

interface PortalOnboardingProps {
    isOpen?: boolean;
    onClose?: () => void;
    steps: OnboardingStep[];
    storageKey: string;
    autoShow?: boolean; // If true, checks storage on mount and shows if not seen
}

export function PortalOnboarding({ isOpen: controlledIsOpen = false, onClose, steps, storageKey, autoShow = true }: PortalOnboardingProps) {
    const [isOpen, setIsOpen] = useState(controlledIsOpen);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (autoShow) {
            const hasSeen = localStorage.getItem(storageKey);
            if (!hasSeen) {
                setIsOpen(true);
            }
        }
    }, [autoShow, storageKey]);

    useEffect(() => {
        if (controlledIsOpen !== undefined && controlledIsOpen !== false) {
            setIsOpen(controlledIsOpen);
        }
    }, [controlledIsOpen]);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem(storageKey, 'true');
        if (onClose) onClose();
        setTimeout(() => setCurrentStep(0), 300); // Reset step after closing animation
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative w-full max-w-lg bg-[#0A0A16] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Progress Bar */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                            />
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 text-white/30 hover:text-white transition-colors rounded-full hover:bg-white/5 z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-8 pt-12">
                            {/* Step Content */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col items-center text-center space-y-6"
                                >
                                    {/* Icon/Image Area */}
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/5 to-transparent border border-white/10 flex items-center justify-center shadow-lg relative group">
                                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full opacity-0 blur-xl group-hover:opacity-100 transition-opacity duration-500" />
                                        {steps[currentStep].icon ? (
                                            <div className="text-white transform scale-150">
                                                {steps[currentStep].icon}
                                            </div>
                                        ) : (
                                            <div className="text-2xl font-bold text-white/50">
                                                {currentStep + 1}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2 max-w-sm">
                                        <h2 className="text-2xl font-bold text-white tracking-tight">
                                            {steps[currentStep].title}
                                        </h2>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            {steps[currentStep].description}
                                        </p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Dots Navigation */}
                            <div className="flex justify-center gap-2 mt-8 mb-4">
                                {steps.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentStep(idx)}
                                        className={`w-2 h-2 rounded-full transition-all ${currentStep === idx ? 'bg-white w-4' : 'bg-white/20 hover:bg-white/40'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-white/5 bg-white/5 flex items-center justify-between">
                            <button
                                onClick={handlePrev}
                                disabled={currentStep === 0}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${currentStep === 0 ? 'text-white/20 cursor-not-allowed' : 'text-white/70 hover:text-white'}`}
                            >
                                <ChevronLeft className="w-4 h-4" /> Back
                            </button>

                            <button
                                onClick={handleNext}
                                className="group relative flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-xl font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                <span className="relative z-10">{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
                                {currentStep === steps.length - 1 ? <CheckCircle2 className="w-4 h-4 relative z-10" /> : <ChevronRight className="w-4 h-4 relative z-10" />}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
