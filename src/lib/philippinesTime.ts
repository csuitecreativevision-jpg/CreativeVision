/**
 * All assign-project deadlines are interpreted and displayed in **Asia/Manila (PH, UTC+8)**.
 * Monday.com date columns require **UTC** in the API; we convert from Manila wall time to UTC.
 */

export const ASIA_MANILA = 'Asia/Manila';

const MANILA_TZ = ASIA_MANILA;

function pad2(n: number) {
    return String(n).padStart(2, '0');
}

/** Calendar YYYY-MM-DD in Manila for an instant. */
export function ymdInManila(d: Date = new Date()): string {
    return d.toLocaleDateString('en-CA', { timeZone: MANILA_TZ });
}

/**
 * “Today” in Manila, as YYYY-MM-DD (e.g. for default picker day).
 * Avoids the browser’s local time zone.
 */
export function todaysYmdManila(): string {
    return ymdInManila(new Date());
}

/**
 * Interprets stored deadline: ISO with offset, or legacy `YYYY-MM-DDTHH:mm` (treated as Manila).
 */
function parseToInstantInManila(deadline: string): Date | null {
    const s = deadline.trim();
    if (!s) return null;
    if (s.includes('+') || s.endsWith('Z')) {
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{1,2}:\d{2}/.test(s)) {
        const [a, t] = s.split('T');
        let time = t;
        if (time.length === 5) {
            time += ':00';
        } else {
            time = time.slice(0, 8);
        }
        const d = new Date(`${a}T${time}+08:00`);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
}

/** For “Today” in deadline picker: current wall clock in Manila. */
export function manilaPickerPartsFromDate(d: Date): { ymd: string; hour12: string; minute: string; ampm: 'AM' | 'PM' } {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: MANILA_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).formatToParts(d);
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value;
    const y = get('year');
    const m = get('month');
    const day = get('day');
    const ymd = y && m && day ? `${y}-${m}-${day}` : todaysYmdManila();
    const hStr = get('hour');
    const isPm = (get('dayPeriod') || '').toLowerCase() === 'pm';
    const ampm: 'AM' | 'PM' = isPm ? 'PM' : 'AM';
    if (!hStr) {
        return { ymd, hour12: '12', minute: '00', ampm: 'PM' };
    }
    const hNum = Math.min(12, Math.max(1, parseInt(hStr, 10) || 12));
    const min = (get('minute') || '00').padStart(2, '0').slice(0, 2);
    return { ymd, hour12: pad2(hNum), minute: min, ampm };
}

/**
 * Picker state from stored deadline, or “now” in Manila when empty / invalid.
 */
export function parseManilaDeadlineForPicker(
    deadline: string
): { ymd: string; hour12: string; minute: string; ampm: 'AM' | 'PM' } {
    if (!deadline || !deadline.trim()) {
        return manilaPickerPartsFromDate(new Date());
    }
    const d = parseToInstantInManila(deadline);
    if (d == null || Number.isNaN(d.getTime())) {
        return manilaPickerPartsFromDate(new Date());
    }
    return manilaPickerPartsFromDate(d);
}

function to24HourFrom12(hour12: string, ampm: 'AM' | 'PM'): number {
    let h = Number(hour12);
    if (Number.isNaN(h) || h < 1 || h > 12) h = 12;
    if (ampm === 'AM') return h === 12 ? 0 : h;
    return h === 12 ? 12 : h + 12;
}

/**
 * User-selected Manila wall time as an ISO string with +08:00.
 */
export function parseYmdToNoonManila(ymd: string): Date {
    return new Date(`${ymd}T12:00:00+08:00`);
}

export function buildManilaDeadline(ymd: string, hour12: string, minute: string, ampm: 'AM' | 'PM'): string {
    const hh = to24HourFrom12(hour12, ampm);
    const mm = String(Math.max(0, Math.min(59, Number(minute) || 0))).padStart(2, '0');
    return `${ymd}T${pad2(hh)}:${mm}:00+08:00`;
}

/** Suffix for all user-visible deadlines (avoids `Intl` emitting “GMT” / “GMT+8” for Asia/Manila). */
const PHT_LABEL = 'PHT';

/**
 * Shown in Assign Project and notifications — always Philippine Time (no GMT label).
 * Stored values may be ISO with `Z` or `+08:00`; display is the same instant in **Asia/Manila** with a **PHT** suffix.
 */
export function formatDeadlineInManila(isoOrLegacy: string, withYear = true): string {
    const d = parseToInstantInManila(isoOrLegacy) ?? new Date(isoOrLegacy);
    if (Number.isNaN(d.getTime())) return isoOrLegacy;
    if (withYear) {
        return (
            `${d.toLocaleString('en-PH', {
                timeZone: MANILA_TZ,
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            })} ${PHT_LABEL}`
        );
    }
    return (
        `${d.toLocaleString('en-PH', {
            timeZone: MANILA_TZ,
            month: '2-digit',
            day: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
        })} ${PHT_LABEL}`
    );
}

/**
 * Monday.com `date` column: API expects `date` + `time` in **UTC** (per official docs).
 * `timeline` is a Manila local instant from `buildManilaDeadline` (or legacy without offset = Manila).
 */
export function manilaWallTimeToMondayDateColumnUtc(
    timeline: string
): { date: string; time: string } {
    const t = timeline.trim();
    if (!t.includes('T')) {
        return { date: t.slice(0, 10) || t, time: '00:00:00' };
    }
    const d = parseToInstantInManila(t);
    if (!d) {
        const [datePart, rest] = t.split('T');
        const timePart = (rest || '00:00:00').replace('Z', '').padEnd(8, '0').slice(0, 8);
        return { date: datePart, time: timePart };
    }
    return {
        date: `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`,
        time: `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`,
    };
}

/** YYYY-MM-DD 24h:MM in Asia/Manila (admin lists, e.g. Pending Approvals). */
export function formatYmdHm24InManila(d: Date): string {
    if (Number.isNaN(d.getTime())) return '';
    const ymd = d.toLocaleDateString('en-CA', { timeZone: MANILA_TZ });
    const hm = d.toLocaleTimeString('en-GB', {
        timeZone: MANILA_TZ,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    return `${ymd} ${hm}`;
}

/** Calendar yesterday (YYYY-MM-DD) in Manila relative to `ref` (default: now). */
export function yesterdaysYmdManila(ref: Date = new Date()): string {
    const todayYmd = ymdInManila(ref);
    const noon = parseYmdToNoonManila(todayYmd);
    return ymdInManila(new Date(noon.getTime() - 24 * 60 * 60 * 1000));
}

/** 24h hour + minute in Manila (for re-applying a wall time to a new calendar day). */
export function manilaWallHm24FromDate(d: Date): { h: string; m: string } {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: MANILA_TZ,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(d);
    const h = (parts.find((p) => p.type === 'hour')?.value ?? '12').padStart(2, '0');
    const m = (parts.find((p) => p.type === 'minute')?.value ?? '00').padStart(2, '0');
    return { h, m };
}

export type MondayDeadlineColumnType = 'date' | 'timeline' | string | undefined;

/**
 * Monday `date` column `value` JSON: `date` + `time` are **UTC** in the API.
 * Timeline: use `from` (or `to`) start day in UTC; no time in UI.
 * Returns the instant in JS `Date` (UTC) for correct PH display and PH calendar bucketing.
 */
export function mondayDateColumnValueToUtcInstant(
    valueJson: string,
    colType: MondayDeadlineColumnType
): { instant: Date; showTimeInPh: boolean } | null {
    let parsed: { date?: string; time?: string; from?: string; to?: string };
    try {
        parsed = JSON.parse(valueJson) as { date?: string; time?: string; from?: string; to?: string };
    } catch {
        return null;
    }
    const ct = String(colType || '').toLowerCase();
    if (ct === 'timeline') {
        const f = (parsed.from || parsed.to || '').slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return null;
        return { instant: new Date(`${f}T00:00:00.000Z`), showTimeInPh: false };
    }
    const base = (parsed.date || '').trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(base)) {
        const from = (parsed.from || '').trim().slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) return null;
        return { instant: new Date(`${from}T00:00:00.000Z`), showTimeInPh: false };
    }
    const timeRaw = (parsed.time || '').trim();
    const hasTime = !!timeRaw && /^\d{1,2}:\d{2}/.test(timeRaw);
    let h = 0;
    let mi = 0;
    let s = 0;
    if (hasTime) {
        const parts = timeRaw.split(':');
        h = parseInt(String(parts[0] || '0').replace(/\D/g, ''), 10) || 0;
        mi = parseInt(String(parts[1] || '0').replace(/\D/g, ''), 10) || 0;
        s = parts[2] != null ? parseInt(String(parts[2] || '0').replace(/\D/g, ''), 10) || 0 : 0;
    }
    const th = String(Math.min(23, Math.max(0, h))).padStart(2, '0');
    const tmi = String(Math.min(59, Math.max(0, mi))).padStart(2, '0');
    const ts = String(Math.min(59, Math.max(0, s))).padStart(2, '0');
    const instant = new Date(`${base}T${th}:${tmi}:${ts}.000Z`);
    if (Number.isNaN(instant.getTime())) return null;
    return { instant, showTimeInPh: hasTime };
}
