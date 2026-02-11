import { useState, useEffect } from 'react';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { AnalyticCard } from '../../components/analytics/AnalyticCard';
import { AnalyticAreaChart } from '../../components/analytics/AnalyticAreaChart';
import { AnalyticBarChart } from '../../components/analytics/AnalyticBarChart';
import { DateFilterModal } from '../../components/analytics/DateFilterModal';
import { Play, Filter, Users, Calendar, ChevronDown } from 'lucide-react';

export default function AdminAnalytics() {
    const [loading, setLoading] = useState(true);

    // Cycle Analytics State
    const [cycleData, setCycleData] = useState<any>(null); // Video Counts
    const [paymentData, setPaymentData] = useState<any>(null); // Payment Amounts
    const [selectedCycle, setSelectedCycle] = useState<string>('');
    const [availableCycles, setAvailableCycles] = useState<string[]>([]);

    // Filter State
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [dateFilter, setDateFilter] = useState<{ year: number, month: number | null } | null>(null);

    // Dropdown State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // View Mode: 'productivity' (Videos) or 'earnings' (Payments)
    const [viewMode, setViewMode] = useState<'productivity' | 'earnings'>('productivity');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch Cycle Based Analytics from Workspace Boards
            const { cycles, data: cData, payments: pData } = await import('../../services/mondayService').then(m => m.getWorkspaceAnalytics());

            setAvailableCycles(cycles);
            setCycleData(cData);
            setPaymentData(pData);

            // Default to most recent cycle
            if (cycles.length > 0) {
                // Initialize filter to most recent cycle's date
                const latest = cycles[0];
                const parts = latest.match(/(\w+) (\d+)/); // Match "February 2026"
                if (parts) {
                    const monthName = parts[1];
                    const year = parseInt(parts[2]);
                    const month = new Date(`${monthName} 1, 2000`).getMonth() + 1;
                    // Default to Specific Month so Bar Chart matches specific cycle
                    setDateFilter({ year, month });
                }
                setSelectedCycle(latest);
            }
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

    // Derived State: Filtered Cycles based on Date Filter
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

    const handleDateFilterApply = (year: number, month: number | null) => {
        setDateFilter({ year, month });

        if (month !== null) {
            const monthName = new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
            // Find cycles matching this filter
            const matching = availableCycles.filter(c => c.includes(`${monthName} ${year}`));
            if (matching.length > 0) {
                // AUTO-SELECT LATEST CYCLE for that month
                setSelectedCycle(matching[0]);
            } else {
                setSelectedCycle('');
            }
        } else {
            // Full Year -> Default to All Cycles (Empty String)
            setSelectedCycle('');
        }
    };

    // Aggregation: Get Monthly Trend Data for the Selected Year
    const getMonthlyTrendData = () => {
        const sourceData = viewMode === 'productivity' ? cycleData : paymentData;
        if (!sourceData) return [];

        const targetYear = dateFilter?.year || new Date().getFullYear();
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        return months.map((monthName, index) => {
            // Find all cycles matching this Month + Year
            const longMonth = new Date(targetYear, index).toLocaleString('default', { month: 'long' });

            let total = 0;
            Object.keys(sourceData).forEach(key => {
                if (key.includes(`${longMonth} ${targetYear}`)) {
                    // Sum up all editors' values for this cycle
                    const cycleTotal = Object.values(sourceData[key]).reduce((acc: any, val: any) => acc + val, 0);
                    total += cycleTotal;
                }
            });

            return { name: monthName, value: total };
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

        // Otherwise (All Cycles), aggregate across filtered cycles
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

    const monthlyTrendData = getMonthlyTrendData();
    const editorBreakdownData = getEditorBreakdownData();

    // Calculate total value for the selected scope (For KPI)
    const getSelectedCycleTotal = () => {
        const sourceData = viewMode === 'productivity' ? cycleData : paymentData;
        if (!sourceData) return 0;

        // If specific cycle
        if (selectedCycle && sourceData[selectedCycle]) {
            return Object.values(sourceData[selectedCycle]).reduce((acc: any, val: any) => acc + val, 0);
        }

        // If "All Cycles" (Aggregate filtered)
        let total = 0;
        filteredCycles.forEach(cycle => {
            if (sourceData[cycle]) {
                total += Object.values(sourceData[cycle]).reduce((acc: any, val: any) => acc + val, 0);
            }
        });
        return total;
    };

    const totalValueInCycle = getSelectedCycleTotal(); // Now represents Total in Scope
    const activeEditorsCount = editorBreakdownData.length;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);
    };

    return (
        <AdminPageLayout
            title={viewMode === 'productivity' ? "Editor Performance" : "Editor Earnings"}
            subtitle={viewMode === 'productivity' ? "Videos produced per editor per cycle." : "Total earnings per editor per cycle."}
            action={
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
            }
        >
            {loading ? (
                <div className="flex items-center justify-center h-96">
                    <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-6">

                    {/* Controls & KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Cycle Selector */}
                        <div className="bg-[#0e0e1a] p-6 rounded-2xl border border-white/5 flex flex-col justify-center space-y-3 relative">
                            <label className="text-gray-400 text-sm font-bold flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4" />
                                Select Cycle
                            </label>

                            <div className="flex gap-2">
                                {/* Date Filter Button */}
                                <button
                                    onClick={() => setIsFilterModalOpen(true)}
                                    className="flex-shrink-0 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all flex items-center gap-2"
                                >
                                    {dateFilter
                                        ? (dateFilter.month
                                            ? `${new Date(2000, dateFilter.month - 1).toLocaleString('default', { month: 'short' })} ${dateFilter.year}`
                                            : `${dateFilter.year} (Full Year)`)
                                        : 'Filter Date'}
                                    <Filter className="w-3 h-3 opacity-50" />
                                </button>

                                {/* Cycle Dropdown (Filtered) */}
                                <div className="relative flex-grow">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white transition-all text-left text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={filteredCycles.length === 0}
                                    >
                                        <span className="truncate mr-2">{selectedCycle || "All Cycles"}</span>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                                            {/* All Cycles Option */}
                                            <button
                                                onClick={() => {
                                                    setSelectedCycle('');
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors text-sm border-b border-white/5 ${selectedCycle === '' ? 'text-violet-400 font-bold bg-violet-500/10' : 'text-gray-300'
                                                    }`}
                                            >
                                                All Cycles
                                            </button>

                                            {filteredCycles.map(cycle => (
                                                <button
                                                    key={cycle}
                                                    onClick={() => {
                                                        setSelectedCycle(cycle);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors text-sm ${selectedCycle === cycle ? 'text-violet-400 font-bold bg-violet-500/10' : 'text-gray-300'
                                                        }`}
                                                >
                                                    {cycle}
                                                </button>
                                            ))}
                                            {filteredCycles.length === 0 && (
                                                <div className="px-4 py-3 text-gray-500 text-sm italic">
                                                    No cycles found for this month.
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

                        {/* 1. Yearly Trend (Area Chart) */}
                        <div className="w-full h-[350px]">
                            <AnalyticAreaChart
                                title={viewMode === 'productivity' ? `Yearly Production: ${dateFilter?.year || new Date().getFullYear()}` : `Yearly Income: ${dateFilter?.year || new Date().getFullYear()}`}
                                data={monthlyTrendData}
                                dataKey="value"
                                xAxisKey="name"
                                color={viewMode === 'productivity' ? "#8b5cf6" : "#10b981"}
                                delay={0.3}
                                height={350}
                                valuePrefix={viewMode === 'earnings' ? "₱" : ""}
                            />
                        </div>

                        {/* 2. Editor Breakdown (Bar Chart) */}
                        <div className="w-full h-[350px]">
                            <AnalyticBarChart
                                title={
                                    selectedCycle
                                        ? (viewMode === 'productivity' ? `Production: ${selectedCycle}` : `Earnings: ${selectedCycle}`)
                                        : (dateFilter?.month
                                            ? (viewMode === 'productivity' ? `Production: ${new Date(2000, dateFilter.month - 1).toLocaleString('default', { month: 'long' })}` : `Earnings: ${new Date(2000, dateFilter.month - 1).toLocaleString('default', { month: 'long' })}`)
                                            : (viewMode === 'productivity' ? `Production Breakdown` : `Earnings Breakdown`)
                                        )
                                }
                                data={editorBreakdownData}
                                dataKey="value"
                                xAxisKey="name"
                                color={viewMode === 'productivity' ? "#8b5cf6" : "#10b981"}
                                delay={0.4}
                                layout="vertical"
                                height={350}
                                valuePrefix={viewMode === 'earnings' ? "₱" : ""}
                            />
                        </div>
                    </div>

                    <DateFilterModal
                        isOpen={isFilterModalOpen}
                        onClose={() => setIsFilterModalOpen(false)}
                        onApply={handleDateFilterApply}
                        availableYears={availableYears}
                        initialDate={{
                            year: dateFilter?.year || new Date().getFullYear(),
                            month: dateFilter?.month || new Date().getMonth() + 1
                        }}
                    />
                </div>
            )}
        </AdminPageLayout>
    );
}
