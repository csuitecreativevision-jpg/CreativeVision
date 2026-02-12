import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

interface AnalyticBarChartProps {
    title: string;
    data: any[];
    dataKey: string;
    xAxisKey?: string;
    color?: string;
    height?: number;
    delay?: number;
    layout?: 'horizontal' | 'vertical';
    valuePrefix?: string;
    emptyMessage?: string;
}

export const AnalyticBarChart = ({
    title,
    data,
    dataKey,
    xAxisKey = "name",
    color = "#8b5cf6", // Default Violet
    height = 400,
    delay = 0,
    layout = 'vertical',
    valuePrefix = "",
    emptyMessage = "No data available"
}: AnalyticBarChartProps) => {

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1a1a2e] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                    <p className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">{label}</p>
                    <p className="text-white text-lg font-bold flex items-center gap-1">
                        <span style={{ color: color }}>{valuePrefix}</span>
                        {new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="w-full bg-[#0e0e1a] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white tracking-tight uppercase">{title}</h3>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                </div>
            </div>

            {/* Empty State */}
            {data.length === 0 ? (
                <div style={{ height: height, width: '100%' }} className="flex flex-col items-center justify-center text-center opacity-50">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: color, opacity: 0.5 }} />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">{emptyMessage}</p>
                </div>
            ) : (
                /* Chart */
                <div style={{ height: height, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout={layout}
                            margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                                    <stop offset="100%" stopColor={color} stopOpacity={1} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff10" />

                            <XAxis
                                type="number"
                                hide
                            />
                            <YAxis
                                dataKey={xAxisKey}
                                type="category"
                                width={180} // Increased width for long names
                                tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500 }}
                                axisLine={false}
                                tickLine={false}
                                interval={0} // Force show all labels
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 8 }}
                            />
                            <Bar
                                dataKey={dataKey}
                                radius={[0, 4, 4, 0]}
                                barSize={12} // Very sleek bars
                                animationDuration={1500}
                                fill={`url(#gradient-${dataKey})`}
                            >
                                {/* Fallback to color if gradient fails, though fill above handles it */}
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={`url(#gradient-${dataKey})`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </motion.div>
    );
};
