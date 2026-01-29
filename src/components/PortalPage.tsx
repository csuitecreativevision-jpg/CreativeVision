import { useState } from 'react';
import { motion } from 'framer-motion';
import { BackgroundLayout } from './layout/BackgroundLayout';
import { CinematicOverlay } from './ui/CinematicOverlay';
import { MagneticButton } from './ui/MagneticButton';
import { SpotlightCard } from './ui/SpotlightCard';
import { ArrowLeft, Lock, ShieldCheck, Wifi } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FloatingWidget = ({ className, children, delay = 0 }: { className?: string, children: React.ReactNode, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.5, duration: 0.8 }}
        className={`absolute p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-2xl ${className}`}
    >
        {children}
    </motion.div>
);

export default function PortalPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Portal Login:", email);
        // Simulate login delay then navigate
        setTimeout(() => {
            navigate('/admin-dashboard');
        }, 800);
    };

    return (
        <BackgroundLayout>
            <CinematicOverlay />

            <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-8 overflow-hidden bg-[#050511]">

                {/* Back Link - Absolute Top Left */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-8 left-8 z-50 flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
                >
                    <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold tracking-[0.2em] uppercase hidden md:inline-block">Return</span>
                </button>

                {/* Main Card Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-[1200px] h-[700px] md:h-[800px] relative z-20"
                >
                    <SpotlightCard className="w-full h-full rounded-[3rem] bg-[#0A0A16]/80 border border-white/10 backdrop-blur-3xl flex flex-col md:flex-row shadow-2xl p-2 md:p-3 overflow-hidden">

                        {/* LEFT SIDE: Login Form */}
                        <div className="w-full md:w-[45%] lg:w-[40%] h-full flex flex-col justify-between p-8 md:p-12 relative">

                            {/* Logo Pill */}
                            <div className="self-start">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                                    <div className="w-2 h-2 rounded-full bg-custom-bright animate-pulse" />
                                    <span className="text-xs font-bold tracking-widest text-white">PORTAL v2.0</span>
                                </div>
                            </div>

                            {/* Form Content */}
                            <div className="max-w-xs w-full mx-auto">
                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Authenticate</h1>
                                <p className="text-gray-400 text-sm mb-8">Access restricted internal systems.</p>

                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-1">
                                        <div className="group relative">
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                onFocus={() => setIsFocused(true)}
                                                onBlur={() => setIsFocused(false)}
                                                placeholder="Employee ID"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-custom-bright/50 focus:bg-white/10 transition-all font-medium text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="group relative">
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                onFocus={() => setIsFocused(true)}
                                                onBlur={() => setIsFocused(false)}
                                                placeholder="Secure Passkey"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-custom-bright/50 focus:bg-white/10 transition-all font-medium text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <MagneticButton className="w-full">
                                            <button
                                                type="submit"
                                                className="w-full py-4 bg-gradient-to-r from-custom-blue via-custom-purple to-custom-violet text-white text-sm font-bold tracking-widest uppercase rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-custom-violet/20"
                                            >
                                                Enter Portal
                                            </button>
                                        </MagneticButton>
                                    </div>

                                    <div className="flex justify-between items-center mt-6 text-[10px] text-gray-500 font-medium tracking-wider uppercase">
                                        <button type="button" className="hover:text-white transition-colors">Recover ID</button>
                                        <button type="button" className="hover:text-white transition-colors">SSO Login</button>
                                    </div>
                                </form>
                            </div>

                            {/* Footer */}
                            <div className="text-[10px] text-gray-600 font-medium tracking-wider">
                                © 2024 CreativeVision Inc. • Secured Connection
                            </div>
                        </div>

                        {/* RIGHT SIDE: Visual Card */}
                        <div className="hidden md:block flex-1 h-full rounded-[2.5rem] relative overflow-hidden bg-gray-900 group">

                            {/* Background Image */}
                            <div className="absolute inset-0">
                                <img
                                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
                                    alt="Portal Background"
                                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
                            </div>

                            {/* Floating Widgets (Style Match) */}

                            {/* Top Right - Network Status */}
                            <FloatingWidget className="top-8 right-8 flex items-center gap-3 backdrop-blur-2xl bg-black/60 border-white/5" delay={0.2}>
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                                    <Wifi className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Network</div>
                                    <div className="text-xs text-white font-bold">Encrypted Mesh</div>
                                </div>
                            </FloatingWidget>

                            {/* Middle Left - Activity Graph */}
                            <FloatingWidget className="top-1/3 left-8 w-48 backdrop-blur-3xl bg-black/60 border-white/5" delay={0.4}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Sys Load</span>
                                    <span className="text-xs text-custom-bright font-bold">94%</span>
                                </div>
                                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div className="w-[94%] h-full bg-gradient-to-r from-custom-blue to-custom-bright" />
                                </div>
                                <div className="flex gap-1 mt-2">
                                    <div className="w-1 h-4 bg-white/10 rounded-full" />
                                    <div className="w-1 h-6 bg-white/20 rounded-full" />
                                    <div className="w-1 h-3 bg-white/10 rounded-full" />
                                    <div className="w-1 h-8 bg-custom-bright rounded-full shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
                                    <div className="w-1 h-5 bg-white/20 rounded-full" />
                                    <div className="w-1 h-3 bg-white/10 rounded-full" />
                                </div>
                            </FloatingWidget>

                            {/* Bottom Center - User Badge */}
                            <FloatingWidget className="bottom-8 left-8 right-8 flex justify-between items-center backdrop-blur-3xl bg-black/60 border-white/5" delay={0.6}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                        <Lock className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-white font-bold">Security Level 5</div>
                                        <div className="text-[10px] text-gray-400">Clearance Verified</div>
                                    </div>
                                </div>
                                <div className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20">
                                    <ShieldCheck className="w-4 h-4 text-green-500" />
                                </div>
                            </FloatingWidget>
                        </div>

                    </SpotlightCard>
                </motion.div>

                {/* Background Grid - Darker */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none z-0" />

            </div>
        </BackgroundLayout>
    );
}
