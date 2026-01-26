
import { Check, Calendar } from 'lucide-react';
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {packages.map((pkg, index) => (
                        <ScrollReveal key={pkg.name} animation="scale-up" delay={index * 0.1}>
                            <SpotlightCard
                                className={`rounded-3xl p-8 flex flex-col h-full border-white/10 ${pkg.popular ? 'bg-custom-purple/10 border-custom-purple/30' : 'bg-black/20'}`}
                                spotlightColor={pkg.popular ? "rgba(116, 36, 245, 0.4)" : "rgba(255, 255, 255, 0.1)"}
                            >
                                {pkg.popular && (
                                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-custom-purple/20 border border-custom-purple/50 text-xs font-bold text-custom-bright">
                                        POPULAR
                                    </div>
                                )}

                                <div className="mb-6">
                                    <div className="text-4xl mb-4">{pkg.icon}</div>
                                    <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-white">${pkg.price}</span>
                                        <span className="text-sm text-gray-500">/{pkg.duration}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8 flex-grow">
                                    {pkg.features.map((feat, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                            <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <MagneticButton className="w-full">
                                    <button className={`w-full py-3 rounded-xl font-bold transition-all ${pkg.popular
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

                {/* Booking CTA */}
                <ScrollReveal animation="fade-up" delay={0.4} className="mt-24 max-w-4xl mx-auto">
                    <SpotlightCard className="p-12 rounded-3xl bg-gradient-to-br from-custom-purple/20 to-blue-900/20 border-white/10 text-center">
                        <Calendar className="w-16 h-16 text-custom-bright mx-auto mb-6" />
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Scale?</h2>
                        <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto">
                            Book a free 30-minute consultation. No commitment, just value.
                        </p>
                        <MagneticButton className="inline-block">
                            <a
                                href="https://calendly.com/creativevision"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Calendar className="w-5 h-5" /> Book Consultation
                            </a>
                        </MagneticButton>
                    </SpotlightCard>
                </ScrollReveal>
            </div>
        </section>
    );
}
