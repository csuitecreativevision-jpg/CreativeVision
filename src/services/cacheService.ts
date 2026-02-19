/**
 * LocalStorage Cache Service
 * 
 * Provides a fast, synchronous caching layer that sits in front of
 * Supabase and Monday.com API calls. Uses a stale-while-revalidate
 * pattern — cached data is returned instantly and refreshed silently.
 */

const CACHE_PREFIX = 'cv_cache_';
const DEFAULT_TTL_MS = 1000 * 60 * 5; // 5 minutes

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

/**
 * Get cached data from localStorage.
 * Returns { data, isStale } if cache exists, or null if no cache.
 */
export function getCache<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): { data: T; isStale: boolean } | null {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;

        const entry: CacheEntry<T> = JSON.parse(raw);
        if (!entry.data || !entry.timestamp) return null;

        const age = Date.now() - entry.timestamp;
        return { data: entry.data, isStale: age > ttlMs };
    } catch {
        // Corrupted data or parse error — clear it
        try { localStorage.removeItem(CACHE_PREFIX + key); } catch { /* noop */ }
        return null;
    }
}

/**
 * Store data in localStorage cache with current timestamp.
 */
export function setCache<T>(key: string, data: T): void {
    try {
        const entry: CacheEntry<T> = { data, timestamp: Date.now() };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e: any) {
        // Handle QuotaExceededError
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            try {
                // Tier 1: Evict 30% of oldest entries
                const totalKeys = getKeyCount();
                evictOldestEntries(Math.max(5, Math.floor(totalKeys * 0.3)));

                const entry: CacheEntry<T> = { data, timestamp: Date.now() };
                localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
            } catch (retryErr) {
                try {
                    // Tier 2: Evict 80% (Aggressive)
                    const totalKeys = getKeyCount();
                    evictOldestEntries(Math.max(5, Math.floor(totalKeys * 0.8)));

                    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
                    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
                } catch (finalErr) {
                    // Tier 3: Nuclear option - Clear entirely
                    clearCache();
                    try {
                        const entry: CacheEntry<T> = { data, timestamp: Date.now() };
                        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
                    } catch (fatal) {
                        console.warn('[CacheService] Data too large for localStorage even after clear:', key);
                    }
                }
            }
        } else {
            console.warn('[CacheService] Storage Error:', e);
        }
    }
}

/**
 * Helper: Count relevant keys
 */
function getKeyCount(): number {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(CACHE_PREFIX)) count++;
    }
    return count;
}

/**
 * Clear one or all cache entries.
 */
export function clearCache(key?: string): void {
    try {
        if (key) {
            localStorage.removeItem(CACHE_PREFIX + key);
        } else {
            // Clear all cv_cache_ entries
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k?.startsWith(CACHE_PREFIX)) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
        }
    } catch {
        // noop
    }
}

/**
 * Evict the oldest N cache entries to free up space.
 */
function evictOldestEntries(count: number): void {
    const entries: { key: string; timestamp: number }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
            try {
                const parsed = JSON.parse(localStorage.getItem(key) || '{}');
                entries.push({ key, timestamp: parsed.timestamp || 0 });
            } catch {
                // Can't parse — evict immediately
                entries.push({ key, timestamp: 0 });
            }
        }
    }

    // Sort oldest first, remove N oldest
    entries.sort((a, b) => a.timestamp - b.timestamp);
    entries.slice(0, count).forEach(e => localStorage.removeItem(e.key));
}
