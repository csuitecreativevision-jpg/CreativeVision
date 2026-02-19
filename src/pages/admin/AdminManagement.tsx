import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import {
    FilePlus,
    Users,
    TrendingUp,
    ArrowRight,
    ArrowLeft,
    CheckSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import AdminAnalytics from './AdminAnalytics';
import AdminApprovalCenter from './AdminApprovalCenter';

export default function AdminManagement() {
    const navigate = useNavigate();
    const [view, setView] = useState<'hub' | 'analytics' | 'approvals'>('hub');

    const actions = [
        {
            id: 'assign-project',
            title: 'Assign Project',
            description: 'Create new project, set pricing, and assign to editors.',
            icon: <FilePlus className="w-8 h-8 text-violet-400" />,
            action: () => navigate('/admin-portal/assign-project'),
            gradient: 'from-violet-500/20 to-fuchsia-500/20',
            border: 'group-hover:border-violet-500/50'
        },
        {
            id: 'approvals',
            title: 'Approval Center',
            description: 'Review pending projects and videos waiting for approval.',
            icon: <CheckSquare className="w-8 h-8 text-blue-400" />,
            action: () => setView('approvals'),
            gradient: 'from-blue-500/20 to-indigo-500/20',
            border: 'group-hover:border-blue-500/50',
            disabled: false
        },
        {
            id: 'manage-team',
            title: 'Manage Team',
            description: 'View team performance and manage member roles.',
            icon: <Users className="w-8 h-8 text-cyan-400" />,
            action: () => navigate('/admin-portal/users'),
            gradient: 'from-cyan-500/20 to-sky-500/20',
            border: 'group-hover:border-cyan-500/50',
            disabled: false
        },
        {
            id: 'analytics',
            title: 'Analytics Overview',
            description: 'Track production metrics, editor performance, and earnings.',
            icon: <TrendingUp className="w-8 h-8 text-emerald-400" />,
            action: () => setView('analytics'),
            gradient: 'from-emerald-500/20 to-teal-500/20',
            border: 'group-hover:border-emerald-500/50',
            disabled: false
        }
    ];

    if (view === 'analytics') {
        return (
            <AdminPageLayout>
                <div className="space-y-6">
                    <button
                        onClick={() => setView('hub')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
                    >
                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold">Back to Management Hub</span>
                    </button>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <AdminAnalytics embedded={true} />
                    </motion.div>
                </div>
            </AdminPageLayout>
        );
    }

    if (view === 'approvals') {
        return (
            <AdminPageLayout>
                <div className="space-y-6">
                    <button
                        onClick={() => setView('hub')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
                    >
                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold">Back to Management Hub</span>
                    </button>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <AdminApprovalCenter />
                    </motion.div>
                </div>
            </AdminPageLayout>
        );
    }

    return (
        <AdminPageLayout
            title="Management Hub"
            subtitle="Central command for project assignments, team operations, and analytics."
        >
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {actions.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        onClick={!item.disabled ? item.action : undefined}
                    >
                        <GlassCard
                            className={`p-6 h-full relative group overflow-hidden transition-all duration-300 border border-white/10 ${!item.disabled ? 'hover:scale-[1.02] cursor-pointer ' + item.border : ''}`}
                        >
                            {/* Ambient Background Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="mb-4 p-3 bg-white/5 w-fit rounded-xl border border-white/10 group-hover:border-white/20 transition-colors">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-200 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-gray-400 text-sm mb-6 flex-1">
                                    {item.description}
                                </p>

                                <div className="flex items-center text-sm font-medium text-white/50 group-hover:text-white transition-colors">
                                    <span>{item.disabled ? 'Coming Soon' : 'Open Dashboard'}</span>
                                    {!item.disabled && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </motion.div>
        </AdminPageLayout>
    );
}
