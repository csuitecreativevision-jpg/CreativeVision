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

            <div className="relative z-10 max-w-5xl w-full px-[clamp(1rem,3vw,2rem)] flex flex-col items-center justify-center h-full py-[clamp(1rem,4vh,2rem)]">

                {/* Alert Badge - Brand Aligned */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-[clamp(0.5rem,2vh,1.5rem)] shrink-0"
                >
                    <AlertTriangle className="w-4 h-4 text-custom-bright" />
                    <span className="text-[clamp(0.7rem,1vw,0.875rem)] font-medium text-gray-300 uppercase tracking-widest">Reality Check</span>
                </motion.div>

                {/* Main Headline */}
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-[clamp(2.5rem,5vw,5rem)] font-bold text-center leading-tight mb-[clamp(0.25rem,1vh,1rem)] shrink-0"
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
                    className="text-gray-400 text-[clamp(1rem,1.5vw,1.25rem)] text-center max-w-2xl mb-[clamp(1rem,3vh,2rem)] shrink-0"
                >
                    You're paying for production, ads, and distribution—but your videos aren't converting. Here's why.
                </motion.p>

                {/* Problem Cards - Elastic Grid */}
                <div className="flex flex-col md:grid md:grid-cols-3 gap-[clamp(0.5rem,1.5vw,1.5rem)] w-full flex-1 min-h-0 md:flex-none md:h-auto">
                    {problems.map((problem, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                            transition={{ duration: 0.6, delay: 0.4 + index * 0.15 }}
                            className="group p-[clamp(1rem,2vw,2rem)] rounded-2xl bg-white/[0.02] border border-white/5 hover:border-custom-bright/30 transition-all duration-500 flex flex-col justify-center h-full"
                        >
                            <div className="w-[clamp(2.5rem,4vw,3rem)] h-[clamp(2.5rem,4vw,3rem)] rounded-xl bg-custom-bright/10 flex items-center justify-center mb-[clamp(0.5rem,1.5vh,1.5rem)] group-hover:bg-custom-bright/20 transition-colors shrink-0">
                                <problem.icon className="w-[clamp(1.25rem,2vw,1.5rem)] h-[clamp(1.25rem,2vw,1.5rem)] text-custom-bright" />
                            </div>
                            <div className="text-[clamp(2rem,4vw,3rem)] font-bold text-white mb-1 shrink-0">
                                <CountingNumber value={problem.value} suffix={problem.suffix} />
                            </div>
                            <div className="text-[clamp(0.6rem,0.9vw,0.875rem)] text-custom-violet font-medium uppercase tracking-wide mb-2 shrink-0">{problem.label}</div>
                            <p className="text-gray-500 text-[clamp(0.75rem,1vw,0.875rem)] line-clamp-3 md:line-clamp-none">{problem.description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Transition hint */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="text-gray-600 text-[clamp(0.8rem,1vw,1rem)] mt-[clamp(1rem,2vh,2rem)] text-center shrink-0"
                >
                    But it doesn't have to be this way →
                </motion.p>

            </div>
        </section>
    );
}
