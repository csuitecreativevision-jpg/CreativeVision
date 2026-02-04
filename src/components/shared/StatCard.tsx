import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { SpotlightCard } from '../ui/SpotlightCard';

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    icon: any;
    delay: number;
}

export const StatCard = ({ title, value, change, icon, delay }: StatCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
    >
        <SpotlightCard className="p-6 rounded-3xl bg-black/20 border border-white/5 backdrop-blur-xl h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    {icon}
                </div>
                <div className="px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {change}
                </div>
            </div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
            <div className="text-3xl font-black text-white tracking-tight">{value}</div>
        </SpotlightCard>
    </motion.div>
);
