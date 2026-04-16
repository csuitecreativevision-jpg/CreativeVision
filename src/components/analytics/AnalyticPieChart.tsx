import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface AnalyticPieChartProps {
    title: string;
    data: { name: string; value: number }[];
    colors?: string[];
    height?: number;
    delay?: number;
    /** When true, renders without the dark card wrapper — use inside a Panel */
    bare?: boolean;
}

const DEFAULT_COLORS = [
    '#8b5cf6',
    '#ec4899',
    '#10b981',
    '#f59e0b',
    '#3b82f6',
    '#6366f1',
    '#ef4444',
    '#14b8a6',
];

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
    return (
        <g>
            <text x={cx} y={cy} dy={-4} textAnchor="middle" fill="#fff" style={{ fontSize: 13, fontWeight: 700 }}>
                {payload.name}
            </text>
            <text x={cx} y={cy} dy={14} textAnchor="middle" fill="#94a3b8" style={{ fontSize: 11 }}>
                {`${(percent * 100).toFixed(0)}%`}
            </text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6}
                startAngle={startAngle} endAngle={endAngle} fill={fill} cornerRadius={4} />
            <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle}
                innerRadius={innerRadius - 5} outerRadius={innerRadius - 2} fill={fill} cornerRadius={2} />
        </g>
    );
};

export const AnalyticPieChart = ({
    title,
    data,
    colors = DEFAULT_COLORS,
    height = 400,
    delay = 0,
    bare = false,
}: AnalyticPieChartProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const gradientBase = title.replace(/\s+/g, '');

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const color = colors[data.findIndex(d => d.name === payload[0].name) % colors.length];
            return (
                <div className="bg-[#0a0a14]/95 border border-white/10 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">{payload[0].name}</p>
                    </div>
                    <p className="text-white text-xl font-black">{new Intl.NumberFormat('en-US').format(payload[0].value)}</p>
                    <p className="text-white/25 text-[10px] mt-0.5 font-medium">projects</p>
                </div>
            );
        }
        return null;
    };

    // ── The chart itself (shared between bare and card modes) ──────────────────
    const LEGEND_H = 56;
    const pieAreaH = height - LEGEND_H;     // height available for the donut
    const pieCy = Math.round(pieAreaH / 2); // center of donut within that zone

    const chart = (
        <div style={{ height, width: '100%' }}>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <defs>
                            {data.map((_, i) => {
                                const color = colors[i % colors.length];
                                return (
                                    <linearGradient id={`${gradientBase}-g${i}`} x1="0" y1="0" x2="0" y2="1" key={i}>
                                        <stop offset="0%" stopColor={color} stopOpacity={1} />
                                        <stop offset="100%" stopColor={color} stopOpacity={0.55} />
                                    </linearGradient>
                                );
                            })}
                        </defs>
                        <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={data}
                            cx="50%"
                            cy={pieCy}
                            innerRadius={70}
                            outerRadius={Math.min(110, pieCy - 8)}
                            paddingAngle={3}
                            dataKey="value"
                            onMouseEnter={(_, i) => setActiveIndex(i)}
                            stroke="none"
                        >
                            {data.map((_, i) => (
                                <Cell key={i} fill={`url(#${gradientBase}-g${i})`} stroke="rgba(0,0,0,0)" />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        {/* Legend anchored below the pie area */}
                        <foreignObject x="0" y={pieAreaH} width="100%" height={LEGEND_H}>
                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 px-4">
                                {data.map((entry, i) => (
                                    <div key={i} className="flex items-center gap-1.5 cursor-pointer" onMouseEnter={() => setActiveIndex(i)}>
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }} />
                                        <span className={`text-[11px] font-semibold transition-colors ${i === activeIndex ? 'text-white' : 'text-white/35'}`}>
                                            {entry.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </foreignObject>
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/15 gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white/25 animate-spin" />
                    <p className="text-xs font-medium">No data available</p>
                </div>
            )}
        </div>
    );

    // ── Bare mode: no card wrapper, just the chart ─────────────────────────────
    if (bare) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
                className="px-2 py-3"
            >
                {chart}
            </motion.div>
        );
    }

    // ── Card mode: full standalone card ───────────────────────────────────────
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: 'easeOut' }}
            className="w-full bg-[#0e0e1a] border border-white/5 rounded-[2rem] p-6 md:p-8 relative overflow-hidden"
        >
            {title && (
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-1 h-5 bg-violet-500 rounded-full" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">{title}</h3>
                </div>
            )}
            {chart}
        </motion.div>
    );
};
