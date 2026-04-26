/**
 * Resolve a project deadline as a local Date (same heuristics as the editor project view).
 * Pass the board's `columns` and the Monday `item`.
 */

function extractTimeFromText(txt: string): { hh: number; mm: number } | null {
    const m = txt.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!m) return null;
    let hh = Number(m[1]);
    const mm = Number(m[2]);
    const ampm = m[3].toUpperCase();
    if (ampm === 'PM' && hh < 12) hh += 12;
    if (ampm === 'AM' && hh === 12) hh = 0;
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return { hh, mm };
}

function extractTimeFromAny(raw: string): { hh: number; mm: number } | null {
    const ampm = extractTimeFromText(raw);
    if (ampm) return ampm;
    const m24 = raw.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (!m24) return null;
    const hh = Number(m24[1]);
    const mm = Number(m24[2]);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return { hh, mm };
}

function pickBestDeadlineColumn(cols: any[], itemArg?: any) {
    const strictCandidates = cols.filter((c: any) => {
        const t = String(c?.title || '').trim().toLowerCase();
        return (t.includes('ve project board') && t.includes('deadline')) || t === 'deadline' || t === 'deadline date';
    });
    if (strictCandidates.length > 0) {
        if (!itemArg?.column_values?.length) return strictCandidates[0];
        const byItemValue = [...strictCandidates].sort((a, b) => {
            const av = itemArg.column_values.find((v: any) => v.id === a.id);
            const bv = itemArg.column_values.find((v: any) => v.id === b.id);
            const ar = String(av?.text || av?.display_value || '').trim();
            const br = String(bv?.text || bv?.display_value || '').trim();
            const as = (ar ? 10 : 0) + (av?.value ? 10 : 0) + (/(\d{1,2}:\d{2}\s*(am|pm))/i.test(ar) ? 5 : 0);
            const bs = (br ? 10 : 0) + (bv?.value ? 10 : 0) + (/(\d{1,2}:\d{2}\s*(am|pm))/i.test(br) ? 5 : 0);
            return bs - as;
        });
        return byItemValue[0];
    }
    const scoreCol = (c: any) => {
        const t = String(c?.title || '').toLowerCase().trim();
        let score = 0;
        if (t === 'deadline' || t === 'due date') score += 100;
        if (t.includes('deadline')) score += 40;
        if (t.includes('due')) score += 25;
        if (c?.type === 'date' || c?.type === 'timeline') score += 20;
        if (t.includes('created') || t.includes('updated') || t.includes('start')) score -= 30;
        if (itemArg?.column_values?.length) {
            const cv = itemArg.column_values.find((v: any) => v.id === c.id);
            const raw = String(cv?.text || cv?.display_value || '');
            if (/(\d{1,2}:\d{2}\s*(am|pm))/i.test(raw)) score += 15;
            if (cv?.value) {
                try {
                    const parsed = JSON.parse(cv.value) as { time?: string };
                    if (parsed?.time) score += 15;
                } catch {
                    /* ignore */
                }
            }
        }
        return score;
    };
    return [...(cols || [])].sort((a, b) => scoreCol(b) - scoreCol(a))[0] || null;
}

export function getItemDeadlineDate(item: any, columns: any[] | undefined): Date | null {
    const cols = columns || [];
    const deadlineCol = pickBestDeadlineColumn(cols, item);
    const cv = deadlineCol?.id ? item?.column_values?.find((v: any) => v.id === deadlineCol.id) : null;
    const raw = String(cv?.text || cv?.display_value || '').trim();
    const rawDateOnly = raw.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (rawDateOnly) {
        const [y, m, d] = rawDateOnly.split('-').map(Number);
        return new Date(y, m - 1, d, 12, 0, 0, 0);
    }
    const resolveAuxTime = (): { hh: number; mm: number } | null => {
        const timeCol = cols.find((c: any) => {
            const t = String(c?.title || '').toLowerCase();
            return t.includes('time') && !t.includes('tracking') && !t.includes('timezone');
        });
        if (!timeCol?.id) return null;
        const tv = item?.column_values?.find((v: any) => v.id === timeCol.id);
        const tRaw = String(tv?.text || tv?.display_value || '').trim();
        return extractTimeFromText(tRaw);
    };
    if (deadlineCol?.id) {
        if (cv?.value) {
            try {
                const v = JSON.parse(cv.value) as {
                    date?: string;
                    time?: string;
                    from?: string;
                    to?: string;
                    hour?: number;
                    minute?: number;
                };
                const base = v.date || v.from || '';
                if (/^\d{4}-\d{2}-\d{2}/.test(base)) {
                    const [y, m, d] = base.slice(0, 10).split('-').map(Number);
                    let hh = 0;
                    let mm = 0;
                    const fromTime = extractTimeFromAny(String(v.time || ''));
                    if (fromTime) {
                        hh = fromTime.hh;
                        mm = fromTime.mm;
                    } else if (typeof v.hour === 'number' && typeof v.minute === 'number') {
                        hh = v.hour;
                        mm = v.minute;
                    } else {
                        const aux = resolveAuxTime();
                        if (aux) {
                            hh = aux.hh;
                            mm = aux.mm;
                        }
                    }
                    return new Date(y, m - 1, d, hh, mm, 0, 0);
                }
                const fromJsonLocalIso = cv.value.match(/(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/);
                if (fromJsonLocalIso) {
                    const [yy, mo, dd] = fromJsonLocalIso[1].split('-').map(Number);
                    const hh = Number(fromJsonLocalIso[2]);
                    const mi = Number(fromJsonLocalIso[3]);
                    if (
                        !Number.isNaN(yy) &&
                        !Number.isNaN(mo) &&
                        !Number.isNaN(dd) &&
                        !Number.isNaN(hh) &&
                        !Number.isNaN(mi)
                    ) {
                        return new Date(yy, mo - 1, dd, hh, mi, 0, 0);
                    }
                }
            } catch {
                /* ignore */
            }
        }
        if (raw) {
            const iso = raw.match(/\d{4}-\d{2}-\d{2}/)?.[0];
            if (iso) {
                const [y, m, d] = iso.split('-').map(Number);
                let hh = 0;
                let mm = 0;
                const timeFromRaw = extractTimeFromText(raw);
                if (timeFromRaw) {
                    hh = timeFromRaw.hh;
                    mm = timeFromRaw.mm;
                } else {
                    const timeFromAux = resolveAuxTime();
                    if (timeFromAux) {
                        hh = timeFromAux.hh;
                        mm = timeFromAux.mm;
                    }
                }
                if (cv?.value) {
                    try {
                        const v = JSON.parse(cv.value) as { time?: string; hour?: number; minute?: number };
                        const fromTime = extractTimeFromAny(String(v.time || ''));
                        if (fromTime) {
                            hh = fromTime.hh;
                            mm = fromTime.mm;
                        } else if (typeof v.hour === 'number' && typeof v.minute === 'number') {
                            hh = v.hour;
                            mm = v.minute;
                        } else {
                            const fromJson = extractTimeFromAny(cv.value);
                            if (fromJson) {
                                hh = fromJson.hh;
                                mm = fromJson.mm;
                            }
                        }
                    } catch {
                        /* ignore */
                    }
                }
                return new Date(y, m - 1, d, hh, mm, 0, 0);
            }
            const localIso = raw.match(/(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/);
            if (localIso) {
                const [yy, mo, dd] = localIso[1].split('-').map(Number);
                const hh = Number(localIso[2]);
                const mi = Number(localIso[3]);
                if (
                    !Number.isNaN(yy) &&
                    !Number.isNaN(mo) &&
                    !Number.isNaN(dd) &&
                    !Number.isNaN(hh) &&
                    !Number.isNaN(mi)
                ) {
                    return new Date(yy, mo - 1, dd, hh, mi, 0, 0);
                }
            }
        }
    }
    return null;
}

/** Start of today 00:00 local — deadline before this counts as overdue for Assigned. */
export function startOfTodayLocal(): Date {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 0, 0, 0, 0);
}

export function isDeadlineOverdueForBacklog(due: Date | null): boolean {
    if (!due || Number.isNaN(due.getTime())) return false;
    return due.getTime() < startOfTodayLocal().getTime();
}
