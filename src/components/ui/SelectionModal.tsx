import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, LucideIcon } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { usePortalThemeOptional } from '../../contexts/PortalThemeContext';

/** Above portal chrome (mobile header z-60, deployment modals ~110, assistant ~999999); below notification takeover (z-[1000010]+). */
const PORTAL_Z_BACKDROP = 1_000_000;
const PORTAL_Z_CONTENT = 1_000_001;

interface SelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    options: string[];
    selected: string;
    onSelect: (value: string) => void;
    icon?: LucideIcon;
}

export const SelectionModal: React.FC<SelectionModalProps> = ({
    isOpen,
    onClose,
    title,
    options,
    selected,
    onSelect,
    icon: Icon
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const isMobile = useIsMobile();
    const theme = usePortalThemeOptional();
    const isDark = theme?.isDark ?? (localStorage.getItem('portal_ui_dark_mode') !== 'false');

    // Reset search when modal opens
    useEffect(() => {
        if (isOpen) setSearchTerm('');
    }, [isOpen]);

    const filteredOptions = (options ?? []).filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const modalTree = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop — portaled so overflow/stacking on page layout cannot clip or sit above fixed chrome */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className={`fixed inset-0 ${isDark ? 'bg-black/75 backdrop-blur-sm' : 'bg-black/45 backdrop-blur-[2px]'}`}
                        style={{ zIndex: PORTAL_Z_BACKDROP }}
                    />

                    <div
                        className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
                        style={{ zIndex: PORTAL_Z_CONTENT }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                            className={`rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col pointer-events-auto overflow-hidden ${
                                isDark ? 'bg-[#0c0c10] border border-white/[0.1]' : 'bg-white border border-zinc-300'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'border-white/[0.08] bg-white/[0.03]' : 'border-zinc-200 bg-zinc-50/80'}`}>
                                <div className="flex items-center gap-3">
                                    {Icon && <Icon className={`w-5 h-5 ${isDark ? 'text-violet-300' : 'text-violet-600'}`} />}
                                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className={`h-8 w-8 inline-flex items-center justify-center rounded-lg border transition-colors ${
                                        isDark
                                            ? 'border-white/[0.14] text-white/60 hover:text-white hover:border-white/30'
                                            : 'border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400'
                                    }`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Search Bar */}
                            <div className={`p-4 border-b ${isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-zinc-200 bg-zinc-50/70'}`}>
                                <div className="relative">
                                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-zinc-500'}`} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder={`Search ${title.toLowerCase()}...`}
                                        className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors ${
                                            isDark
                                                ? 'bg-[#0d1020] border-white/[0.14] text-white focus:border-violet-500/60 placeholder:text-white/35'
                                                : 'bg-white border-zinc-300 text-zinc-900 focus:border-violet-500 placeholder:text-zinc-500'
                                        }`}
                                        autoFocus={!isMobile}
                                    />
                                </div>
                            </div>

                            {/* Options Grid */}
                            <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1">
                                {filteredOptions.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {filteredOptions.map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => {
                                                    onSelect(option);
                                                    onClose();
                                                }}
                                                className={`
                                                    group relative flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200
                                                    ${selected === option
                                                        ? (isDark
                                                            ? 'bg-violet-500/18 border-violet-500/45'
                                                            : 'bg-violet-50 border-violet-300')
                                                        : (isDark
                                                            ? 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.14]'
                                                            : 'bg-zinc-50/70 border-zinc-200 hover:bg-zinc-100/80 hover:border-zinc-300')
                                                    }
                                                `}
                                            >
                                                <span className={`font-semibold ${
                                                    selected === option
                                                            ? (isDark ? 'text-white' : 'text-zinc-900')
                                                            : (isDark ? 'text-white/80 group-hover:text-white' : 'text-zinc-700 group-hover:text-zinc-900')
                                                }`}>
                                                    {option}
                                                </span>
                                                {selected === option && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className={`rounded-full p-1 ${isDark ? 'bg-violet-500' : 'bg-violet-600'}`}
                                                    >
                                                        <Check className="w-3 h-3 text-white" />
                                                    </motion.div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-zinc-500'}`}>
                                        No options found matching "{searchTerm}"
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className={`p-3.5 border-t text-[11px] text-center uppercase tracking-wider shrink-0 ${
                                isDark ? 'bg-white/[0.03] border-white/[0.08] text-white/35' : 'bg-zinc-50/90 border-zinc-200 text-zinc-500'
                            }`}>
                                {filteredOptions.length} Options Available
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );

    if (!mounted) return null;
    return createPortal(modalTree, document.body);
};
