import { useState, useEffect, useRef } from 'react';
import { X, Download, FileText, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssetPublicUrl, normalizeMondayFileUrl } from '../../services/mondayService';

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
                        const normalizedUrl = normalizeMondayFileUrl(publicUrl);
                        if (normalizedUrl) {
                            urlCacheRef.current.set(assetId, normalizedUrl);
                            setPreviewFile(prev => prev ? { ...prev, url: normalizedUrl, assetId: undefined } : null);
                        }
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
    onReady?: () => void;
}

// Helper to detect Monday.com WorkDocs
const isMondayWorkDoc = (url: string): boolean => {
    return url.includes('monday.com') && (url.includes('/docs/') || url.includes('object_id'));
};

// Helper to get file extension from URL or name
const getFileExtension = (url: string, name: string): string => {
    // First try to get from name
    if (name) {
        const nameParts = name.split('.');
        if (nameParts.length > 1) {
            return nameParts.pop()?.toLowerCase() || '';
        }
    }
    // Fall back to URL (without query params)
    const urlWithoutParams = url.split('?')[0];
    const urlParts = urlWithoutParams.split('.');
    return urlParts.length > 1 ? (urlParts.pop()?.toLowerCase() || '') : '';
};

export const FilePreviewer = ({ url, name, isLoading, onReady }: FilePreviewerProps) => {
    const [error, setError] = useState(false);
    const [iframeLoading, setIframeLoading] = useState(true);

    // Reset error when URL changes
    useEffect(() => {
        setError(false);
        setIframeLoading(true);
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
                    Unable to preview this file in the browser ({getFileExtension(url, name) || 'file'}).
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

    const ext = getFileExtension(url, name);

    // Monday.com WorkDocs - open in iframe or new tab
    if (isMondayWorkDoc(url)) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
                    <FileText className="w-12 h-12 text-purple-400" />
                </div>
                <div className="text-center">
                    <p className="text-xl font-semibold text-white mb-2">{name || 'Monday WorkDoc'}</p>
                    <p className="text-sm text-gray-400 mb-6">
                        This is a Monday.com document that opens in a new tab.
                    </p>
                </div>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:brightness-110 rounded-xl text-white font-bold transition-all shadow-lg shadow-purple-500/30"
                >
                    <FileText className="w-5 h-5" /> Open in Monday.com
                </a>
            </div>
        );
    }

    // Image preview
    if (['jpeg', 'jpg', 'gif', 'png', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
        return <img src={url} onError={() => setError(true)} onLoad={() => onReady?.()} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt={name || "Preview"} referrerPolicy="no-referrer" />;
    }

    // Video preview
    if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext)) {
        return (
            <video
                src={url}
                controls
                autoPlay
                muted
                loop
                preload="auto"
                playsInline
                onCanPlay={(e) => {
                    e.currentTarget.play().catch(err => console.error("Autoplay failed:", err));
                    onReady?.();
                }}
                onError={(e) => {
                    console.error('[VideoPlayer] Video failed to load:', e.currentTarget.error, url);
                    setError(true);
                }}
                className="max-w-full max-h-full rounded-lg shadow-2xl outline-none"
                // @ts-ignore
                referrerPolicy="no-referrer"
            />
        );
    }

    // Audio preview
    if (['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'].includes(ext)) {
        return (
            <div className="flex flex-col items-center gap-6 p-8">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-white/10">
                    <FileText className="w-16 h-16 text-emerald-400" />
                </div>
                <p className="text-lg font-medium text-white">{name || 'Audio File'}</p>
                <audio
                    src={url}
                    controls
                    autoPlay
                    onError={() => setError(true)}
                    className="w-full max-w-md"
                />
            </div>
        );
    }

    // PDF preview
    if (ext === 'pdf') {
        return (
            <div className="w-full h-full relative">
                {iframeLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                    </div>
                )}
                <iframe
                    src={url}
                    className="w-full h-full rounded-lg shadow-2xl bg-white"
                    title="PDF Preview"
                    onLoad={() => {
                        setIframeLoading(false);
                        onReady?.();
                    }}
                    onError={() => setError(true)}
                />
            </div>
        );
    }

    // Office documents (Word, Excel, PowerPoint) - use Microsoft Office viewer
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
        // Microsoft Office Online viewer requires a publicly accessible URL
        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
        return (
            <div className="w-full h-full relative">
                {iframeLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                    </div>
                )}
                <iframe
                    src={officeViewerUrl}
                    className="w-full h-full rounded-lg shadow-2xl bg-white"
                    title="Document Preview"
                    onLoad={() => {
                        setIframeLoading(false);
                        onReady?.();
                    }}
                    onError={() => setError(true)}
                />
            </div>
        );
    }

    // Text files
    if (['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(ext)) {
        return (
            <iframe
                src={url}
                className="w-full h-full rounded-lg shadow-2xl bg-slate-800 text-white"
                title="Text Preview"
                onError={() => setError(true)}
            />
        );
    }

    // Default fallback
    return (
        <div className="text-center text-gray-400">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <FileText className="w-10 h-10 opacity-50" />
            </div>
            <p className="text-lg font-medium text-white mb-2">{name || "File Preview"}</p>
            <p className="text-sm max-w-xs mx-auto mb-6 opacity-70">
                This file type ({ext || 'unknown'}) cannot be previewed in the browser.
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
