import { X, Smartphone, MonitorPlay, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '../../hooks/useIsMobile';

interface SelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (option: 'long' | 'short' | 'mixed') => void;
}

export function SelectionModal({ isOpen, onClose, onSelect }: SelectionModalProps) {
    const isMobile = useIsMobile();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative w-full max-w-2xl bg-[#0a0a1f] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden"
                    >
                        {/* Background Gradients */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" />
                            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[100px]" />
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="text-center mb-8 relative z-10">
                            <motion.h3
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                                className="text-2xl md:text-3xl font-bold text-white mb-2"
                            >
                                Choose Your Format
                            </motion.h3>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                                className="text-gray-400"
                            >
                                Select the type of content you want us to edit.
                            </motion.p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                            {/* Long Form */}
                            <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0, transition: { delay: 0.3 } }}
                                whileHover={!isMobile ? { scale: 1.05, borderColor: "rgba(59, 130, 246, 0.5)", boxShadow: "0 0 30px rgba(59, 130, 246, 0.15)" } : undefined}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onSelect('long')}
                                className="group relative p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center gap-4 transition-colors"
                            >
                                <motion.div
                                    whileHover={!isMobile ? { rotate: 5, scale: 1.1 } : undefined}
                                    className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors"
                                >
                                    <MonitorPlay className="w-8 h-8 text-blue-400" />
                                </motion.div>
                                <div className="text-center">
                                    <h4 className="text-lg font-bold text-white mb-1">Long Form</h4>
                                    <p className="text-xs text-gray-400">Youtube videos, documentaries, etc.</p>
                                </div>
                            </motion.button>

                            {/* Short Form */}
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
                                whileHover={!isMobile ? { scale: 1.05, borderColor: "rgba(236, 72, 153, 0.5)", boxShadow: "0 0 30px rgba(236, 72, 153, 0.15)" } : undefined}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onSelect('short')}
                                className="group relative p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center gap-4 transition-colors"
                            >
                                <motion.div
                                    whileHover={!isMobile ? { rotate: -5, scale: 1.1 } : undefined}
                                    className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors"
                                >
                                    <Smartphone className="w-8 h-8 text-pink-400" />
                                </motion.div>
                                <div className="text-center">
                                    <h4 className="text-lg font-bold text-white mb-1">Short Form</h4>
                                    <p className="text-xs text-gray-400">TikToks, Reels, Shorts</p>
                                </div>
                            </motion.button>

                            {/* Mixed */}
                            <motion.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0, transition: { delay: 0.5 } }}
                                whileHover={!isMobile ? { scale: 1.05, borderColor: "rgba(168, 85, 247, 0.5)", boxShadow: "0 0 30px rgba(168, 85, 247, 0.15)" } : undefined}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onSelect('mixed')}
                                className="group relative p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center gap-4 transition-colors"
                            >
                                <motion.div
                                    whileHover={!isMobile ? { rotate: 180, scale: 1.1 } : undefined}
                                    transition={{ type: "spring", stiffness: 200 }}
                                    className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors"
                                >
                                    <Layers className="w-8 h-8 text-purple-400" />
                                </motion.div>
                                <div className="text-center">
                                    <h4 className="text-lg font-bold text-white mb-1">Mixed</h4>
                                    <p className="text-xs text-gray-400">Custom mix of formats</p>
                                </div>
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
