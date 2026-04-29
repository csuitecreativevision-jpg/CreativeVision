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
                        className={`fixed inset-0 backdrop-blur-sm ${isDark ? 'bg-black/60' : 'bg-black/35'}`}
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
                            className={`rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col pointer-events-auto overflow-hidden ${
                                isDark ? 'bg-[#1A1A2E] border border-white/10' : 'bg-white border border-zinc-200'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-50'}`}>
                                <div className="flex items-center gap-3">
                                    {Icon && <Icon className={`w-6 h-6 ${isDark ? 'text-violet-400' : 'text-zinc-600'}`} />}
                                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900'}`}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Search Bar */}
                            <div className={`p-4 border-b ${isDark ? 'border-white/5 bg-[#151525]' : 'border-zinc-200 bg-zinc-50'}`}>
                                <div className="relative">
                                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-zinc-500'}`} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder={`Search ${title.toLowerCase()}...`}
                                        className={`w-full border rounded-xl pl-10 pr-4 py-3 focus:outline-none transition-colors ${
                                            isDark
                                                ? 'bg-[#0E0E1A] border-white/10 text-white focus:border-violet-500 placeholder:text-gray-600'
                                                : 'bg-white border-zinc-200 text-zinc-900 focus:border-zinc-500 placeholder:text-zinc-500'
                                        }`}
                                        autoFocus={!isMobile}
                                    />
                                </div>
                            </div>

                            {/* Options Grid */}
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
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
                                                            ? 'bg-violet-500/20 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                                                            : 'bg-zinc-100 border-zinc-300')
                                                        : (isDark
                                                            ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                                            : 'bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300')
                                                    }
                                                `}
                                            >
                                                <span className={`font-semibold ${
                                                    selected === option
                                                        ? (isDark ? 'text-white' : 'text-zinc-900')
                                                        : (isDark ? 'text-gray-300 group-hover:text-white' : 'text-zinc-700 group-hover:text-zinc-900')
                                                }`}>
                                                    {option}
                                                </span>
                                                {selected === option && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className={`rounded-full p-1 ${isDark ? 'bg-violet-500' : 'bg-zinc-700'}`}
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
                            <div className={`p-4 border-t text-xs text-center uppercase tracking-wider shrink-0 ${
                                isDark ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-zinc-50 border-zinc-200 text-zinc-500'
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
