import { useState, useEffect } from 'react';
import { AnalyticCard } from '../../components/analytics/AnalyticCard';
import { AnalyticAreaChart } from '../../components/analytics/AnalyticAreaChart';
import { AnalyticPieChart } from '../../components/analytics/AnalyticPieChart';
import { AnalyticsFilterModal } from '../../components/analytics/AnalyticsFilterModal';
import { Play, Filter, Users, Calendar, Settings2 } from 'lucide-react';

import { getWorkspaceAnalytics } from '../../services/mondayService';
import { getCache, setCache } from '../../services/cacheService';

interface ClientAnalyticsProps {
    boardId: string;
}

export const ClientAnalytics = ({ boardId }: ClientAnalyticsProps) => {
    // Make cache key unique to the specific client board
    const ANALYTICS_CACHE_KEY = `client_analytics_${boardId}`;

    // Try to hydrate from cache instantly
    const cachedPage = getCache<any>(ANALYTICS_CACHE_KEY)?.data;

    const [loading, setLoading] = useState(!cachedPage);

    // Cycle Analytics State
    const [cycleData, setCycleData] = useState<any>(cachedPage?.cycleData || null);
    const [statusData, setStatusData] = useState<any>(cachedPage?.statusData || null);
    const [selectedCycle, setSelectedCycle] = useState<string>(cachedPage?.selectedCycle || '');
    const [availableCycles, setAvailableCycles] = useState<string[]>(cachedPage?.availableCycles || []);

    // Filter State
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [dateFilter, setDateFilter] = useState<{ year: number, month: number | null, cycle: string } | null>(cachedPage?.dateFilter || null);

    useEffect(() => {
        loadData();
    }, [boardId]);

    const loadData = async () => {
        // Only show spinner if there's no cached data at all
        if (!cachedPage) setLoading(true);
        try {
            // Fetch Cycle Based Analytics from Workspace Boards, specifically for this client's board
            const { cycles, data: cData, statuses: sData } = await getWorkspaceAnalytics([boardId]);

            setAvailableCycles(cycles);
            setCycleData(cData);
            setStatusData(sData);

            // Default to most recent cycle
            let newDateFilter = dateFilter;
            let newSelectedCycle = selectedCycle;
            if (cycles.length > 0 && !dateFilter) {
                // Initialize filter to most recent cycle's date
                const latest = cycles[0];
                const parts = latest.match(/(\w+) (\d+)/); // Match "February 2026"
                if (parts) {
                    const monthName = parts[1];
                    const year = parseInt(parts[2]);
                    const month = new Date(`${monthName} 1, 2000`).getMonth() + 1;

                    newDateFilter = { year, month, cycle: latest };
                    newSelectedCycle = latest;
                    setDateFilter(newDateFilter);
                    setSelectedCycle(newSelectedCycle);
                }
            }

            // Save to localStorage cache
            setCache(ANALYTICS_CACHE_KEY, {
                cycleData: cData,
                statusData: sData,
                selectedCycle: newSelectedCycle,
                availableCycles: cycles,
                dateFilter: newDateFilter
            });
        } catch (error) {
            console.error("Failed to load analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    // Derived State: Available Years
    const availableYears = Array.from(new Set(availableCycles.map(c => {
        const match = c.match(/\d{4}/);
        return match ? parseInt(match[0]) : new Date().getFullYear();
    }))).sort((a, b) => b - a);

    // Filter Logic is now handled by the Modal selection, we just use dateFilter state directly
    const filteredCycles = availableCycles.filter(cycle => {
        if (!dateFilter) return true;

        const cycleYear = parseInt(cycle.match(/\d{4}/)?.[0] || '0');
        const cycleMonthName = cycle.split(' ')[0];
        const cycleMonth = new Date(`${cycleMonthName} 1, 2000`).getMonth() + 1;

        // If "All Year" (month is null), show all cycles for that year
        if (dateFilter.month === null) {
            return cycleYear === dateFilter.year;
        }

        return cycleYear === dateFilter.year && cycleMonth === dateFilter.month;
    });

    const handleFilterApply = (year: number, month: number | null, cycle: string) => {
        setDateFilter({ year, month, cycle });
        setSelectedCycle(cycle); // Cycle is now explicitly passed from modal
    };

    // Aggregation: Get Monthly Trend Data for the Selected Year AND Previous Year
    const getMonthlyTrendData = () => {
        const sourceData = cycleData;
        if (!sourceData) return [];

        const targetYear = dateFilter?.year || new Date().getFullYear();
        const previousYear = targetYear - 1;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonthIndex = now.getMonth(); // 0-11

        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        return months.map((monthName, index) => {
            const longMonth = new Date(targetYear, index).toLocaleString('default', { month: 'long' });

            // Future Data Logic: If target is current year and month is in future, return null
            if (targetYear === currentYear && index > currentMonthIndex) {
                let previousTotal = 0;
                Object.keys(sourceData).forEach(key => {
                    if (key.includes(`${longMonth} ${previousYear}`)) {
                        const cycleTotal = Object.values(sourceData[key]).reduce((acc: number, val: any) => acc + (val as number), 0);
                        previousTotal += cycleTotal;
                    }
                });

                return { name: monthName, value: null, previousValue: previousTotal };
            }

            let currentTotal = 0;
            let previousTotal = 0;

            Object.keys(sourceData).forEach(key => {
                const match = key.match(/([a-zA-Z]+) (\d{4})/);

                if (match) {
                    const [_, cycleMonthName, cycleYearStr] = match;
                    const cycleYear = parseInt(cycleYearStr);

                    const normalizeMonth = (m: string) => new Date(`${m} 1, 2000`).getMonth();
                    const isSameMonth = normalizeMonth(cycleMonthName) === index; // index is 0-11

                    // Current Year Match
                    if (isSameMonth && cycleYear === targetYear) {
                        const cycleTotal = Object.values(sourceData[key]).reduce((acc: number, val: any) => acc + (val as number), 0);
                        currentTotal += cycleTotal;
                    }

                    // Previous Year Match
                    if (isSameMonth && cycleYear === previousYear) {
                        const cycleTotal = Object.values(sourceData[key]).reduce((acc: number, val: any) => acc + (val as number), 0);
                        previousTotal += cycleTotal;
                    }
                }
            });

            return { name: monthName, value: currentTotal, previousValue: previousTotal };
        });
    };

    const monthlyTrendData = getMonthlyTrendData();
    // Aggregation: Get Project Status Data (PIE CHART)
    const getProjectStatusData = () => {
        if (!statusData) return { data: [], colors: [] };

        let rawData: { name: string; value: number }[] = [];

        // If a specific cycle is selected
        if (selectedCycle && statusData[selectedCycle]) {
            rawData = Object.entries(statusData[selectedCycle])
                .map(([name, value]: [string, any]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
        } else {
            // Otherwise (All Cycles), aggregate across filtered cycles
            const totals: Record<string, number> = {};

            filteredCycles.forEach(cycle => {
                if (statusData[cycle]) {
                    Object.entries(statusData[cycle]).forEach(([status, val]: [string, any]) => {
                        totals[status] = (totals[status] || 0) + val;
                    });
                }
            });

            rawData = Object.entries(totals)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
        }

        // Color Mapping Logic
        const getColorForStatus = (status: string) => {
            const s = status.toLowerCase();
            if (s.includes('approved') || s.includes('done') || s.includes('complete')) return '#10b981'; // Emerald (Green)
            if (s.includes('assigned') || s.includes('progress') || s.includes('working')) return '#3b82f6'; // Blue
            if (s.includes('revision') || s.includes('change')) return '#ef4444'; // Red
            if (s.includes('client') && (s.includes('waiting') || s.includes('review'))) return '#f59e0b'; // Amber (Waiting)
            if (s.includes('approval') || s.includes('review')) return '#8b5cf6'; // Violet (Internal Review)
            if (s.includes('new') || s.includes('open')) return '#06b6d4'; // Cyan
            if (s.includes('stuck') || s.includes('hold')) return '#64748b'; // Slate (Gray)

            // Fallback palette
            return '#6366f1'; // Indigo
        };

        const colors = rawData.map(item => getColorForStatus(item.name));

        return { data: rawData, colors };
    };

    const projectStatusData = getProjectStatusData();

    // Active Editors Count (Keep this calculation for the KPI, simplified)
    const getActiveEditorsCount = () => {
        const sourceData = cycleData;
        if (!sourceData) return 0;

        const editors = new Set<string>();

        if (selectedCycle && sourceData[selectedCycle]) {
            Object.keys(sourceData[selectedCycle]).forEach(ext => editors.add(ext));
        } else {
            filteredCycles.forEach(cycle => {
                if (sourceData[cycle]) {
                    Object.keys(sourceData[cycle]).forEach(ext => editors.add(ext));
                }
            });
        }
        return editors.size;
    };

    const activeEditorsCount = getActiveEditorsCount();

    // Calculate total value for the selected scope (For KPI)
    const getSelectedCycleTotal = () => {
        const sourceData = cycleData;
        if (!sourceData) return 0;

        // If specific cycle
        if (selectedCycle && sourceData[selectedCycle]) {
            return Object.values(sourceData[selectedCycle]).reduce((acc: number, val: any) => acc + (val as number), 0);
        }

        // If "All Cycles" (Aggregate filtered)
        let total = 0;
        filteredCycles.forEach(cycle => {
            if (sourceData[cycle]) {
                total += Object.values(sourceData[cycle]).reduce((acc: number, val: any) => acc + (val as number), 0);
            }
        });
        return total;
    };

    const totalValueInCycle = getSelectedCycleTotal(); // Now represents Total in Scope

    const getFilterLabel = () => {
        if (!dateFilter) return "Loading...";
        const { year, month, cycle } = dateFilter;

        if (cycle) return cycle;
        if (month) return `${new Date(2000, month - 1).toLocaleString('default', { month: 'long' })} ${year} (All Cycles)`;
        return `${year} (Full Year)`;
    };

    const Controls = (
        <div className="flex items-center gap-3">
            <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-bold transition-all"
            >
                <Filter className="w-4 h-4" />
                Refresh
            </button>
        </div>
    );

    const Content = (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Controls & KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Configuration Button (Unified) */}
                <div className="bg-[#0e0e1a] p-6 rounded-2xl border border-white/5 flex flex-col justify-center space-y-3 relative group hover:border-violet-500/30 transition-colors cursor-pointer" onClick={() => setIsFilterModalOpen(true)}>
                    <label className="text-gray-400 text-sm font-bold flex items-center gap-2 mb-2 group-hover:text-violet-400 transition-colors">
                        <Settings2 className="w-4 h-4" />
                        Analytics Configuration
                    </label>

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-white font-bold text-lg truncate pr-4">
                                {getFilterLabel()}
                            </div>
                            <div className="text-xs text-gray-500 font-medium mt-1">
                                Click to change Year, Month, or Cycle
                            </div>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5 group-hover:bg-violet-500/10 transition-colors">
                            <Calendar className="w-5 h-5 text-gray-400 group-hover:text-violet-400 transition-colors" />
                        </div>
                    </div>
                </div>

                {/* KPI: Primary Metric */}
                <AnalyticCard
                    title="Total Videos Produced"
                    value={totalValueInCycle}
                    icon={<Play className="w-5 h-5" />}
                    trend={{ value: 0, label: selectedCycle || "Monthly Total", isPositive: true }}
                    delay={0.1}
                />

                {/* KPI: Active Editors */}
                <AnalyticCard
                    title="Active Editors"
                    value={activeEditorsCount}
                    icon={<Users className="w-5 h-5" />}
                    trend={{ value: 0, label: 'contributing this cycle', isPositive: true }}
                    delay={0.2}
                />
            </div>

            {/* Charts Section */}
            <div className="flex flex-col gap-8 mt-8">

                {/* 1. Yearly Trend (Area Chart) */}
                <div className="w-full">
                    <AnalyticAreaChart
                        title={`Yearly Production: ${dateFilter?.year || new Date().getFullYear()} vs ${dateFilter?.year ? dateFilter.year - 1 : new Date().getFullYear() - 1}`}
                        data={monthlyTrendData}
                        dataKey="value"
                        compareDataKey="previousValue"
                        xAxisKey="name"
                        color="#8b5cf6"
                        compareColor="#64748b"
                        delay={0.3}
                        height={300}
                        valuePrefix=""
                    />
                </div>

                {/* 2. Distributions: Status (Full Width) */}
                <div className="w-full">
                    <AnalyticPieChart
                        title="Project Status Distribution"
                        data={projectStatusData.data}
                        delay={0.55}
                        height={400}
                        colors={projectStatusData.colors}
                    />
                </div>
            </div>


            <AnalyticsFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApply={handleFilterApply}
                availableYears={availableYears}
                availableCycles={availableCycles}
                initialFilter={{
                    year: dateFilter?.year || new Date().getFullYear(),
                    month: dateFilter?.month || null,
                    cycle: dateFilter?.cycle || ''
                }}
            />
        </div >
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Embedded layout styling */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                        Project Performance
                    </h1>
                    <p className="text-gray-400 max-w-2xl">
                        Videos produced for this workspace per cycle.
                    </p>
                </div>
                <div>{Controls}</div>
            </div>
            {Content}
        </div>
    );
};
