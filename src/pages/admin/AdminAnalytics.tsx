import { useState, useEffect } from 'react';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { AnalyticAreaChart } from '../../components/analytics/AnalyticAreaChart';
import { AnalyticBarChart } from '../../components/analytics/AnalyticBarChart';
import { AnalyticPieChart } from '../../components/analytics/AnalyticPieChart';
import { AnalyticsFilterModal } from '../../components/analytics/AnalyticsFilterModal';
import { motion } from 'framer-motion';
import { Play, Filter, Users, Calendar, Settings2, TrendingUp, Loader2, BarChart2, PieChart, RefreshCw } from 'lucide-react';

import { getWorkspaceAnalytics } from '../../services/mondayService';
import { getCache, setCache } from '../../services/cacheService';

interface AdminAnalyticsProps {
    embedded?: boolean;
    allowedBoardIds?: string[];
}

export default function AdminAnalytics({ embedded = false, allowedBoardIds }: AdminAnalyticsProps) {
    // Make cache key unique to the specific boards being requested (or 'all' if none)
    const boardKeySuffix = allowedBoardIds && allowedBoardIds.length > 0
        ? `_${allowedBoardIds.sort().join('_')}`
        : '_all';
    const ANALYTICS_CACHE_KEY = `admin_analytics_page${boardKeySuffix}`;

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
            const { cycles, data: cData, payments: pData, types: tData, statuses: sData, revisions: rData } = await getWorkspaceAnalytics(allowedBoardIds);

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

    // ── KPI values ──────────────────────────────────────────────────────────
    const monthlyTrendData = getMonthlyTrendData();
    const editorBreakdownData = getEditorBreakdownData();
    const projectTypeData = getProjectTypeData();
    const projectStatusData = getProjectStatusData();
    const revisionsChartData = getRevisionsData();

    const getSelectedCycleTotal = () => {
        const sourceData = viewMode === 'productivity' ? cycleData : paymentData;
        if (!sourceData) return 0;
        if (selectedCycle && sourceData[selectedCycle]) {
            return Object.values(sourceData[selectedCycle]).reduce((acc: number, val: any) => acc + (val as number), 0);
        }
        let total = 0;
        filteredCycles.forEach(cycle => {
            if (sourceData[cycle]) {
                total += Object.values(sourceData[cycle]).reduce((acc: number, val: any) => acc + (val as number), 0);
            }
        });
        return total;
    };

    const totalValueInCycle = getSelectedCycleTotal();
    const activeEditorsCount = editorBreakdownData.length;


    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

    const getFilterLabel = () => {
        if (!dateFilter) return 'Loading...';
        const { year, month, cycle } = dateFilter;
        if (cycle) return cycle;
        if (month) return `${new Date(2000, month - 1).toLocaleString('default', { month: 'long' })} ${year}`;
        return `${year} (Full Year)`;
    };

    // ── Shared panel wrapper ─────────────────────────────────────────────────
    const Panel = ({
        icon, iconColor, title, subtitle, delay = 0, children,
    }: {
        icon: React.ReactNode; iconColor: string; title: string; subtitle?: string;
        delay?: number; children: React.ReactNode;
    }) => (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white/[0.018] border border-white/[0.06] rounded-2xl overflow-hidden"
        >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${iconColor}14`, border: `1px solid ${iconColor}22` }}>
                        <span style={{ color: iconColor }}>{icon}</span>
                    </div>
                    <div>
                        <h3 className="text-[13px] font-bold text-white/80">{title}</h3>
                        {subtitle && <p className="text-[10px] text-white/25 font-medium mt-0.5">{subtitle}</p>}
                    </div>
                </div>
            </div>
            <div className="p-1">{children}</div>
        </motion.div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-5 h-5 text-violet-400/50 animate-spin" />
            </div>
        );
    }

    // ── Header action area ───────────────────────────────────────────────────
    const HeaderActions = (
        <div className="flex items-center gap-2">
            {/* Production / Earnings toggle */}
            <div className="flex bg-white/[0.04] border border-white/[0.07] rounded-xl p-0.5">
                <button
                    onClick={() => setViewMode('productivity')}
                    className={`px-3.5 py-1.5 rounded-[10px] text-xs font-bold transition-all duration-150 ${
                        viewMode === 'productivity'
                            ? 'bg-violet-500 text-white shadow-md'
                            : 'text-white/40 hover:text-white'
                    }`}
                >
                    Production
                </button>
                <button
                    onClick={() => setViewMode('earnings')}
                    className={`px-3.5 py-1.5 rounded-[10px] text-xs font-bold transition-all duration-150 ${
                        viewMode === 'earnings'
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'text-white/40 hover:text-white'
                    }`}
                >
                    Earnings
                </button>
            </div>

            {/* Filter button */}
            <button
                onClick={() => setIsFilterModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/[0.04] border border-white/[0.07] rounded-xl text-xs font-semibold text-white/55 hover:text-white transition-all duration-150"
            >
                <Calendar className="w-3.5 h-3.5 text-violet-400" />
                <span className="truncate max-w-[160px]">{getFilterLabel()}</span>
            </button>

            {/* Refresh */}
            <button
                onClick={loadData}
                className="p-2 bg-white/[0.04] border border-white/[0.07] rounded-xl text-white/35 hover:text-white transition-all duration-150"
            >
                <RefreshCw className="w-3.5 h-3.5" />
            </button>
        </div>
    );

    const content = (
        <div className="space-y-5">

            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Primary metric */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex flex-col justify-between p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden cursor-pointer group"
                    onClick={() => setIsFilterModalOpen(true)}
                >
                    <div className="absolute top-0 left-6 right-6 h-[1px]"
                        style={{ background: `linear-gradient(to right, transparent, ${viewMode === 'productivity' ? '#8b5cf6' : '#10b981'}66, transparent)` }} />
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: viewMode === 'productivity' ? '#8b5cf614' : '#10b98114', border: `1px solid ${viewMode === 'productivity' ? '#8b5cf625' : '#10b98125'}` }}>
                        {viewMode === 'productivity'
                            ? <Play className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
                            : <TrendingUp className="w-3.5 h-3.5" style={{ color: '#10b981' }} />}
                    </div>
                    <div>
                        <div className="text-[28px] font-black text-white leading-none tracking-tight mb-1">
                            {viewMode === 'productivity' ? totalValueInCycle : formatCurrency(totalValueInCycle)}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: viewMode === 'productivity' ? '#8b5cf680' : '#10b98180' }}>
                            {viewMode === 'productivity' ? 'Total Videos' : 'Total Payout'}
                        </div>
                        <div className="text-[10px] text-white/20 mt-0.5 font-medium">{getFilterLabel()}</div>
                    </div>
                </motion.div>

                {/* Active editors */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex flex-col justify-between p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden"
                >
                    <div className="absolute top-0 left-6 right-6 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, #10b98166, transparent)' }} />
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-4" style={{ background: '#10b98114', border: '1px solid #10b98125' }}>
                        <Users className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                    </div>
                    <div>
                        <div className="text-[28px] font-black text-white leading-none tracking-tight mb-1">{activeEditorsCount}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#10b98180' }}>Active Editors</div>
                        <div className="text-[10px] text-white/20 mt-0.5 font-medium">Contributing this cycle</div>
                    </div>
                </motion.div>

                {/* Filter config card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex flex-col justify-between p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden cursor-pointer group hover:border-violet-500/20 transition-all duration-150"
                    onClick={() => setIsFilterModalOpen(true)}
                >
                    <div className="absolute top-0 left-6 right-6 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, #8b5cf666, transparent)' }} />
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-4" style={{ background: '#8b5cf614', border: '1px solid #8b5cf625' }}>
                        <Settings2 className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
                    </div>
                    <div>
                        <div className="text-[14px] font-bold text-white/80 leading-tight mb-1 truncate">{getFilterLabel()}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8b5cf680' }}>Active Filter</div>
                        <div className="text-[10px] text-white/20 mt-0.5 font-medium group-hover:text-violet-400/50 transition-colors">Click to change →</div>
                    </div>
                </motion.div>
            </div>

            {/* Area chart — yearly trend */}
            <Panel
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                iconColor={viewMode === 'productivity' ? '#8b5cf6' : '#10b981'}
                title={viewMode === 'productivity' ? 'Production Trend' : 'Earnings Trend'}
                subtitle={`${dateFilter?.year || new Date().getFullYear()} vs ${(dateFilter?.year || new Date().getFullYear()) - 1}`}
                delay={0.2}
            >
                <AnalyticAreaChart
                    title=""
                    data={monthlyTrendData}
                    dataKey="value"
                    compareDataKey="previousValue"
                    xAxisKey="name"
                    color={viewMode === 'productivity' ? '#8b5cf6' : '#10b981'}
                    compareColor="#334155"
                    delay={0}
                    height={260}
                    valuePrefix={viewMode === 'earnings' ? '₱' : ''}
                />
            </Panel>

            {/* Editor breakdown bar chart */}
            <Panel
                icon={<BarChart2 className="w-3.5 h-3.5" />}
                iconColor={viewMode === 'productivity' ? '#8b5cf6' : '#10b981'}
                title={viewMode === 'productivity' ? 'Editor Output' : 'Editor Earnings'}
                subtitle={selectedCycle || getFilterLabel()}
                delay={0.25}
            >
                <AnalyticBarChart
                    title=""
                    data={editorBreakdownData}
                    dataKey="value"
                    xAxisKey="name"
                    color={viewMode === 'productivity' ? '#8b5cf6' : '#10b981'}
                    delay={0}
                    layout="vertical"
                    height={Math.max(300, editorBreakdownData.length * 48)}
                    valuePrefix={viewMode === 'earnings' ? '₱' : ''}
                />
            </Panel>

            {/* Type + Status side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Panel
                    icon={<PieChart className="w-3.5 h-3.5" />}
                    iconColor="#3b82f6"
                    title="Project Types"
                    subtitle="By content category"
                    delay={0.3}
                >
                    <AnalyticPieChart
                        title="ProjectTypes"
                        data={projectTypeData}
                        delay={0}
                        height={320}
                        bare
                    />
                </Panel>

                <Panel
                    icon={<PieChart className="w-3.5 h-3.5" />}
                    iconColor="#f59e0b"
                    title="Project Status"
                    subtitle="By workflow stage"
                    delay={0.35}
                >
                    <AnalyticPieChart
                        title="ProjectStatus"
                        data={projectStatusData.data}
                        delay={0}
                        height={320}
                        colors={projectStatusData.colors}
                        bare
                    />
                </Panel>
            </div>

            {/* Revisions bar chart */}
            <Panel
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                iconColor="#f59e0b"
                title="Revision Rates"
                subtitle="Per editor"
                delay={0.4}
            >
                <AnalyticBarChart
                    title=""
                    data={revisionsChartData}
                    dataKey="value"
                    xAxisKey="name"
                    color="#f59e0b"
                    delay={0}
                    layout="vertical"
                    height={Math.max(280, revisionsChartData.length * 48)}
                    valuePrefix=""
                    emptyMessage="No revisions found for editors yet"
                />
            </Panel>

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
        </div>
    );

    if (embedded) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">
                            {viewMode === 'productivity' ? 'Editor Performance' : 'Editor Earnings'}
                        </h1>
                        <p className="text-sm text-white/40 mt-1">
                            {viewMode === 'productivity' ? 'Videos produced per editor per cycle.' : 'Total earnings per editor per cycle.'}
                        </p>
                    </div>
                    {HeaderActions}
                </div>
                {content}
            </div>
        );
    }

    return (
        <AdminPageLayout
            label="Admin"
            title={viewMode === 'productivity' ? 'Analytics' : 'Earnings'}
            subtitle={viewMode === 'productivity' ? 'Production output across editors and cycles' : 'Payout breakdown across editors and cycles'}
            action={HeaderActions}
        >
            {content}
        </AdminPageLayout>
    );
}
