import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { loginUser } from '../services/boardsService';
import { EDITOR_BACKLOG_POPUP_SESSION_KEY } from '../lib/editorBacklogPopup';
import { PORTAL_CACHED_PASSWORD_KEY } from '../lib/portalPasswordCache';
import DomeGallery from '../components/ui/DomeGallery';
const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function PortalPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const result = await loginUser(email.toLowerCase(), password);

        if (!result.success || !result.user) {
            setError(result.error || 'Invalid credentials');
            setIsLoading(false);
            return;
        }

        localStorage.setItem('portal_user_email', result.user.email);
        localStorage.setItem('portal_user_role', result.user.role);
        localStorage.setItem('portal_user_name', result.user.name);
        if (result.user.role === 'editor' && result.user.is_full_timer) {
            localStorage.setItem('portal_editor_full_timer', '1');
        } else {
            localStorage.removeItem('portal_editor_full_timer');
        }
        localStorage.setItem(PORTAL_CACHED_PASSWORD_KEY, password);
        window.dispatchEvent(new CustomEvent('cv-portal-login-password-cached'));
        if (result.user.role === 'editor') {
            sessionStorage.removeItem(EDITOR_BACKLOG_POPUP_SESSION_KEY);
        }
        if (result.user.workspace_id) {
            localStorage.setItem('portal_user_workspace', result.user.workspace_id);
        } else {
            localStorage.removeItem('portal_user_workspace');
        }

        setTimeout(() => {
            if (result.user!.role === 'admin') navigate('/admin-portal');
            else if (result.user!.role === 'editor') navigate('/editor-portal');
            else navigate('/client-portal');
        }, 400);
    };

    return (
        <div className="relative min-h-screen min-h-[100dvh] w-full max-w-full flex overflow-hidden bg-[#020204]">
            <div className="bg-noise" />

            {/* ─── LEFT PANEL : Auth ──────────────────────────────── */}
            <div className="flex-1 lg:flex-none lg:w-[460px] xl:w-[500px] native:!w-full native:!max-w-none native:flex-1 flex flex-col relative bg-[#020204] [color-scheme:dark]">

                {/* Back link — hidden in native app; home route redirects to portal */}
                {!Capacitor.isNativePlatform() && (
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="absolute top-[max(1.75rem,env(safe-area-inset-top,0px))] left-[max(1.25rem,env(safe-area-inset-left,0px))] z-50 flex items-center gap-2 text-white/25 hover:text-white/70 transition-colors duration-200 group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
                        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase">Return</span>
                    </button>
                )}

                {/* Form area — vertically centered */}
                <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 md:px-10 xl:px-14 py-6 sm:py-0">
                    <div className="w-full max-w-[340px] min-w-0">

                        {/* Heading */}
                        <motion.div {...fadeUp(0.05)} className="mb-10">
                            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/25 mb-4">Portal Access</p>
                            <h1 className="font-display text-3xl sm:text-4xl xl:text-5xl font-medium tracking-tight leading-[1.0] text-glow-premium">
                                Sign <span className="italic text-violet-400 text-glow-violet">in.</span>
                            </h1>
                        </motion.div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/15"
                            >
                                <div className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                                <span className="text-xs text-red-400/90 font-medium">{error}</span>
                            </motion.div>
                        )}

                        {/* Form */}
                        <motion.form {...fadeUp(0.15)} onSubmit={handleLogin} className="space-y-3">

                            {/* Email */}
                            <div className="group relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-violet-400/80 transition-colors duration-200 z-10" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="Email address"
                                    disabled={isLoading}
                                    className="w-full bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.11] rounded-2xl pl-11 pr-5 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/35 focus:bg-white/[0.05] focus:ring-1 focus:ring-violet-500/20 transition-all duration-200 font-medium"
                                />
                            </div>

                            {/* Password */}
                            <div className="group relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-violet-400/80 transition-colors duration-200 z-10 pointer-events-none" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Type your password here"
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                    className="w-full bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.11] rounded-2xl pl-11 pr-12 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/35 focus:bg-white/[0.05] focus:ring-1 focus:ring-violet-500/20 transition-all duration-200 font-medium"
                                />
                                <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl text-white/35 hover:text-white/80 hover:bg-white/[0.06] transition-colors duration-200 z-10 disabled:opacity-30 disabled:pointer-events-none"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* CTA */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-white text-black rounded-full py-3.5 font-semibold text-sm tracking-wide flex items-center justify-center gap-2.5 hover:bg-violet-50 hover:scale-[1.015] active:scale-[0.99] transition-all duration-200 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
                                            Verifying
                                        </>
                                    ) : (
                                        <>
                                            Authenticate
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.form>


                    </div>
                </div>

                {/* Footer */}
                <div className="pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:pb-8 text-center">
                    <p className="text-[10px] text-white/15 font-medium tracking-wider">© 2024 CreativeVision Inc.</p>
                </div>
            </div>

            {/* Hairline divider */}
            <div className="hidden lg:block native:hidden w-px self-stretch bg-gradient-to-b from-transparent via-white/[0.07] to-transparent flex-shrink-0" />

            {/* ─── RIGHT PANEL : Brand ──────────────────────────────── */}
            <div className="hidden lg:flex native:hidden flex-1 relative flex-col overflow-hidden bg-[#020204]">

                {/* Ambient art */}
                <div className="absolute inset-0">
                    <DomeGallery
                        fit={0.9}
                        minRadius={400}
                        segments={28}
                        dragDampening={1.8}
                    />
                    {/* Fade edges — left side fades toward divider */}
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#020204]/60 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#020204]/30 via-transparent to-[#020204]/40 pointer-events-none" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full p-14 xl:p-16 pointer-events-none">
                    {/* Main wordmark — bottom anchored */}
                    <div className="mt-auto pointer-events-auto w-fit">
                        <motion.h1 {...fadeUp(0)} className="font-display text-[4.5rem] xl:text-[5.5rem] font-medium leading-[0.88] tracking-tight drop-shadow-2xl mb-8">
                            Creative<br />
                            <span className="italic text-violet-400 drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]">Vision.</span>
                        </motion.h1>

                        <motion.p {...fadeUp(0.1)} className="text-white/80 font-light text-lg max-w-xs leading-relaxed drop-shadow-md">
                            Cinematic content engineered to hook audiences and drive real conversions.
                        </motion.p>
                    </div>
                </div>
            </div>
        </div>
    );
}
