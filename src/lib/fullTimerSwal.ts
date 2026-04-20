import Swal from 'sweetalert2';

const swalDark = {
    background: '#131322',
    color: '#f4f4f5',
    confirmButtonColor: '#7c3aed',
    cancelButtonColor: '#52525b'
};

/** Large emoji / icon inside SweetAlert2’s icon ring (replaces default ✓ / i glyph). */
function swalIconEmoji(emoji: string, sizeRem = 2.5): string {
    return `<span style="font-size:${sizeRem}rem;line-height:1;display:flex;align-items:center;justify-content:center">${emoji}</span>`;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function formatTimeLocal(d: Date): string {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Full-timer shift: 4:00 PM up to (but not including) midnight, local device time. */
export function isWithinFullTimerShift(d: Date): boolean {
    const mins = d.getHours() * 60 + d.getMinutes();
    return mins >= 16 * 60 && mins < 24 * 60;
}

/**
 * After midnight until 4:00 AM: allow clock out only (close a session that ran until 12:00 AM).
 * Not valid for clock-in.
 */
export function isPostShiftClockOutGrace(d: Date): boolean {
    const mins = d.getHours() * 60 + d.getMinutes();
    return mins < 4 * 60;
}

/** Full-timer may end their session: during shift, or in post-midnight grace. */
export function canFullTimerClockOutNow(d: Date): boolean {
    return isWithinFullTimerShift(d) || isPostShiftClockOutGrace(d);
}

/** Dinner break: 6:00 PM up to (but not including) 9:00 PM, device local time. */
export function isWithinDinnerWindow(d: Date): boolean {
    const mins = d.getHours() * 60 + d.getMinutes();
    return mins >= 18 * 60 && mins < 21 * 60;
}

/** Hard block — no override. */
export async function blockFullTimerClockIn(now: Date): Promise<void> {
    const t = formatTimeLocal(now);
    await Swal.fire({
        ...swalDark,
        icon: 'error',
        title: 'Clock in not allowed',
        html: `It's <strong>${t}</strong> right now (real time on this device). Full-time shift is only <strong>4:00 PM – 12:00 AM</strong>.`,
        confirmButtonText: 'OK'
    });
}

export async function blockFullTimerClockOut(now: Date): Promise<void> {
    const t = formatTimeLocal(now);
    await Swal.fire({
        ...swalDark,
        icon: 'error',
        title: 'Clock out not allowed',
        html: `It's <strong>${t}</strong>. Full-timers can clock out during <strong>4:00 PM – 12:00 AM</strong>, or before <strong>4:00 AM</strong> after midnight to close out the prior shift.`,
        confirmButtonText: 'OK'
    });
}

/** During shift: optional confirm when leaving before midnight. */
export async function confirmFullTimerLeavingDuringShift(now: Date): Promise<boolean> {
    const t = formatTimeLocal(now);
    const r = await Swal.fire({
        ...swalDark,
        icon: 'warning',
        title: 'End shift before 12:00 AM?',
        html: `It's <strong>${t}</strong>. Scheduled shift ends at <strong>12:00 AM</strong>. Clock out anyway?`,
        showCancelButton: true,
        confirmButtonText: 'Yes, clock out',
        cancelButtonText: 'Cancel'
    });
    return r.isConfirmed;
}

/**
 * @returns whether clock out may proceed
 */
export async function guardFullTimerClockOut(now: Date): Promise<boolean> {
    if (!canFullTimerClockOutNow(now)) {
        await blockFullTimerClockOut(now);
        return false;
    }
    if (isWithinFullTimerShift(now)) {
        return confirmFullTimerLeavingDuringShift(now);
    }
    return true;
}

const DINNER_START_MINS = 18 * 60;

export async function blockFullTimerDinnerOutsideWindow(now: Date): Promise<void> {
    const t = formatTimeLocal(now);
    const mins = now.getHours() * 60 + now.getMinutes();
    const tooEarly = mins < DINNER_START_MINS;
    await Swal.fire({
        ...swalDark,
        icon: 'warning',
        title: tooEarly ? 'Too early for dinner' : 'Dinner window has ended',
        html: tooEarly
            ? `It's <strong>${t}</strong>. It's too early to start your dinner break. Dinner is only available from <strong>6:00 PM – 9:00 PM</strong> on this device.`
            : `It's <strong>${t}</strong>. The dinner window is <strong>6:00 PM – 9:00 PM</strong>. You can't start dinner now — that time has passed for today.`,
        confirmButtonText: 'OK'
    });
}

/**
 * DINNER OUT only during 6–9 PM. DINNER IN is always allowed (so editors aren't stuck if they return after 9 PM).
 */
export async function guardFullTimerDinner(now: Date, action: 'out' | 'in'): Promise<boolean> {
    if (action === 'in') return true;
    if (isWithinDinnerWindow(now)) return true;
    await blockFullTimerDinnerOutsideWindow(now);
    return false;
}

/** After starting dinner break — 1-hour meal window begins. */
export async function swalDinnerOutEatwell(): Promise<void> {
    await Swal.fire({
        ...swalDark,
        icon: 'success',
        iconColor: '#fb923c',
        iconHtml: swalIconEmoji('🍳'),
        title: 'Eatwell',
        html: 'Your <strong>1-hour</strong> dinner break has started. Enjoy your meal — a countdown will show on the tracker until the hour is up. When you are back, tap <strong>DINNER IN</strong>.',
        confirmButtonText: 'OK'
    });
}

/** After dinner in — work timer resumes (shift time continues toward your full block). */
export async function swalDinnerInResumeShift(): Promise<void> {
    await Swal.fire({
        ...swalDark,
        icon: 'info',
        iconColor: '#a78bfa',
        iconHtml: swalIconEmoji('💼'),
        title: 'Welcome back',
        html: 'Your <strong>shift timer</strong> is running again. Paid time continues toward your scheduled block (full-time shift is <strong>8 hours</strong> from 4:00 PM through midnight, with this break counted separately).',
        confirmButtonText: 'OK'
    });
}

/** After a successful clock out — friendly goodbye with waving hand (see `.cv-swal-bye-hand` in `index.css`). */
export async function swalClockOutGoodbye(displayName: string): Promise<void> {
    const rawFirst = displayName.trim().split(/\s+/)[0] || 'there';
    const first = escapeHtml(rawFirst.slice(0, 48));
    await Swal.fire({
        ...swalDark,
        icon: 'success',
        iconColor: '#a78bfa',
        iconHtml: '<span class="cv-swal-bye-hand">👋</span>',
        title: `Bye, ${first}!`,
        html: "You're <strong>clocked out</strong>. Rest well — see you on your next shift.",
        confirmButtonText: 'OK'
    });
}

export async function swalActionError(title: string, html: string): Promise<void> {
    await Swal.fire({
        ...swalDark,
        icon: 'error',
        title,
        html,
        confirmButtonText: 'OK'
    });
}
