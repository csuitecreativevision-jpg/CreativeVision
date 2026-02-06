import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SettingsToggleItemProps {
    icon: LucideIcon;
    title: string;
    description: string;
    isOn: boolean;
    onToggle: () => void;
    iconColor?: string;
    iconBgColor?: string; // Optional custom bg color (e.g. bg-black/40)
    toggleColor?: string; // e.g. bg-emerald-500
}

export function SettingsToggleItem({
    icon: Icon,
    title,
    description,
    isOn,
    onToggle,
    iconColor = 'text-gray-400',
    iconBgColor = 'bg-black/40',
    toggleColor = 'bg-emerald-500'
}: SettingsToggleItemProps) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${iconBgColor} ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <div className="text-sm font-bold text-white">{title}</div>
                    <div className="text-xs text-gray-500">{description}</div>
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`relative w-11 h-6 rounded-full transition-colors ${isOn ? toggleColor : 'bg-gray-700'}`}
            >
                <motion.div
                    layout
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ left: isOn ? '1.5rem' : '0.25rem' }}
                />
            </button>
        </div>
    );
}
