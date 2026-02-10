import { motion } from 'framer-motion';
import { ArrowUpRight, Calendar, Clock, Sparkles } from 'lucide-react';
import { forwardRef } from 'react';

interface ProjectCardProps {
    name: string;
    status?: string;
    cycle?: string;
    date?: string;
    color?: string;
    onClick?: () => void;
    index?: number;
}

export const ProjectCard = forwardRef<HTMLDivElement, ProjectCardProps>((
    {
        name,
        status = 'Active',
        cycle,
        date,
        color = '#8b5cf6',
        onClick,
        index = 0
    },
    ref
) => {
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="group relative cursor-pointer"
        >
            {/* Glow Effect */}
            <div
                className="absolute -inset-0.5 bg-gradient-to-br from-white/20 to-white/0 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"
                style={{ background: `linear-gradient(to bottom right, ${color}40, transparent)` }}
            />

            {/* Card Content */}
            <div className="relative h-full bg-[#0E0E1A]/90 backdrop-blur-xl border border-white/5 rounded-2xl p-5 flex flex-col justify-between overflow-hidden group-hover:border-white/10 transition-all duration-300">

                {/* Background Gradient Mesh */}
                <div
                    className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"
                    style={{ background: color }}
                />

                {/* Header */}
                <div className="flex justify-between items-start z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/5 flex items-center justify-center text-white shadow-lg group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all">
                        <Sparkles className="w-5 h-5 opacity-70 group-hover:opacity-100" style={{ color }} />
                    </div>
                    {cycle && (
                        <div className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {cycle}
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="mt-8 z-10">
                    <h3 className="text-xl font-black text-white leading-tight line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                        {name}
                    </h3>

                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse`} style={{ backgroundColor: color }} />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{status}</span>
                        </div>

                        {date && (
                            <div className="text-[10px] text-gray-600 font-mono flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {date}
                            </div>
                        )}
                    </div>
                </div>

                {/* Hover Action */}
                <div className="absolute top-4 right-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ArrowUpRight className="w-5 h-5 text-white" />
                </div>
            </div>
        </motion.div>
    );
});

ProjectCard.displayName = 'ProjectCard';
