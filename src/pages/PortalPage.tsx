import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Mail, ArrowRight, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/boardsService';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function PortalPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        <div className="relative min-h-screen w-full flex overflow-hidden bg-[#020204]">
            <div className="bg-noise" />

            {/* ─── LEFT PANEL : Auth ──────────────────────────────── */}
            <div className="flex-1 lg:flex-none lg:w-[460px] xl:w-[500px] flex flex-col relative bg-[#020204]">

                {/* Back link */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-8 left-8 z-50 flex items-center gap-2 text-white/25 hover:text-white/70 transition-colors duration-200 group"
                >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
                    <span className="text-[11px] font-semibold tracking-[0.2em] uppercase">Return</span>
                </button>

                {/* Form area — vertically centered */}
                <div className="flex-1 flex flex-col items-center justify-center px-10 xl:px-14">
                    <div className="w-full max-w-[340px]">

                        {/* Heading */}
                        <motion.div {...fadeUp(0.05)} className="mb-10">
                            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/25 mb-4">Portal Access</p>
                            <h1 className="font-display text-4xl xl:text-5xl font-medium tracking-tight leading-[1.0] text-glow-premium">
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
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-violet-400/80 transition-colors duration-200 z-10" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Passkey"
                                    disabled={isLoading}
                                    className="w-full bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.11] rounded-2xl pl-11 pr-5 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/35 focus:bg-white/[0.05] focus:ring-1 focus:ring-violet-500/20 transition-all duration-200 font-medium"
                                />
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

                        {/* Utility links */}
                        <motion.div {...fadeUp(0.25)} className="mt-8 flex items-center justify-center gap-5 text-[10px] text-white/20 font-bold tracking-widest uppercase">
                            <button type="button" className="hover:text-white/50 transition-colors duration-150">Help</button>
                            <span className="w-px h-3 bg-white/10" />
                            <button type="button" className="hover:text-white/50 transition-colors duration-150">Privacy</button>
                        </motion.div>
                    </div>
                </div>

                {/* Footer */}
                <div className="pb-8 text-center">
                    <p className="text-[10px] text-white/15 font-medium tracking-wider">© 2024 CreativeVision Inc.</p>
                </div>
            </div>

            {/* Hairline divider */}
            <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-white/[0.07] to-transparent flex-shrink-0" />

            {/* ─── RIGHT PANEL : Brand ──────────────────────────────── */}
            <div className="hidden lg:flex flex-1 relative flex-col overflow-hidden">

                {/* Ambient art */}
                <div className="absolute inset-0">
                    <div className="portal-orb-violet w-[80%] h-[80%] top-[-30%] right-[-30%]" />
                    <div className="portal-orb-fuchsia w-[70%] h-[70%] bottom-[-30%] left-[-20%]" />
                    <div className="portal-orb-indigo w-[50%] h-[50%] top-[30%] left-[10%]" />
                    {/* Fine grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
                    {/* Fade edges — left side fades toward divider */}
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#020204]/60" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#020204]/30 via-transparent to-[#020204]/40" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full p-14 xl:p-16">
                    {/* Logomark */}
                    <motion.div {...fadeUp(0)} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/40 to-violet-900/30 border border-violet-500/30 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-violet-300" />
                        </div>
                        <span className="text-white/80 font-semibold text-sm tracking-wide">CreativeVision</span>
                    </motion.div>

                    {/* Main wordmark — bottom anchored */}
                    <div className="mt-auto">
                        <motion.div {...fadeUp(0.1)} className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] mb-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-white/50">Accepting New Clients</span>
                        </motion.div>

                        <motion.h1 {...fadeUp(0.2)} className="font-display text-[4.5rem] xl:text-[5.5rem] font-medium leading-[0.88] tracking-tight text-glow-premium mb-8">
                            Creative<br />
                            <span className="italic text-violet-400 text-glow-violet">Vision.</span>
                        </motion.h1>

                        <motion.p {...fadeUp(0.3)} className="text-white/35 font-light text-lg max-w-xs leading-relaxed">
                            Cinematic content engineered to hook audiences and drive real conversions.
                        </motion.p>
                    </div>
                </div>
            </div>
        </div>
    );
}
