import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, ChevronRight, Sparkles } from 'lucide-react';

type TierId = 'trial' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'compare';

export default function PricingPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  
  const currentType = (type as 'short-form' | 'long-form' | 'mixed') || 'short-form';
  const availableTiers = currentType === 'short-form' 
    ? ['trial', 'bronze', 'silver', 'gold', 'platinum'] 
    : currentType === 'long-form'
      ? ['bronze', 'silver', 'gold']
      : ['bronze', 'silver', 'gold', 'platinum'];

  const [activeTier, setActiveTier] = useState<TierId>(availableTiers[0] as TierId);

  // Ensure active tier is valid for current type when navigating between types
  if (activeTier !== 'compare' && !availableTiers.includes(activeTier)) {
    setActiveTier(availableTiers[0] as TierId);
  }

  const getPlanData = () => {
    const baseFeatures = {
      'short-form': {
        trial: ['30 Minute Consultation', 'Free Trial Video'],
        bronze: ['6 Videos', '6 Thumbnails', 'Customized Editing Style', 'Quick Turnarounds', 'Unlimited Revisions'],
        silver: ['12 Videos', '12 Thumbnails', 'Customized Editing Style', 'Quick Turnarounds', 'Unlimited revisions'],
        gold: ['25 Videos', '25 Thumbnails', 'Customized Editing Style', 'Quick Turnarounds', 'Unlimited revisions', 'Content Curation', 'Content Repurposing', 'Editing Style Inventory', 'Distribution System', 'Project Overview System'],
        platinum: ['45 Videos', '45 Thumbnails', 'Customized Editing Style', 'Quick Turnarounds', 'Unlimited Revisions', 'Content Curation', 'Content Repurposing', 'Editing Style Inventory', 'Distribution System', 'Project Overview System']
      },
      'long-form': {
        trial: [] as string[],
        bronze: ['4 Long Forms per month', 'Weekly Consultation', '5 Revisions/video', 'Project Overview System', '4 Thumbnails'],
        silver: ['8 Long Forms per month', 'Weekly Consultation', '5 revisions/video', 'Project Overview System', '8 Thumbnails'],
        gold: ['12 Long Forms per month', 'Weekly Consultation', 'Optional SEO Description/Tags/Title', '5 revisions/video', 'Project Overview System', '12 Thumbnails', 'Weekly Data Analysis', 'Content Strategy'],
        platinum: [] as string[]
      },
      'mixed': {
        trial: ['30 Minute Consultation', 'Free Trial Video'],
        bronze: ['4 Short + 1 Long per month', 'Cross-Platform Formatting', 'Standard Editing', 'Weekly Delivery', '2 Revision Rounds'],
        silver: ['10 Short + 2 Long per month', 'Advanced Motion Graphics', 'Premium Sound Design', '48h Turnaround', 'Unlimited Revisions', 'Thumbnail Design'],
        gold: ['20 Short + 4 Long per month', 'Bespoke 3D Elements', 'Cinematic Color Grading', '24h Turnaround', 'A/B Testing Assets', 'Dedicated Strategist'],
        platinum: ['30 Short + 8 Long per month', 'Full Production Suite', 'Dedicated Team', '24h Turnaround', 'A/B Testing Assets', 'Dedicated Strategist']
      }
    };

    const prices = {
      'short-form': { trial: '$0', bronze: '$390', silver: '$780', gold: '$1600', platinum: '$2900' },
      'long-form': { trial: '$0', bronze: '$600', silver: '$1,500', gold: '$2,000', platinum: '$3,500' },
      'mixed': { trial: '$0', bronze: '$4,000', silver: '$8,500', gold: '$15,000', platinum: '$25,000' }
    };

    const originalPrices: Record<string, Record<string, string>> = {
      'short-form': { silver: '$870', gold: '$1915', platinum: '$3660' }
    };

    const discounts: Record<string, Record<string, string>> = {
      'short-form': { silver: '10% OFF', gold: '15% OFF', platinum: '20% OFF' }
    };

    return {
      trial: {
        id: 'trial',
        name: 'Trial',
        letter: 'T',
        title: 'Experience the\nFuture.',
        description: 'Zero risk. Pure potential. See the difference professional editing makes.',
        price: prices[currentType].trial,
        period: '/one-time',
        features: baseFeatures[currentType].trial,
        originalPrice: undefined as string | undefined,
        discount: undefined as string | undefined,
        badge: undefined as string | undefined,
        theme: {
          primary: 'bg-[#3b82f6]',
          text: 'text-[#3b82f6]',
          border: 'border-[#3b82f6]/30',
          bgGlow: 'bg-[#1e3a8a]/40',
          gradient: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700'
        }
      },
      bronze: {
        id: 'bronze',
        name: 'Bronze',
        letter: 'B',
        title: 'Build Your\nFoundation.',
        description: 'Consistency creates authority. Start your journey with a professional edge.',
        price: prices[currentType].bronze,
        period: '/month',
        features: baseFeatures[currentType].bronze,
        originalPrice: undefined as string | undefined,
        discount: undefined as string | undefined,
        badge: undefined as string | undefined,
        theme: {
          primary: 'bg-[#d97706]',
          text: 'text-[#d97706]',
          border: 'border-[#d97706]/30',
          bgGlow: 'bg-[#78350f]/40',
          gradient: 'bg-gradient-to-br from-orange-400 via-orange-600 to-orange-800'
        }
      },
      silver: {
        id: 'silver',
        name: 'Silver',
        letter: 'S',
        title: 'Accelerate\nGrowth.',
        description: 'Momentum is everything. Double your output, double your impact.',
        price: prices[currentType].silver,
        originalPrice: originalPrices[currentType]?.silver as string | undefined,
        discount: discounts[currentType]?.silver as string | undefined,
        badge: undefined as string | undefined,
        period: '/month',
        features: baseFeatures[currentType].silver,
        theme: {
          primary: 'bg-[#94a3b8]',
          text: 'text-[#94a3b8]',
          border: 'border-[#94a3b8]/30',
          bgGlow: 'bg-[#334155]/40',
          gradient: 'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-600'
        }
      },
      gold: {
        id: 'gold',
        name: 'Gold',
        letter: 'G',
        title: 'Dominate Your\nNiche.',
        description: 'The gold standard for serious creators. Full-scale production power.',
        price: prices[currentType].gold,
        originalPrice: originalPrices[currentType]?.gold as string | undefined,
        discount: discounts[currentType]?.gold as string | undefined,
        period: '/month',
        features: baseFeatures[currentType].gold,
        badge: 'BEST VALUE' as string | undefined,
        theme: {
          primary: 'bg-[#eab308]',
          text: 'text-[#eab308]',
          border: 'border-[#eab308]/30',
          bgGlow: 'bg-[#713f12]/40',
          gradient: 'bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700'
        }
      },
      platinum: {
        id: 'platinum',
        name: 'Platinum',
        letter: 'P',
        title: 'Leave a\nLegacy.',
        description: 'Maximum scale. Maximum authority. For those who play at the highest level.',
        price: prices[currentType].platinum,
        originalPrice: originalPrices[currentType]?.platinum as string | undefined,
        discount: discounts[currentType]?.platinum as string | undefined,
        badge: undefined as string | undefined,
        period: '/month',
        features: baseFeatures[currentType].platinum,
        theme: {
          primary: 'bg-[#06b6d4]',
          text: 'text-[#06b6d4]',
          border: 'border-[#06b6d4]/30',
          bgGlow: 'bg-[#164e63]/40',
          gradient: 'bg-gradient-to-br from-cyan-300 via-cyan-500 to-cyan-700'
        }
      }
    };
  };

  const data = getPlanData();
  const currentPlan = activeTier !== 'compare' ? data[activeTier as keyof typeof data] : data.bronze;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-white/30 flex flex-col font-sans relative overflow-hidden">
      <div className="bg-noise opacity-30 pointer-events-none z-50 fixed inset-0" />
      
      {/* Background Glow */}
      <AnimatePresence mode="wait">
        {activeTier !== 'compare' && currentType !== 'mixed' && (
          <motion.div
            key={activeTier}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className={`fixed top-1/2 left-0 w-[100vw] h-[100vh] ${currentPlan.theme.bgGlow} blur-[180px] rounded-full -translate-x-1/3 -translate-y-1/2 pointer-events-none z-0`}
          />
        )}
        {currentType === 'mixed' && (
          <motion.div
            key="mixed-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed top-1/2 left-0 w-[100vw] h-[100vh] bg-violet-600/10 blur-[180px] rounded-full -translate-x-1/3 -translate-y-1/2 pointer-events-none z-0"
          />
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <nav className="relative z-40 w-full p-6 md:p-10 flex justify-between items-start md:items-center flex-col md:flex-row gap-6">
        <button
          onClick={() => navigate('/start')}
          className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase text-white/70 hover:text-white transition-colors border border-white/10 px-6 py-3 rounded-full bg-[#1a1a1a]/50 backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous Page
        </button>

        {/* Segmented Control - Only show if not mixed */}
        {currentType !== 'mixed' && (
          <div className="flex items-center bg-[#1a1a1a]/80 border border-white/10 rounded-full p-1.5 backdrop-blur-md">
            {(availableTiers as TierId[]).map((tier) => (
              <button
                key={tier}
                onClick={() => setActiveTier(tier)}
                className={`relative px-6 py-2 rounded-full text-sm font-medium capitalize transition-colors z-10 ${
                  activeTier === tier ? 'text-white' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {activeTier === tier && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 rounded-full -z-10 border border-white/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {tier}
              </button>
            ))}
            <div className="w-[1px] h-4 bg-white/20 mx-2" />
            <button
              onClick={() => setActiveTier('compare')}
              className={`relative px-6 py-2 rounded-full text-sm font-medium capitalize transition-colors z-10 ${
                activeTier === 'compare' ? 'text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {activeTier === 'compare' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/10 rounded-full -z-10 border border-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              Compare
            </button>
          </div>
        )}
        
        <div className="hidden md:block w-[180px]" /> 
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex items-center justify-center px-6 md:px-10 pb-20">
        <AnimatePresence mode="wait">
          {currentType === 'mixed' ? (
            <motion.div
              key="mixed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-4xl text-center"
            >
              <div className="glass-panel rounded-[2.5rem] p-12 md:p-20 border border-white/10 bg-[#1a1a1e]/60 backdrop-blur-2xl shadow-[0_0_40px_rgba(139,92,246,0.15)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[100px] pointer-events-none -z-10" />
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full mb-8"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400/80" />
                  <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/70">Bespoke Production</span>
                </motion.div>

                <h2 className="font-display text-5xl md:text-7xl font-medium text-white mb-8 tracking-tight">
                  Custom <span className="italic text-violet-400 text-glow-violet">Plan.</span>
                </h2>
                <p className="text-xl text-white/70 font-light max-w-2xl mx-auto mb-12 leading-relaxed">
                  Every brand's needs are unique. For a combination of short-form and long-form content, we create bespoke packages tailored exactly to your strategy. Schedule a consultation to build your perfect plan.
                </p>
                
                <button 
                  onClick={() => window.open('https://calendly.com', '_blank')}
                  className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-black font-bold text-lg hover:bg-white/90 transition-all overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)]"
                >
                  <span className="relative">Schedule a Consultation</span>
                  <ChevronRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ) : activeTier !== 'compare' ? (
            <motion.div
              key={activeTier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            >
              {/* Left Column: Text */}
              <div className="relative pl-4 md:pl-12">
                {/* Massive Background Text */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-12 text-[120px] md:text-[200px] lg:text-[280px] font-display font-black text-white/[0.03] pointer-events-none tracking-tighter uppercase leading-none z-0 select-none">
                  {currentPlan.name}
                </div>

                <div className="relative z-10 [perspective:1000px]">
                  <motion.div
                    animate={{
                      y: [-10, 10, -10],
                      rotateY: [-15, 15, -15],
                      rotateX: [5, 15, 5]
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative w-24 h-24 md:w-28 md:h-28 mb-12"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* 3D Extrusion Layers */}
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className={`absolute inset-0 rounded-[1.5rem] md:rounded-[2rem] ${currentPlan.theme.gradient} border border-black/20`}
                        style={{ 
                          transform: `translateZ(${-i * 4}px)`,
                          opacity: 1 - (i * 0.1),
                          filter: `brightness(${1 - i * 0.15})`
                        }}
                      />
                    ))}
                    
                    {/* Front Face */}
                    <div 
                      className={`absolute inset-0 rounded-[1.5rem] md:rounded-[2rem] ${currentPlan.theme.gradient} flex items-center justify-center border border-white/40 shadow-[inset_0_0_30px_rgba(255,255,255,0.5),0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden`}
                      style={{ transform: 'translateZ(0px)' }}
                    >
                      {/* Glossy highlight */}
                      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/50 to-transparent rounded-t-[1.5rem] md:rounded-t-[2rem]" />
                      
                      {/* Diagonal Shine */}
                      <motion.div 
                        animate={{ x: ['-200%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                        className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-[45deg]"
                      />

                      <span 
                        className="font-display text-5xl md:text-6xl font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]" 
                        style={{ transform: 'translateZ(20px)' }}
                      >
                        {currentPlan.letter}
                      </span>
                    </div>
                  </motion.div>
                  
                  <h2 
                    className={`font-sans text-xl font-black tracking-[0.15em] uppercase mb-4 flex items-center gap-3 ${currentPlan.theme.text}`}
                    style={{ textShadow: '0 0 20px currentColor' }}
                  >
                    {currentPlan.name} Plan
                    {currentPlan.badge && (
                      <span className={`text-[10px] ${currentPlan.theme.primary} text-black px-3 py-1 rounded-full tracking-widest font-bold flex items-center gap-1`} style={{ textShadow: 'none' }}>
                        <Sparkles className="w-3 h-3" />
                        {currentPlan.badge}
                      </span>
                    )}
                  </h2>
                  
                  <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tighter leading-[0.95] mb-6 text-white text-glow-premium">
                    {currentPlan.title.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </h1>
                  
                  <p className="text-xl text-white/70 font-light max-w-md leading-relaxed">
                    {currentPlan.description}
                  </p>
                </div>
              </div>

              {/* Right Column: Pricing Card */}
              <div className="relative z-10 flex justify-center lg:justify-end">
                <div className="w-full max-w-[480px] glass-panel rounded-[2.5rem] p-8 md:p-12 border border-white/10 bg-[#1a1a1e]/60 backdrop-blur-2xl shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-end gap-2">
                      <span className="font-sans text-6xl md:text-7xl font-bold text-white tracking-tight text-glow-premium leading-none">{currentPlan.price}</span>
                      <div className="flex flex-col justify-end pb-1">
                        {currentPlan.originalPrice && (
                          <span className="text-white/40 text-sm font-medium line-through decoration-white/30 leading-none mb-1">{currentPlan.originalPrice}</span>
                        )}
                        <span className="text-white/60 text-lg font-medium leading-none">{currentPlan.period}</span>
                      </div>
                    </div>
                    {currentPlan.discount && (
                      <div className="bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                        {currentPlan.discount}
                      </div>
                    )}
                  </div>

                  {/* 3D Metallic Divider */}
                  <div className="relative w-full h-1.5 mb-8 rounded-full overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.5)] border border-black/20">
                    <div className={`absolute inset-0 bg-gradient-to-r ${currentPlan.theme.gradient} opacity-90`} />
                    <div className="absolute top-0 left-0 w-full h-[40%] bg-white/30" />
                    <div className="absolute bottom-0 left-0 w-full h-[40%] bg-black/40" />
                    <motion.div 
                      animate={{ x: ['-200%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                      className="absolute inset-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-[45deg]"
                    />
                  </div>

                  <ul className="space-y-5 mb-10">
                    {currentPlan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                          <Check className={`w-3.5 h-3.5 ${currentPlan.theme.text}`} strokeWidth={3} />
                        </div>
                        <span className="text-white/90 font-medium text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button className={`w-full py-5 rounded-2xl text-black font-bold text-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 mb-6 ${currentPlan.theme.primary}`}>
                    Schedule Consultation <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="flex flex-col items-center gap-4">
                    <button 
                      onClick={() => {
                        const nextIndex = availableTiers.indexOf(activeTier as string) + 1;
                        if (nextIndex < availableTiers.length) setActiveTier(availableTiers[nextIndex] as TierId);
                      }}
                      className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1 mb-2"
                    >
                      Explore Next Level <ChevronRight className="w-4 h-4" />
                    </button>
                    
                    <button 
                      onClick={() => setActiveTier('compare')}
                      className="w-full py-4 rounded-2xl text-white/80 font-bold text-sm border border-white/10 hover:bg-white/5 transition-colors uppercase tracking-widest"
                    >
                      View Full Comparison
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-6xl relative z-10"
            >
              {/* Background Glow for Compare */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

              <div className="text-center mb-16">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full mb-6"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400/80" />
                  <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/70">Feature Breakdown</span>
                </motion.div>
                <h2 className="font-display text-5xl md:text-7xl font-medium tracking-tight mb-6">
                  <span className="italic text-violet-400 text-glow-violet">Compare Plans.</span>
                </h2>
                <p className="text-white/50 text-lg font-light max-w-xl mx-auto">Find the perfect fit for your content strategy and production needs.</p>
              </div>
              
              <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/10 bg-[#1a1a1e]/60 backdrop-blur-2xl shadow-[0_0_40px_rgba(139,92,246,0.15)] relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02]">
                        <th className="p-6 md:p-8 text-white/40 font-medium w-1/4 text-xs tracking-[0.2em] uppercase">Features</th>
                        {availableTiers.map(tier => (
                          <th 
                            key={tier} 
                            className={`p-6 md:p-8 font-display text-2xl md:text-3xl capitalize ${data[tier as keyof typeof data].theme.text}`}
                            style={{ filter: 'drop-shadow(0 0 12px currentColor)' }}
                          >
                            <span className={`bg-clip-text text-transparent ${data[tier as keyof typeof data].theme.gradient}`}>
                              {tier}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-6 md:p-8 text-white/80 font-medium group-hover:text-white transition-colors">Price</td>
                        {availableTiers.map(tier => (
                          <td key={tier} className="p-6 md:p-8 font-bold text-xl md:text-2xl">{data[tier as keyof typeof data].price}</td>
                        ))}
                      </tr>
                      <tr className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-6 md:p-8 text-white/80 font-medium group-hover:text-white transition-colors">Turnaround Time</td>
                        {availableTiers.map(tier => (
                          <td key={tier} className="p-6 md:p-8 text-white/60">{data[tier as keyof typeof data].features.find(f => f.includes('Turnaround')) || '-'}</td>
                        ))}
                      </tr>
                      <tr className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-6 md:p-8 text-white/80 font-medium group-hover:text-white transition-colors">Revisions</td>
                        {availableTiers.map(tier => (
                          <td key={tier} className="p-6 md:p-8 text-white/60">{data[tier as keyof typeof data].features.find(f => f.toLowerCase().includes('revision')) || '-'}</td>
                        ))}
                      </tr>
                      <tr className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-6 md:p-8 text-white/80 font-medium group-hover:text-white transition-colors">Videos</td>
                        {availableTiers.map(tier => (
                          <td key={tier} className="p-6 md:p-8 text-white/60">{data[tier as keyof typeof data].features.find(f => f.toLowerCase().includes('video') || f.toLowerCase().includes('form') || f.toLowerCase().includes('forms')) || '-'}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cross-sell CTA */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-16 flex flex-col items-center justify-center"
              >
                <p className="text-white/50 text-sm tracking-[0.2em] uppercase mb-6 font-medium">Can't find what you're looking for?</p>
                <button 
                  onClick={() => {
                    navigate('/pricing/mixed');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#1a1a1e]/80 border border-white/10 hover:border-violet-500/50 transition-all overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative text-white font-medium text-lg">
                    What about Mixed Plans?
                  </span>
                  <ChevronRight className="relative w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
