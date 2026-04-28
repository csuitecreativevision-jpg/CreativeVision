import { useState, useEffect } from 'react';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { LeaveRequest, getAllLeaveRequests, updateLeaveRequestStatus } from '../../services/leaveService';
import { Calendar as CalendarIcon, Loader2, CheckCircle2, XCircle, Clock, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLeaveApprovals() {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        const { success, data } = await getAllLeaveRequests();
        if (success && data) {
            setRequests(data);
        }
        setIsLoading(false);
    };

    const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
        setUpdatingId(id);
        const { success } = await updateLeaveRequestStatus(id, newStatus);
        
        if (success) {
            // Update local state without full refetch for better UX
            setRequests(prev => prev.map(req => 
                req.id === id ? { ...req, status: newStatus } : req
            ));
            if (selectedRequest?.id === id) {
                setSelectedRequest({ ...selectedRequest, status: newStatus });
            }
        } else {
            alert(`Failed to ${newStatus} leave request. Please try again.`);
        }
        setUpdatingId(null);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, { 
            month: 'short', day: 'numeric', year: 'numeric' 
        });
    };

    const formatDateRange = (start: string, end: string) => {
        const a = formatDate(start);
        const b = formatDate(end);
        return a === b ? a : `${a} – ${b}`;
    };

    return (
        <AdminPageLayout
            title="Leave Approvals"
            subtitle="Review and manage employee time off requests."
        >
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-[#0E0E1A]/80 backdrop-blur-md border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl flex items-center gap-3 md:gap-4">
                        <div className="p-3 md:p-4 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {requests.filter(r => r.status === 'pending').length}
                            </div>
                            <div className="text-sm font-medium text-gray-500">Pending Requests</div>
                        </div>
                    </div>
                    <div className="bg-[#0E0E1A]/80 backdrop-blur-md border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl flex items-center gap-3 md:gap-4">
                        <div className="p-3 md:p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {requests.filter(r => r.status === 'approved').length}
                            </div>
                            <div className="text-sm font-medium text-gray-500">Approved Leaves</div>
                        </div>
                    </div>
                    <div className="bg-[#0E0E1A]/80 backdrop-blur-md border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl flex items-center gap-3 md:gap-4">
                        <div className="p-3 md:p-4 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {requests.length}
                            </div>
                            <div className="text-sm font-medium text-gray-500">Total Requests</div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-[#0E0E1A]/80 backdrop-blur-md border border-white/5 rounded-2xl md:rounded-3xl shadow-xl overflow-hidden mt-6 md:mt-8">
                    <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-white">All Leave Requests</h2>
                        </div>
                        <button 
                            onClick={fetchRequests} 
                            disabled={isLoading}
                            className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#131322]">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Employee</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap min-w-[10.5rem]">Dates</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Type</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Reason</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Status</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading && requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Retrieving requests...
                                        </td>
                                    </tr>
                                ) : requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">
                                            No leave requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="p-4 py-5">
                                                <div className="font-bold text-white text-sm">{req.user_name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{req.user_email}</div>
                                            </td>
                                            <td className="p-4 align-top min-w-[10.5rem]">
                                                <div className="text-sm font-bold text-gray-300 whitespace-nowrap">
                                                    {formatDateRange(req.start_date, req.end_date)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs font-medium capitalize border border-white/10 text-gray-300">
                                                    {req.leave_type || 'vacation'}
                                                </span>
                                            </td>
                                            <td className="p-4 min-w-[200px] max-w-[300px]">
                                                <div className="text-sm text-gray-400 truncate" title={req.reason}>
                                                    {req.reason}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {req.status === 'pending' && (
                                                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                                                        <Clock className="w-3 h-3" />
                                                        Pending
                                                    </span>
                                                )}
                                                {req.status === 'approved' && (
                                                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Approved
                                                    </span>
                                                )}
                                                {req.status === 'rejected' && (
                                                    <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                                                        <XCircle className="w-3 h-3" />
                                                        Rejected
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => setSelectedRequest(req)}
                                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors border border-white/10"
                                                >
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Review Modal */}
                <AnimatePresence>
                    {selectedRequest && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedRequest(null)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-lg bg-[#0a0a16] border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
                            >
                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a16]/80 backdrop-blur-md">
                                    <div>
                                        <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-violet-400" />
                                            Leave Request Details
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => setSelectedRequest(null)}
                                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div>
                                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Employee</div>
                                        <div className="text-lg font-bold text-white">{selectedRequest.user_name}</div>
                                        <div className="text-sm text-gray-500 font-mono">{selectedRequest.user_email}</div>
                                    </div>
                                    
                                    
                                    <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                                        <div>
                                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Leave Type</div>
                                            <div className="text-sm font-bold text-white capitalize">{selectedRequest.leave_type || 'vacation'}</div>
                                        </div>
                                        <div />
                                        <div>
                                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Start Date</div>
                                            <div className="text-sm font-bold text-white">{formatDate(selectedRequest.start_date)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">End Date</div>
                                            <div className="text-sm font-bold text-white">{formatDate(selectedRequest.end_date)}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Reason provided</div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 leading-relaxed max-h-[150px] overflow-y-auto">
                                            {selectedRequest.reason}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Status:</span>
                                            {selectedRequest.status === 'pending' && <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Pending</span>}
                                            {selectedRequest.status === 'approved' && <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Approved</span>}
                                            {selectedRequest.status === 'rejected' && <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Rejected</span>}
                                        </div>
                                        
                                        {selectedRequest.status === 'pending' && (
                                            <div className="flex gap-3">
                                                <button
                                                    disabled={updatingId === selectedRequest.id}
                                                    onClick={() => handleAction(selectedRequest.id, 'rejected')}
                                                    className="px-4 py-2 flex items-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-sm transition-colors disabled:opacity-50"
                                                >
                                                    {updatingId === selectedRequest.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                    Reject
                                                </button>
                                                <button
                                                    disabled={updatingId === selectedRequest.id}
                                                    onClick={() => handleAction(selectedRequest.id, 'approved')}
                                                    className="px-4 py-2 flex items-center gap-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-sm transition-colors disabled:opacity-50"
                                                >
                                                    {updatingId === selectedRequest.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                    Approve
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AdminPageLayout>
    );
}
