import { useState, useEffect } from 'react';
import { X, Calendar, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DateFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (year: number, month: number | null) => void;
    availableYears: number[];
    initialDate?: { year: number; month: number | null };
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const DateFilterModal = ({
    isOpen,
    onClose,
    onApply,
    availableYears,
    initialDate
}: DateFilterModalProps) => {
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1);

    // Sync state when modal opens
    useEffect(() => {
        if (isOpen && initialDate) {
            setSelectedYear(initialDate.year);
            setSelectedMonth(initialDate.month);
        } else if (isOpen && availableYears.length > 0) {
            // Default to latest available year if current year not in list
            if (!availableYears.includes(selectedYear)) {
                setSelectedYear(availableYears[0]);
            }
        }
    }, [isOpen, initialDate, availableYears]);

    const handleApply = () => {
        onApply(selectedYear, selectedMonth);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all duration-200"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-[#0e0e1a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]">

                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Select Date</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

                                {/* Year Selector */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Year</label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableYears.map(year => (
                                            <button
                                                key={year}
                                                onClick={() => setSelectedYear(year)}
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

                                        {/* All Year Option */}
                                        <button
                                            onClick={() => setSelectedMonth(null)}
                                            className={`text-xs font-bold transition-colors ${selectedMonth === null ? 'text-violet-400' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            Show Full Year
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        {MONTHS.map((month, index) => {
                                            const monthNum = index + 1;
                                            const isSelected = selectedMonth === monthNum;
                                            return (
                                                <button
                                                    key={month}
                                                    onClick={() => setSelectedMonth(monthNum)}
                                                    className={`px-3 py-3 rounded-xl text-sm font-medium border transition-all duration-200 relative overflow-hidden group ${isSelected
                                                        ? 'bg-white/10 border-violet-500 text-white shadow-inner'
                                                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10'
                                                        }`}
                                                >
                                                    <span className="relative z-10">{month}</span>
                                                    {isSelected && (
                                                        <motion.div
                                                            layoutId="month-active"
                                                            className="absolute inset-0 bg-violet-500/20"
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApply}
                                    className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold shadow-lg shadow-violet-500/25 transition-all duration-200 flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Apply Filter
                                </button>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
