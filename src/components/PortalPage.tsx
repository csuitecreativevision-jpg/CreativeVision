import { useState } from 'react';
import { motion } from 'framer-motion';
import { BackgroundLayout } from './layout/BackgroundLayout';
import { CinematicOverlay } from './ui/CinematicOverlay';
import { MagneticButton } from './ui/MagneticButton';
import { SpotlightCard } from './ui/SpotlightCard';
import { ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PortalPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock login
        console.log("Portal Login:", email);
    };

    return (
        <BackgroundLayout>
            <CinematicOverlay />

            <div className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">

                {/* Back Link */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-12 left-8 md:left-12 flex items-center gap-2 text-gray-500 hover:text-white transition-colors z-50 text-sm tracking-widest uppercase"
                >
                    <ArrowLeft className="w-4 h-4" /> Return to Site
                </button>

                {/* Content Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 1 }}
                    className="w-full max-w-md relative z-20"
                >
                    <SpotlightCard className="p-8 md:p-12 rounded-3xl bg-black/40 border-white/10 backdrop-blur-xl">

                        {/* Header */}
                        <div className="text-center mb-12">
                            <div className="flex justify-center mb-8">
                                <div className="p-4 rounded-full bg-white/5 border border-white/10 shadow-2xl relative group">
                                    <div className="absolute inset-0 bg-custom-bright/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <img
                                        src="/Untitled design (3).png"
                                        alt="CreativeVision"
                                        className="w-12 h-12 object-contain relative z-10"
                                    />
                                </div>
                            </div>

                            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                                CreativeVision
                            </h1>
                            <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-[0.2em] text-gray-500 uppercase">
                                <Lock className="w-3 h-3" /> Internal System
                            </div>
                        </div>

                        {/* Minimalist Form */}
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-4">
                                <div className="group">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Employee ID"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-center"
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                    />
                                </div>
                                <div className="group">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Passkey"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-center"
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <MagneticButton className="w-full">
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-white text-black text-xs font-bold tracking-widest uppercase rounded-xl hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                                    >
                                        Authenticate
                                    </button>
                                </MagneticButton>
                            </div>
                        </form>
                    </SpotlightCard>

                    <div className="text-center mt-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[9px] font-bold tracking-[0.2em] text-red-500/70 uppercase">Restricted Access // Auth Req</span>
                        </div>
                    </div>

                </motion.div>

                {/* Decorative Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none" />
            </div>
        </BackgroundLayout>
    );
}
