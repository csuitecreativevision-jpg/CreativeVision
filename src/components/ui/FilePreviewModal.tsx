import { useState, useEffect, useRef } from 'react';
import { X, Download, FileText, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssetPublicUrl } from '../../services/mondayService';

// --- Types ---
export interface PreviewFile {
    url: string;
    name: string;
    assetId?: string;
}

// --- Custom Hook for Protected Video URLs ---
export function useProtectedPreview() {
    const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Refs for caching and deduplication
    const fetchingRef = useRef<string | null>(null);
    const urlCacheRef = useRef<Map<string, string>>(new Map());

    // Effect to fetch public URL for protected assets
    useEffect(() => {
        if (previewFile?.assetId && previewFile.url) {
            const assetId = previewFile.assetId;

            // Check if we have a cached URL for this assetId
            const cachedUrl = urlCacheRef.current.get(assetId);
            if (cachedUrl) {
                setPreviewFile(prev => prev ? { ...prev, url: cachedUrl, assetId: undefined } : null);
                setIsLoading(false);
                return;
            }

            // Check if we're already fetching this assetId
            if (fetchingRef.current === assetId) {
                return;
            }

            fetchingRef.current = assetId;
            setIsLoading(true);

            const fetchPublicUrl = async () => {
                try {
                    const publicUrl = await getAssetPublicUrl(assetId);
                    if (publicUrl) {
                        urlCacheRef.current.set(assetId, publicUrl);
                        setPreviewFile(prev => prev ? { ...prev, url: publicUrl, assetId: undefined } : null);
                    }
                } catch (err) {
                    console.error("Failed to fetch public URL", err);
                } finally {
                    fetchingRef.current = null;
                    setIsLoading(false);
                }
            };
            fetchPublicUrl();
        }
    }, [previewFile]);

    const openPreview = (file: PreviewFile) => {
        setPreviewFile(file);
        if (file.assetId) {
            setIsLoading(true);
        }
    };

    const closePreview = () => {
        setPreviewFile(null);
        setIsLoading(false);
    };

    return {
        previewFile,
        isLoading,
        openPreview,
        closePreview,
        setPreviewFile
    };
}

// --- File Previewer Component ---
interface FilePreviewerProps {
    url: string;
    name: string;
    isLoading?: boolean;
}

export const FilePreviewer = ({ url, name, isLoading }: FilePreviewerProps) => {
    const [error, setError] = useState(false);

    // Reset error when URL changes
    useEffect(() => {
        setError(false);
    }, [url]);

    // Show loading state while fetching authorized URL
    if (isLoading) {
        return (
            <div className="text-center text-gray-400">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                </div>
                <p className="text-lg font-medium text-white mb-2">Loading Preview...</p>
                <p className="text-sm max-w-xs mx-auto opacity-70">
                    Fetching authorized access
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-gray-400">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 opacity-50 text-red-400" />
                </div>
                <p className="text-lg font-medium text-white mb-2">Preview Unavailable</p>
                <p className="text-sm max-w-xs mx-auto mb-6 opacity-70">
                    Unable to play this file in the browser ({(url.split('?')[0].split('.').pop() || 'file').toLowerCase()}).
                </p>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:brightness-110 rounded-lg text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
                >
                    <Download className="w-4 h-4" /> Open / Download
                </a>
            </div>
        );
    }

    // Image preview
    if (url.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?|$)/i)) {
        return <img src={url} onError={() => setError(true)} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt={name || "Preview"} />;
    }

    // Video preview
    if (url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) {
        return (
            <video
                src={url}
                controls
                autoPlay
                muted
                preload="auto"
                playsInline
                onError={(e) => {
                    console.error('[VideoPlayer] Video failed to load:', e.currentTarget.error, url);
                    setError(true);
                }}
                className="max-w-full max-h-full rounded-lg shadow-2xl outline-none"
            />
        );
    }

    // PDF preview
    if (url.match(/\.pdf(\?|$)/i)) {
        return <iframe src={url} className="w-full h-full rounded-lg shadow-2xl bg-white" title="PDF Preview" onError={() => setError(true)} />;
    }

    // Default fallback
    return (
        <div className="text-center text-gray-400">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <FileText className="w-10 h-10 opacity-50" />
            </div>
            <p className="text-lg font-medium text-white mb-2">{name || "File Preview"}</p>
            <p className="text-sm max-w-xs mx-auto mb-6 opacity-70">
                This file type cannot be previewed in the browser.
            </p>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:brightness-110 rounded-lg text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
            >
                <Download className="w-4 h-4" /> Open / Download
            </a>
        </div>
    );
};

// --- Full Modal Component ---
interface FilePreviewModalProps {
    previewFile: PreviewFile | null;
    isLoading: boolean;
    onClose: () => void;
}

export const FilePreviewModal = ({ previewFile, isLoading, onClose }: FilePreviewModalProps) => {
    if (!previewFile) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative z-10 w-[90vw] h-[90vh] max-w-6xl bg-slate-900/90 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/30">
                        <h3 className="text-white font-semibold truncate max-w-[70%]">
                            {previewFile.name || 'File Preview'}
                        </h3>
                        <div className="flex items-center gap-2">
                            <a
                                href={previewFile.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                                title="Download"
                            >
                                <Download className="w-5 h-5" />
                            </a>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-black/50 relative flex items-center justify-center p-4 overflow-hidden">
                        <FilePreviewer
                            url={previewFile.url}
                            name={previewFile.name}
                            isLoading={isLoading || !!previewFile.assetId}
                        />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default FilePreviewModal;
