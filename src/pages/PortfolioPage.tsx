import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PORTFOLIO_ITEMS = [
  // Long Form
  { id: 1,  category: "long-form",  type: "Long Form",  ytId: "DFsizBNcfIA",  landscape: true,  featured: true },
  { id: 2,  category: "long-form",  type: "Long Form",  ytId: "4iQHoaFQr8E",  landscape: true,  featured: false },
  { id: 3,  category: "long-form",  type: "Long Form",  ytId: "sRM0RiUAvLg",  landscape: true,  featured: false },
  { id: 4,  category: "long-form",  type: "Long Form",  ytId: "WrCfTCyATGU",  landscape: true,  featured: false },
  { id: 5,  category: "long-form",  type: "Long Form",  ytId: "d1lVFDIV8Mg",  landscape: true,  featured: false },
  { id: 6,  category: "long-form",  type: "Long Form",  ytId: "dkhEOaGboGg",  landscape: true,  featured: false },
  // Short Form
  { id: 7,  category: "short-form", type: "Short Form", ytId: "n4ha0vyW7Vc",  landscape: false, featured: true  },
  { id: 8,  category: "short-form", type: "Short Form", ytId: "g7EigqBCJco",  landscape: false, featured: false },
  { id: 9,  category: "short-form", type: "Short Form", ytId: "l42-Sp68dLo",  landscape: false, featured: false },
  { id: 10, category: "short-form", type: "Short Form", ytId: "2lIv1gi_aLg",  landscape: false, featured: false },
  { id: 11, category: "long-form",  type: "Long Form",  ytId: "fEJw0Zg9yQA",  landscape: true,  featured: false },
  { id: 12, category: "short-form", type: "Short Form", ytId: "JSgyhmA3X78",  landscape: false, featured: false },
  { id: 13, category: "short-form", type: "Short Form", ytId: "KXNxPS2JJWY",  landscape: false, featured: false },
  { id: 14, category: "short-form", type: "Short Form", ytId: "GP54C67DM2Q",  landscape: false, featured: false },
  { id: 15, category: "short-form", type: "Short Form", ytId: "iDqPyKDiBos",  landscape: false, featured: false },
];

const VideoCard: React.FC<{ item: typeof PORTFOLIO_ITEMS[0], i: number, onClick: () => void }> = ({ item, i, onClick }) => {
  const embedUrl = `https://www.youtube.com/embed/${item.ytId}?autoplay=1&mute=1&loop=1&playlist=${item.ytId}&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1`;
  const aspectClass = item.landscape ? 'aspect-video' : 'aspect-[9/16]';

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
        className={`relative z-10 rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-sm group-hover:border-white/20 transition-all duration-500 ${aspectClass}`}
      >
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-90 group-hover:scale-100 z-20">
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </div>

        <iframe
          src={embedUrl}
          title="Portfolio Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 w-full h-full scale-[1.05] group-hover:scale-[1.1] transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none"
        />
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/60 via-[#050508]/10 to-transparent pointer-events-none z-10" />
        
        {/* Subtle inner shadow */}
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

            {(activeFilter === 'all' || activeFilter === 'short-form') && (
              <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                {PORTFOLIO_ITEMS.filter(item => item.category === 'short-form').map((item, i) => (
                  <VideoCard key={item.id} item={item} i={i} onClick={() => setActiveVideo(item)} />
                ))}
              </div>
            )}
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
