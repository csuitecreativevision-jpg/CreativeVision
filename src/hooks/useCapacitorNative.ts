import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/** True when running inside the Capacitor native shell (Android/iOS), not desktop browser. */
export function useCapacitorNative(): boolean {
    const [native, setNative] = useState(false);
    useEffect(() => {
        setNative(Capacitor.isNativePlatform());
    }, []);
    return native;
}
