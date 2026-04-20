import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { PremiumModal } from '../../components/ui/PremiumModal';
import { PORTAL_CACHED_PASSWORD_KEY } from '../../lib/portalPasswordCache';
import {
    Settings,
    ShieldCheck,
    Palette,
    Bell,
    Moon,
    Sun,
    Laptop,
    Lock,
    Eye,
    EyeOff,
    X
} from 'lucide-react';
import { usePortalTheme } from '../../contexts/PortalThemeContext';

function readPortalProfile() {
    return {
        name: localStorage.getItem('portal_user_name') || 'Admin User',
        email: localStorage.getItem('portal_user_email') || 'admin@cv.com',
        role: localStorage.getItem('portal_user_role') || 'Admin',
    };
}

export default function AdminSettings() {
    const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
    const [profile, setProfile] = useState(readPortalProfile);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');

    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Stub state for visuals
    const [emailNotifs, setEmailNotifs] = useState(true);

    useEffect(() => {
        if (activeTab !== 'security') return;
        setCurrentPassword(localStorage.getItem(PORTAL_CACHED_PASSWORD_KEY) || '');
    }, [activeTab]);

    useEffect(() => {
        const sync = () => setCurrentPassword(localStorage.getItem(PORTAL_CACHED_PASSWORD_KEY) || '');
        window.addEventListener('cv-portal-login-password-cached', sync);
        return () => window.removeEventListener('cv-portal-login-password-cached', sync);
    }, []);

    const handleUpdatePassword = () => {
        if (!newPassword || newPassword !== confirmPassword) return;
        localStorage.setItem(PORTAL_CACHED_PASSWORD_KEY, newPassword);
        setCurrentPassword(newPassword);
        setNewPassword('');
        setConfirmPassword('');
    };

    const openProfileModal = () => {
        const p = readPortalProfile();
        setProfile(p);
        setEditName(p.name);
        setEditEmail(p.email);
        setProfileModalOpen(true);
    };

    const saveProfile = () => {
        const name = editName.trim() || profile.name;
        const email = editEmail.trim() || profile.email;
        localStorage.setItem('portal_user_name', name);
        localStorage.setItem('portal_user_email', email);
        setProfile(readPortalProfile());
        setProfileModalOpen(false);
        window.dispatchEvent(new CustomEvent('cv-portal-profile-updated'));
    };

    const { name: currentUserName, email: currentUserEmail, role: currentUserRole } = profile;
    const { isDark, setIsDark } = usePortalTheme();

    const card = isDark ? 'bg-[#13141f] border-white/5' : 'bg-white border-zinc-200 shadow-sm ring-1 ring-black/5';
    const row = isDark ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-200';
    const iconBox = isDark ? 'bg-black/40 text-gray-400' : 'bg-zinc-200/80 text-zinc-600';
    const labelStrong = isDark ? 'text-white' : 'text-zinc-900';
    const labelMuted = isDark ? 'text-gray-500' : 'text-zinc-600';
    const avatarInner = isDark ? 'bg-[#0E0E1A] text-white' : 'bg-zinc-100 text-zinc-900';
    const badge = isDark
        ? 'bg-white/10 border-white/5 text-gray-300'
        : 'bg-zinc-100 border-zinc-200 text-zinc-600';
    const fieldLabel = isDark ? 'text-gray-500' : 'text-zinc-500';
    const inputField = isDark
        ? 'bg-[#131322] border-white/10 text-white [color-scheme:dark]'
        : 'bg-white border-zinc-200 text-zinc-900 [color-scheme:light]';
    const iconBtn = isDark
        ? 'text-gray-400 hover:text-white hover:bg-white/5'
        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100';

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
            <div className={`flex flex-wrap gap-2 pb-6 border-b mb-8 ${isDark ? 'border-white/5' : 'border-zinc-200'}`}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all select-none cursor-pointer ${
                            activeTab === tab.id
                                ? isDark
                                    ? 'text-white'
                                    : 'text-zinc-900'
                                : isDark
                                  ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/70'
                        }`}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="active-tab-settings"
                                className={`absolute inset-0 rounded-full border ${
                                    isDark ? 'bg-white/10 border-white/10' : 'bg-violet-100 border-violet-200/80'
                                }`}
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
                            <div className={`rounded-2xl p-8 relative overflow-hidden border ${card}`}>
                                <div className="relative z-10 flex items-start gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-[1px] shadow-lg shadow-violet-500/20">
                                        <div className={`w-full h-full rounded-2xl flex items-center justify-center text-2xl font-black ${avatarInner}`}>
                                            {currentUserName.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className={`text-xl font-bold ${labelStrong}`}>{currentUserName}</h3>
                                            <span className={`px-2 py-0.5 rounded-md border text-[10px] uppercase font-bold ${badge}`}>
                                                {String(currentUserRole || '').toUpperCase()}
                                            </span>
                                        </div>
                                        <p className={`cursor-default font-mono text-xs select-none ${labelMuted}`}>{currentUserEmail}</p>
                                        <button
                                            type="button"
                                            onClick={openProfileModal}
                                            className={`mt-4 text-xs font-bold transition-colors ${
                                                isDark
                                                    ? 'text-violet-400 hover:text-violet-300'
                                                    : 'text-violet-600 hover:text-violet-700'
                                            }`}
                                        >
                                            Edit Profile
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Appearance & Notifications */}
                            <div className="space-y-6">
                                <div className={`rounded-2xl p-6 space-y-6 border ${card}`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Palette className="w-5 h-5 text-pink-400" />
                                        <h3 className={`font-bold ${labelStrong}`}>Appearance</h3>
                                    </div>

                                    <div className={`flex items-center justify-between p-4 rounded-xl border ${row}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${iconBox}`}>
                                                {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className={`text-sm font-bold ${labelStrong}`}>Dark Mode</div>
                                                <div className={`text-xs ${labelMuted}`}>
                                                    {isDark
                                                        ? 'On — deep theme for sidebar and portal chrome'
                                                        : 'Off — light theme for sidebar and portal chrome'}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsDark(!isDark)}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${
                                                isDark ? 'bg-violet-600' : 'bg-zinc-300'
                                            }`}
                                            aria-pressed={isDark}
                                            aria-label={isDark ? 'Disable dark mode' : 'Enable dark mode'}
                                        >
                                            <motion.div
                                                layout
                                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                                animate={{ left: isDark ? '1.5rem' : '0.25rem' }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div className={`rounded-2xl p-6 space-y-6 border ${card}`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Bell className="w-5 h-5 text-amber-400" />
                                        <h3 className={`font-bold ${labelStrong}`}>Notifications</h3>
                                    </div>

                                    <div className={`flex items-center justify-between p-4 rounded-xl border ${row}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${iconBox}`}>
                                                <Laptop className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className={`text-sm font-bold ${labelStrong}`}>Email Alerts</div>
                                                <div className={`text-xs ${labelMuted}`}>Receive updates on project activity</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setEmailNotifs(!emailNotifs)}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${
                                                emailNotifs ? 'bg-emerald-500' : isDark ? 'bg-gray-700' : 'bg-zinc-300'
                                            }`}
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
                            <GlassCard className="p-8" tone={isDark ? 'dark' : 'light'}>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold ${labelStrong}`}>Security Settings</h3>
                                        <p className={`text-sm ${labelMuted}`}>Update your password and security questions.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className={`text-xs font-bold uppercase tracking-wider ${fieldLabel}`}>Current Password</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="current-password-field"
                                                inputMode={showCurrentPw ? 'text' : 'none'}
                                                autoComplete={showCurrentPw ? 'current-password' : 'off'}
                                                readOnly={!showCurrentPw}
                                                value={showCurrentPw ? currentPassword : '*'.repeat(currentPassword.length)}
                                                onChange={
                                                    showCurrentPw
                                                        ? (e) => setCurrentPassword(e.target.value)
                                                        : undefined
                                                }
                                                onKeyDown={(e) => {
                                                    if (showCurrentPw) return;
                                                    if (e.key === 'Backspace' || e.key === 'Delete') {
                                                        e.preventDefault();
                                                        setCurrentPassword((p) => p.slice(0, -1));
                                                        return;
                                                    }
                                                    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                                                        e.preventDefault();
                                                        setCurrentPassword((p) => p + e.key);
                                                    }
                                                }}
                                                className={`w-full border rounded-xl px-4 py-3 pr-11 font-mono tracking-widest focus:outline-none focus:border-emerald-500/50 transition-colors ${inputField}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPw((v) => !v)}
                                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${iconBtn}`}
                                                aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
                                            >
                                                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {!currentPassword && (
                                            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-amber-400/80' : 'text-amber-700'}`}>
                                                Your last sign-in password appears here after you log in at the portal. If this is empty, sign out and sign in once.
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className={`text-xs font-bold uppercase tracking-wider ${fieldLabel}`}>New Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPw ? 'text' : 'password'}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    autoComplete="new-password"
                                                    className={`w-full border rounded-xl px-4 py-3 pr-11 font-mono tracking-wide focus:outline-none focus:border-emerald-500/50 transition-colors ${inputField}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPw((v) => !v)}
                                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${iconBtn}`}
                                                    aria-label={showNewPw ? 'Hide password' : 'Show password'}
                                                >
                                                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className={`text-xs font-bold uppercase tracking-wider ${fieldLabel}`}>Confirm Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPw ? 'text' : 'password'}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    autoComplete="new-password"
                                                    className={`w-full border rounded-xl px-4 py-3 pr-11 font-mono tracking-wide focus:outline-none focus:border-emerald-500/50 transition-colors ${inputField}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPw((v) => !v)}
                                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${iconBtn}`}
                                                    aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                                                >
                                                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleUpdatePassword}
                                            disabled={!newPassword || newPassword !== confirmPassword}
                                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
                                        >
                                            Update Password
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            <PremiumModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                maxWidth="max-w-md"
                tone={isDark ? 'dark' : 'light'}
            >
                <div className="p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                            <h2 className={`text-xl font-bold ${labelStrong}`}>Edit profile</h2>
                            <p className={`text-sm mt-1 ${labelMuted}`}>Updates how your name and email appear in the portal.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setProfileModalOpen(false)}
                            className={`p-2 rounded-xl transition-colors ${iconBtn}`}
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-wider ${fieldLabel}`}>Display name</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition-colors ${inputField}`}
                                autoComplete="name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-wider ${fieldLabel}`}>Email</label>
                            <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition-colors ${inputField}`}
                                autoComplete="email"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={() => setProfileModalOpen(false)}
                            className={`px-5 py-2.5 rounded-xl border font-semibold text-sm transition-colors ${
                                isDark
                                    ? 'border-white/10 text-gray-300 hover:bg-white/5'
                                    : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                            }`}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={saveProfile}
                            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-violet-600/20"
                        >
                            Save changes
                        </button>
                    </div>
                </div>
            </PremiumModal>
        </AdminPageLayout>
    );
}
