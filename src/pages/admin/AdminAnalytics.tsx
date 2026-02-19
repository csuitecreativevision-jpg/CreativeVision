import { useState, useEffect } from 'react';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { AnalyticCard } from '../../components/analytics/AnalyticCard';
import { AnalyticAreaChart } from '../../components/analytics/AnalyticAreaChart';
import { AnalyticBarChart } from '../../components/analytics/AnalyticBarChart';
import { AnalyticPieChart } from '../../components/analytics/AnalyticPieChart';
import { AnalyticsFilterModal } from '../../components/analytics/AnalyticsFilterModal';
import { Play, Filter, Users, Calendar, Settings2 } from 'lucide-react';

import { getWorkspaceAnalytics } from '../../services/mondayService';
import { getCache, setCache } from '../../services/cacheService';

const ANALYTICS_CACHE_KEY = 'admin_analytics_page';

interface AdminAnalyticsProps {
    embedded?: boolean;
}

export default function AdminAnalytics({ embedded = false }: AdminAnalyticsProps) {
    // Try to hydrate from cache instantly
    const cachedPage = getCache<any>(ANALYTICS_CACHE_KEY)?.data;

    const [loading, setLoading] = useState(!cachedPage);

    // Cycle Analytics State
    const [cycleData, setCycleData] = useState<any>(cachedPage?.cycleData || null);
    const [paymentData, setPaymentData] = useState<any>(cachedPage?.paymentData || null);
    const [typeData, setTypeData] = useState<any>(cachedPage?.typeData || null);
    const [statusData, setStatusData] = useState<any>(cachedPage?.statusData || null);
    const [revisionsData, setRevisionsData] = useState<any>(cachedPage?.revisionsData || null);
    const [selectedCycle, setSelectedCycle] = useState<string>(cachedPage?.selectedCycle || '');
    const [availableCycles, setAvailableCycles] = useState<string[]>(cachedPage?.availableCycles || []);

    // Filter State
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [dateFilter, setDateFilter] = useState<{ year: number, month: number | null, cycle: string } | null>(cachedPage?.dateFilter || null);

    // View Mode: 'productivity' (Videos) or 'earnings' (Payments)
    const [viewMode, setViewMode] = useState<'productivity' | 'earnings'>('productivity');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        // Only show spinner if there's no cached data at all
        if (!cachedPage) setLoading(true);
        try {
            // Fetch Cycle Based Analytics from Workspace Boards
            const { cycles, data: cData, payments: pData, types: tData, statuses: sData, revisions: rData } = await getWorkspaceAnalytics();

            setAvailableCycles(cycles);
            setCycleData(cData);
            setPaymentData(pData);
            setTypeData(tData);
            setStatusData(sData);
            setRevisionsData(rData);

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
                paymentData: pData,
                typeData: tData,
                statusData: sData,
                revisionsData: rData,
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
        const sourceData = viewMode === 'productivity' ? cycleData : paymentData;
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
                // Still calculate previous year if needed, but current usage implies we might want to stop line
                // If we return null for value, chart stops.
                // We still might want previousValue? Yes, usually.
                // But let's check sourceData for previous year regardless.

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
                // Parse Month and Year from Cycle Name (e.g. "January 2026 - Cycle 1")
                // Robust Regex to find "MonthName YYYY" pattern
                const match = key.match(/([a-zA-Z]+) (\d{4})/);

                if (match) {
                    const [_, cycleMonthName, cycleYearStr] = match;
                    const cycleYear = parseInt(cycleYearStr);

                    // Check if Month matches current loop month
                    // (monthName is "Jan", "Feb", etc. from the loop, cycleMonthName is "January", etc.)
                    // We need to normalize.

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

    // Aggregation: Get Editor Breakdown for the Selected Scope (BAR CHART)
    const getEditorBreakdownData = () => {
        const sourceData = viewMode === 'productivity' ? cycleData : paymentData;
        if (!sourceData) return [];

        // If a specific cycle is selected, show ONLY that cycle
        if (selectedCycle && sourceData[selectedCycle]) {
            return Object.entries(sourceData[selectedCycle])
                .map(([name, value]) => ({ name, value }))
                .sort((a: any, b: any) => b.value - a.value);
        }

        // Otherwise (All Cycles), aggregate across filtered cycles (based on year/month filter)
        const totals: Record<string, number> = {};

        filteredCycles.forEach(cycle => {
            if (sourceData[cycle]) {
                Object.entries(sourceData[cycle]).forEach(([editor, val]: [string, any]) => {
                    totals[editor] = (totals[editor] || 0) + val;
                });
            }
        });

        return Object.entries(totals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    };

    const getProjectTypeData = () => {
        if (!typeData) return [];

        // If a specific cycle is selected
        if (selectedCycle && typeData[selectedCycle]) {
            return Object.entries(typeData[selectedCycle])
                .map(([name, value]: [string, any]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
        }

        // Otherwise (All Cycles), aggregate across filtered cycles
        const totals: Record<string, number> = {};

        filteredCycles.forEach(cycle => {
            if (typeData[cycle]) {
                Object.entries(typeData[cycle]).forEach(([type, val]: [string, any]) => {
                    totals[type] = (totals[type] || 0) + val;
                });
            }
        });

        const result = Object.entries(totals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return result;
    };

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

    // Aggregation: Get Revisions Data (BAR CHART)
    const getRevisionsData = () => {
        if (!revisionsData) return [];

        // If a specific cycle is selected
        if (selectedCycle && revisionsData[selectedCycle]) {
            return Object.entries(revisionsData[selectedCycle])
                .map(([name, value]: [string, any]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
        }

        // Otherwise (All Cycles), aggregate across filtered cycles
        const totals: Record<string, number> = {};

        filteredCycles.forEach(cycle => {
            if (revisionsData[cycle]) {
                Object.entries(revisionsData[cycle]).forEach(([editor, val]: [string, any]) => {
                    totals[editor] = (totals[editor] || 0) + val;
                });
            }
        });

        const result = Object.entries(totals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return result;
    };

    const monthlyTrendData = getMonthlyTrendData();
    const editorBreakdownData = getEditorBreakdownData();
    const projectTypeData = getProjectTypeData();
    const projectStatusData = getProjectStatusData();
    const revisionsChartData = getRevisionsData();

    // Calculate total value for the selected scope (For KPI)
    const getSelectedCycleTotal = () => {
        const sourceData = viewMode === 'productivity' ? cycleData : paymentData;
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
    const activeEditorsCount = editorBreakdownData.length;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);
    };

    const getFilterLabel = () => {
        if (!dateFilter) return "Loading...";
        const { year, month, cycle } = dateFilter;

        if (cycle) return cycle;
        if (month) return `${new Date(2000, month - 1).toLocaleString('default', { month: 'long' })} ${year} (All Cycles)`;
        return `${year} (Full Year)`;
    };

    const Controls = (
        <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="bg-[#0e0e1a] p-1 rounded-xl border border-white/10 flex items-center">
                <button
                    onClick={() => setViewMode('productivity')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'productivity'
                        ? 'bg-violet-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'}`}
                >
                    Production
                </button>
                <button
                    onClick={() => setViewMode('earnings')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'earnings'
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'}`}
                >
                    Earnings
                </button>
            </div>

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
                    title={viewMode === 'productivity' ? "Total Videos Produced" : "Total Payout"}
                    value={viewMode === 'productivity' ? totalValueInCycle : formatCurrency(totalValueInCycle)}
                    icon={viewMode === 'productivity' ? <Play className="w-5 h-5" /> : <span className="font-bold text-emerald-400">₱</span>}
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
                        title={viewMode === 'productivity' ? `Yearly Production: ${dateFilter?.year || new Date().getFullYear()} vs ${dateFilter?.year ? dateFilter.year - 1 : new Date().getFullYear() - 1}` : `Yearly Income: ${dateFilter?.year || new Date().getFullYear()} vs ${dateFilter?.year ? dateFilter.year - 1 : new Date().getFullYear() - 1}`}
                        data={monthlyTrendData}
                        dataKey="value"
                        compareDataKey="previousValue"
                        xAxisKey="name"
                        color={viewMode === 'productivity' ? "#8b5cf6" : "#10b981"}
                        compareColor="#64748b"
                        delay={0.3}
                        height={300}
                        valuePrefix={viewMode === 'earnings' ? "₱" : ""}
                    />
                </div>

                {/* 2. Editor Breakdown (Bar Chart) - Full Width */}
                <div className="w-full">
                    <AnalyticBarChart
                        title={
                            selectedCycle
                                ? (viewMode === 'productivity' ? `Top Editors: ${selectedCycle}` : `Editor Earnings: ${selectedCycle}`)
                                : (dateFilter?.month
                                    ? (viewMode === 'productivity' ? `Top Editors: ${new Date(2000, dateFilter.month - 1).toLocaleString('default', { month: 'long' })}` : `Editor Earnings: ${new Date(2000, dateFilter.month - 1).toLocaleString('default', { month: 'long' })}`)
                                    : (viewMode === 'productivity' ? `Editor Breakdown` : `Earnings Breakdown`)
                                )
                        }
                        data={editorBreakdownData}
                        dataKey="value"
                        xAxisKey="name"
                        color={viewMode === 'productivity' ? "#8b5cf6" : "#10b981"}
                        delay={0.4}
                        layout="vertical"
                        height={400}
                        valuePrefix={viewMode === 'earnings' ? "₱" : ""}
                    />
                </div>

                {/* 3. Distributions: Type + Status (Side by Side) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Project Type Distribution (Pie Chart) */}
                    <div className="w-full">
                        <AnalyticPieChart
                            title="Project Type Distribution"
                            data={projectTypeData}
                            delay={0.5}
                            height={400}
                        />
                    </div>

                    {/* Project Status Distribution (Pie Chart) */}
                    <div className="w-full">
                        <AnalyticPieChart
                            title="Project Status Distribution"
                            data={projectStatusData.data}
                            delay={0.55}
                            height={400}
                            colors={projectStatusData.colors} // Custom mapped colors
                        />
                    </div>
                </div>

                {/* 4. Revisions Chart (Bar Chart) */}
                <div className="w-full">
                    <AnalyticBarChart
                        title="Revision Rates per Editor"
                        data={revisionsChartData}
                        dataKey="value"
                        xAxisKey="name"
                        color="#f59e0b" // Amber/Orange for caution/revisions
                        delay={0.6}
                        layout="vertical"
                        height={400}
                        valuePrefix=""
                        emptyMessage="No revisions found for editors yet"
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

    if (embedded) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Replicate AdminPageLayout Header Styling */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                            {viewMode === 'productivity' ? "Editor Performance" : "Editor Earnings"}
                        </h1>
                        <p className="text-gray-400 max-w-2xl">
                            {viewMode === 'productivity' ? "Videos produced per editor per cycle." : "Total earnings per editor per cycle."}
                        </p>
                    </div>
                    <div>{Controls}</div>
                </div>
                {Content}
            </div>
        );
    }

    return (
        <AdminPageLayout
            title={viewMode === 'productivity' ? "Editor Performance" : "Editor Earnings"}
            subtitle={viewMode === 'productivity' ? "Videos produced per editor per cycle." : "Total earnings per editor per cycle."}
            action={Controls}
        >
            {Content}
        </AdminPageLayout>
    );
}
