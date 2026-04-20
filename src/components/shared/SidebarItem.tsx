import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { usePortalTheme } from '../../contexts/PortalThemeContext';

interface SidebarItemProps {
    icon: ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
    isClientItem?: boolean;
    indent?: boolean;
}

/** Section label divider — use between groups of nav items */
export const SidebarSectionLabel = ({ label }: { label: string }) => {
    const { isDark } = usePortalTheme();
    return (
        <div className="px-3 pt-5 pb-1.5 first:pt-2">
            <span
                className={`text-[9px] font-bold tracking-[0.22em] uppercase ${
                    isDark ? 'text-white/18' : 'text-zinc-400'
                }`}
            >
                {label}
            </span>
        </div>
    );
};

export const SidebarItem = ({
    icon,
    label,
    active = false,
    onClick,
    isClientItem = false,
    indent = false,
}: SidebarItemProps) => {
    const { isDark } = usePortalTheme();
    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.975 }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 group relative ${
                indent ? 'pl-3' : ''
            } ${
                active
                    ? isDark
                        ? 'text-white'
                        : 'text-zinc-900'
                    : isDark
                      ? 'text-white/35 hover:text-white/70'
                      : 'text-zinc-500 hover:text-zinc-800'
            }`}
        >
            {active && (
                <motion.div
                    layoutId={isClientItem ? 'client-active-bg' : 'active-bg'}
                    className={`absolute inset-0 rounded-xl border ${
                        isDark
                            ? 'bg-white/[0.06] border-white/[0.08]'
                            : 'bg-violet-50 border-violet-200/80'
                    }`}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
            )}

            {!active && (
                <div
                    className={`absolute inset-0 rounded-xl transition-colors duration-150 ${
                        isDark
                            ? 'bg-white/0 group-hover:bg-white/[0.035]'
                            : 'bg-transparent group-hover:bg-zinc-100'
                    }`}
                />
            )}

            <span
                className={`relative z-10 flex-shrink-0 transition-colors duration-150 ${
                    active
                        ? 'text-violet-500'
                        : isDark
                          ? 'text-white/25 group-hover:text-white/50'
                          : 'text-zinc-400 group-hover:text-zinc-600'
                }`}
            >
                {icon}
            </span>

            <span
                className={`relative z-10 text-[12.5px] leading-none whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left transition-colors duration-150 ${
                    active ? 'font-semibold' : 'font-medium'
                }`}
            >
                {label}
            </span>

            {active && (
                <div className="relative z-10 w-1 h-1 rounded-full bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.6)] flex-shrink-0" />
            )}
        </motion.button>
    );
};
