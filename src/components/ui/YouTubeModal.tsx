import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, ExternalLink, Download, FileText, Loader2, AlertCircle } from 'lucide-react';
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
                        {/* Header */}
                        <div className="flex flex-shrink-0 items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0E0E1A] z-20">
                            <h2 className="text-lg font-bold text-white truncate max-w-2xl">
                                {title || 'Project Details'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content Grid */}
                        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                            {/* Main Stage (Left/Top) */}
                            <div className="flex-1 bg-black/50 relative overflow-hidden flex flex-col">
                                <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-y-auto custom-scrollbar">
                                    {/* Centered Content Container */}
                                    <div className="w-full h-full flex flex-col items-center justify-center relative">
                                        {mainContent}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar (Right/Bottom) */}
                            {sidebarContent && (
                                <div className="w-full lg:w-[400px] xl:w-[450px] bg-[#131322] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col h-[50vh] lg:h-full lg:flex-shrink-0 z-10">
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                        {sidebarContent}
                                    </div>
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
