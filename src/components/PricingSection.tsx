
import { Check } from 'lucide-react';
import { SpotlightCard } from './ui/SpotlightCard';
import { MagneticButton } from './ui/MagneticButton';
import { ScrollReveal } from './ui/ScrollReveal';

interface PricingSectionProps {
    id?: string;
    className?: string;
}

export default function PricingSection({ id, className }: PricingSectionProps) {
    const packages = [
        {
            name: "Bronze Plan",
            price: 390,
            duration: "monthly",
            description: "Perfect for getting started with professional video editing",
            features: [
                "6 Videos",
                "6 Thumbnails",
                "Customized Editing Style",
                "Quick Turnarounds",
                "Unlimited Revisions"
            ],
            popular: false,
            color: "bronze",
            icon: "🟤"
        },
        {
            name: "Silver Plan",
            price: 780,
            duration: "monthly",
            originalPrice: 870,
            savings: "Save 10%",
            description: "Great value for growing content creators and small businesses",
            features: [
                "12 Videos",
                "12 Thumbnails",
                "Customized Editing Style",
                "Quick Turnarounds",
                "Unlimited revisions"
            ],
            popular: false,
            color: "silver",
            icon: "⚪"
        },
        {
            name: "Gold Plan",
            price: 1600,
            duration: "monthly",
            originalPrice: 1915,
            savings: "Save 15%",
            description: "Professional solution with advanced features and full support",
            features: [
                "25 Videos",
                "25 Thumbnails",
                "Customized Editing Style",
                "Quick Turnarounds",
                "Unlimited revisions",
                "Content Curation",
                "Content Repurposing",
                "Access to Editing Style Inventory",
                "Customized Distribution System",
                "Customized Project Overview System"
            ],
            popular: true,
            color: "gold",
            icon: "🟡"
        },
        {
            name: "Platinum Plan",
            price: 2900,
            duration: "monthly",
            originalPrice: 3660,
            savings: "Save 20%",
            description: "Ultimate package for serious content creators and enterprises",
            features: [
                "45 Videos",
                "45 Thumbnails",
                "Customized Editing Style",
                "Quick Turnarounds",
                "Unlimited Revisions",
                "Content Curation",
                "Content Repurposing",
                "Access to Editing Style Inventory",
                "Customized Distribution System",
                "Customized Project Overview System"
            ],
            popular: false,
            color: "platinum",
            icon: "🟣"
        }
    ];

    return (
        <section id={id} className={`py-12 px-6 relative z-10 ${className} h-screen flex flex-col justify-center`}>
            <div className="max-w-7xl mx-auto">
                <ScrollReveal animation="fade-up">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Pricing Plans</h2>
                        <p className="text-gray-300">Choose the perfect plan for your needs.</p>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full items-center">
                    {packages.map((pkg, index) => (
                        <ScrollReveal key={pkg.name} animation="scale-up" delay={index * 0.1} className="h-full max-h-[600px]">
                            <SpotlightCard
                                className={`rounded-2xl p-6 flex flex-col h-full border-white/10 transition-transform hover:scale-[1.02] ${pkg.popular ? 'bg-custom-purple/10 border-custom-purple/30' : 'bg-black/20'}`}
                                spotlightColor={pkg.popular ? "rgba(116, 36, 245, 0.4)" : "rgba(255, 255, 255, 0.1)"}
                            >
                                {pkg.popular && (
                                    <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-custom-purple/20 border border-custom-purple/50 text-[10px] font-bold text-custom-bright">
                                        POPULAR
                                    </div>
                                )}

                                <div className="mb-4">
                                    <div className="text-3xl mb-2">{pkg.icon}</div>
                                    <h3 className="text-lg font-bold text-white mb-1">{pkg.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-white">${pkg.price}</span>
                                        <span className="text-xs text-gray-500">/{pkg.duration}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6 flex-grow overflow-y-auto custom-scrollbar">
                                    {pkg.features.map((feat, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                                            <Check className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <MagneticButton className="w-full mt-auto">
                                    <button className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${pkg.popular
                                        ? 'bg-custom-bright text-white hover:bg-custom-purple'
                                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                        }`}>
                                        Choose {pkg.name}
                                    </button>
                                </MagneticButton>
                            </SpotlightCard>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
