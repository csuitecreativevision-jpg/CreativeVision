import { useState, useEffect } from 'react';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { AnalyticCard } from '../../components/analytics/AnalyticCard';
import { AnalyticBarChart } from '../../components/analytics/AnalyticBarChart'; // Corrected Import
import { Play, RotateCcw, Filter, Download } from 'lucide-react';
import { getAggregatedAnalytics } from '../../services/mondayService';

export default function AdminAnalytics() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const stats = await getAggregatedAnalytics();
            setData(stats);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminPageLayout
            title="Analytics Dashboard"
            subtitle="Real-time performance metrics and team productivity insights."
            action={
                <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-bold transition-all"
                >
                    <Filter className="w-4 h-4" />
                    Filter
                </button>
            }
        >
            {loading ? (
                <div className="flex items-center justify-center h-96">
                    <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-6">

                    {/* KPI Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnalyticCard
                            title="Total Amount of Videos Produced"
                            value={data?.totalVideos || 0}
                            icon={<Play className="w-5 h-5" />}
                            trend={{ value: 12, label: 'vs last month', isPositive: true }}
                            delay={0.1}
                        />
                        <AnalyticCard
                            title="Total Amount of Revisions"
                            value={data?.totalRevisions || 0}
                            icon={<RotateCcw className="w-5 h-5" />}
                            trend={{ value: 5, label: 'vs last month', isPositive: false }}
                            delay={0.2}
                        />
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Videos Per Editor */}
                        <div className="h-80">
                            <AnalyticBarChart
                                title="Videos Produced Per Editor"
                                data={data?.videosPerEditor || []}
                                dataKey="count"
                                xAxisKey="name"
                                color="#60a5fa" // Blue
                                delay={0.3}
                                layout="horizontal" // Horizontal bars (left to right) if passing 'vertical' prop to recharts, but my component logic is: layout='vertical' makes horizontal bars. Confusing naming in Recharts.
                            // Recharts: layout="vertical" means Y axis is category, X axis is number -> Horizontal bars.
                            // My Component: layout prop passed directly to Recharts.
                            // So I want Horizontal Bars -> layout="vertical"
                            />
                        </div>

                        {/* Revisions Per Editor */}
                        <div className="h-80">
                            <AnalyticBarChart
                                title="Revisions Per Editor"
                                data={data?.revisionsPerEditor || []}
                                dataKey="count"
                                xAxisKey="name"
                                color="#60a5fa"
                                delay={0.4}
                            />
                        </div>
                    </div>

                    {/* Editor Ratings (Stacked) */}
                    <div className="h-96">
                        <AnalyticBarChart
                            title="Editor's Ratings"
                            data={data?.ratingsPerEditor || []}
                            dataKey="" // logic handled by stacked keys
                            xAxisKey="name"
                            stacked={true}
                            stackKeys={[
                                { key: '5 Stars', color: '#a78bfa' }, // Purple
                                { key: '4 Stars', color: '#facc15' }, // Yellow
                                { key: '3 Stars', color: '#fb923c' }, // Orange
                                { key: '2 Stars', color: '#f87171' }, // Red
                                { key: '1 Star', color: '#9ca3af' },  // Gray
                            ]}
                            delay={0.5}
                            layout="vertical" // Horizontal bars
                            showLegend={true}
                        />
                    </div>

                </div>
            )}
        </AdminPageLayout>
    );
}
