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
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${active ? 'bg-custom-bright/10 border border-custom-bright/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
    >
        {icon && !isClientItem && <div className={`p-1 rounded-lg ${active ? 'text-custom-bright' : 'text-gray-500 group-hover:text-white transition-colors'}`}>
            {icon}
        </div>}
        {isClientItem && (
            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-600 group-hover:bg-gray-400'} mr-2`} />
        )}
        <span className="text-sm font-medium tracking-wide">{label}</span>
        {active && !isClientItem && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-custom-bright shadow-[0_0_8px_rgba(124,58,237,0.5)]" />}
    </button>
);
