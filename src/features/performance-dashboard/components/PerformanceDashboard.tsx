/**
 * Performance Dashboard Component
 * 
 * DUMB COMPONENT - Only renders data passed via props
 * Never accesses raw Monday.com data structures
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Star, TrendingUp, Calendar, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { usePerformanceAnalytics } from '../hooks/usePerformanceAnalytics';
import { getCurrentCycle, getCycleDates, formatCycle } from '../utils/dateUtils';
import type { CycleInfo } from '../types';
import { AnalyticCard } from '../../../components/analytics/AnalyticCard';
import { AnalyticBarChart } from '../../../components/analytics/AnalyticBarChart';

export function PerformanceDashboard() {
    const [selectedCycle, setSelectedCycle] = useState<CycleInfo>(getCurrentCycle());
    const { metrics, loading, error, refetch } = usePerformanceAnalytics(selectedCycle);

    // Cycle navigation
    const goToPreviousCycle = () => {
        const { cycle, month, year } = selectedCycle;

        if (cycle === 2) {
            // Go from Cycle 2 to Cycle 1 of same month
            setSelectedCycle(getCycleDates(1, month, year));
        } else {
            // Go from Cycle 1 to Cycle 2 of previous month
            const prevMonth = month === 1 ? 12 : month - 1;
            const prevYear = month === 1 ? year - 1 : year;
            setSelectedCycle(getCycleDates(2, prevMonth, prevYear));
        }
    };

    const goToNextCycle = () => {
        const { cycle, month, year } = selectedCycle;

        if (cycle === 1) {
            // Go from Cycle 1 to Cycle 2 of same month
            setSelectedCycle(getCycleDates(2, month, year));
        } else {
            // Go from Cycle 2 to Cycle 1 of next month
            const nextMonth = month === 12 ? 1 : month + 1;
            const nextYear = month === 12 ? year + 1 : year;
            setSelectedCycle(getCycleDates(1, nextMonth, nextYear));
        }
    };

    const goToCurrentCycle = () => {
        setSelectedCycle(getCurrentCycle());
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                    <p className="text-red-400">{error}</p>
                    <button
                        onClick={refetch}
                        className="px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!metrics) return null;

    return (
        <div className="space-y-6">
            {/* Cycle Selector */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-violet-400" />
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Selected Period</p>
                        <p className="text-white font-bold">{formatCycle(selectedCycle)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {selectedCycle.startDate.toLocaleDateString()} - {selectedCycle.endDate.toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPreviousCycle}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                        title="Previous Cycle"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                        onClick={goToCurrentCycle}
                        className="px-3 py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 text-xs font-bold transition-all"
                        title="Go to Current Cycle"
                    >
                        Current
                    </button>

                    <button
                        onClick={goToNextCycle}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                        title="Next Cycle"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    <button
                        onClick={refetch}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all ml-2"
                        title="Refresh Data"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnalyticCard
                    title="Total Videos Produced"
                    value={metrics.totalVideosProduced}
                    icon={<Play className="w-5 h-5" />}
                    delay={0.1}
                />

                <AnalyticCard
                    title="Total Revisions"
                    value={metrics.totalRevisions}
                    icon={<RotateCcw className="w-5 h-5" />}
                    delay={0.2}
                />

                <AnalyticCard
                    title="Average Rating"
                    value={metrics.averageRating !== null ? metrics.averageRating.toFixed(2) : 'N/A'}
                    icon={<Star className="w-5 h-5" />}
                    delay={0.3}
                />
            </div>

            {/* Revisions Per Editor Chart */}
            <div className="h-96">
                <AnalyticBarChart
                    title="Revisions Per Editor"
                    data={metrics.revisionsPerEditor.map(item => ({
                        name: item.editorName,
                        count: item.revisions
                    }))}
                    dataKey="count"
                    xAxisKey="name"
                    color="#8b5cf6" // Violet
                    delay={0.4}
                    layout="vertical" // Horizontal bars
                />
            </div>

            {/* Empty State */}
            {metrics.totalVideosProduced === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12 bg-white/5 border border-white/10 rounded-xl"
                >
                    <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No data found for this cycle</p>
                    <p className="text-gray-600 text-sm mt-2">Try selecting a different period</p>
                </motion.div>
            )}
        </div>
    );
}
