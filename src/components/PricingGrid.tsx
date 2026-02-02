
import { Sparkles, Check } from 'lucide-react';
import { MagneticButton } from './ui/MagneticButton';
import { ScrollReveal } from './ui/ScrollReveal';
import { packages } from '../data/pricingData';

interface PricingGridProps {
    id?: string;
    className?: string;
}

export default function PricingGrid({ id, className }: PricingGridProps) {
    const handlePlanClick = (pkg: typeof packages[0]) => {
        if (pkg.name === 'Trial') {
            window.open('https://calendar.google.com/calendar/render?action=TEMPLATE&text=Trial+Plan', '_blank');
        } else {
            alert(`Proceeding with ${pkg.name} plan`);
        }
    };

    return (
        <section id={id} className={`w-screen h-[100svh] flex-shrink-0 flex items-center justify-center relative overflow-hidden bg-[#050511] px-[clamp(1rem,3vw,2rem)] ${className}`}>
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-custom-purple/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-custom-blue/10 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-[1600px] w-full mx-auto relative z-10 h-full flex flex-col justify-center py-[clamp(1rem,4vh,3rem)]">
                <ScrollReveal animation="fade-up" className="flex-shrink-0 text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-custom-bright" />
                        <span className="text-xs font-medium text-gray-300">Detailed Pricing</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">Compare Plans</h2>
                    <p className="text-gray-400 text-sm md:text-base">Select the best fit for your vision.</p>
                </ScrollReveal>

                {/* Packages Grid - Scrollable on mobile, Fitted on desktop */}
                <div className="flex-1 min-h-0 w-full overflow-y-auto no-scrollbar p-[clamp(0.25rem,1vh,1rem)] pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-[clamp(0.75rem,1.5vw,1.5rem)] h-full lg:h-auto items-stretch">
                        {packages.map((pkg, index) => (
                            <ScrollReveal key={pkg.name} animation="scale-up" delay={index * 0.1} className="h-full flex flex-col">
                                <div
                                    className={`relative rounded-2xl p-[clamp(1rem,1.5vw,1.5rem)] flex flex-col h-full bg-gradient-to-br ${pkg.gradient} border ${pkg.borderColor} backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-custom-purple/10 ${pkg.popular ? 'ring-2 ring-yellow-500/50 z-10' : 'z-0'}`}
                                >
                                    {/* Popular badge */}
                                    {pkg.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-[10px] font-bold text-black flex items-center gap-1 shrink-0 shadow-lg z-20">
                                            <Sparkles className="w-3 h-3" /> MOST POPULAR
                                        </div>
                                    )}

                                    <div className="mb-4 shrink-0">
                                        {/* Plan icon */}
                                        <div className={`w-[clamp(2rem,3vw,2.5rem)] h-[clamp(2rem,3vw,2.5rem)] rounded-xl bg-gradient-to-br ${pkg.iconGradient} flex items-center justify-center mb-3 shadow-lg`}>
                                            <span className="text-white font-bold text-[clamp(0.8rem,1vw,1rem)]">{pkg.name.charAt(0)}</span>
                                        </div>

                                        <h3 className="text-[clamp(1rem,1.5vw,1.25rem)] font-bold text-white mb-1">{pkg.name}</h3>
                                        <p className="text-gray-400 text-[10px] sm:text-xs mb-3 line-clamp-2 md:line-clamp-none">{pkg.description}</p>

                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[clamp(1.25rem,2vw,1.8rem)] font-bold text-white">${pkg.price}</span>
                                            <span className="text-[10px] sm:text-xs text-gray-500">/{pkg.duration}</span>
                                        </div>
                                        {pkg.originalPrice && (
                                            <div className="text-[10px] text-gray-500 line-through mt-1">${pkg.originalPrice}/month</div>
                                        )}
                                    </div>

                                    <div className="space-y-2 mb-6 flex-grow overflow-y-auto no-scrollbar min-h-0">
                                        {packages[index].features.map((feat, i) => ( // Use packages[index] strictly or just pkg.features if trusted
                                            <div key={i} className="flex items-start gap-2 text-[10px] sm:text-xs text-gray-300">
                                                <Check className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <MagneticButton className="w-full mt-auto shrink-0">
                                        <button
                                            onClick={() => handlePlanClick(pkg)}
                                            className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all ${pkg.popular
                                                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-400 hover:to-amber-400 shadow-lg shadow-yellow-500/25'
                                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                                                }`}>
                                            Choose Plan
                                        </button>
                                    </MagneticButton>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
