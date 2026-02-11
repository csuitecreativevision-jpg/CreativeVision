/**
 * Performance Dashboard - Domain Types
 * 
 * Clean, strictly-typed interfaces decoupled from Monday.com data structures.
 * The UI layer only consumes these types, never raw API responses.
 */

/**
 * Represents a single video task with all relevant performance metrics
 */
export interface VideoTask {
    id: string;
    name: string;
    deadline: Date | null;
    editor: string | null;
    client: string | null;
    amountOfRevisions: number | null;
    rating: number | null;
}

/**
 * Cycle information for filtering performance data
 */
export interface CycleInfo {
    cycle: 1 | 2;
    month: number;  // 1-12
    year: number;
    startDate: Date;
    endDate: Date;
}

/**
 * Aggregated performance metrics for the dashboard
 */
export interface DashboardMetrics {
    totalVideosProduced: number;
    totalRevisions: number;
    averageRating: number | null;
    revisionsPerEditor: EditorRevisionMetric[];
}

/**
 * Revision count per editor
 */
export interface EditorRevisionMetric {
    editorName: string;
    revisions: number;
}
