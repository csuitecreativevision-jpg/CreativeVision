import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SidebarDropdownProps {
    icon: ReactNode;
    label: string;
    active?: boolean;
    children: ReactNode;
    isOpenByDefault?: boolean;
}

export const SidebarDropdown = ({ icon, label, active = false, children, isOpenByDefault = false }: SidebarDropdownProps) => {
    // If it's active, keep it open by default to show the active child
    const [isOpen, setIsOpen] = useState(isOpenByDefault || active);

    return (
        <div className="w-full flex flex-col">
            <button
                onClick={() => setIsOpen(!isOpen)}
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

                <div className={`ml-auto transition-transform duration-300 ${isOpen ? 'rotate-180 text-violet-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    <ChevronDown className="w-4 h-4" />
                </div>
            </button>

            {isOpen && (
                <div className="flex flex-col gap-1 pt-1 ml-4 pl-4 border-l border-white/5 mt-1">
                    {children}
                </div>
            )}
        </div>
    );
};
