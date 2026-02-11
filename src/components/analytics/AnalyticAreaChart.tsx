import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

interface AnalyticAreaChartProps {
    title: string;
    data: any[];
    dataKey: string;
    compareDataKey?: string; // New: Optional comparison key
    xAxisKey?: string;
    color?: string;
    compareColor?: string; // New: Optional comparison color
    height?: number;
    delay?: number;
    valuePrefix?: string; // e.g. "$" or "₱"
}

export const AnalyticAreaChart = ({
    title,
    data,
    dataKey,
    compareDataKey,
    xAxisKey = "name",
    color = "#8b5cf6", // Default Violet
    compareColor = "#64748b", // Default Slate-500 for comparison
    height = 400,
    delay = 0,
    valuePrefix = ""
}: AnalyticAreaChartProps) => {

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            // Find the correct payload item by dataKey
            const currentItem = payload.find((p: any) => p.dataKey === dataKey);
            const compareItem = compareDataKey ? payload.find((p: any) => p.dataKey === compareDataKey) : null;

            return (
                <div className="bg-[#1a1a2e] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[200px]">
                    <p className="text-gray-400 text-xs font-bold mb-3 uppercase tracking-wider">{label}</p>

                    {/* Current Value */}
                    {currentItem && (
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm font-medium flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                Current
                            </span>
                            <span className="text-white text-sm font-bold">
                                {valuePrefix}{new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(currentItem.value)}
                            </span>
                        </div>
                    )}

                    {/* Comparison Value (if exists) */}
                    {compareItem && (
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-sm font-medium flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: compareColor }} />
                                Previous
                            </span>
                            <span className="text-gray-400 text-sm font-bold">
                                {valuePrefix}{new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(compareItem.value)}
                            </span>
                        </div>
                    )}
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
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>

                {/* Legend */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-xs font-bold text-gray-400">Current</span>
                    </div>
                    {compareDataKey && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: compareColor }} />
                            <span className="text-xs font-bold text-gray-500">Previous</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Chart */}
            <div style={{ height: height, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                        <defs>
                            <linearGradient id={`colorGradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.5} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                            {compareDataKey && (
                                <linearGradient id={`colorGradient-${compareDataKey}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={compareColor} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={compareColor} stopOpacity={0} />
                                </linearGradient>
                            )}
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />

                        <XAxis
                            dataKey={xAxisKey}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                            dy={10} // Reduced vertical offset slightly
                            interval={0} // Show all ticks (months)
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '5 5' }} />

                        {/* Comparison Area (Rendered first to be behind) */}
                        {compareDataKey && (
                            <Area
                                type="monotone"
                                dataKey={compareDataKey}
                                stroke={compareColor}
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fill={`url(#colorGradient-${compareDataKey})`}
                                animationDuration={1500}
                            />
                        )}

                        {/* Main Area */}
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={3}
                            fill={`url(#colorGradient-${dataKey})`}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};
