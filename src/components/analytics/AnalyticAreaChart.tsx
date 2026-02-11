import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, Defs, LinearGradient, Stop } from 'recharts';
import { motion } from 'framer-motion';

interface AnalyticAreaChartProps {
    title: string;
    data: any[];
    dataKey: string;
    xAxisKey?: string;
    color?: string;
    height?: number;
    delay?: number;
    valuePrefix?: string; // e.g. "$" or "₱"
}

export const AnalyticAreaChart = ({
    title,
    data,
    dataKey,
    xAxisKey = "name",
    color = "#8b5cf6", // Default Violet
    height = 400,
    delay = 0,
    valuePrefix = ""
}: AnalyticAreaChartProps) => {

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
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                </div>
            </div>

            {/* Chart */}
            <div style={{ height: height, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`colorGradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <XAxis
                            dataKey={xAxisKey}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                            dy={15}
                            interval={0} // Show all ticks (months)
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '5 5' }} />

                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={4}
                            fill={`url(#colorGradient-${dataKey})`}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};
