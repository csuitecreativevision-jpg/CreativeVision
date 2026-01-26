import { ArrowRight, Lightbulb } from 'lucide-react';
import { SpotlightCard } from './ui/SpotlightCard';
import { MagneticButton } from './ui/MagneticButton';
import { ScrollReveal } from './ui/ScrollReveal';

interface StartProjectSectionProps {
    id?: string;
    onViewPackages: () => void;
}

export default function StartProjectSection({ id, onViewPackages }: StartProjectSectionProps) {
    // HMR Trigger
    return (
        <section id={id} className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6">
            <div className="max-w-4xl mx-auto w-full">
                <ScrollReveal animation="fade-up" className="w-full">
                    <SpotlightCard className="p-12 md:p-20 rounded-[3rem] bg-gradient-to-br from-custom-purple/20 via-black/40 to-blue-900/20 border-white/10 text-center backdrop-blur-3xl overflow-hidden relative group">

                        {/* Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(116,36,245,0.15)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                        <Lightbulb className="w-20 h-20 text-custom-bright mx-auto mb-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />

                        <h2 className="text-4xl md:text-7xl font-bold text-white mb-8 leading-[1.1] tracking-tight">
                            Have a Vision? <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet">Let's Build It.</span>
                        </h2>

                        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Don't let your ideas stay in your head. We turn abstract concepts into high-converting visual assets.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <MagneticButton className="min-w-[200px]">
                                <button
                                    onClick={onViewPackages}
                                    className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black text-lg font-bold rounded-full hover:bg-gray-200 transition-colors shadow-xl shadow-white/10"
                                >
                                    View Packages <ArrowRight className="w-5 h-5" />
                                </button>
                            </MagneticButton>
                        </div>
                    </SpotlightCard>
                </ScrollReveal>
            </div>
        </section>
    );
}
