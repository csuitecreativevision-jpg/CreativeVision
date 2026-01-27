import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { AlertTriangle, TrendingDown, Clock, Eye } from 'lucide-react';

const problems = [
    {
        icon: TrendingDown,
        stat: '87%',
        label: 'of videos fail to convert',
        description: 'Poor hooks, weak pacing, amateur edits.'
    },
    {
        icon: Clock,
        stat: '3 sec',
        label: 'to capture attention',
        description: 'Most brands lose viewers before the message lands.'
    },
    {
        icon: Eye,
        stat: '10x',
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

            <div className="relative z-10 max-w-6xl w-full px-6 flex flex-col items-center">

                {/* Alert Badge - Brand Aligned */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
                >
                    <AlertTriangle className="w-4 h-4 text-custom-bright" />
                    <span className="text-sm font-medium text-gray-300 uppercase tracking-widest">Reality Check</span>
                </motion.div>

                {/* Main Headline */}
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-4xl md:text-6xl lg:text-7xl font-bold text-center leading-tight mb-6"
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
                    className="text-gray-400 text-lg md:text-xl text-center max-w-2xl mb-16"
                >
                    You're paying for production, ads, and distribution—but your videos aren't converting. Here's why.
                </motion.p>

                {/* Problem Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    {problems.map((problem, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                            transition={{ duration: 0.6, delay: 0.4 + index * 0.15 }}
                            className="group p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-custom-bright/30 transition-all duration-500"
                        >
                            <div className="w-12 h-12 rounded-xl bg-custom-bright/10 flex items-center justify-center mb-6 group-hover:bg-custom-bright/20 transition-colors">
                                <problem.icon className="w-6 h-6 text-custom-bright" />
                            </div>
                            <div className="text-4xl font-bold text-white mb-1">{problem.stat}</div>
                            <div className="text-sm text-custom-violet font-medium uppercase tracking-wide mb-3">{problem.label}</div>
                            <p className="text-gray-500 text-sm">{problem.description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Transition hint */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="text-gray-600 text-base mt-16 text-center"
                >
                    But it doesn't have to be this way →
                </motion.p>

            </div>
        </section>
    );
}
