import { motion } from 'framer-motion';
import { ArrowRight, Briefcase } from 'lucide-react';

interface PortalBoardCardProps {
    name: string;
    itemCount?: number;
    onClick: () => void;
    color?: string;
    index?: number;
}

export const PortalBoardCard = ({
    name,
    itemCount = 0,
    onClick,
    color = '#8b5cf6',
    index = 0,
}: PortalBoardCardProps) => {
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClick}
            className="group relative cursor-pointer"
        >
            <div className="flex items-center gap-4 px-5 py-4 bg-white/[0.02] hover:bg-white/[0.045] border border-white/[0.06] hover:border-violet-500/25 rounded-2xl transition-all duration-200 hover:translate-x-0.5 hover:shadow-[0_4px_24px_rgba(139,92,246,0.07)]">

                {/* Left color bar */}
                <div
                    className="w-[3px] h-9 rounded-full flex-shrink-0 transition-all duration-300 group-hover:h-12 group-hover:opacity-90"
                    style={{ background: `linear-gradient(to bottom, ${color}, ${color}55)`, opacity: 0.5 }}
                />

                {/* Icon */}
                <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.07] transition-colors duration-200">
                    <Briefcase className="w-3.5 h-3.5 text-white/35 group-hover:text-white/60 transition-colors duration-200" />
                </div>

                {/* Name + label */}
                <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-white/80 group-hover:text-white truncate transition-colors duration-200 leading-tight capitalize">
                        {displayName}
                    </div>
                    <div className="text-[10px] text-white/25 font-medium mt-0.5">Client project space</div>
                </div>

                {/* Count */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/35 font-mono font-bold group-hover:text-white/55 transition-colors duration-200">
                        {itemCount}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-white/15 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all duration-200" />
                </div>
            </div>
        </motion.div>
    );
};
