import { motion, Variants } from 'framer-motion';
import { Check, Sparkles, ChevronRight } from 'lucide-react';
import { MagneticButton } from './ui/MagneticButton';
import { PricingPackage } from '../data/pricingData';

interface PlanShowcaseProps {
    packageData: PricingPackage;
    onNext: () => void;
    onSelect?: () => void;
}

export default function PlanShowcase({ packageData, onNext, onSelect }: PlanShowcaseProps) {
    // Animation variants
    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
    };

    return (
        <section className="w-screen h-[100svh] flex-shrink-0 flex items-center justify-center relative overflow-hidden bg-[#050511] px-[clamp(1rem,3vw,2.5rem)] pt-0 select-none">

            {/* Immersive Background */}
            {/* Main Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${packageData.gradient} opacity-40 mix-blend-screen pointer-events-none transition-all duration-1000`} />

            {/* Animated Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] rounded-full blur-[150px] pointer-events-none"
                style={{ background: packageData.themeColor, opacity: 0.15 }}
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    x: [0, 50, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[150px] pointer-events-none"
                style={{ background: packageData.themeColor, opacity: 0.1 }}
            />

            {/* Content Container */}
            <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: false, amount: 0.3 }}
                className="relative z-10 max-w-7xl w-full flex flex-col md:flex-row gap-[clamp(1rem,2vh,4rem)] items-center justify-center h-full md:h-auto"
            >

                {/* Visual / Hook Side (Left) */}
                <div className="w-full md:flex-1 text-center md:text-left relative flex flex-col items-center md:items-start justify-center group-text">
                    {/* Giant Behind Text Background - Now visible on mobile too */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[25vw] md:text-[20vw] font-black text-white/5 whitespace-nowrap pointer-events-none select-none uppercase tracking-tighter z-0">
                        {packageData.name}
                    </div>

                    <motion.div variants={itemVariants} className="relative z-10 inline-block mb-[clamp(0.5rem,1vh,1.5rem)]">
                        <div className={`w-[clamp(4rem,8vw,6rem)] h-[clamp(4rem,8vw,6rem)] rounded-2xl md:rounded-3xl bg-gradient-to-br ${packageData.iconGradient} flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/20 mx-auto md:mx-0 backdrop-blur-lg`}>
                            <span className="text-3xl md:text-5xl font-bold text-white drop-shadow-md">{packageData.name.charAt(0)}</span>
                        </div>
                        {packageData.popular && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-3 -right-3 md:-top-4 md:-right-8 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black text-[10px] md:text-xs shadow-lg border border-yellow-200 flex items-center gap-1 z-20 whitespace-nowrap"
                            >
                                <Sparkles className="w-2 h-2 md:w-3 md:h-3 fill-current" /> BEST VALUE
                            </motion.div>
                        )}
                    </motion.div>

                    <motion.h2 variants={itemVariants} className="text-[clamp(2.5rem,5vw,6rem)] font-black text-white mb-[0.5rem] leading-[0.9] tracking-tight text-glow">
                        <span className="block text-[clamp(1rem,1.5vw,1.8rem)] font-bold tracking-widest uppercase opacity-60 mb-1">{packageData.name} Plan</span>
                        {packageData.headline}
                    </motion.h2>

                    <motion.p variants={itemVariants} className="text-[clamp(0.875rem,1.5vw,1.25rem)] text-gray-300 mb-[1rem] max-w-lg mx-auto md:mx-0 font-light leading-relaxed px-4 md:px-0">
                        {packageData.description}
                    </motion.p>
                </div>

                {/* Details Card (Right) */}
                <motion.div
                    variants={itemVariants}
                    className="flex-shrink-0 w-full max-w-md bg-white/5 border border-white/10 rounded-2xl md:rounded-[2.5rem] p-[clamp(1.25rem,2vw,2.5rem)] backdrop-blur-xl shadow-2xl relative group overflow-hidden flex flex-col md:flex-none min-h-0"
                >
                    {/* Hover Glow */}
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none"
                        style={{ background: `radial-gradient(circle at 50% 0%, ${packageData.themeColor}, transparent 70%)` }}
                    />

                    {/* Price Block */}
                    <div className="flex items-end gap-2 mb-[clamp(1rem,2vh,2rem)] pb-[clamp(1rem,2vh,2rem)] border-b border-white/10 relative z-10 shrink-0">
                        <span className="text-[clamp(3rem,4vw,4.5rem)] font-bold text-white tracking-tighter leading-none">${packageData.price}</span>
                        <div className="flex flex-col mb-1">
                            {packageData.originalPrice && (
                                <span className="text-sm md:text-lg text-gray-500 line-through decoration-red-500/50">${packageData.originalPrice}</span>
                            )}
                            <span className="text-sm md:text-xl text-gray-400 font-medium">/{packageData.duration}</span>
                        </div>
                        {packageData.savings && (
                            <span className="ml-auto px-2 py-1 bg-white/10 rounded-lg text-[10px] md:text-xs font-bold text-green-400 border border-green-500/30">
                                {packageData.savings}
                            </span>
                        )}
                    </div>

                    {/* Features List */}
                    <ul className="space-y-2 md:space-y-4 mb-[clamp(1rem,2.5vh,2.5rem)] flex-1 min-h-[100px] overflow-y-auto no-scrollbar relative z-10 pr-2">
                        {packageData.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-3 md:gap-4">
                                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-white/5 border border-white/10`}>
                                    <Check className="w-3 h-3 md:w-3.5 h-3.5" style={{ color: packageData.themeColor }} />
                                </div>
                                <span className="text-xs md:text-base text-gray-300 font-medium">{feat}</span>
                            </li>
                        ))}
                    </ul>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 md:gap-4 relative z-10 shrink-0">
                        <MagneticButton className="w-full">
                            <button
                                onClick={onNext}
                                className="w-full py-3 md:py-4 rounded-xl md:rounded-2xl text-black font-bold text-sm md:text-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 md:gap-3 shadow-lg group-hover:scale-[1.02] active:scale-[0.98]"
                                style={{ background: packageData.themeColor }}
                            >
                                Explore Next Level <ChevronRight className="w-4 h-4 md:w-5 h-5" />
                            </button>
                        </MagneticButton>

                        {onSelect && (
                            <button
                                onClick={onSelect}
                                className="w-full py-3 md:py-4 rounded-xl md:rounded-2xl border border-white/10 text-white/70 font-medium hover:text-white hover:bg-white/5 hover:border-white/30 transition-all text-xs md:text-sm uppercase tracking-wider"
                            >
                                View Full Comparison
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* Bottom Scroll/Swipe Hint */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-xs uppercase tracking-[0.2em] animate-pulse flex flex-col items-center gap-2 md:hidden"
            >
                Swipe for more
            </motion.div>
        </section>
    );
}
