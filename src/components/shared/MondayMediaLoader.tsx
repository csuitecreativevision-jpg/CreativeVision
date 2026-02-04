import { useState, useEffect, useRef } from 'react';
import { getAssetPublicUrl } from '../../services/mondayService';
import { FilePreviewer } from '../ui/FilePreviewModal';
import { Loader2 } from 'lucide-react';

interface MondayMediaLoaderProps {
    url: string;
    assetId?: string;
    name: string;
    type?: 'video' | 'image' | 'external_link' | string;
    className?: string;
}

export const MondayMediaLoader = ({
    url: initialUrl,
    assetId: initialAssetId,
    name,
    type,
    className = ""
}: MondayMediaLoaderProps) => {
    const [resolvedUrl, setResolvedUrl] = useState<string>(initialUrl);
    const [isResolving, setIsResolving] = useState<boolean>(false); // URL fetching state
    const [isContentReady, setIsContentReady] = useState<boolean>(false); // Media loading state
    const [error, setError] = useState<boolean>(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        const resolve = async () => {
            // Reset state when inputs change
            setResolvedUrl(initialUrl);
            setError(false);
            setIsContentReady(false);
            setIsResolving(!!((initialAssetId || initialUrl) && type !== 'external_link')); // Start loading if we might fetch

            let currentAssetId = initialAssetId;

            // 1. Try to extract Asset ID from URL if not provided
            if (!currentAssetId && initialUrl) {
                const resourceMatch = initialUrl.match(/\/resources\/(\d+)\//);
                const assetMatch = initialUrl.match(/\/assets\/(\d+)/);
                if (resourceMatch && resourceMatch[1]) {
                    currentAssetId = resourceMatch[1];
                } else if (assetMatch && assetMatch[1]) {
                    currentAssetId = assetMatch[1];
                }
            }

            // 2. Fetch Public URL if we have an Asset ID
            // If type is explicitly 'external_link', we might skip, but for safety with ID, usually fetch.
            const shouldFetch = currentAssetId && type !== 'external_link';

            if (shouldFetch) {
                setIsResolving(true);
                try {
                    console.log("[MondayMediaLoader] Fetching public URL for asset:", currentAssetId);
                    const publicUrl = await getAssetPublicUrl(currentAssetId!);
                    if (mountedRef.current && publicUrl) {
                        console.log("[MondayMediaLoader] Resolved:", publicUrl);
                        setResolvedUrl(publicUrl);
                    } else if (mountedRef.current) {
                        console.warn("[MondayMediaLoader] No public URL returned");
                    }
                } catch (err) {
                    console.error("[MondayMediaLoader] Failed to fetch public URL:", err);
                    if (mountedRef.current) setError(true);
                } finally {
                    if (mountedRef.current) setIsResolving(false);
                }
            } else {
                if (mountedRef.current) setIsResolving(false); // If no fetch needed, resolve immediately
            }
        };

        resolve();
    }, [initialUrl, initialAssetId, type]);

    const showLoader = isResolving || !isContentReady;

    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center bg-white/5 rounded-xl p-4 text-center ${className}`}>
                <Loader2 className="w-8 h-8 text-red-400 mb-2" />
                <p className="text-xs text-red-300">Failed to load media</p>
            </div>
        );
    }

    return (
        <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
            {/* Loader Overlay */}
            {showLoader && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg transition-opacity duration-300">
                    <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
                </div>
            )}

            {/* Actual Content (Hidden until ready, but rendered to allow loading) */}
            <div className={`w-full h-full flex items-center justify-center transition-opacity duration-500 ${!isContentReady ? 'opacity-0' : 'opacity-100'}`}>
                <FilePreviewer
                    url={resolvedUrl}
                    name={name}
                    isLoading={false}
                    onReady={() => {
                        console.log("[MondayMediaLoader] Content Ready");
                        setIsContentReady(true);
                    }}
                />
            </div>
        </div>
    );
};
