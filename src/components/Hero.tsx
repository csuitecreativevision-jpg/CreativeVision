import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { RevealText } from './ui/RevealText';
import { TextRotator } from './ui/TextRotator';

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted: _ }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section ref={containerRef} className="relative w-screen h-screen flex-shrink-0 flex items-center justify-center overflow-hidden">

      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-custom-purple/20 via-custom-bg to-custom-bg opacity-40" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center text-center">

        {/* Label */}
        <RevealText delay={0.2} classNameWrapper="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-gray-300 font-medium">Accepting New Clients</span>
          </div>
        </RevealText>

        {/* Headline - The Hook */}
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight text-white mb-8 leading-[0.9]">
          <div className="overflow-hidden">
            <RevealText delay={0.4} direction="up" className="block text-gray-300">
              Turn
            </RevealText>
          </div>

          <div className="overflow-visible relative z-20">
            <TextRotator
              words={["Views", "Watch Time", "Content", "Stories", "Footage"]}
              className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet pb-2"
            />
          </div>

          <div className="overflow-hidden">
            <RevealText delay={0.6} direction="up" className="block text-gray-300">
              Into Revenue.
            </RevealText>
          </div>
        </h1>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Stop posting content that gets ignored. We engineer cinematic videos that hook audiences and drive conversions.
        </motion.p>
      </div>

      {/* Scroll Indicator - Horizontal Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 animate-pulse">Scroll to Begin</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-gray-800/0 via-white/20 to-gray-800/0"></div>
      </motion.div>
    </section>
  );
}