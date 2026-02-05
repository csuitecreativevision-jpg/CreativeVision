import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnalyticCardProps {
    title: string;
    value: string | number;
    icon?: ReactNode;
    trend?: {
        value: number;
        label: string;
        isPositive: boolean;
    };
    className?: string;
    delay?: number;
}

export const AnalyticCard = ({ title, value, icon, trend, className = '', delay = 0 }: AnalyticCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className={`p-6 rounded-3xl bg-[#0E0E1A]/60 border border-white/5 backdrop-blur-sm relative overflow-hidden group ${className}`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</h3>
                    <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
                </div>
                {icon && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                        {icon}
                    </div>
                )}
            </div>

            {trend && (
                <div className="relative z-10 mt-4 flex items-center gap-2 text-xs">
                    <span className={`font-bold ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trend.isPositive ? '+' : ''}{trend.value}%
                    </span>
                    <span className="text-gray-500">{trend.label}</span>
                </div>
            )}
        </motion.div>
    );
};
