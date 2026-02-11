/**
 * Date Utilities for Cycle Calculations
 * 
 * Cycle 1: 1st - 15th of the month
 * Cycle 2: 16th - Last day of the month
 */

import type { CycleInfo } from '../types';

/**
 * Get the start and end dates for a specific cycle
 * @param cycle - Cycle number (1 or 2)
 * @param month - Month (1-12)
 * @param year - Year
 * @returns CycleInfo with calculated dates
 */
export function getCycleDates(cycle: 1 | 2, month: number, year: number): CycleInfo {
    let startDate: Date;
    let endDate: Date;

    if (cycle === 1) {
        // Cycle 1: 1st - 13th
        startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
        endDate = new Date(year, month - 1, 13, 23, 59, 59, 999);
    } else {
        // Cycle 2: 14th - (End of month - 2 days)
        startDate = new Date(year, month - 1, 14, 0, 0, 0, 0);
        // Get last day of month
        const lastDay = new Date(year, month, 0);
        // Subtract 2 days
        lastDay.setDate(lastDay.getDate() - 2);
        lastDay.setHours(23, 59, 59, 999);
        endDate = lastDay;
    }

    return {
        cycle,
        month,
        year,
        startDate,
        endDate
    };
}

/**
 * Get the current cycle based on today's date
 * @returns CycleInfo for the current cycle
 */
export function getCurrentCycle(): CycleInfo {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1; // 0-indexed to 1-indexed
    const year = now.getFullYear();

    const cycle = day <= 13 ? 1 : 2;
    return getCycleDates(cycle as 1 | 2, month, year);
}

/**
 * Check if a date falls within a specific cycle
 * @param date - Date to check
 * @param cycleInfo - Cycle information
 * @returns true if date is within the cycle range
 */
export function isDateInCycle(date: Date, cycleInfo: CycleInfo): boolean {
    const timestamp = date.getTime();
    return timestamp >= cycleInfo.startDate.getTime() &&
        timestamp <= cycleInfo.endDate.getTime();
}

/**
 * Format cycle for display
 * @param cycleInfo - Cycle information
 * @returns Formatted string (e.g., "Cycle 1 - January 2026")
 */
export function formatCycle(cycleInfo: CycleInfo): string {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return `Cycle ${cycleInfo.cycle} - ${monthNames[cycleInfo.month - 1]} ${cycleInfo.year}`;
}

/**
 * Determine the cycle number (1 or 2) for a given date
 * @param date - Date to check
 * @returns 1 or 2
 */
export function getCycleFromDate(date: Date): 1 | 2 {
    return date.getDate() <= 13 ? 1 : 2;
}
