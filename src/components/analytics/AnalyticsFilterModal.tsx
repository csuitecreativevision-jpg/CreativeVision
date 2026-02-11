import { useState, useEffect } from 'react';
import { X, Calendar, Check, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalyticsFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (year: number, month: number | null, cycle: string) => void;
    availableYears: number[];
    availableCycles: string[]; // Full strings like "January 2026 - Cycle 1"
    initialFilter: {
        year: number;
        month: number | null;
        cycle: string;
    };
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const AnalyticsFilterModal = ({
    isOpen,
    onClose,
    onApply,
    availableYears,
    availableCycles,
    initialFilter
}: AnalyticsFilterModalProps) => {
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [selectedCycle, setSelectedCycle] = useState<string>('');

    // Sync state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedYear(initialFilter.year);
            setSelectedMonth(initialFilter.month);
            setSelectedCycle(initialFilter.cycle);
        }
    }, [isOpen, initialFilter]);

    // Derived: Cycles available for the selected Year & Month
    const filteredCycles = availableCycles.filter(cycle => {
        const cycleYear = parseInt(cycle.match(/\d{4}/)?.[0] || '0');

        if (selectedMonth === null) {
            return cycleYear === selectedYear; // Show all for the year if no month selected
        }

        const cycleMonthName = cycle.split(' ')[0];
        const cycleMonth = new Date(`${cycleMonthName} 1, 2000`).getMonth() + 1;
        return cycleYear === selectedYear && cycleMonth === selectedMonth;
    });

    const handleApply = () => {
        onApply(selectedYear, selectedMonth, selectedCycle);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal-content"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-[#0e0e1a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]">

                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0e0e1a]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                                        <Filter className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Configure Analytics View</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-grow bg-[#0e0e1a]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                    {/* Left Column: Year & Month */}
                                    <div className="space-y-6">

                                        {/* Year Selector */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <Calendar className="w-3 h-3" /> Year
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {availableYears.map(year => (
                                                    <button
                                                        key={year}
                                                        onClick={() => {
                                                            setSelectedYear(year);
                                                            // Reset month/cycle if invalid? No, keep user intent if possible, usage logic handles filtering
                                                        }}
                                                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${selectedYear === year
                                                            ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                                                            : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10'
                                                            }`}
                                                    >
                                                        {year}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Month Selector */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Month</label>
                                                <button
                                                    onClick={() => setSelectedMonth(null)}
                                                    className={`text-xs font-bold transition-colors ${selectedMonth === null ? 'text-violet-400' : 'text-gray-500 hover:text-white'}`}
                                                >
                                                    Select Full Year
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                {MONTHS.map((monthName, index) => {
                                                    const monthNum = index + 1;
                                                    const isSelected = selectedMonth === monthNum;
                                                    return (
                                                        <button
                                                            key={monthName}
                                                            onClick={() => {
                                                                setSelectedMonth(monthNum);
                                                                setSelectedCycle(''); // Reset cycle when changing month to avoid partial match confusion
                                                            }}
                                                            className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all duration-200 text-center ${isSelected
                                                                ? 'bg-white/10 border-white/20 text-white shadow-inner'
                                                                : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                                                }`}
                                                        >
                                                            {monthName}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Cycle Selection */}
                                    <div className="space-y-3 flex flex-col h-full">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            {selectedMonth ? `Cycles in ${MONTHS[selectedMonth - 1]}` : "All Cycles in Year"}
                                        </label>

                                        <div className="flex-grow bg-white/5 rounded-xl border border-white/5 p-2 overflow-y-auto max-h-[300px] custom-scrollbar">
                                            {/* All Cycles Option */}
                                            <button
                                                onClick={() => setSelectedCycle('')}
                                                className={`w-full text-left px-4 py-3 rounded-lg transition-all mb-1 flex items-center justify-between group ${selectedCycle === ''
                                                    ? 'bg-violet-500/10 text-violet-400 font-bold'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                    }`}
                                            >
                                                <span>{selectedMonth ? `All Cycles in ${MONTHS[selectedMonth - 1]}` : `All Cycles in ${selectedYear}`}</span>
                                                {selectedCycle === '' && <Check className="w-4 h-4" />}
                                            </button>

                                            <div className="h-px bg-white/10 my-2 mx-2" />

                                            {filteredCycles.length > 0 ? (
                                                filteredCycles.map(cycle => (
                                                    <button
                                                        key={cycle}
                                                        onClick={() => setSelectedCycle(cycle)}
                                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all mb-1 flex items-center justify-between group ${selectedCycle === cycle
                                                            ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20 font-bold'
                                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                            }`}
                                                    >
                                                        <span>{cycle}</span>
                                                        {selectedCycle === cycle && <Check className="w-4 h-4" />}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-gray-500 text-xs italic">
                                                    No cycles found for this selection.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-white/5 bg-[#0e0e1a] flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApply}
                                    className="px-8 py-2.5 rounded-xl text-sm font-bold bg-violet-600 text-white shadow-lg shadow-violet-500/20 hover:bg-violet-500 hover:scale-105 active:scale-95 transition-all"
                                >
                                    Apply Configuration
                                </button>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
