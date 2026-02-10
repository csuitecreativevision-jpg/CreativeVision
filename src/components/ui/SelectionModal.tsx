import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, LucideIcon } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

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

    // Reset search when modal opens
    useEffect(() => {
        if (isOpen) setSearchTerm('');
    }, [isOpen]);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#1A1A2E] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col pointer-events-auto overflow-hidden pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                                <div className="flex items-center gap-3">
                                    {Icon && <Icon className="w-6 h-6 text-violet-400" />}
                                    <h3 className="text-xl font-bold text-white">{title}</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Search Bar */}
                            <div className="p-4 border-b border-white/5 bg-[#151525]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder={`Search ${title.toLowerCase()}...`}
                                        className="w-full bg-[#0E0E1A] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
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
                                                        ? 'bg-violet-500/20 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                                    }
                                                `}
                                            >
                                                <span className={`font-semibold ${selected === option ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                                    {option}
                                                </span>
                                                {selected === option && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="bg-violet-500 rounded-full p-1"
                                                    >
                                                        <Check className="w-3 h-3 text-white" />
                                                    </motion.div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        No options found matching "{searchTerm}"
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-white/5 border-t border-white/10 text-xs text-gray-500 text-center uppercase tracking-wider shrink-0">
                                {filteredOptions.length} Options Available
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
