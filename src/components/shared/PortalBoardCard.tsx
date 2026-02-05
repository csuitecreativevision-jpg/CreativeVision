import { motion } from 'framer-motion';
import { ArrowRight, Briefcase } from 'lucide-react';

interface PortalBoardCardProps {
    name: string;
    itemCount?: number;
    onClick: () => void;
    color?: string;
    index?: number;
}

export const PortalBoardCard = ({ name, itemCount = 0, onClick, color = '#8b5cf6', index = 0 }: PortalBoardCardProps) => {
    // Clean up name
    const displayName = name
        .replace(/fulfillment board/i, '')
        .replace(/fullfilment board/i, '')
        .replace(/\(inactive\)/i, '')
        .replace(/\(CF.*?\)/i, '')
        .replace(/\(C-F.*?\)/i, '')
        .replace(/-/g, ' ')
        .trim();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            onClick={onClick}
            className="group relative h-[320px] w-full cursor-pointer perspective-1000"
        >
            {/* Card Container with Glassmorphism */}
            <div className="absolute inset-0 bg-[#0e0e1a]/40 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden transition-all duration-500 group-hover:border-white/20 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.05)] group-hover:bg-[#0e0e1a]/60">

                {/* Background Gradient Effect */}
                <div
                    className="absolute inset-0 opacity-10 transition-opacity duration-500 group-hover:opacity-20"
                    style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }}
                />

                {/* Content */}
                <div className="absolute inset-0 p-10 flex flex-col justify-between z-10">

                    {/* Top Section */}
                    <div className="flex justify-between items-start">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm group-hover:bg-white/10 transition-colors">
                            <Briefcase className="w-6 h-6 text-white/70" />
                        </div>
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-widest backdrop-blur-md">
                            Workspace
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="space-y-6">
                        <h3 className="text-3xl font-black text-white uppercase leading-[0.9] tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/40 transition-all duration-500">
                            {displayName}
                        </h3>

                        <div className="flex items-end justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Projects</span>
                                <div className="text-2xl font-black text-white font-mono leading-none">{itemCount}</div>
                            </div>

                            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                                <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
