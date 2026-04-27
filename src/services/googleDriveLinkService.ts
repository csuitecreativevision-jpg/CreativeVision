/**
 * Resolve Google Drive file titles for deployment video rows.
 * Requires VITE_GOOGLE_DRIVE_API_KEY (Google Cloud → APIs & Services → Credentials).
 * Enable "Google Drive API" and restrict the key by HTTP referrer (your site) for browser use.
 * Works for files the key can access (typically "anyone with link" / public metadata); private-only files may return 403.
 */

let warnedMissingKey = false;
let warnedDriveApiFailure = false;

/** Trailing video container extensions — removed from autofill titles (Drive file name is often `Project.mp4`). */
const VIDEO_FILE_EXT_RE = /\.(mp4|mov|webm|m4v|avi|mkv|wmv|flv|ogv|mpg|mpeg|mts|m2ts|3gp)$/i;

/**
 * Strips a trailing video file extension for display as project / row title.
 * If nothing would remain, returns the original string trimmed.
 */
export function stripVideoFileExtensionFromTitle(name: string): string {
    let t = name.trim();
    if (!t) return t;
    let prev = '';
    while (prev !== t) {
        prev = t;
        t = t.replace(VIDEO_FILE_EXT_RE, '').trim();
    }
    return t || name.trim();
}

function isDriveFileHostname(host: string): boolean {
    const h = host.toLowerCase();
    return (
        h === 'drive.google.com' ||
        h.endsWith('.drive.google.com') ||
        h === 'docs.google.com' ||
        h.endsWith('.docs.google.com') ||
        h === 'drive.usercontent.google.com'
    );
}

/** Extract a Drive file id from common share URL shapes. Returns null for folders or unrecognized URLs. */
export function extractGoogleDriveFileId(raw: string): string | null {
    const s = raw.trim();
    if (!s) return null;
    if (s.includes('/folders/')) return null;

    try {
        const u = new URL(s);
        const host = u.hostname.toLowerCase();

        if (host === 'google.com' || host === 'www.google.com') {
            if (u.pathname === '/url') {
                const q = u.searchParams.get('q') || u.searchParams.get('url');
                if (q && (q.includes('drive.google') || q.includes('docs.google'))) {
                    const nested = extractGoogleDriveFileId(q);
                    if (nested) return nested;
                }
            }
        }

        if (isDriveFileHostname(host)) {
            const dMatch = u.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (dMatch?.[1]) return dMatch[1];
            const idParam = u.searchParams.get('id')?.trim();
            if (idParam && /^[a-zA-Z0-9_-]+$/.test(idParam)) return idParam;
        }

        return null;
    } catch {
        const dMatch = s.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (dMatch?.[1]) return dMatch[1];
        const idMatch = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch?.[1]) return idMatch[1];
        return null;
    }
}

/**
 * Best-effort label from a pasted URL when the DB has no `name` yet and Drive metadata
 * is unavailable (no API key or non-file links). Skips bare Google `/file/d/…/view` paths
 * where the filename is not in the URL.
 */
export function deriveTitleFromVideoUrl(raw: string): string | null {
    const s = raw.trim();
    if (!s) return null;
    try {
        const u = new URL(s);
        const host = u.hostname.toLowerCase();
        const parts = u.pathname.split('/').filter(Boolean);

        if (host === 'youtu.be' && parts[0]) {
            return `YouTube ${parts[0].slice(0, 12)}…`;
        }
        if (host.includes('youtube.com')) {
            const v = u.searchParams.get('v');
            if (v) return `YouTube ${v.slice(0, 12)}…`;
        }

        if (host.includes('drive.google.com') || host.includes('docs.google.com')) {
            const fileId = extractGoogleDriveFileId(s);
            if (fileId) {
                return `Drive file ${fileId.slice(0, 8)}...`;
            }
        }

        let candidate = parts[parts.length - 1] || '';
        const lower = candidate.toLowerCase();
        if (['view', 'edit', 'preview', 'open', 'file', 'd', 'u', 'watch', 'live'].includes(lower)) {
            candidate = parts[parts.length - 2] || '';
        }
        const decoded = decodeURIComponent(candidate).replace(/\+/g, ' ');
        if (!decoded) return null;
        const trimmed = decoded.length > 200 ? `${decoded.slice(0, 197)}…` : decoded;
        if (trimmed.includes('.') || trimmed.length >= 4) {
            return stripVideoFileExtensionFromTitle(trimmed);
        }
        return null;
    } catch {
        return null;
    }
}

/** Fetch display name via Drive API v3 (API key). */
export async function fetchGoogleDriveFileTitle(fileId: string): Promise<string | null> {
    const key = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY as string | undefined;
    if (!key?.trim()) {
        if (!warnedMissingKey) {
            warnedMissingKey = true;
            console.info(
                '[CreativeVision] Set VITE_GOOGLE_DRIVE_API_KEY to auto-fill video names from Google Drive links.'
            );
        }
        return null;
    }

    const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`);
    url.searchParams.set('fields', 'name');
    url.searchParams.set('supportsAllDrives', 'true');
    url.searchParams.set('key', key.trim());

    try {
        const res = await fetch(url.toString());
        const data = (await res.json()) as { name?: string; error?: { message?: string; status?: string } };
        if (!res.ok) {
            if (import.meta.env.DEV && !warnedDriveApiFailure) {
                warnedDriveApiFailure = true;
                const msg = data.error?.message || res.statusText || 'unknown error';
                console.warn(
                    '[CreativeVision] Google Drive files.get failed — video name will not auto-fill. ',
                    `HTTP ${res.status}: ${msg}. `,
                    'Enable the Google Drive API for this key, allow HTTP referrers (e.g. http://localhost:* and your production origin), ',
                    'restart `npm run dev` after changing .env, and ensure the file is shared so metadata is readable (private files often return 403).'
                );
            }
            return null;
        }
        if (typeof data.name !== 'string' || !data.name.trim()) return null;
        return stripVideoFileExtensionFromTitle(data.name.trim());
    } catch {
        return null;
    }
}
