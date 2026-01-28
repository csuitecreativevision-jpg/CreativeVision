import { motion, Variants } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { MagneticButton } from '../ui/MagneticButton';

interface ExperienceIntroProps {
    onNext: () => void;
}

export default function ExperienceIntro({ onNext }: ExperienceIntroProps) {
    const fadeIn: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <section className="w-screen h-[100svh] flex-shrink-0 flex flex-col items-center justify-center relative overflow-hidden bg-[#050511] px-[clamp(1.5rem,5vw,5rem)] text-center">

            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-custom-purple/20 via-custom-bg to-custom-bg opacity-30 pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center justify-center h-full">

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="mb-8"
                >
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-custom-bright animate-pulse" />
                    </div>
                </motion.div>

                <motion.h2
                    variants={fadeIn}
                    initial="hidden"
                    whileInView="visible"
                    className="text-[clamp(2rem,5vw,4.5rem)] font-bold text-white leading-tight mb-8"
                >
                    We don't just sell plans.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet">
                        We sell an experience.
                    </span>
                </motion.h2>

                <motion.p
                    variants={fadeIn}
                    initial="hidden"
                    whileInView="visible"
                    transition={{ delay: 0.2 }}
                    className="text-[clamp(1rem,1.5vw,1.25rem)] text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
                >
                    Every detail acts as a leverage point. Every frame is calculated.
                    Choose the level of impact you are ready for.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <MagneticButton>
                        <button
                            onClick={onNext}
                            className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-colors flex items-center gap-3 text-lg"
                        >
                            Begin Selection <ArrowRight className="w-5 h-5" />
                        </button>
                    </MagneticButton>
                </motion.div>

            </div>
        </section>
    );
}
