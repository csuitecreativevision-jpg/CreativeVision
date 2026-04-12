import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Video, Film, Layers, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function ThreeDModel({ type, isHovered }: { type: string, isHovered: boolean }) {
  if (type === 'short-form') {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none [perspective:1000px] z-0">
        <motion.div
          animate={{
            rotateY: isHovered ? 180 : 0,
            rotateX: isHovered ? 10 : 5,
            y: [-10, 10, -10]
          }}
          transition={{
            rotateY: { duration: 1.5, ease: "easeInOut" },
            rotateX: { duration: 1.5, ease: "easeInOut" },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          className="relative w-24 h-48 md:w-32 md:h-64"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-2xl bg-black/40 border border-white/5"
              style={{ transform: `translateZ(${-i * 5}px)`, opacity: 1 - i * 0.1 }}
            />
          ))}
          <div className="absolute inset-0 rounded-2xl bg-[#0a0a0c]/80 border border-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.15)]" style={{ transform: 'translateZ(0px)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent h-1/2" />
            <motion.div 
              animate={{ x: ['-200%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
              className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-[45deg]"
            />
          </div>
        </motion.div>
      </div>
    );
  }
  
  if (type === 'long-form') {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none [perspective:1000px] z-0">
        <motion.div
          animate={{
            rotateY: isHovered ? -180 : 0,
            rotateX: isHovered ? 10 : 5,
            y: [-10, 10, -10]
          }}
          transition={{
            rotateY: { duration: 1.5, ease: "easeInOut" },
            rotateX: { duration: 1.5, ease: "easeInOut" },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
          }}
          className="relative w-48 h-28 md:w-64 md:h-36"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-2xl bg-black/40 border border-white/5"
              style={{ transform: `translateZ(${-i * 5}px)`, opacity: 1 - i * 0.1 }}
            />
          ))}
          <div className="absolute inset-0 rounded-2xl bg-[#0a0a0c]/80 border border-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.15)]" style={{ transform: 'translateZ(0px)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent h-1/2" />
            <motion.div 
              animate={{ x: ['-200%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
              className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-[45deg]"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none [perspective:1000px] z-0">
      <motion.div
        animate={{
          rotateY: isHovered ? 180 : 0,
          rotateX: isHovered ? 180 : 0,
          rotateZ: isHovered ? 90 : 45,
          y: [-10, 10, -10]
        }}
        transition={{
          rotateY: { duration: 2, ease: "easeInOut" },
          rotateX: { duration: 2, ease: "easeInOut" },
          rotateZ: { duration: 2, ease: "easeInOut" },
          y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }
        }}
        className="relative w-32 h-32 md:w-40 md:h-40"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-3xl bg-black/40 border border-white/5"
            style={{ transform: `translateZ(${-i * 8}px)`, opacity: 1 - i * 0.1 }}
          />
        ))}
        <div className="absolute inset-0 rounded-3xl bg-[#0a0a0c]/80 border border-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(217,70,239,0.15)]" style={{ transform: 'translateZ(0px)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent h-1/2" />
          <motion.div 
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
            className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-[45deg]"
          />
        </div>
      </motion.div>
    </div>
  );
}

interface StartProjectPageProps {
  onBack?: () => void;
}

export default function StartProjectPage({ onBack }: StartProjectPageProps) {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const options = [
    {
      id: 'short-form',
      num: '01',
      title: 'Short Form',
      subtitle: 'Viral Architecture',
      description: 'High-impact vertical content engineered for virality, retention, and immediate audience engagement.',
      icon: Video,
      vid: 'https://cdn.pixabay.com/video/2020/05/25/40139-424917419_tiny.mp4',
      color: 'from-violet-500/40'
    },
    {
      id: 'long-form',
      num: '02',
      title: 'Long Form',
      subtitle: 'Cinematic Narratives',
      description: 'Deep-dive storytelling and widescreen cinematic production that builds unwavering brand authority.',
      icon: Film,
      vid: 'https://cdn.pixabay.com/video/2023/10/22/186005-876823351_tiny.mp4',
      color: 'from-indigo-500/40'
    },
    {
      id: 'mixed',
      num: '03',
      title: 'Ecosystem',
      subtitle: 'Omnichannel Dominance',
      description: 'A strategic, relentless blend of both formats to completely saturate your market.',
      icon: Layers,
      vid: 'https://cdn.pixabay.com/video/2024/02/20/201308-915383511_tiny.mp4',
      color: 'from-fuchsia-500/40'
    }
  ];

  return (
    <div className="min-h-screen bg-[#030305] text-white selection:bg-violet-500/30 flex flex-col overflow-hidden font-sans">
      <div className="bg-noise opacity-40 pointer-events-none z-50" />
      
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-violet-900/20 rounded-full blur-[120px]" 
        />
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-40 w-full p-6 md:p-10 flex justify-between items-center"
      >
        <button
          onClick={() => onBack ? onBack() : navigate('/')}
          className="group flex items-center gap-3 text-xs font-medium tracking-[0.2em] uppercase text-white/50 hover:text-white transition-colors"
        >
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 group-hover:bg-white/5 transition-all">
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
          </div>
          Return
        </button>
      </motion.nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col z-10 px-6 md:px-10 pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mt-4 md:mt-8 mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ willChange: "transform, filter, opacity" }}
          >
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.1] mb-6">
              <span className="text-white/80">We don't just sell plans.</span><br />
              <span className="italic text-violet-400 text-glow-violet">We sell an experience.</span>
            </h1>
            <p className="text-sm md:text-base text-white/40 font-light max-w-xl mx-auto tracking-wide leading-relaxed">
              Every detail acts as a leverage point. Every frame is calculated.<br className="hidden md:block" />
              Choose the level of impact you are ready for.
            </p>
          </motion.div>
        </div>

        {/* Cinematic Accordion */}
        <motion.div 
          initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ willChange: "transform, filter, opacity" }}
          className="flex-1 flex flex-col lg:flex-row gap-4 w-full max-w-[1400px] mx-auto min-h-[500px]"
        >
          {options.map((option, i) => {
            const isHovered = hoveredIndex === i;
            const isAnyHovered = hoveredIndex !== null;
            
            return (
              <motion.div
                key={option.id}
                onHoverStart={() => setHoveredIndex(i)}
                onHoverEnd={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(i)}
                animate={{
                  flex: isHovered ? 3 : isAnyHovered ? 1 : 1,
                }}
                transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-sm cursor-pointer group flex-1 min-h-[120px] lg:min-h-0"
              >
                {/* 3D Model Background (Visible when not hovered) */}
                <motion.div
                  animate={{ opacity: isHovered ? 0 : 1 }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-0 z-0"
                >
                  <ThreeDModel type={option.id} isHovered={isHovered} />
                </motion.div>

                {/* Video Background (Visible when hovered) */}
                <motion.div
                  animate={{ opacity: isHovered ? 0.6 : 0 }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-0 z-0"
                >
                  <video
                    src={option.vid}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${option.color} to-transparent mix-blend-overlay`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/40 to-transparent" />
                </motion.div>

                {/* Content Container */}
                <div className="absolute inset-0 z-10 p-6 md:p-8 flex flex-col justify-between">
                  {/* Top: Number & Icon */}
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-sm md:text-base text-white/30 font-medium tracking-wider">
                      {option.num}
                    </span>
                    <motion.div 
                      animate={{ 
                        backgroundColor: isHovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
                        color: isHovered ? '#fff' : 'rgba(255,255,255,0.3)'
                      }}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-md"
                    >
                      <option.icon className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.5} />
                    </motion.div>
                  </div>

                  {/* Bottom: Text & CTA */}
                  <div className="flex flex-col">
                    <motion.div
                      animate={{ y: isHovered ? 0 : 10 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <h3 className="font-sans text-2xl md:text-4xl font-black text-white mb-1 tracking-tight text-glow-premium">
                        {option.title}
                      </h3>
                      <p className="text-violet-400 text-xs md:text-sm font-medium tracking-[0.15em] uppercase mb-0">
                        {option.subtitle}
                      </p>
                    </motion.div>

                    {/* CSS Grid transition for smooth expand/collapse */}
                    <div className={`grid transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isHovered ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                      <div className="overflow-hidden">
                        <div className="min-w-[280px]">
                          <p className="text-white/60 text-sm md:text-base font-light leading-relaxed max-w-md mb-8">
                            {option.description}
                          </p>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/pricing/${option.id}`);
                            }}
                            className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full text-sm font-semibold hover:scale-105 transition-transform"
                          >
                            Select Plan <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}
