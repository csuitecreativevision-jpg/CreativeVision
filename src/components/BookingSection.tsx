import { Calendar } from 'lucide-react';
import { SpotlightCard } from './ui/SpotlightCard';
import { MagneticButton } from './ui/MagneticButton';
import { ScrollReveal } from './ui/ScrollReveal';

interface BookingSectionProps {
    id?: string;
}

export default function BookingSection({ id }: BookingSectionProps) {
    return (
        <section id={id} className="relative z-10 w-full max-w-4xl mx-auto px-6 flex flex-col items-center justify-center h-full">
            <ScrollReveal animation="fade-up" className="w-full">
                <SpotlightCard className="p-12 rounded-3xl bg-gradient-to-br from-custom-purple/20 to-blue-900/20 border-white/10 text-center backdrop-blur-xl">
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
        </section>
    );
}
