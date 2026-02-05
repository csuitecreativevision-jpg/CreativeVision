import { motion } from 'framer-motion';
import { Users, ArrowRight } from 'lucide-react';

interface WorkspaceCardProps {
    name: string;
    itemCount?: number;
    onClick: () => void;
    color?: string;
    index?: number;
}

export const WorkspaceCard = ({ name, itemCount = 0, onClick, color = '#8b5cf6', index = 0 }: WorkspaceCardProps) => {
    // Clean up name (remove "- Workspace" suffix and "(c-w-...)" pattern if present)
    const displayName = name.replace(/- Workspace/i, '').replace(/\(c-w-[\w-]+\)/i, '').trim();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            onClick={onClick}
            className="group relative h-[320px] w-full cursor-pointer perspective-1000"
        >
            {/* Card Container with Glassmorphism */}
            <div className="absolute inset-0 bg-[#0e0e1a]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden transition-all duration-500 group-hover:border-white/30 group-hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] group-hover:translate-y-[-10px]">

                {/* Background Gradient Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div
                    className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-40"
                    style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }}
                />

                {/* Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">

                    {/* Top Section */}
                    <div className="flex justify-between items-start">
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-inner group-hover:bg-white/10 transition-colors">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div className="px-3 py-1 rounded-full bg-black/40 border border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-wider backdrop-blur-md">
                            Workspace
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div>
                        <h3 className="text-3xl font-black text-white uppercase leading-none mb-2 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                            {displayName}
                        </h3>

                        <div className="h-1 w-12 rounded-full bg-white/20 mb-6 group-hover:w-full group-hover:bg-custom-bright transition-all duration-500" />

                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400 font-medium">Active Projects</span>
                                <span className="text-lg font-bold text-white font-mono">{itemCount}</span>
                            </div>

                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-custom-bright group-hover:border-custom-bright transition-all duration-300">
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reflection/Glow underneath */}
            <div
                className="absolute -bottom-4 left-4 right-4 h-4 rounded-[100%] blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"
                style={{ background: color }}
            />
        </motion.div>
    );
};
