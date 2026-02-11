/**
 * Performance Dashboard Feature - Public API
 * 
 * Barrel export for clean imports
 */

export { PerformanceDashboard } from './components/PerformanceDashboard';
export { usePerformanceAnalytics } from './hooks/usePerformanceAnalytics';
export { getCycleDates, getCurrentCycle, isDateInCycle, formatCycle } from './utils/dateUtils';
export type { VideoTask, CycleInfo, DashboardMetrics, EditorRevisionMetric } from './types';
