import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';

interface AnalyticBarChartProps {
    title: string;
    data: any[];
    dataKey: string; // The key for the bar value
    xAxisKey: string; // The key for the x-axis label
    color?: string;
    height?: number;
    delay?: number;
    showLegend?: boolean;
    layout?: 'horizontal' | 'vertical'; // Horizontal bars vs vertical bars
    stacked?: boolean;
    stackKeys?: { key: string; color: string }[]; // For stacked charts
}

export const AnalyticBarChart = ({
    title,
    data,
    dataKey,
    xAxisKey,
    color = '#8b5cf6',
    height = 300,
    delay = 0.2,
    showLegend = false,
    layout = 'horizontal', // Default to normal vertical bars
    stacked = false,
    stackKeys = []
}: AnalyticBarChartProps) => {

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0E0E1A] border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-xl">
                    <p className="text-white font-bold text-xs mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="text-xs flex items-center gap-2 mb-1 last:mb-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-400 capitalize">{entry.name}:</span>
                            <span className="text-white font-mono font-bold">{entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="p-6 rounded-3xl bg-[#0E0E1A]/60 border border-white/5 backdrop-blur-sm relative overflow-hidden h-full flex flex-col"
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    {title}
                </h3>
            </div>

            {/* min-w-0 is crucial for Recharts inside flex containers */}
            <div className="flex-1 w-full min-h-[200px] min-w-0" style={{ height: height ? `${height - 60}px` : '100%' }}>
                <ResponsiveContainer width="99%" height="100%">
                    <BarChart
                        layout={layout}
                        data={data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

                        {layout === 'horizontal' ? (
                            <>
                                <XAxis
                                    dataKey={xAxisKey}
                                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={30}
                                />
                            </>
                        ) : (
                            <>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey={xAxisKey}
                                    type="category"
                                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={100}
                                />
                            </>
                        )}

                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        {showLegend && <Legend wrapperStyle={{ paddingTop: '20px' }} />}

                        {stacked ? (
                            stackKeys.map((k, i) => (
                                <Bar
                                    key={k.key}
                                    dataKey={k.key}
                                    stackId="a"
                                    fill={k.color}
                                    radius={i === stackKeys.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                                    barSize={20}
                                />
                            ))
                        ) : (
                            <Bar
                                dataKey={dataKey}
                                fill={color}
                                radius={layout === 'vertical' ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                                barSize={layout === 'vertical' ? 20 : 40}
                            />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};
