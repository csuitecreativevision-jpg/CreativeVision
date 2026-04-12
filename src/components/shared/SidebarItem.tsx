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

export const SidebarItem = ({ icon, label, active = false, onClick, isClientItem = false, indent = false }: SidebarItemProps) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
            indent ? 'pl-3' : ''
        } ${
            active
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-200'
        }`}
    >
        {/* Active background pill */}
        {active && (
            <motion.div
                layoutId={isClientItem ? 'client-active-pill' : 'active-pill'}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/20 to-indigo-600/10 border border-violet-500/20"
                initial={false}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            />
        )}

        {/* Hover background */}
        {!active && (
            <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/[0.04] transition-colors duration-200" />
        )}

        {/* Left accent bar */}
        {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
        )}

        {/* Icon */}
        <span className={`relative z-10 flex-shrink-0 transition-colors duration-200 ${
            active ? 'text-violet-400' : 'text-gray-600 group-hover:text-gray-400'
        }`}>
            {icon}
        </span>

        {/* Label */}
        <span className={`relative z-10 text-[13px] tracking-wide whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-200 ${
            active ? 'font-semibold text-white' : 'font-medium text-gray-500 group-hover:text-gray-300'
        }`}>
            {label}
        </span>

        {/* Active dot */}
        {active && (
            <div className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.9)] flex-shrink-0" />
        )}
    </motion.button>
);
