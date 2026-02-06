import { useNavigate } from 'react-router-dom';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import {
    FilePlus,
    Users,
    TrendingUp,
    ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminManagement() {
    const navigate = useNavigate();

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
        // Placeholders for future expansion
        {
            id: 'manage-team',
            title: 'Manage Team',
            description: 'View team performance and manage member roles.',
            icon: <Users className="w-8 h-8 text-blue-400" />,
            action: () => navigate('/admin-portal/users'),
            gradient: 'from-blue-500/20 to-cyan-500/20',
            border: 'group-hover:border-blue-500/50',
            disabled: false
        },
        {
            id: 'financials',
            title: 'Financial Overview',
            description: 'Track revenue, project costs, and profitability.',
            icon: <TrendingUp className="w-8 h-8 text-emerald-400" />,
            action: () => { },
            gradient: 'from-emerald-500/20 to-teal-500/20',
            border: 'group-hover:border-emerald-500/50',
            disabled: true
        }
    ];

    return (
        <AdminPageLayout
            title="Management Hub"
            subtitle="Central command for project assignments and team operations."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                    <span>{item.disabled ? 'Coming Soon' : 'Open Module'}</span>
                                    {!item.disabled && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>
        </AdminPageLayout>
    );
}
