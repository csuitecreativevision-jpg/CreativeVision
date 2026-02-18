import { Sparkles } from 'lucide-react';
import { MagneticButton } from './ui/MagneticButton';
import { ScrollReveal } from './ui/ScrollReveal';


import { useState } from 'react';
import { SelectionModal } from './ui/SelectionModal';

interface PricingSectionProps {
    id?: string;
    className?: string;
    onShortFormSelect?: () => void;
}

export default function PricingSection({ id, className, onShortFormSelect }: PricingSectionProps) {
    const [showSelectionModal, setShowSelectionModal] = useState(false);

    const handleSelection = (option: 'long' | 'short' | 'mixed') => {
        const planName = 'Trial'; // Default context
        console.log(`Selected ${option} for plan ${planName}`);

        if (option === 'mixed') {
            setShowSelectionModal(false);
            alert("Redirecting to Custom Plan inquiry...");
        } else if (option === 'short') {
            // Short Form -> Trigger Parent Navigation to Pricing Page Carousel
            setShowSelectionModal(false);
            if (onShortFormSelect) {
                onShortFormSelect();
            }
        } else {
            // Long Form -> Redirect to Calendar (Trial) or Alert
            setShowSelectionModal(false);
            if (planName === 'Trial') {
                window.open('https://calendar.google.com/calendar/render?action=TEMPLATE&text=Trial+Plan', '_blank');
            } else {
                alert(`Proceeding with ${planName} - ${option} form`);
            }
        }
    };

    return (
        <section id={id} className={`w-full flex-shrink-0 flex items-center justify-center relative overflow-hidden px-[clamp(1rem,3vw,2rem)] ${className}`}>
            <SelectionModal
                isOpen={showSelectionModal}
                onClose={() => setShowSelectionModal(false)}
                title="Select Content Type"
                options={['Long Form', 'Short Form', 'Mixed']}
                selected=""
                onSelect={(val) => {
                    const mapped = val.toLowerCase().replace(' form', '') as 'long' | 'short' | 'mixed';
                    handleSelection(mapped);
                }}
            />

            <div className="max-w-[1600px] w-full mx-auto relative z-10 h-full flex flex-col justify-center py-[clamp(1rem,4vh,3rem)]">
                <ScrollReveal animation="fade-up" className="flex-shrink-0">
                    <div className="text-center mb-[clamp(2rem,5vh,4rem)]">
                        {/* Star Icon */}
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-8 animate-pulse">
                            <Sparkles className="w-5 h-5 text-custom-violet" />
                        </div>

                        <h2 className="text-[clamp(2.5rem,5vw,5rem)] font-bold text-white mb-2 leading-[1.1] tracking-tight">
                            We don't just sell plans.
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet">
                                We sell an experience.
                            </span>
                        </h2>

                        <p className="text-gray-400 text-[clamp(0.9rem,1.2vw,1.25rem)] max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                            Every detail acts as a leverage point. Every frame is calculated.
                            <br className="hidden md:block" />
                            Choose the level of impact you are ready for.
                        </p>

                        <MagneticButton className="mx-auto">
                            <button
                                onClick={() => setShowSelectionModal(true)}
                                className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                            >
                                Begin Selection
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </button>
                        </MagneticButton>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
