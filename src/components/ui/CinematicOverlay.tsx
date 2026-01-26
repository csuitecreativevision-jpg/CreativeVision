import { useEffect, useState } from 'react';

export const CinematicOverlay = () => {
    const [opacity, setOpacity] = useState(0);

    useEffect(() => {
        // Fade in the grain to avoid harsh load
        setOpacity(1);
    }, []);

    return (
        <div className="fixed inset-0 z-40 pointer-events-none select-none overflow-hidden" style={{ opacity }}>
            {/* Film Grain */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay">
                <svg className='w-full h-full' xmlns='http://www.w3.org/2000/svg'>
                    <filter id='noiseFilter'>
                        <feTurbulence
                            type='fractalNoise'
                            baseFrequency='0.8'
                            numOctaves='3'
                            stitchTiles='stitch' />
                    </filter>
                    <rect width='100%' height='100%' filter='url(#noiseFilter)' />
                </svg>
            </div>

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />

            {/* Subtle Screen Line Texture (Scanlines) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,6px_100%] pointer-events-none opacity-20" />
        </div>
    );
};
