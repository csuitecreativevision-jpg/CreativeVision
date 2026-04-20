import { ReactNode, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortalTheme } from '../../contexts/PortalThemeContext';

interface SidebarDropdownProps {
    icon: ReactNode;
    label: string;
    active?: boolean;
    children: ReactNode;
    isOpenByDefault?: boolean;
}

export const SidebarDropdown = ({ icon, label, active = false, children, isOpenByDefault = false }: SidebarDropdownProps) => {
    const [isOpen, setIsOpen] = useState(isOpenByDefault || active);
    const { isDark } = usePortalTheme();

    return (
        <div className="w-full flex flex-col">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.97 }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                    active
                        ? isDark
                            ? 'text-white'
                            : 'text-zinc-900'
                        : isDark
                          ? 'text-gray-500 hover:text-gray-200'
                          : 'text-zinc-500 hover:text-zinc-800'
                }`}
            >
                {active && !isOpen && (
                    <motion.div
                        className={`absolute inset-0 rounded-xl border ${
                            isDark
                                ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 border-violet-500/20'
                                : 'bg-violet-50 border-violet-200/80'
                        }`}
                        initial={false}
                    />
                )}

                {!active && (
                    <div
                        className={`absolute inset-0 rounded-xl transition-colors duration-200 ${
                            isDark
                                ? 'bg-white/0 group-hover:bg-white/[0.04]'
                                : 'bg-transparent group-hover:bg-zinc-100'
                        }`}
                    />
                )}

                {isOpen && (
                    <div
                        className={`absolute inset-0 rounded-xl ${
                            isDark ? 'bg-white/[0.03]' : 'bg-zinc-50'
                        }`}
                    />
                )}

                <span
                    className={`relative z-10 flex-shrink-0 transition-colors duration-200 ${
                        active || isOpen
                            ? 'text-violet-500'
                            : isDark
                              ? 'text-gray-600 group-hover:text-gray-400'
                              : 'text-zinc-400 group-hover:text-zinc-600'
                    }`}
                >
                    {icon}
                </span>

                <span
                    className={`relative z-10 text-[13px] tracking-wide transition-colors duration-200 ${
                        active || isOpen
                            ? `font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`
                            : `font-medium ${
                                  isDark
                                      ? 'text-gray-500 group-hover:text-gray-300'
                                      : 'text-zinc-500 group-hover:text-zinc-700'
                              }`
                    }`}
                >
                    {label}
                </span>

                <motion.span
                    className={`relative z-10 ml-auto flex-shrink-0 transition-colors duration-200 ${
                        isOpen
                            ? 'text-violet-500'
                            : isDark
                              ? 'text-gray-600 group-hover:text-gray-400'
                              : 'text-zinc-400 group-hover:text-zinc-600'
                    }`}
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </motion.span>
            </motion.button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div
                            className={`mt-1 ml-3 pl-3 space-y-0.5 py-1 border-l ${
                                isDark ? 'border-white/[0.06]' : 'border-zinc-200'
                            }`}
                        >
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
