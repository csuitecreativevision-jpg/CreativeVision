import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, FileText, Send, Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { LeaveRequest, createLeaveRequest, getUserLeaveRequests } from '../../services/leaveService';

interface LeaveRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
    userName: string;
}

export function LeaveRequestModal({ isOpen, onClose, userEmail, userName }: LeaveRequestModalProps) {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [viewingRequest, setViewingRequest] = useState<LeaveRequest | null>(null);

    // Form state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [leaveType, setLeaveType] = useState('vacation');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadRequests();
            // Reset form
            setStartDate('');
            setEndDate('');
            setLeaveType('vacation');
            setReason('');
            setSubmitSuccess(false);
            setError(null);
            setViewingRequest(null);
        }
    }, [isOpen, userEmail]);

    const loadRequests = async () => {
        setIsLoading(true);
        const { data, success } = await getUserLeaveRequests(userEmail);
        if (success && data) {
            setRequests(data);
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate || !reason.trim()) {
            setError('Please fill in all fields.');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            setError('End date cannot be before start date.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const { success, error: submitError } = await createLeaveRequest(
            userEmail,
            userName,
            startDate,
            endDate,
            leaveType,
            reason
        );

        setIsSubmitting(false);

        if (success) {
            setSubmitSuccess(true);
            setStartDate('');
            setEndDate('');
            setLeaveType('vacation');
            setReason('');
            loadRequests();
            // Hide success message after 3 seconds
            setTimeout(() => setSubmitSuccess(false), 3000);
        } else {
            setError(submitError || 'Failed to submit leave request. Please try again.');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-400" />;
            default:
                return <Clock className="w-4 h-4 text-amber-400" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider">Approved</span>;
            case 'rejected':
                return <span className="text-red-400 font-bold uppercase text-[10px] tracking-wider">Rejected</span>;
            default:
                return <span className="text-amber-400 font-bold uppercase text-[10px] tracking-wider">Pending</span>;
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[90vh] bg-[#0a0a16] border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden z-10"
                >
                    {/* Close Button Mobile - Absolute Top Right */}
                    <button
                        onClick={onClose}
                        className="md:hidden absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Navigation/History Pane */}
                    {showHistory && (
                        <div className="w-full md:w-1/3 bg-white/5 border-r border-white/5 flex flex-col max-h-[40vh] md:max-h-none overflow-hidden shrink-0">
                            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                                <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-violet-400" />
                                    Leave History
                                </h2>
                                <p className="text-xs text-gray-400 mt-1 font-medium">Your past and pending leaves</p>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                    <span className="text-xs font-medium">Loading history...</span>
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="text-center py-10 px-4">
                                    <FileText className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                                    <p className="text-sm text-gray-400 font-medium">No leave history found.</p>
                                </div>
                            ) : (
                                requests.map((req) => (
                                    <button 
                                        type="button"
                                        key={req.id} 
                                        onClick={() => setViewingRequest(req)}
                                        className={`w-full text-left bg-white/5 border rounded-xl p-4 transition-colors ${viewingRequest?.id === req.id ? 'border-violet-500/50 bg-white/10 shadow-[0_0_15px_rgba(139,92,246,0.1)]' : 'border-white/10 hover:bg-white/10'}`}
                                    >
                                        <div className="flex justify-between items-start mb-3 border-b border-white/5 pb-2">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {getStatusIcon(req.status)}
                                                {getStatusText(req.status)}
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-mono text-right shrink-0 ml-2">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-300 border border-white/5">
                                                    {req.leave_type || 'vacation'}
                                                </span>
                                            </div>
                                            <div className="text-[13px] font-bold text-gray-200 flex flex-wrap items-center gap-x-1.5">
                                                <span className="whitespace-nowrap">{req.start_date}</span>
                                                <span className="text-gray-600 font-normal text-[11px] uppercase">to</span>
                                                <span className="whitespace-nowrap">{req.end_date}</span>
                                            </div>
                                            <div className="text-sm text-gray-400 pt-1 line-clamp-3 leading-relaxed">
                                                "{req.reason}"
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                    )}

                    {/* Right Pane Container */}
                    <div className={`w-full ${showHistory ? 'md:w-2/3' : ''} h-full bg-[#0a0a16] relative max-h-[60vh] md:max-h-none overflow-y-auto custom-scrollbar overflow-x-hidden`}>
                        <AnimatePresence mode="wait">
                            {viewingRequest ? (
                                <motion.div
                                    key={`details-${viewingRequest.id}`}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="flex flex-col min-h-full"
                                >
                                    <div className="sticky top-0 z-10 p-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a16]/80 backdrop-blur-md">
                                        <div>
                                            <h1 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-violet-400" />
                                                Request Details
                                            </h1>
                                            <p className="text-sm text-gray-400 font-medium mt-1">Viewing your selected leave request</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setViewingRequest(null)}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-violet-500/20 text-gray-400 hover:text-violet-400 transition-colors text-xs font-bold md:mr-2 border border-white/5 hover:border-violet-500/30"
                                            >
                                                New Request
                                            </button>
                                            <button
                                                onClick={() => setShowHistory(!showHistory)}
                                                className="flex md:hidden items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-xs font-bold"
                                            >
                                                <Calendar className="w-4 h-4" />
                                                {showHistory ? 'Hide List' : 'View List'}
                                            </button>
                                            <button
                                                onClick={onClose}
                                                className="hidden md:flex p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 md:p-8 flex-1">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                                                <div>
                                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Status</div>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(viewingRequest.status)}
                                                        {getStatusText(viewingRequest.status)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Submitted On</div>
                                                    <div className="text-sm font-bold text-white font-mono">{new Date(viewingRequest.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                                                <div>
                                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Leave Type</div>
                                                    <div className="text-sm font-bold text-white capitalize">{viewingRequest.leave_type || 'vacation'}</div>
                                                </div>
                                                <div />
                                                <div>
                                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Start Date</div>
                                                    <div className="text-sm font-bold text-white">{viewingRequest.start_date}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">End Date</div>
                                                    <div className="text-sm font-bold text-white">{viewingRequest.end_date}</div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Reason provided</div>
                                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                    {viewingRequest.reason}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="flex flex-col min-h-full"
                                >
                                    <div className="sticky top-0 z-10 p-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a16]/80 backdrop-blur-md">
                                        <div>
                                            <h1 className="text-2xl font-black text-white tracking-tight uppercase">Request Leave</h1>
                                            <p className="text-sm text-gray-400 font-medium mt-1">Submit a new request for time off</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setShowHistory(!showHistory)}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-xs font-bold md:mr-2"
                                            >
                                                <Calendar className="w-4 h-4" />
                                                {showHistory ? 'Hide History' : 'View History'}
                                            </button>
                                            <button
                                                onClick={onClose}
                                                className="hidden md:flex p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 md:p-8 flex-1">
                                        {submitSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-400"
                                >
                                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-sm">Request Submitted successfully!</h4>
                                        <p className="text-xs text-emerald-500/80 mt-1">Your leave request is now pending approval from admin.</p>
                                    </div>
                                </motion.div>
                            )}

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400"
                                >
                                    <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p className="font-bold text-sm">{error}</p>
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Start Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="date"
                                                required
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">End Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="date"
                                                required
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                                                min={startDate || new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Leave Type</label>
                                        <select
                                            value={leaveType}
                                            onChange={(e) => setLeaveType(e.target.value)}
                                            className="w-full bg-[#131322] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 appearance-none transition-colors"
                                        >
                                            <option value="vacation">Vacation / Paid Time Off</option>
                                            <option value="sick">Sick Leave</option>
                                            <option value="personal">Personal Leave</option>
                                            <option value="bereavement">Bereavement</option>
                                            <option value="unpaid">Unpaid Leave</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reason for Leave</label>
                                    <textarea
                                        required
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={4}
                                        placeholder="Please provide a brief reason for your leave request..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white mr-4 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Submit Request
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

