import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface SidebarItemProps {
    icon: ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
    isClientItem?: boolean;
    indent?: boolean;
}

/** Section label divider — use between groups of nav items */
export const SidebarSectionLabel = ({ label }: { label: string }) => (
    <div className="px-3 pt-5 pb-1.5 first:pt-2">
        <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-white/18" style={{ color: 'rgba(255,255,255,0.18)' }}>
            {label}
        </span>
    </div>
);

export const SidebarItem = ({
    icon,
    label,
    active = false,
    onClick,
    isClientItem = false,
    indent = false,
}: SidebarItemProps) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.975 }}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 group relative ${
            indent ? 'pl-3' : ''
        } ${active ? 'text-white' : 'text-white/35 hover:text-white/70'}`}
    >
        {/* Active pill background */}
        {active && (
            <motion.div
                layoutId={isClientItem ? 'client-active-bg' : 'active-bg'}
                className="absolute inset-0 rounded-xl bg-white/[0.06] border border-white/[0.08]"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
        )}

        {/* Hover background */}
        {!active && (
            <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/[0.035] transition-colors duration-150" />
        )}

        {/* Left glow bar */}
        {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-violet-400 to-violet-600/50 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
        )}

        {/* Icon */}
        <span className={`relative z-10 flex-shrink-0 transition-colors duration-150 ${
            active ? 'text-violet-400' : 'text-white/25 group-hover:text-white/50'
        }`}>
            {icon}
        </span>

        {/* Label */}
        <span className={`relative z-10 text-[12.5px] leading-none whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left transition-colors duration-150 ${
            active ? 'font-semibold text-white' : 'font-medium'
        }`}>
            {label}
        </span>

        {/* Active indicator dot */}
        {active && (
            <div className="relative z-10 w-1 h-1 rounded-full bg-violet-400/80 shadow-[0_0_6px_rgba(139,92,246,0.9)] flex-shrink-0" />
        )}
    </motion.button>
);
