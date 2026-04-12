import { ReactNode, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarDropdownProps {
    icon: ReactNode;
    label: string;
    active?: boolean;
    children: ReactNode;
    isOpenByDefault?: boolean;
}

export const SidebarDropdown = ({ icon, label, active = false, children, isOpenByDefault = false }: SidebarDropdownProps) => {
    const [isOpen, setIsOpen] = useState(isOpenByDefault || active);

    return (
        <div className="w-full flex flex-col">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.97 }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                    active ? 'text-white' : 'text-gray-500 hover:text-gray-200'
                }`}
            >
                {/* Active background */}
                {active && !isOpen && (
                    <motion.div
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/20 to-indigo-600/10 border border-violet-500/20"
                        initial={false}
                    />
                )}

                {/* Hover background */}
                {!active && (
                    <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/[0.04] transition-colors duration-200" />
                )}

                {/* Open state background */}
                {isOpen && (
                    <div className="absolute inset-0 rounded-xl bg-white/[0.03]" />
                )}

                {/* Icon */}
                <span className={`relative z-10 flex-shrink-0 transition-colors duration-200 ${
                    active || isOpen ? 'text-violet-400' : 'text-gray-600 group-hover:text-gray-400'
                }`}>
                    {icon}
                </span>

                {/* Label */}
                <span className={`relative z-10 text-[13px] tracking-wide transition-colors duration-200 ${
                    active || isOpen ? 'font-semibold text-white' : 'font-medium text-gray-500 group-hover:text-gray-300'
                }`}>
                    {label}
                </span>

                {/* Chevron */}
                <motion.span
                    className={`relative z-10 ml-auto flex-shrink-0 transition-colors duration-200 ${
                        isOpen ? 'text-violet-400' : 'text-gray-600 group-hover:text-gray-400'
                    }`}
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </motion.span>
            </motion.button>

            {/* Children */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="mt-1 ml-3 pl-3 border-l border-white/[0.06] space-y-0.5 py-1">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
