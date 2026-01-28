import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CountingNumber } from '../ui/CountingNumber';

const stats = [
    { value: 250, suffix: 'M+', label: 'Views Generated' },
    { value: 24, suffix: 'h', label: 'Turnaround Time' },
    { value: 98, suffix: '%', label: 'Retention Rate' },
    { value: 2, suffix: 'x', label: 'Average ROI' },
];

const logos = [
    "Google", "Spotify", "Netflix", "Adobe", "Nike", "RedBull" // Placeholders - in real world use SVGs
];

export default function TrustSignals() {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: false, margin: "-20%" });

    return (
        <section ref={containerRef} className="w-screen h-[100svh] flex-shrink-0 flex items-center justify-center bg-[#050511] relative overflow-hidden">

            {/* Background Glow */}
            <div className="absolute inset-0 bg-custom-bg">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-custom-purple/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl w-full px-[clamp(1rem,3vw,2rem)] flex flex-col items-center justify-center h-full py-[clamp(1rem,3vh,3rem)] gap-[clamp(1rem,4vh,4rem)]">

                {/* Intro */}
                <div className="text-center shrink-0">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.8 }}
                        className="text-[clamp(1.75rem,4vw,3rem)] md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 mb-[clamp(0.5rem,1.5vh,1.5rem)]"
                    >
                        Trusted by the world's best.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-gray-400 text-[clamp(0.7rem,1vw,1.125rem)] text-lg uppercase tracking-widest"
                    >
                        Delivering impact at scale
                    </motion.p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-[clamp(0.5rem,2vw,2rem)] w-full flex-1 min-h-0 md:flex-none md:h-auto items-center">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.5, delay: index * 0.1 + 0.4 }}
                            className="p-[clamp(1rem,2vw,2rem)] rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors backdrop-blur-sm text-center group h-full flex flex-col justify-center"
                        >
                            <h3 className="text-[clamp(2rem,4vw,3.5rem)] md:text-5xl font-bold text-white mb-1 md:mb-2 group-hover:text-custom-bright transition-colors">
                                <CountingNumber value={stat.value} suffix={stat.suffix} />
                            </h3>
                            <p className="text-[clamp(0.6rem,0.8vw,0.875rem)] text-sm text-gray-400 font-medium uppercase tracking-wide">
                                {stat.label}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Logos Marquee (Static representation for layout, animation would be ideal) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 0.5 } : { opacity: 0 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="flex flex-wrap justify-center gap-[clamp(1rem,3vw,3rem)] items-center grayscale opacity-50 hover:opacity-100 transition-opacity duration-500 shrink-0 mb-[clamp(0.5rem,2vh,2rem)]"
                >
                    {logos.map((logo, i) => (
                        <span key={i} className="text-[clamp(0.9rem,1.5vw,1.25rem)] text-xl font-bold text-white/40 hover:text-white transition-colors cursor-default">{logo}</span>
                    ))}
                </motion.div>

            </div>
        </section>
    );
}
