import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: string; // Tailwind class like 'max-w-2xl', 'max-w-5xl'
    /** Match portal chrome; defaults to dark for standalone modals */
    tone?: 'dark' | 'light';
}

export const PremiumModal = ({
    isOpen,
    onClose,
    children,
    maxWidth = 'max-w-2xl',
    tone = 'dark'
}: PremiumModalProps) => {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className={`fixed inset-0 backdrop-blur-xl cursor-pointer ${
                            tone === 'dark' ? 'bg-black/80' : 'bg-black/40'
                        }`}
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
                        className={`w-full ${maxWidth} rounded-3xl shadow-2xl overflow-hidden cursor-default relative flex flex-col max-h-[90vh] z-10 ${
                            tone === 'dark'
                                ? 'bg-[#0E0E1A] border border-white/10'
                                : 'bg-white border border-zinc-200 ring-1 ring-black/5'
                        }`}
                    >
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
