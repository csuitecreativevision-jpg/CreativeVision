import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface AnalyticPieChartProps {
    title: string;
    data: { name: string; value: number }[];
    colors?: string[];
    height?: number;
    delay?: number;
}

const DEFAULT_COLORS = [
    '#8b5cf6', // Violet-500
    '#ec4899', // Pink-500
    '#10b981', // Emerald-500
    '#f59e0b', // Amber-500
    '#3b82f6', // Blue-500
    '#6366f1', // Indigo-500
    '#ef4444', // Red-500
    '#14b8a6', // Teal-500
];

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

    return (
        <g>
            <text x={cx} y={cy} dy={-4} textAnchor="middle" fill="#fff" className="text-xl font-bold">
                {payload.name}
            </text>
            <text x={cx} y={cy} dy={16} textAnchor="middle" fill="#94a3b8" className="text-sm font-medium">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                cornerRadius={4}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={innerRadius - 6}
                outerRadius={innerRadius - 2}
                fill={fill}
                cornerRadius={2}
            />
        </g>
    );
};

export const AnalyticPieChart = ({
    title,
    data,
    colors = DEFAULT_COLORS,
    height = 400,
    delay = 0
}: AnalyticPieChartProps) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1a1a2e]/90 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl ring-1 ring-white/20">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
                        <p className="text-gray-300 text-xs font-bold uppercase tracking-wider">{payload[0].name}</p>
                    </div>
                    <p className="text-white text-2xl font-black tracking-tight">
                        {new Intl.NumberFormat('en-US').format(payload[0].value)}
                    </p>
                    <p className="text-gray-500 text-xs mt-1 font-medium">
                        Projects
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
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
            className="w-full bg-[#0e0e1a] border border-white/5 rounded-[2rem] p-6 md:p-8 relative overflow-hidden group hover:border-violet-500/10 transition-colors duration-500"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-white tracking-tight uppercase flex items-center gap-3">
                    <div className="w-1 h-6 bg-violet-500 rounded-full" />
                    {title}
                </h3>
            </div>

            {/* Chart */}
            <div style={{ height: height, width: '100%' }}>
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <defs>
                                {data.map((_, index) => {
                                    const color = colors[index % colors.length];
                                    const gradientId = `pieGradient-${title.replace(/\s+/g, '')}-${index}`;
                                    return (
                                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1" key={`grad-${index}`}>
                                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                                            <stop offset="100%" stopColor={color} stopOpacity={0.5} />
                                        </linearGradient>
                                    );
                                })}
                            </defs>
                            <Pie
                                activeIndex={activeIndex}
                                activeShape={renderActiveShape}
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={4}
                                dataKey="value"
                                onMouseEnter={onPieEnter}
                                stroke="none"
                            >
                                {data.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={`url(#pieGradient-${title.replace(/\s+/g, '')}-${index})`}
                                        stroke="rgba(0,0,0,0)"
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            {/* Custom Legend Layout */}
                            <foreignObject x="0" y={height - 60} width="100%" height="60">
                                <div className="flex flex-wrap justify-center gap-4 px-4">
                                    {data.map((entry, index) => (
                                        <div key={index} className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80" onMouseEnter={() => setActiveIndex(index)}>
                                            <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ background: `linear-gradient(180deg, ${colors[index % colors.length]} 0%, ${colors[index % colors.length]}80 100%)` }} />
                                            <span className={`text-xs font-bold ${index === activeIndex ? 'text-white' : 'text-gray-500'}`}>
                                                {entry.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </foreignObject>
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500/50 space-y-4">
                        <div className="w-16 h-16 rounded-full border-4 border-gray-800 border-t-gray-700 animate-spin-slow" />
                        <div className="text-center">
                            <p className="text-sm font-bold text-gray-500">No Distribution Data</p>
                            <p className="text-xs opacity-50 mt-1">Data will appear once projects have assigned types</p>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
