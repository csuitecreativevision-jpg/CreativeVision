import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import {
    Settings,
    ShieldCheck,
    Palette,
    Bell,
    Moon,
    Laptop,
    Lock
} from 'lucide-react';

export default function AdminSettings() {
    const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');

    // Stub state for visuals
    const [emailNotifs, setEmailNotifs] = useState(true);

    const currentUserRole = localStorage.getItem('portal_user_role') || 'Admin';
    const currentUserName = localStorage.getItem('portal_user_name') || 'Admin User';
    const currentUserEmail = localStorage.getItem('portal_user_email') || 'admin@cv.com';

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'security', label: 'Security', icon: ShieldCheck },
    ];

    return (
        <AdminPageLayout
            title="Settings"
            subtitle="Manage your platform preferences and security configurations."
        >
            {/* Tabs Navigation */}
            <div className="flex flex-wrap gap-2 pb-6 border-b border-white/5 mb-8">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === tab.id
                            ? 'text-white'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="active-tab-settings"
                                className="absolute inset-0 bg-white/10 border border-white/10 rounded-full"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <tab.icon className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
                            {/* Profile Card */}
                            <div className="bg-[#13141f] border border-white/5 rounded-2xl p-8 relative overflow-hidden">

                                <div className="relative z-10 flex items-start gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-[1px] shadow-lg shadow-violet-500/20">
                                        <div className="w-full h-full rounded-2xl bg-[#0E0E1A] flex items-center justify-center text-2xl font-black text-white">
                                            {currentUserName.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-bold text-white">{currentUserName}</h3>
                                            <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/5 text-[10px] uppercase font-bold text-gray-300">
                                                {currentUserRole}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 font-mono text-xs">{currentUserEmail}</p>
                                        <button className="mt-4 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors">
                                            Edit Profile
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Appearance & Notifications */}
                            <div className="space-y-6">
                                <div className="bg-[#13141f] border border-white/5 rounded-2xl p-6 space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Palette className="w-5 h-5 text-pink-400" />
                                        <h3 className="font-bold text-white">Appearance</h3>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-black/40 text-gray-400">
                                                <Moon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">Dark Mode</div>
                                                <div className="text-xs text-gray-500">Always active for cinematic feel</div>
                                            </div>
                                        </div>
                                        <div className="relative w-11 h-6 bg-violet-600 rounded-full cursor-not-allowed opacity-80">
                                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#13141f] border border-white/5 rounded-2xl p-6 space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Bell className="w-5 h-5 text-amber-400" />
                                        <h3 className="font-bold text-white">Notifications</h3>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-black/40 text-gray-400">
                                                <Laptop className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">Email Alerts</div>
                                                <div className="text-xs text-gray-500">Receive updates on project activity</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setEmailNotifs(!emailNotifs)}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${emailNotifs ? 'bg-emerald-500' : 'bg-gray-700'}`}
                                        >
                                            <motion.div
                                                layout
                                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                                animate={{ left: emailNotifs ? '1.5rem' : '0.25rem' }}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {activeTab === 'security' && (
                        <div className="max-w-2xl">
                            <GlassCard className="p-8">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Security Settings</h3>
                                        <p className="text-gray-400 text-sm">Update your password and security questions.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Password</label>
                                        <input type="password" placeholder="••••••••" className="w-full bg-[#131322] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Password</label>
                                            <input type="password" placeholder="••••••••" className="w-full bg-[#131322] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm Password</label>
                                            <input type="password" placeholder="••••••••" className="w-full bg-[#131322] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <button className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20">
                                            Update Password
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </AdminPageLayout>
    );
}
