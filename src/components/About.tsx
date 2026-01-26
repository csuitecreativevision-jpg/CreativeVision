import React, { useState, useRef } from 'react';
import { Play, Users, Clock, Music, Sparkles, Calendar, Bot, Mic, FileText, Scissors, X, Layers } from 'lucide-react';
import { SiAdobepremierepro, SiCanva, SiDiscord, SiGoogle, SiWhatsapp, SiPexels } from 'react-icons/si';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import CountingNumber from './CountingNumber';
import { SpotlightCard } from './ui/SpotlightCard';

const techStack = [
  { icon: <SiAdobepremierepro className="w-6 h-6" />, name: "Adobe Premiere Pro", category: "Editing" },
  { icon: <Scissors className="w-6 h-6" />, name: "CapCut", category: "Editing" },
  { icon: <FileText className="w-6 h-6" />, name: "Subtitle Edit", category: "Subtitles" },
  { icon: <FileText className="w-6 h-6" />, name: "Turboscribe", category: "Subtitles" },
  { icon: <Mic className="w-6 h-6" />, name: "fish.audio", category: "Audio" },
  { icon: <Music className="w-6 h-6" />, name: "Epidemic Sound", category: "Audio" },
  { icon: <SiCanva className="w-6 h-6" />, name: "Canva", category: "Design" },
  { icon: <SiPexels className="w-6 h-6" />, name: "Pexels", category: "Assets" },
  { icon: <Sparkles className="w-6 h-6" />, name: "Adobe AI Enhancer", category: "AI" },
  { icon: <SiGoogle className="w-6 h-6" />, name: "Google Workspace", category: "Workflow" },
  { icon: <Calendar className="w-6 h-6" />, name: "Monday.com", category: "Workflow" },
  { icon: <Bot className="w-6 h-6" />, name: "Gemini", category: "AI" },
  { icon: <Mic className="w-6 h-6" />, name: "Elevenlabs", category: "AI" },
  { icon: <SiWhatsapp className="w-6 h-6" />, name: "WhatsApp", category: "Communication" },
  { icon: <SiDiscord className="w-6 h-6" />, name: "Discord", category: "Communication" }
];

export default function About() {
  const [showTechModal, setShowTechModal] = useState(false);

  return (
    <section id="about" className="w-screen h-screen flex-shrink-0 flex items-center justify-center relative overflow-hidden px-6">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-custom-bright" />
              <span className="text-xs font-medium text-gray-300">About Us</span>
            </div>

            <h2 className="text-6xl md:text-8xl font-bold text-white mb-10 leading-tight">
              Crafting Visual <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet">Stories.</span>
            </h2>

            <p className="text-gray-400 text-xl leading-relaxed mb-12">
              CreativeVision is more than an editing house. We are your post-production partner, turning raw footage into compelling narratives that drive results.
            </p>

            <div className="grid grid-cols-3 gap-10 mb-12">
              <StatItem number={5000} suffix="+" label="Projects" />
              <StatItem number={98} suffix="%" label="Satisfaction" />
              <StatItem number={24} suffix="h" label="Turnaround" />
            </div>

            {/* Tech Stack Preview - Interactive with Auto-Animation */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Our Tech Stack</h3>
              <button
                onClick={() => setShowTechModal(true)}
                className="group relative flex items-center gap-4 px-6 py-5 bg-gradient-to-r from-white/5 via-white/10 to-white/5 border border-white/20 rounded-2xl hover:border-white/40 transition-all duration-500 w-full overflow-hidden animate-[subtle-pulse_4s_ease-in-out_infinite]"
              >
                {/* Continuous shimmer effect - auto-plays */}
                <div className="absolute inset-0 animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Border glow pulse */}
                <div className="absolute inset-0 rounded-2xl animate-[border-glow_2s_ease-in-out_infinite] opacity-30" style={{ boxShadow: '0 0 20px rgba(116, 36, 245, 0.3)' }} />

                <div className="relative flex -space-x-3">
                  {techStack.slice(0, 5).map((tool, idx) => (
                    <div
                      key={idx}
                      className="w-11 h-11 rounded-full bg-white/10 border-2 border-[#050511] flex items-center justify-center text-gray-300 group-hover:text-white transition-colors shadow-lg"
                    >
                      {React.cloneElement(tool.icon as React.ReactElement, { className: "w-4 h-4" })}
                    </div>
                  ))}
                  <div className="w-11 h-11 rounded-full bg-white/20 border-2 border-[#050511] flex items-center justify-center text-white text-xs font-bold shadow-lg group-hover:scale-110 transition-transform animate-[bounce-subtle_2s_ease-in-out_infinite]">
                    +{techStack.length - 5}
                  </div>
                </div>
                <div className="relative text-left flex-1">
                  <div className="text-white font-bold text-base">15+ Professional Tools</div>
                  <div className="text-gray-400 text-sm flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Click to explore our full stack
                  </div>
                </div>
                <div className="relative flex items-center gap-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wider hidden md:block animate-pulse">Explore</span>
                  <Layers className="w-6 h-6 text-gray-400 group-hover:text-white group-hover:rotate-12 transition-all duration-300 animate-[wiggle_2s_ease-in-out_infinite]" />
                </div>
              </button>
            </div>
          </div>

          {/* Right Column - Portrait Video (9:16 aspect ratio) */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-custom-purple to-custom-blue rounded-3xl opacity-20 blur-2xl" />
            <div className="relative rounded-3xl bg-black/40 border border-white/10 overflow-hidden backdrop-blur-xl w-[450px] aspect-[9/16] flex items-center justify-center">
              {/* Video Placeholder */}
              <div className="text-center p-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-300 cursor-pointer">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
                <p className="text-gray-400 text-sm">Portrait Video Coming Soon</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tech Stack Modal */}
      <AnimatePresence>
        {showTechModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-6"
            onClick={() => setShowTechModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0a12] border border-white/10 rounded-3xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Our Tech Stack</h2>
                  <p className="text-gray-400">Industry-leading tools for exceptional results</p>
                </div>
                <button
                  onClick={() => setShowTechModal(false)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Grouped by Category */}
              <div className="space-y-8">
                {/* Editing */}
                <CategorySection title="Video Editing" tools={techStack.filter(t => t.category === "Editing")} />

                {/* Audio */}
                <CategorySection title="Audio Production" tools={techStack.filter(t => t.category === "Audio")} />

                {/* AI Tools */}
                <CategorySection title="AI & Enhancement" tools={techStack.filter(t => t.category === "AI")} />

                {/* Design & Assets */}
                <CategorySection title="Design & Assets" tools={techStack.filter(t => t.category === "Design" || t.category === "Assets")} />

                {/* Workflow */}
                <CategorySection title="Workflow & Management" tools={techStack.filter(t => t.category === "Workflow" || t.category === "Subtitles")} />

                {/* Communication */}
                <CategorySection title="Communication" tools={techStack.filter(t => t.category === "Communication")} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

const StatItem = ({ number, suffix, label }: { number: number, suffix: string, label: string }) => (
  <div>
    <div className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-baseline">
      <CountingNumber target={number} suffix={suffix} />
    </div>
    <div className="text-sm text-gray-500 uppercase tracking-wider">{label}</div>
  </div>
);

const FeatureCard = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    { icon: <Play className="w-5 h-5 text-white" />, title: "Premium Quality", desc: "Cinema-grade color grading and sound design." },
    { icon: <Users className="w-5 h-5 text-white" />, title: "Expert Team", desc: "Curated roster of top-tier editors." },
    { icon: <Clock className="w-5 h-5 text-white" />, title: "Fast Delivery", desc: "Rapid turnaround without compromising quality." }
  ];

  return (
    <div ref={ref} className="relative">
      <div className="absolute -inset-4 bg-gradient-to-r from-custom-purple to-custom-blue rounded-3xl opacity-20 blur-2xl" />
      <SpotlightCard className="relative rounded-3xl bg-black/40 border-white/10 p-8 backdrop-blur-xl">
        <div className="space-y-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
              transition={{
                duration: 0.6,
                delay: idx * 0.2,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-white font-bold text-base mb-1">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </SpotlightCard>
    </div>
  );
};


interface TechTool {
  icon: React.ReactNode;
  name: string;
  category: string;
}

const CategorySection = ({ title, tools }: { title: string, tools: TechTool[] }) => (
  <div>
    <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest mb-4">{title}</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {tools.map((tool, idx) => (
        <div
          key={idx}
          className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-custom-bright/50 transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-custom-bright transition-colors shrink-0">
            {tool.icon}
          </div>
          <span className="text-white text-sm font-medium">{tool.name}</span>
        </div>
      ))}
    </div>
  </div>
);