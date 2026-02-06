import { useState } from 'react';
import { motion } from 'framer-motion';
import { BackgroundLayout } from '../components/layout/BackgroundLayout';
import { CinematicOverlay } from '../components/ui/CinematicOverlay';
import { MagneticButton } from '../components/ui/MagneticButton';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { ArrowLeft, Lock, Mail } from 'lucide-react';
import { FishTank } from '../components/ui/FishTank';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/boardsService';

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

        // Store user info
        localStorage.setItem('portal_user_email', result.user.email);
        localStorage.setItem('portal_user_role', result.user.role);
        localStorage.setItem('portal_user_name', result.user.name);
        if (result.user.workspace_id) {
            localStorage.setItem('portal_user_workspace', result.user.workspace_id);
        } else {
            localStorage.removeItem('portal_user_workspace');
        }

        // Redirect based on role
        setTimeout(() => {
            if (result.user!.role === 'admin') {
                navigate('/admin-portal');
            } else if (result.user!.role === 'editor') {
                navigate('/editor-portal');
            } else {
                navigate('/client-portal');
            }
        }, 500);
    };

    return (
        <BackgroundLayout>
            <CinematicOverlay />

            <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-8 overflow-hidden bg-[#050511]">

                {/* Back Link */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-8 left-8 z-50 flex items-center gap-3 text-white/40 hover:text-white transition-all duration-300 group"
                >
                    <div className="p-2.5 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold tracking-[0.25em] uppercase hidden md:inline-block">Return</span>
                </button>

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-[1100px] h-[650px] md:h-[750px] relative z-20"
                >
                    <SpotlightCard className="w-full h-full rounded-[2.5rem] bg-[#0A0A16]/90 border border-white/10 backdrop-blur-3xl flex flex-col md:flex-row shadow-2xl p-2 md:p-3 overflow-hidden">

                        {/* LEFT SIDE: Login Form */}
                        <div className="w-full md:w-[45%] lg:w-[40%] h-full flex flex-col justify-between p-8 md:p-12 relative overflow-hidden">

                            {/* Ambient Glow */}
                            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />

                            {/* Brand Pill */}
                            <div className="self-start relative z-10 text-white/90">
                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)] animate-pulse" />
                                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase">CreativeVision Portal</span>
                                </div>
                            </div>

                            {/* Form Content */}
                            <div className="max-w-xs w-full mx-auto relative z-10">
                                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
                                <p className="text-gray-400 text-sm mb-8 font-medium">Please enter your credentials.</p>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center"
                                    >
                                        <span className="text-xs text-red-400 font-medium">{error}</span>
                                    </motion.div>
                                )}

                                <form onSubmit={handleLogin} className="space-y-4">
                                    {/* Email */}
                                    <div className="group relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors duration-300 z-10">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Identity"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/5 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 text-sm font-medium"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    {/* Password */}
                                    <div className="group relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors duration-300 z-10">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Passkey"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/5 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 text-sm font-medium"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="pt-6">
                                        <MagneticButton className="w-full">
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full py-4 bg-white text-black text-xs font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-indigo-50 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isLoading ? 'Verifying...' : 'Authenticate'}
                                            </button>
                                        </MagneticButton>
                                    </div>

                                    <div className="flex justify-center gap-6 mt-8 text-[10px] text-gray-600 font-bold tracking-widest uppercase">
                                        <button type="button" className="hover:text-white transition-colors duration-200">Help</button>
                                        <button type="button" className="hover:text-white transition-colors duration-200">Privacy</button>
                                    </div>
                                </form>
                            </div>


                            {/* Footer */}
                            <div className="text-[10px] text-gray-600 font-medium tracking-wider">
                                © 2024 CreativeVision Inc. • Secured Connection
                            </div>
                        </div>

                        {/* RIGHT SIDE: Visual Card via FishTank */}
                        <div className="hidden md:block flex-1 h-full rounded-[2.5rem] relative overflow-hidden bg-gray-900 group">

                            {/* Interactive Fish Tank */}
                            <FishTank />

                            {/* Overlay Gradient for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-20" />
                        </div>

                    </SpotlightCard>
                </motion.div>

                {/* Background Grid - Darker */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none z-0" />

            </div>
        </BackgroundLayout>
    );
}
