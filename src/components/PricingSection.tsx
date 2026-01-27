
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
        <section id={id} className={`w-screen min-h-screen flex-shrink-0 flex items-center justify-center relative overflow-hidden py-20 px-6 ${className}`}>
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-custom-purple/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-custom-blue/10 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-[1600px] mx-auto relative z-10">
                <ScrollReveal animation="fade-up">
                    <div className="text-center mb-16">
                        {/* Pill badge like other sections */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-custom-bright" />
                            <span className="text-xs font-medium text-gray-300">Pricing</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
                            Invest in{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet">
                                Quality.
                            </span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Transparent pricing. No hidden fees. Cancel anytime.
                        </p>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {packages.map((pkg, index) => (
                        <ScrollReveal key={pkg.name} animation="scale-up" delay={index * 0.1} className="h-full">
                            <div
                                className={`relative rounded-2xl p-6 flex flex-col h-full bg-gradient-to-br ${pkg.gradient} border ${pkg.borderColor} backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-custom-purple/10 ${pkg.popular ? 'ring-2 ring-yellow-500/50' : ''}`}
                            >
                                {/* Popular badge */}
                                {pkg.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-xs font-bold text-black flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> MOST POPULAR
                                    </div>
                                )}

                                {/* Savings badge - Commented out for future use
                                {pkg.savings && (
                                    <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/50 text-[10px] font-bold text-green-400">
                                        {pkg.savings}
                                    </div>
                                )}
                                */}

                                <div className="mb-4">
                                    {/* Plan icon */}
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pkg.iconGradient} flex items-center justify-center mb-3 shadow-lg`}>
                                        <span className="text-white font-bold text-base">{pkg.name.charAt(0)}</span>
                                    </div>

                                    <h3 className="text-lg font-bold text-white mb-1">{pkg.name}</h3>
                                    <p className="text-gray-400 text-xs mb-3">{pkg.description}</p>

                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-white">${pkg.price}</span>
                                        <span className="text-sm text-gray-500">/{pkg.duration}</span>
                                    </div>
                                    {pkg.originalPrice && (
                                        <div className="text-xs text-gray-500 line-through mt-1">${pkg.originalPrice}/month</div>
                                    )}
                                </div>

                                <div className="space-y-2 mb-6 flex-grow">
                                    {pkg.features.map((feat, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                                            <Check className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <MagneticButton className="w-full mt-auto">
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
        </section>
    );
}
