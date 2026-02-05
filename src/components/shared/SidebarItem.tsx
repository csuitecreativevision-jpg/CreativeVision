import { ReactNode } from 'react';

interface SidebarItemProps {
    icon: ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
    isClientItem?: boolean;
}

export const SidebarItem = ({ icon, label, active = false, onClick, isClientItem = false }: SidebarItemProps) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${active
                ? 'bg-[#1E1B2E] text-white shadow-lg shadow-black/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
    >
        {/* Active Indicator Glow (Left) */}
        {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-600/50 blur-[8px]" />}

        <div className={`transition-colors duration-300 ${active ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
            {icon}
        </div>

        <span className={`text-[13px] font-medium tracking-wide ${active ? 'font-semibold' : ''}`}>{label}</span>

        {/* Active Dot (Right) */}
        {active && !isClientItem && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_2px_rgba(139,92,246,0.6)]" />
        )}

        {isClientItem && (
            <div className={`ml-auto w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-700 group-hover:bg-gray-500'}`} />
        )}
    </button>
);
