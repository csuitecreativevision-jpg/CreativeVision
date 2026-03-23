
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

            <div className="max-w-[1600px] w-full mx-auto relative z-10 h-full flex flex-col justify-center px-2 pt-20 md:pt-24 pb-8 md:pb-12">
                <ScrollReveal animation="fade-up" className="flex-shrink-0 text-center mb-2 md:mb-4">
                    <div className="hidden md:inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-custom-bright" />
                        <span className="text-[10px] font-medium text-gray-300">Detailed Pricing</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-0 md:mb-1">Compare Plans</h2>
                    <p className="text-gray-400 text-xs hidden md:block">Select the best fit for your vision.</p>
                </ScrollReveal>

                {/* Packages Grid - Scrollable on mobile, Fitted on desktop */}
                <div className="flex-1 min-h-0 w-full overflow-y-auto no-scrollbar p-2 pb-8 md:pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 md:gap-3 h-full items-stretch">
                        {packages.map((pkg, index) => (
                            <ScrollReveal key={pkg.name} animation="scale-up" delay={index * 0.1} className="h-full flex flex-col">
                                <div
                                    className={`relative rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col h-full bg-gradient-to-br ${pkg.gradient} border ${pkg.borderColor} backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-custom-purple/10 ${pkg.popular ? 'ring-1 ring-yellow-500/50 z-10' : 'z-0'}`}
                                >
                                    {/* Popular badge */}
                                    {pkg.popular && (
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-[9px] font-bold text-black flex items-center gap-1 shrink-0 shadow-lg z-20">
                                            <Sparkles className="w-2.5 h-2.5" /> MOST POPULAR
                                        </div>
                                    )}

                                    <div className="mb-2 md:mb-3 shrink-0">
                                        {/* Plan icon */}
                                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br ${pkg.iconGradient} flex items-center justify-center mb-2 shadow-lg`}>
                                            <span className="text-white font-bold text-xs md:text-sm">{pkg.name.charAt(0)}</span>
                                        </div>

                                        <h3 className="text-sm md:text-base font-bold text-white mb-0.5">{pkg.name}</h3>
                                        <p className="text-gray-400 text-[10px] sm:text-xs mb-3 line-clamp-2 md:line-clamp-none">{pkg.description}</p>

                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg md:text-xl font-bold text-white">${pkg.price}</span>
                                            <span className="text-[9px] md:text-[10px] text-gray-500">/{pkg.duration}</span>
                                        </div>
                                        {pkg.originalPrice && (
                                            <div className="text-[9px] text-gray-500 line-through mt-0.5">${pkg.originalPrice}/m</div>
                                        )}
                                    </div>

                                    <div className="space-y-1 mb-3 flex-grow overflow-y-auto no-scrollbar min-h-0">
                                        {packages[index].features.map((feat, i) => (
                                            <div key={i} className="flex items-start gap-1.5 text-[9px] md:text-[10px] lg:text-[11px] text-gray-300">
                                                <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-400 shrink-0 mt-[2px]" />
                                                <span className="leading-tight">{feat}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <MagneticButton className="w-full mt-auto shrink-0">
                                        <button
                                            onClick={() => handlePlanClick(pkg)}
                                            className={`w-full py-1.5 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold transition-all ${pkg.popular
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
