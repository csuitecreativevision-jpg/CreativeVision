import { motion } from 'framer-motion';
import { ArrowLeft, Video, Film, Layers, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StartProjectPageProps {
  onBack?: () => void;
}

export default function StartProjectPage({ onBack }: StartProjectPageProps) {
  const navigate = useNavigate();

  const options = [
    {
      id: 'short-form',
      title: 'Short Form',
      subtitle: 'Viral Architecture',
      description: 'High-impact vertical content engineered for virality, retention, and immediate audience engagement.',
      icon: Video,
    },
    {
      id: 'long-form',
      title: 'Long Form',
      subtitle: 'Cinematic Narratives',
      description: 'Deep-dive storytelling and widescreen cinematic production that builds unwavering brand authority.',
      icon: Film,
    },
    {
      id: 'mixed',
      title: 'Ecosystem',
      subtitle: 'Omnichannel Dominance',
      description: 'A strategic, relentless blend of both formats to completely saturate your market.',
      icon: Layers,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-[#0a0a0c] text-white selection:bg-violet-500/30 flex flex-col overflow-hidden font-sans relative"
    >
      <div className="bg-noise opacity-30 pointer-events-none z-50 fixed inset-0" />

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-violet-600/20 rounded-full blur-[120px]"
        />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="relative z-40 w-full p-6 md:p-10 flex justify-between items-center"
      >
        <button
          onClick={() => onBack ? onBack() : navigate('/')}
          className="group flex items-center gap-3 text-xs font-bold tracking-[0.2em] uppercase text-white/50 hover:text-white transition-colors bg-[#1a1a1a]/50 border border-white/10 px-6 py-3 rounded-full backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Return
        </button>
      </motion.nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col z-10 px-6 md:px-10 pb-20">

        {/* Header */}
        <div className="flex flex-col items-center text-center mt-4 md:mt-8 mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ willChange: 'transform, filter, opacity' }}
          >
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-6">
              <span className="text-white/90">Choose your</span><br />
              <span className="italic text-violet-400 text-glow-violet">Ecosystem.</span>
            </h1>
            <p className="text-base md:text-lg text-white/50 font-light max-w-2xl mx-auto tracking-wide leading-relaxed">
              Every detail acts as a leverage point. Every frame is calculated.<br className="hidden md:block" />
              Select the architecture that aligns with your vision.
            </p>
          </motion.div>
        </div>

        {/* Premium List Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-3xl mx-auto flex flex-col gap-5 relative z-10"
        >
          {options.map((option, i) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => navigate(`/pricing/${option.id}`)}
              className="group relative flex items-center gap-6 p-6 md:p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.04] hover:border-violet-500/30 transition-all duration-500 cursor-pointer w-full text-left overflow-hidden shadow-lg hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] hover:-translate-y-1"
            >
              {/* Subtle background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 to-violet-500/0 group-hover:from-violet-500/5 group-hover:to-transparent transition-all duration-500" />

              {/* Icon */}
              <div className="relative w-16 h-16 rounded-full border border-violet-500/20 flex items-center justify-center shrink-0 bg-violet-500/10 group-hover:bg-violet-500/20 group-hover:border-violet-500/40 transition-all duration-500 shadow-[0_0_15px_rgba(139,92,246,0.2)] group-hover:shadow-[0_0_25px_rgba(139,92,246,0.4)]">
                <option.icon
                  className="w-7 h-7 text-violet-400 group-hover:text-violet-300 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6"
                  strokeWidth={1.5}
                />
              </div>

              {/* Text */}
              <div className="flex-1 relative z-10">
                <h3 className="text-2xl font-sans font-extrabold text-white mb-1 group-hover:text-glow-premium transition-all duration-500">
                  {option.title}
                </h3>
                <p className="text-white/50 text-sm md:text-base font-light group-hover:text-white/70 transition-colors duration-500">
                  {option.description}
                </p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.03] border border-white/10 group-hover:bg-violet-500/20 group-hover:border-violet-500/40 transition-all duration-500 shrink-0 relative z-10">
                <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-violet-300 group-hover:translate-x-1 transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </motion.div>
  );
}
