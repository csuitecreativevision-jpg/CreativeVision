import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PORTFOLIO_ITEMS = [
  { id: 1, category: "long-form", type: "Long Form", vid: "https://www.youtube.com/embed/DFsizBNcfIA?autoplay=1&mute=1&loop=1&playlist=DFsizBNcfIA&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1", ytId: "DFsizBNcfIA", featured: true },
  { id: 2, category: "long-form", type: "Long Form", vid: "https://www.youtube.com/embed/4iQHoaFQr8E?autoplay=1&mute=1&loop=1&playlist=4iQHoaFQr8E&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1", ytId: "4iQHoaFQr8E", featured: false },
  { id: 3, category: "long-form", type: "Long Form", vid: "https://www.youtube.com/embed/sRM0RiUAvLg?autoplay=1&mute=1&loop=1&playlist=sRM0RiUAvLg&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1", ytId: "sRM0RiUAvLg", featured: false },
  { id: 4, category: "long-form", type: "Long Form", vid: "https://www.youtube.com/embed/WrCfTCyATGU?autoplay=1&mute=1&loop=1&playlist=WrCfTCyATGU&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1", ytId: "WrCfTCyATGU", featured: false },
  { id: 5, category: "long-form", type: "Long Form", vid: "https://www.youtube.com/embed/d1lVFDIV8Mg?autoplay=1&mute=1&loop=1&playlist=d1lVFDIV8Mg&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1", ytId: "d1lVFDIV8Mg", featured: false },
  { id: 6, category: "short-form", type: "Short Form", vid: "https://www.youtube.com/embed/n4ha0vyW7Vc?autoplay=1&mute=1&loop=1&playlist=n4ha0vyW7Vc&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1", ytId: "n4ha0vyW7Vc", featured: true },
  { id: 7, category: "short-form", type: "Short Form", vid: "https://www.youtube.com/embed/g7EigqBCJco?autoplay=1&mute=1&loop=1&playlist=g7EigqBCJco&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1", ytId: "g7EigqBCJco", featured: false },
];

const VideoCard: React.FC<{ item: typeof PORTFOLIO_ITEMS[0], i: number, onClick: () => void }> = ({ item, i, onClick }) => {
  return (
    <div className="group relative cursor-pointer" onClick={onClick}>
      {/* Ambient Blurred Background */}
      <div className="absolute -inset-4 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <img
          src={`https://img.youtube.com/vi/${item.ytId}/hqdefault.jpg`}
          alt=""
          className="w-full h-full object-cover blur-3xl saturate-200 opacity-70 rounded-[3rem] scale-105"
        />
      </div>

      {/* Main Card */}
      <div
        className={`relative z-10 rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-sm group-hover:border-white/20 transition-all duration-500 ${
          item.category === 'short-form' ? 'aspect-[9/16]' : 'aspect-video'
        }`}
      >
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-90 group-hover:scale-100 z-20">
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </div>

        <iframe
          src={item.vid}
          title="Portfolio Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 w-full h-full scale-[1.05] group-hover:scale-[1.1] transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none"
        />
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/60 via-[#050508]/10 to-transparent pointer-events-none z-10" />
        
        {/* Subtle inner shadow to frame the video without darkening it entirely */}
        <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.4)] pointer-events-none z-10" />
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'short-form' | 'long-form'>('all');
  const [activeVideo, setActiveVideo] = useState<typeof PORTFOLIO_ITEMS[0] | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeVideo) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [activeVideo]);

  return (
    <div className="min-h-screen bg-[#050508] text-white selection:bg-violet-500/30 flex flex-col font-sans relative overflow-x-hidden">
      <div className="bg-noise" />
      
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15] 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-violet-600/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-fuchsia-600/10 rounded-full blur-[150px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1] 
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] bg-indigo-500/10 rounded-full blur-[100px]" 
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
          onClick={() => navigate('/#showcase')}
          className="group flex items-center gap-3 text-xs font-medium tracking-[0.2em] uppercase text-white/50 hover:text-white transition-colors"
        >
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 group-hover:bg-white/5 transition-all">
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
          </div>
          Back to Showcase
        </button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center gap-2 p-1.5 glass-panel rounded-full"
        >
          {(['all', 'long-form', 'short-form'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`relative px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-colors z-10 whitespace-nowrap ${
                activeFilter === filter ? 'text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {activeFilter === filter && (
                <motion.div
                  layoutId="portfolioFilter"
                  className="absolute inset-0 bg-white/10 rounded-full -z-10 border border-white/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {filter.replace('-', ' ')}
            </button>
          ))}
        </motion.div>
      </motion.nav>

      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-30 px-6 md:px-10 pt-4 pb-12 max-w-[1600px] mx-auto w-full flex flex-col items-center text-center md:items-start md:text-left"
      >
        <h1 className="font-display text-5xl md:text-7xl font-medium italic text-violet-400 tracking-tight text-glow-violet mb-4">
          Selected Works
        </h1>
        <p className="text-white/50 font-sans max-w-xl text-sm md:text-base leading-relaxed">
          A curated collection of my recent video editing projects, ranging from cinematic long-form documentaries to high-retention short-form content.
        </p>
      </motion.div>

      {/* Grid */}
      <main className="relative z-10 px-6 md:px-10 pb-32 max-w-[1600px] mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeFilter}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            {(activeFilter === 'all' || activeFilter === 'long-form') && (
              <div className="col-span-full flex items-center gap-6 mb-2 mt-4 first:mt-0">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                  <h2 className="font-display text-3xl md:text-4xl font-medium italic text-white tracking-wide text-glow-premium">Long Form</h2>
                </div>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 to-transparent" />
              </div>
            )}
            
            {PORTFOLIO_ITEMS.filter(item => item.category === 'long-form' && (activeFilter === 'all' || activeFilter === 'long-form')).map((item, i) => (
              <VideoCard key={item.id} item={item} i={i} onClick={() => setActiveVideo(item)} />
            ))}

            {(activeFilter === 'all' || activeFilter === 'short-form') && (
              <div className="col-span-full flex items-center gap-6 mb-2 mt-12">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                  <h2 className="font-display text-3xl md:text-4xl font-medium italic text-white tracking-wide text-glow-premium">Short Form</h2>
                </div>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 to-transparent" />
              </div>
            )}

            {PORTFOLIO_ITEMS.filter(item => item.category === 'short-form' && (activeFilter === 'all' || activeFilter === 'short-form')).map((item, i) => (
              <VideoCard key={item.id} item={item} i={i} onClick={() => setActiveVideo(item)} />
            ))}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Video Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#050508]/95 backdrop-blur-xl p-4 md:p-10"
          >
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-6 right-6 md:top-10 md:right-10 text-white/50 hover:text-white transition-colors flex items-center gap-2 text-xs font-mono tracking-widest uppercase z-50"
            >
              Close <X className="w-4 h-4" />
            </button>
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              className="w-full max-w-7xl aspect-video relative rounded-lg overflow-hidden shadow-[0_0_100px_rgba(139,92,246,0.1)] border border-white/10 bg-black"
            >
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.ytId}?autoplay=1&rel=0&modestbranding=1`}
                title="Fullscreen Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
