import { motion, Variants } from 'framer-motion';
import { Instagram, Twitter, Linkedin, Mail, Globe } from 'lucide-react';

export default function SummarySection() {
    const fadeIn: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <section className="w-screen h-[100svh] flex-shrink-0 flex flex-col items-center justify-center relative overflow-hidden px-[clamp(1.5rem,5vw,5rem)] text-center">

            {/* Background Elements - Matching Hero Aesthetic */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-custom-purple/20 via-custom-bg to-custom-bg opacity-40 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#050511] to-transparent z-10" />

            <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center justify-center h-full">

                {/* Logo / Brand Mark */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="mb-[clamp(2rem,5vh,4rem)]"
                >
                    <div className="w-[clamp(5rem,10vw,8rem)] h-[clamp(5rem,10vw,8rem)] rounded-full flex items-center justify-center drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]">
                        <img
                            src="/Untitled design (3).png"
                            alt="CreativeVision Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </motion.div>

                {/* Manifesto Headline */}
                <motion.h2
                    variants={fadeIn}
                    initial="hidden"
                    whileInView="visible"
                    className="text-[clamp(2.5rem,6vw,5rem)] font-bold text-white leading-tight mb-[clamp(1.5rem,3vh,2rem)]"
                >
                    We Don't Just Edit.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet">
                        We Engineer Influence.
                    </span>
                </motion.h2>

                {/* Manifesto Text */}
                <motion.p
                    variants={fadeIn}
                    initial="hidden"
                    whileInView="visible"
                    transition={{ delay: 0.2 }}
                    className="text-[clamp(1rem,2vw,1.5rem)] text-gray-400 max-w-3xl mx-auto mb-[clamp(3rem,6vh,5rem)] leading-relaxed font-light px-4"
                >
                    From the first frame to the final cut, our mission is to elevate your vision beyond the noise.
                    We believe in the power of storytelling to shift perspectives and build legacies.
                    This is where your next chapter begins.
                </motion.p>

                {/* Footer / Links */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col items-center gap-[clamp(1.5rem,3vh,2rem)]"
                >
                    <div className="flex items-center gap-[clamp(1.5rem,3vw,3rem)]">
                        {[Instagram, Twitter, Linkedin, Globe].map((Icon, i) => (
                            <a key={i} href="#" className="text-gray-500 hover:text-white transition-colors transform hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                                <Icon className="w-[clamp(1.5rem,2.5vw,2rem)] h-[clamp(1.5rem,2.5vw,2rem)]" />
                            </a>
                        ))}
                    </div>

                    <a href="mailto:contact@creativevision.com" className="group flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors text-sm md:text-base tracking-widest uppercase font-medium">
                        <Mail className="w-4 h-4 group-hover:animate-bounce" /> contact@creativevision.com
                    </a>

                    <div className="text-gray-600 text-[10px] md:text-sm mt-2 font-mono">
                        © 2026 CreativeVision. All Rights Reserved.
                    </div>
                </motion.div>

            </div>
        </section>
    );
}
