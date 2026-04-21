import { motion } from 'framer-motion';
import { Calendar, ArrowUpRight } from 'lucide-react';
import { forwardRef } from 'react';

interface ProjectCardProps {
    name: string;
    status?: string;
    cycle?: string;
    date?: string;
    color?: string;
    onClick?: () => void;
    index?: number;
    emphasizeDeadline?: boolean;
}

// Maps a status string → a semantic color if Monday's own color isn't available
const getStatusMeta = (status: string, brandColor: string) => {
    const s = status.toLowerCase();
    if (s.includes('approved') || s.includes('done') || s.includes('complete'))
        return { bg: '#10b981', text: '#fff' };
    if (s.includes('revision') || s.includes('change') || s.includes('sent for'))
        return { bg: '#ef4444', text: '#fff' };
    if (s.includes('progress') || s.includes('working') || s.includes('assigned'))
        return { bg: '#3b82f6', text: '#fff' };
    if (s.includes('review') || s.includes('approval') || s.includes('for approval'))
        return { bg: '#8b5cf6', text: '#fff' };
    if (s.includes('waiting') || s.includes('client'))
        return { bg: '#f59e0b', text: '#fff' };
    if (s.includes('new') || s.includes('open') || s.includes('unassigned'))
        return { bg: '#06b6d4', text: '#fff' };
    if (s.includes('stuck') || s.includes('hold'))
        return { bg: '#64748b', text: '#fff' };
    // Fallback to the brand color passed in from Monday
    return { bg: brandColor, text: '#fff' };
};

export const ProjectCard = forwardRef<HTMLDivElement, ProjectCardProps>((
    {
        name,
        status = 'Active',
        cycle,
        date,
        color = '#8b5cf6',
        onClick,
        index = 0,
        emphasizeDeadline = false
    },
    ref
) => {
    const { bg: statusBg } = getStatusMeta(status, color);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.995 }}
            onClick={onClick}
            className="group relative cursor-pointer"
        >
            <div className="relative flex items-center gap-4 px-5 py-4 bg-white/[0.02] hover:bg-white/[0.045] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl transition-all duration-200 hover:translate-x-0.5">

                {/* Left accent bar — uses the Monday brand color */}
                <div
                    className="w-1 h-10 rounded-full flex-shrink-0 transition-all duration-300 group-hover:h-12"
                    style={{ background: `linear-gradient(to bottom, ${color}, ${color}22)` }}
                />

                {/* Main info */}
                <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-white/80 group-hover:text-white truncate leading-tight transition-colors duration-150">
                        {name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        {cycle && (
                            <>
                                <span className="text-[10px] text-white/25 font-medium">{cycle}</span>
                                <span className="text-white/10">·</span>
                            </>
                        )}
                        {date && (
                            <span
                                className={`font-semibold flex items-center gap-1 ${emphasizeDeadline ? 'text-[12px] text-amber-300/95' : 'text-[10px] text-white/25'}`}
                            >
                                <Calendar className={emphasizeDeadline ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} />
                                {emphasizeDeadline ? `Deadline: ${date}` : date}
                            </span>
                        )}
                    </div>
                </div>

                {/* Status pill — only shown when we have a real status string */}
                {status && (
                    <div
                        className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                        style={{ background: `${statusBg}20`, color: statusBg, border: `1px solid ${statusBg}35` }}
                    >
                        {status}
                    </div>
                )}

                {/* Arrow */}
                <ArrowUpRight className="w-4 h-4 text-white/10 group-hover:text-white/50 flex-shrink-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
        </motion.div>
    );
});

ProjectCard.displayName = 'ProjectCard';
