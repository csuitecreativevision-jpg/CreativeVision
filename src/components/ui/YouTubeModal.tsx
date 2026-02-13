import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface YouTubeModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    mainContent?: React.ReactNode;
    sidebarContent?: React.ReactNode;
}

export const YouTubeModal = ({
    isOpen,
    onClose,
    title,
    mainContent,
    sidebarContent
}: YouTubeModalProps) => {

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
                    />

                    {/* Modal Container - "Theater Mode" */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
                        className="relative w-full max-w-[95vw] h-[90vh] bg-[#0E0E1A] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/10"
                    >
                        {/* Header - Glassmorphic overlay */}
                        {/* Header - Standard Modal Title Bar */}
                        <div className="relative z-50 flex items-center justify-between px-6 py-4 bg-[#0E0E1A] border-b border-white/10">
                            <h2 className="text-lg font-bold text-white/90 truncate max-w-2xl">
                                {title || 'Project Details'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white transition-all duration-200 group"
                            >
                                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        {/* Content Grid */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-[#0b0b15]">
                            {/* Main Stage (Top for Video) */}
                            <div className="w-full bg-black relative flex-shrink-0 min-h-[50vh] xl:min-h-[65vh] flex flex-col items-center justify-center shadow-2xl z-10">
                                <div className="w-full h-full absolute inset-0 flex items-center justify-center">
                                    {mainContent}
                                </div>
                            </div>

                            {/* Details (Bottom) */}
                            {sidebarContent && (
                                <div className="w-full max-w-[1600px] mx-auto p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {sidebarContent}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
