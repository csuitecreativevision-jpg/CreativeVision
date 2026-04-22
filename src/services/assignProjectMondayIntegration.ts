/**
 * Monday.com: editor availability for Admin → Assign Project (optional sidebar).
 * Availability board: https://creative-vision-unit.monday.com/boards/7616044423/views
 */
import { ymdInManila } from '../lib/philippinesTime';
import { getBoardItems, getUsers } from './mondayService';

export const ASSIGN_PROJECT_MONDAY_BOARD_IDS = {
    availability: '7616044423',
} as const;

function norm(s: string) {
    return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

async function mondayUserIdToName(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    try {
        const users = await getUsers();
        for (const u of users || []) {
            if (u?.id != null && u?.name) map.set(String(u.id), String(u.name));
        }
    } catch {
        /* token / network */
    }
    return map;
}

function parseStatusLabelFromValue(valueStr: string | null | undefined): string {
    if (!valueStr) return '';
    try {
        const j = JSON.parse(valueStr) as { label?: { text?: string } | string };
        if (j && typeof j.label === 'object' && j.label?.text) return String(j.label.text).trim();
        if (j && typeof j.label === 'string') return j.label.trim();
    } catch {
        /* ignore */
    }
    return '';
}

function splitNameList(raw: string): string[] {
    const names: string[] = [];
    for (const part of raw.split(/[,;]/)) {
        const n = part.replace(/\([^)]*\)/g, '').trim();
        if (n.length > 0) names.push(n);
    }
    return names;
}

function normalizeNameKey(name: string): string {
    return norm(name).replace(/[^a-z0-9 ]+/g, '').replace(/\s+/g, ' ').trim();
}

function peopleNamesFromColumnValue(cv: any, userById: Map<string, string>): string[] {
    const text = (cv.text || cv.display_value || '').trim();
    if (text) return splitNameList(text);

    if (!cv.value) return [];
    try {
        const j = JSON.parse(cv.value) as { personsAndTeams?: { id?: number | string; kind?: string }[] };
        const pts = j.personsAndTeams;
        if (!Array.isArray(pts)) return [];
        const names: string[] = [];
        for (const p of pts) {
            if (p.kind === 'person' && p.id != null) {
                const nm = userById.get(String(p.id));
                if (nm) names.push(nm);
            }
        }
        return names;
    } catch {
        return [];
    }
}

function flattenItemsWithSubitems(items: any[]): any[] {
    const out: any[] = [];
    const walk = (row: any) => {
        out.push(row);
        const subs = row.subitems;
        if (Array.isArray(subs)) subs.forEach(walk);
    };
    items.forEach(walk);
    return out;
}

function parseColumnDateText(cv: { text?: string | null; value?: string | null; type?: string }): string | null {
    const raw = (cv.text || '').trim();
    if (raw) {
        const isoLike = raw.match(/(\d{4}-\d{2}-\d{2})/);
        if (isoLike) return isoLike[1];
        const t = Date.parse(raw);
        if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
    }
    if (cv.value) {
        try {
            const j = JSON.parse(cv.value) as { date?: string; from?: string; to?: string };
            if (j?.date && /^\d{4}-\d{2}-\d{2}/.test(j.date)) return j.date.slice(0, 10);
            if (j?.from && /^\d{4}-\d{2}-\d{2}/.test(j.from)) return j.from.slice(0, 10);
        } catch {
            /* ignore */
        }
    }
    return null;
}

function rowMatchesCalendarDay(cv: any, yyyyMmDd: string): boolean {
    if (!cv) return false;

    if (cv.type === 'timeline' || cv.type === 'timerange') {
        if (!cv.value) return false;
        try {
            const j = JSON.parse(cv.value) as { from?: string; to?: string };
            const from = j.from?.slice(0, 10);
            const to = (j.to || j.from)?.slice(0, 10);
            if (from && to) return yyyyMmDd >= from && yyyyMmDd <= to;
        } catch {
            return false;
        }
        return false;
    }

    const single = parseColumnDateText(cv);
    return single === yyyyMmDd;
}

function findAvailabilityDateColumn(columns: any[]): any | undefined {
    const timeline = columns.find((c: any) => c.type === 'timeline' || c.type === 'timerange');
    if (timeline) return timeline;
    const byType = columns.find((c: any) => c.type === 'date');
    if (byType) return byType;
    return columns.find((c: any) => {
        const t = norm(c.title);
        return t === 'date' || t.includes('day') || t.includes('schedule') || t === 'when';
    });
}

function findAvailabilityPeopleColumn(columns: any[]): any | undefined {
    const people = columns.find((c: any) => c.type === 'people');
    if (people) return people;
    const titled = columns.find((c: any) => {
        const t = norm(c.title);
        return t.includes('editor') || t.includes('team member') || t.includes('person');
    });
    if (titled) return titled;
    return columns.find((c: any) => c.type === 'dropdown' && norm(c.title).includes('editor'));
}

/** "Availability Form" boards: tags like "Monday - PM", not a calendar date column. */
function findWeekdayAvailabilityColumn(columns: any[]): any | undefined {
    const byTitle = columns.find((c: any) => norm(c.title).includes('availability'));
    if (byTitle) return byTitle;
    return undefined;
}

function findFirstNameColumn(columns: any[]): any | undefined {
    return columns.find((c: any) => {
        const t = norm(c.title);
        return /\bfirst\b/.test(t) && /\bname\b/.test(t) && !/\blast\b/.test(t);
    });
}

function findLastNameColumn(columns: any[]): any | undefined {
    return columns.find((c: any) => {
        const t = norm(c.title);
        return /\blast\b/.test(t) && /\bname\b/.test(t);
    });
}

function findFullNameColumn(columns: any[]): any | undefined {
    return columns.find((c: any) => {
        const t = norm(c.title);
        if (/\bfirst\b/.test(t) || /\blast\b/.test(t)) return false;
        return t === 'name' || t === 'full name' || t === 'editor name' || t === 'team member';
    });
}

/** Selected human-readable pieces from status / dropdown / tags column (API + JSON). */
function collectAvailabilityCellText(cv: any): string {
    if (!cv) return '';
    const chunks: string[] = [];
    const t = (cv.text || '').trim();
    if (t) chunks.push(t);
    const dv = (cv.display_value || '').trim();
    if (dv && dv !== t) chunks.push(dv);
    if (!cv.value) return chunks.join(' ');
    try {
        const j = JSON.parse(cv.value) as Record<string, unknown>;
        const label = j.label as { text?: string } | string | undefined;
        if (label && typeof label === 'object' && label.text) chunks.push(String(label.text));
        if (typeof label === 'string') chunks.push(label);
        const chosen = j.chosenValues as unknown[] | undefined;
        if (Array.isArray(chosen)) {
            for (const ch of chosen) {
                if (typeof ch === 'string') chunks.push(ch);
                else if (ch && typeof ch === 'object' && 'name' in (ch as object)) chunks.push(String((ch as { name?: string }).name));
            }
        }
    } catch {
        /* ignore */
    }
    return chunks.join(' ');
}

const WEEKDAY_LONG = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

/** True if availability tags mention the calendar weekday of yyyy-mm-dd (local). */
function availabilityTextMatchesYyyyMmDd(availTextRaw: string, yyyyMmDd: string): boolean {
    if (!availTextRaw.trim()) return false;
    const [y, mo, d] = yyyyMmDd.split('-').map(Number);
    const dt = new Date(y, mo - 1, d, 12, 0, 0, 0);
    const idx = dt.getDay();
    const long = WEEKDAY_LONG[idx];

    const segments = availTextRaw.split(/[,;/|]/).map(s => norm(s)).filter(Boolean);
    const haystack = segments.length > 0 ? segments : [norm(availTextRaw)];

    for (const seg of haystack) {
        if (seg.includes(long)) return true;
    }
    const fullHay = norm(availTextRaw);
    if (fullHay.includes(long)) return true;

    /** Truncated labels (e.g. "Tu…") — safe short tokens that are not substrings of other weekdays. */
    const shorts: Record<number, string[]> = {
        0: ['sun'],
        1: ['mon'],
        2: ['tue'],
        3: ['wed'],
        4: ['thu'],
        5: ['fri'],
        6: ['sat'],
    };
    for (const s of shorts[idx] || []) {
        const re = new RegExp(`\\b${s}\\w*\\b`, 'i');
        if (re.test(availTextRaw)) return true;
    }
    return false;
}

function namesFromFirstLastColumns(item: any, firstCol: any | undefined, lastCol: any | undefined): string[] {
    if (!firstCol?.id && !lastCol?.id) return [];
    const first =
        firstCol?.id ? (item.column_values?.find((v: any) => v.id === firstCol.id)?.text || '').trim() : '';
    const last =
        lastCol?.id ? (item.column_values?.find((v: any) => v.id === lastCol.id)?.text || '').trim() : '';
    const full = `${first} ${last}`.trim();
    return full ? [full] : [];
}

function isGenericFormItemName(name: string): boolean {
    const n = norm(name);
    return n.includes('incoming form') || n.includes('form answ') || n === 'item' || n.length < 2;
}

function discoverAvailabilityColumnIds(items: any[]): { dateId?: string; peopleId?: string } {
    const flat = flattenItemsWithSubitems(items);
    let dateId: string | undefined;
    let peopleId: string | undefined;
    for (const item of flat) {
        for (const cv of item.column_values || []) {
            if (!peopleId && cv.type === 'people') peopleId = cv.id;
            if (
                !dateId &&
                (cv.type === 'date' || cv.type === 'timeline' || cv.type === 'timerange')
            ) {
                dateId = cv.id;
            }
        }
        if (dateId && peopleId) break;
    }
    return { dateId, peopleId };
}

function passesAvailabilityGateSimple(item: any, columns: any[]): boolean {
    const candidates = columns.filter((c: any) => {
        const t = norm(c.title);
        if (c.type !== 'status' && c.type !== 'color' && c.type !== 'dropdown') return false;
        return (
            t.includes('available') ||
            t.includes('attendance') ||
            t.includes('here') ||
            t.includes('pto') ||
            t.includes('leave')
        );
    });

    for (const col of candidates) {
        const cv = item.column_values?.find((v: any) => v.id === col.id);
        const text = norm(cv?.text || cv?.display_value || '');
        if (!text) continue;

        const bad =
            text.includes('unavailable') ||
            text.includes('out of office') ||
            text.includes('ooo') ||
            /\bpto\b/.test(text) ||
            text.includes('sick leave') ||
            text.includes('vacation') ||
            text.includes('day off') ||
            text === 'off' ||
            text.startsWith('off -');

        if (bad) return false;
    }
    return true;
}

export async function fetchEditorsAvailableForDate(yyyyMmDd: string, forceSync = false): Promise<string[]> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return [];

    const board = await getBoardItems(ASSIGN_PROJECT_MONDAY_BOARD_IDS.availability, forceSync);
    if (!board?.items?.length) return [];

    const userById = await mondayUserIdToName();
    const columns = board.columns || [];
    let dateCol = findAvailabilityDateColumn(columns);
    let peopleCol = findAvailabilityPeopleColumn(columns);
    const weekdayAvailCol = findWeekdayAvailabilityColumn(columns);
    const firstNameCol = findFirstNameColumn(columns);
    const lastNameCol = findLastNameColumn(columns);
    const fullNameCol = findFullNameColumn(columns);

    const discovered = discoverAvailabilityColumnIds(board.items);
    if (!dateCol?.id && discovered.dateId) {
        dateCol = { id: discovered.dateId, type: 'date' };
    }
    if (!peopleCol?.id && discovered.peopleId) {
        peopleCol = { id: discovered.peopleId, type: 'people' };
    }

    const canMatchByCalendar = Boolean(dateCol?.id);
    const canMatchByWeekdayTags = Boolean(weekdayAvailCol?.id);

    if (!canMatchByCalendar && !canMatchByWeekdayTags) return [];

    const namesByKey = new Map<string, string>();

    // Availability Form is filled as top-level rows. Subitems can duplicate names,
    // so prefer board items only. If a "Current" group exists, use only that group.
    const groupTitleById = new Map<string, string>();
    for (const g of board.groups || []) {
        if (g?.id) groupTitleById.set(String(g.id), norm(String(g.title || '')));
    }
    const topItems = Array.isArray(board.items) ? board.items : [];
    const currentGroupRows = topItems.filter((it: any) => {
        const gid = String(it?.group?.id || '');
        const gt = groupTitleById.get(gid) || '';
        return gt.includes('current');
    });
    const rows: any[] = currentGroupRows.length > 0 ? currentGroupRows : topItems;

    for (const item of rows) {
        if (!passesAvailabilityGateSimple(item, columns)) continue;

        const dateCv = dateCol?.id ? item.column_values?.find((v: any) => v.id === dateCol.id) : null;
        const availCv = weekdayAvailCol?.id
            ? item.column_values?.find((v: any) => v.id === weekdayAvailCol.id)
            : null;

        const byCalendarDate = Boolean(dateCv && rowMatchesCalendarDay(dateCv, yyyyMmDd));
        const availText = availCv ? collectAvailabilityCellText(availCv) : '';
        const byWeekdayTags = Boolean(availText && availabilityTextMatchesYyyyMmDd(availText, yyyyMmDd));

        if (!byCalendarDate && !byWeekdayTags) continue;

        let rowNames: string[] = [];
        if (peopleCol?.id) {
            const peopleCv = item.column_values?.find((v: any) => v.id === peopleCol.id);
            if (peopleCv) {
                rowNames = peopleNamesFromColumnValue(peopleCv, userById);
                if (rowNames.length === 0 && peopleCv.type === 'dropdown') {
                    const t = (peopleCv.text || peopleCv.display_value || parseStatusLabelFromValue(peopleCv.value)).trim();
                    if (t) rowNames = splitNameList(t);
                }
            }
        }
        if (rowNames.length === 0) {
            rowNames = namesFromFirstLastColumns(item, firstNameCol, lastNameCol);
        }
        if (rowNames.length === 0 && fullNameCol?.id) {
            const nm = (item.column_values?.find((v: any) => v.id === fullNameCol.id)?.text || '').trim();
            if (nm) rowNames = [nm];
        }
        if (rowNames.length === 0) {
            const fallback = (item.name || '').trim();
            if (fallback && !isGenericFormItemName(fallback)) rowNames = [fallback];
        }

        for (const n of rowNames) {
            const clean = n.trim();
            if (!clean) continue;
            const key = normalizeNameKey(clean);
            if (!key) continue;
            const existing = namesByKey.get(key);
            if (!existing || clean.length > existing.length) namesByKey.set(key, clean);
        }
    }

    return [...namesByKey.values()].sort((a, b) => a.localeCompare(b));
}

export function deadlineToYyyyMmDd(deadlineInput: string): string | null {
    if (!deadlineInput || !deadlineInput.trim()) return null;
    const d = new Date(deadlineInput);
    if (Number.isNaN(d.getTime())) return null;
    return ymdInManila(d);
}
