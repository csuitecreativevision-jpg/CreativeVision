import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { MagneticButton } from './ui/MagneticButton';
import { RevealText } from './ui/RevealText';

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center text-center">

        {/* Label */}
        <RevealText delay={0.2} classNameWrapper="mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-gray-300 font-medium">Available for new projects</span>
          </div>
        </RevealText>

        {/* Headline */}
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight text-white mb-8 leading-[0.9]">
          <div className="overflow-hidden">
            <RevealText delay={0.4} direction="up" className="block">
              Visuals That
            </RevealText>
          </div>
          <div className="overflow-hidden">
            <RevealText delay={0.5} direction="up" className="block text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet">
              Transcend
            </RevealText>
          </div>
          <div className="overflow-hidden">
            <RevealText delay={0.6} direction="up" className="block">
              Reality.
            </RevealText>
          </div>
        </h1>

        {/* Subline */}
        <motion.p
          style={{ opacity }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          We are a premium video agency crafting cinematic experiences.
          From concept to final cut, we elevate your brand's narrative.
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <MagneticButton strength={0.4} onClick={onGetStarted}>
            <button className="group relative px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-2">
                Start Project <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </MagneticButton>

          <MagneticButton strength={0.2}>
            <button className="px-8 py-4 text-white font-medium hover:text-custom-bright transition-colors flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:border-custom-bright/50 transition-colors">
                <Play className="w-4 h-4 fill-white group-hover:fill-custom-bright transition-colors" />
              </div>
              <span className="uppercase tracking-wide text-sm">View Reel</span>
            </button>
          </MagneticButton>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        style={{ opacity }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-gray-500 to-transparent" />
      </motion.div>
    </section>
  );
}