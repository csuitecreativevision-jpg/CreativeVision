import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { getAssetPublicUrl, normalizeMondayFileUrl } from '../../services/mondayService';

export type SubmissionVideoPlayerHandle = {
    /** Jump playback; waits for metadata if needed. */
    seek: (seconds: number) => void;
    getCurrentTime: () => number | null;
};

type Props = {
    url: string;
    className?: string;
};

/** HTML5 video with Monday signed URL support; use ref.seek() for timestamp jumps (works while loading). */
export const SubmissionVideoPlayer = forwardRef<SubmissionVideoPlayerHandle, Props>(function SubmissionVideoPlayer(
    { url, className },
    ref
) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const pendingSeekRef = useRef<number | null>(null);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [error, setError] = useState(false);

    const applySeekToVideo = (v: HTMLVideoElement, sec: number) => {
        const apply = () => {
            try {
                v.currentTime = sec;
                void v.play().catch(() => {});
            } catch {
                /* ignore */
            }
        };
        if (v.readyState >= HTMLMediaElement.HAVE_METADATA) {
            apply();
        } else {
            const once = () => {
                v.removeEventListener('loadedmetadata', once);
                apply();
            };
            v.addEventListener('loadedmetadata', once);
        }
    };

    useImperativeHandle(
        ref,
        () => ({
            seek: (seconds: number) => {
                const sec = Math.max(0, Number(seconds));
                if (!Number.isFinite(sec)) return;
                const v = videoRef.current;
                if (!v) {
                    pendingSeekRef.current = sec;
                    return;
                }
                applySeekToVideo(v, sec);
            },
            getCurrentTime: () => {
                const v = videoRef.current;
                if (!v || Number.isNaN(v.currentTime)) return null;
                return v.currentTime;
            },
        }),
        []
    );

    /** Flush seek queued before &lt;video&gt; mounted (e.g. signed URL still loading). */
    useEffect(() => {
        if (!videoSrc) return;
        const v = videoRef.current;
        const pend = pendingSeekRef.current;
        if (!v || pend == null) return;
        pendingSeekRef.current = null;
        applySeekToVideo(v, pend);
    }, [videoSrc]);

    useEffect(() => {
        let isMounted = true;
        const fetchUrl = async () => {
            const match = url.match(/\/resources\/(\d+)\//);
            if (match && match[1]) {
                try {
                    const assetId = match[1];
                    const publicUrl = await getAssetPublicUrl(assetId);
                    if (isMounted && publicUrl) {
                        setVideoSrc(normalizeMondayFileUrl(publicUrl));
                        return;
                    }
                } catch (e) {
                    console.error('Failed to fetch signed video URL', e);
                }
            }
            if (isMounted) setVideoSrc(url);
        };
        void fetchUrl();
        return () => {
            isMounted = false;
        };
    }, [url]);

    if (error) {
        return (
            <div className="text-white p-4 text-center text-sm">
                Video failed to load.{' '}
                <a href={url} target="_blank" className="underline" rel="noreferrer">
                    Open link
                </a>
            </div>
        );
    }

    if (!videoSrc) {
        return (
            <div className="flex items-center justify-center h-full min-h-[12rem]">
                <span className="animate-pulse text-gray-400 text-sm">Loading video…</span>
            </div>
        );
    }

    return (
        <div className={`w-full h-full flex items-center justify-center bg-black relative group min-h-0 ${className || ''}`}>
            <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full max-h-[min(70vh,100%)] object-contain"
                controls
                autoPlay
                muted
                loop
                preload="auto"
                playsInline
                // @ts-expect-error referrerPolicy on video
                referrerPolicy="no-referrer"
                onError={e => {
                    console.error('Video playback error', e);
                    setError(true);
                }}
            >
                Your browser does not support the video tag.
            </video>
        </div>
    );
});
