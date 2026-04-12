import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { AlertTriangle, TrendingDown, Clock, Eye } from 'lucide-react';
import { CountingNumber } from '../ui/CountingNumber';

const problems = [
    {
        icon: TrendingDown,
        value: 87,
        suffix: '%',
        label: 'of videos fail to convert',
        description: 'Poor hooks, weak pacing, amateur edits.'
    },
    {
        icon: Clock,
        value: 3,
        suffix: ' sec',
        label: 'to capture attention',
        description: 'Most brands lose viewers before the message lands.'
    },
    {
        icon: Eye,
        value: 10,
        suffix: 'x',
        label: 'cost of bad content',
        description: 'Missed ads, lost leads, wasted production budgets.'
    }
];

export default function ProblemSection() {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: false, margin: "-20%" });

    return (
        <section
            ref={containerRef}
            className="w-screen h-screen flex-shrink-0 flex items-center justify-center bg-[#050511] relative overflow-hidden"
        >
            {/* Dramatic Background - Brand Aligned */}
            <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-custom-purple/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-custom-blue/5 rounded-full blur-[120px]" />
                {/* Subtle dark overlay to differentiate from Hero */}
                <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Subtle grid overlay for tension */}
            <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '60px 60px'
            }} />

            <div className="relative z-10 max-w-5xl w-full px-[clamp(1rem,3vw,2rem)] flex flex-col items-center justify-center h-full py-[clamp(0.5rem,2vh,2rem)]">

                {/* Alert Badge - Brand Aligned */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-[clamp(0.25rem,1.5vh,1.5rem)] shrink-0"
                >
                    <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-custom-bright" />
                    <span className="text-[clamp(0.6rem,1vw,0.875rem)] font-medium text-gray-300 uppercase tracking-widest">Reality Check</span>
                </motion.div>

                {/* Main Headline */}
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-[clamp(1.75rem,4vw,5rem)] font-bold text-center leading-none md:leading-tight mb-[clamp(0.25rem,1.5vh,1rem)] shrink-0"
                >
                    <span className="text-white">Your content is </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet">
                        bleeding money.
                    </span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-gray-400 text-[clamp(0.8rem,1.5vw,1.25rem)] text-center max-w-2xl mb-[clamp(0.5rem,2.5vh,2rem)] shrink-0 hidden md:block" // Hide description on very small screens if absolutely necessary? No, try to keep it but smaller.
                >
                    You're paying for production, ads, and distribution—but your videos aren't converting. Here's why.
                </motion.p>
                {/* Mobile version of p above to save space? actually just clamp it. I'll keep it visible but tight. */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-gray-400 text-[clamp(0.75rem,1.2vw,1.25rem)] text-center max-w-2xl mb-[clamp(0.5rem,2vh,2rem)] shrink-0 md:hidden"
                >
                    Videos not converting? Here's why.
                </motion.p>

                {/* Problem Cards - Elastic Grid */}
                <div className="flex flex-col md:grid md:grid-cols-3 gap-[clamp(0.25rem,1.5vw,1.5rem)] w-full flex-1 min-h-0 md:flex-none md:h-auto overflow-y-auto md:overflow-visible no-scrollbar">
                    {problems.map((problem, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                            transition={{ duration: 0.6, delay: 0.4 + index * 0.15 }}
                            className="group p-[clamp(0.75rem,2vw,2rem)] rounded-xl md:rounded-2xl bg-white/[0.02] border border-white/5 hover:border-custom-bright/30 transition-all duration-500 flex flex-row md:flex-col items-center md:justify-center gap-4 md:gap-0 h-full md:h-auto"
                        >
                            {/* Make card horizontal on mobile for density? */}
                            {/* The user wants checks "box" look. Vertical stack of boxes. 
                                By making them flex-row on mobile, we save vertical space (Icon side-by-side with text).
                                Let's try FLEX ROW on mobile.
                            */}
                            <div className="w-[clamp(2rem,4vw,3rem)] h-[clamp(2rem,4vw,3rem)] rounded-lg md:rounded-xl bg-custom-bright/10 flex items-center justify-center md:mb-[clamp(0.5rem,1.5vh,1.5rem)] group-hover:bg-custom-bright/20 transition-colors shrink-0">
                                <problem.icon className="w-[clamp(1rem,2vw,1.5rem)] h-[clamp(1rem,2vw,1.5rem)] text-custom-bright" />
                            </div>

                            <div className="flex flex-col items-start md:items-center text-left md:text-center flex-1 min-w-0">
                                <div className="text-[clamp(1.5rem,4vw,3rem)] font-bold text-white mb-0 md:mb-1 shrink-0 leading-none">
                                    <CountingNumber value={problem.value} suffix={problem.suffix} />
                                </div>
                                <div className="text-[clamp(0.5rem,0.9vw,0.875rem)] text-custom-violet font-medium uppercase tracking-wide mb-0.5 md:mb-2 shrink-0">{problem.label}</div>
                                <p className="text-gray-500 text-[clamp(0.65rem,1vw,0.875rem)] leading-tight line-clamp-2 md:line-clamp-none">{problem.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Transition hint */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="text-gray-600 text-[clamp(0.7rem,1vw,1rem)] mt-[clamp(0.5rem,2vh,2rem)] text-center shrink-0"
                >
                    But it doesn't have to be this way →
                </motion.p>

            </div>
        </section>
    );
}
