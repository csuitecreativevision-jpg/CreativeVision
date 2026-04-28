import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

function stableIntId(seed: string): number {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = (h << 5) - h + seed.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h) % 2147483646 + 1;
}

/**
 * Show a system notification on Android/iOS when the app has permission.
 * Mirrors in-app notifications; safe no-op on web/desktop.
 */
export async function showNativeAppNotification(
    title: string,
    body: string,
    idSeed?: string
): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
        let perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
            perm = await LocalNotifications.requestPermissions();
        }
        if (perm.display !== 'granted') return;

        const id = idSeed ? stableIntId(idSeed) : Math.floor(Date.now() % 2147483646) + 1;

        await LocalNotifications.schedule({
            notifications: [
                {
                    id,
                    title: title.slice(0, 120),
                    body: body.slice(0, 400),
                    schedule: { at: new Date(Date.now() + 400) },
                },
            ],
        });
    } catch (e) {
        console.warn('[nativeNotification]', e);
    }
}
