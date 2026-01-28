
import { Check, Sparkles } from 'lucide-react';
import { MagneticButton } from './ui/MagneticButton';
import { ScrollReveal } from './ui/ScrollReveal';

interface PricingSectionProps {
    id?: string;
    className?: string;
}

export default function PricingSection({ id, className }: PricingSectionProps) {
    const packages = [
        {
            name: "Trial",
            price: 0,
            duration: "one-time",
            description: "Experience our quality risk-free",
            features: [
                "30 Minute Consultation",
                "Free Trial Video"
            ],
            popular: false,
            gradient: "from-blue-500/20 to-indigo-500/10",
            borderColor: "border-blue-500/30",
            iconGradient: "from-blue-400 to-indigo-500"
        },
        {
            name: "Bronze",
            price: 390,
            duration: "month",
            description: "Perfect for getting started",
            features: [
                "6 Videos",
                "6 Thumbnails",
                "Customized Editing Style",
                "Quick Turnarounds",
                "Unlimited Revisions"
            ],
            popular: false,
            gradient: "from-amber-700/20 to-amber-900/10",
            borderColor: "border-amber-700/30",
            iconGradient: "from-amber-600 to-amber-800"
        },
        {
            name: "Silver",
            price: 780,
            duration: "month",
            originalPrice: 870,
            savings: "10% OFF",
            description: "Great for growing creators",
            features: [
                "12 Videos",
                "12 Thumbnails",
                "Customized Editing Style",
                "Quick Turnarounds",
                "Unlimited revisions"
            ],
            popular: false,
            gradient: "from-gray-400/20 to-gray-600/10",
            borderColor: "border-gray-400/30",
            iconGradient: "from-gray-300 to-gray-500"
        },
        {
            name: "Gold",
            price: 1600,
            duration: "month",
            originalPrice: 1915,
            savings: "15% OFF",
            description: "Professional solution",
            features: [
                "25 Videos",
                "25 Thumbnails",
                "Customized Editing Style",
                "Quick Turnarounds",
                "Unlimited revisions",
                "Content Curation",
                "Content Repurposing",
                "Editing Style Inventory",
                "Distribution System",
                "Project Overview System"
            ],
            popular: true,
            gradient: "from-yellow-500/20 to-amber-600/10",
            borderColor: "border-yellow-500/50",
            iconGradient: "from-yellow-400 to-amber-500"
        },
        {
            name: "Platinum",
            price: 2900,
            duration: "month",
            originalPrice: 3660,
            savings: "20% OFF",
            description: "Ultimate enterprise package",
            features: [
                "45 Videos",
                "45 Thumbnails",
                "Customized Editing Style",
                "Quick Turnarounds",
                "Unlimited Revisions",
                "Content Curation",
                "Content Repurposing",
                "Editing Style Inventory",
                "Distribution System",
                "Project Overview System"
            ],
            popular: false,
            gradient: "from-slate-300/20 to-zinc-200/10",
            borderColor: "border-slate-300/40",
            iconGradient: "from-slate-300 to-zinc-400"
        }
    ];

    return (
        <section id={id} className={`w-screen h-[100svh] flex-shrink-0 flex items-start justify-center relative overflow-hidden bg-[#050511] px-[clamp(1rem,3vw,2rem)] ${className}`}>
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-custom-purple/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-custom-blue/10 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-[1600px] w-full mx-auto relative z-10 h-full flex flex-col justify-start md:justify-center py-[clamp(1rem,4vh,3rem)] pt-[clamp(5rem,10vh,6rem)] md:pt-[clamp(1rem,4vh,3rem)]">
                <ScrollReveal animation="fade-up" className="flex-shrink-0">
                    <div className="text-center mb-[clamp(0.5rem,2vh,2rem)]">
                        {/* Pill badge like other sections */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-[clamp(0.25rem,1.5vh,1rem)]">
                            <div className="w-1.5 h-1.5 rounded-full bg-custom-bright" />
                            <span className="text-[clamp(0.6rem,1vw,0.75rem)] font-medium text-gray-300">Pricing</span>
                        </div>
                        <h2 className="text-[clamp(2rem,5vw,5rem)] font-bold text-white mb-1 leading-tight">
                            Invest in{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet">
                                Quality.
                            </span>
                        </h2>
                        <p className="text-gray-400 text-[clamp(0.75rem,1vw,1.1rem)] max-w-2xl mx-auto">
                            Transparent pricing. No hidden fees. Cancel anytime.
                        </p>
                    </div>
                </ScrollReveal>

                {/* Packages Grid - Scrollable on mobile, Fitted on desktop */}
                <div className="flex-1 min-h-0 w-full overflow-y-auto no-scrollbar p-[clamp(0.25rem,1vh,1rem)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-[clamp(0.75rem,1.5vw,1.5rem)] h-full lg:h-auto items-stretch">
                        {packages.map((pkg, index) => (
                            <ScrollReveal key={pkg.name} animation="scale-up" delay={index * 0.1} className="h-full flex flex-col">
                                <div
                                    className={`relative rounded-2xl p-[clamp(1rem,1.5vw,1.5rem)] flex flex-col h-full bg-gradient-to-br ${pkg.gradient} border ${pkg.borderColor} backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-custom-purple/10 ${pkg.popular ? 'ring-2 ring-yellow-500/50' : ''}`}
                                >
                                    {/* Popular badge */}
                                    {pkg.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-[10px] font-bold text-black flex items-center gap-1 shrink-0">
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
                                        {pkg.features.map((feat, i) => (
                                            <div key={i} className="flex items-start gap-2 text-[10px] sm:text-xs text-gray-300">
                                                <Check className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <MagneticButton className="w-full mt-auto shrink-0">
                                        <button className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all ${pkg.popular
                                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-400 hover:to-amber-400 shadow-lg shadow-yellow-500/25'
                                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                                            }`}>
                                            Get Started
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
