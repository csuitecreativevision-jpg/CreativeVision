import React from 'react';
import { Play, ArrowRight, Star } from 'lucide-react';
import { SpotlightCard } from './ui/SpotlightCard';
import { RevealText } from './ui/RevealText';
import { MagneticButton } from './ui/MagneticButton';

interface PortfolioProps {
  onGetStarted: () => void;
}

export default function Portfolio({ onGetStarted }: PortfolioProps) {
  return (
    <section id="portfolio" className="py-32 px-6 relative overflow-hidden">

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div>
            <RevealText classNameWrapper="mb-4">
              <span className="text-custom-bright font-medium tracking-widest text-sm uppercase">Selected Work</span>
            </RevealText>
            <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              <RevealText delay={0.1}>Visual</RevealText> <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-purple to-custom-bright">
                <RevealText delay={0.2}>Masterpieces.</RevealText>
              </span>
            </h2>
          </div>
          <MagneticButton>
            <button className="px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors flex items-center gap-2">
              View All Projects <ArrowRight className="w-4 h-4" />
            </button>
          </MagneticButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
          <ProjectCard
            category="Brand Film"
            title="Neon Nights"
            image="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2525&auto=format&fit=crop"
          />
          <ProjectCard
            category="Commercial"
            title="Future Tech"
            image="https://images.unsplash.com/photo-1535016120720-40c6874c3b13?q=80&w=2564&auto=format&fit=crop"
          />
          <ProjectCard
            category="Documentary"
            title="Urban Stories"
            image="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2670&auto=format&fit=crop"
          />
        </div>

        {/* Testimonials */}
        <div className="border-t border-white/10 pt-24">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Trusted by Creators</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard
              name="Sarah Chen"
              role="Content Creator"
              quote="CreativeVision transformed my raw footage into a cinematic masterpiece. Engagement skyrocketed!"
            />
            <TestimonialCard
              name="Marcus Rodriguez"
              role="YouTuber (1M+ Subs)"
              quote="The speed and quality are unmatched. They just 'get' the pacing I need for retention."
            />
            <TestimonialCard
              name="Emma Thompson"
              role="Brand Director"
              quote="Reliable, creative, and professional. The best post-production partner we've worked with."
            />
          </div>
        </div>

        <div className="mt-24 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Ready to create?</h2>
          <MagneticButton className="inline-block">
            <button
              onClick={onGetStarted}
              className="px-12 py-6 bg-white text-black text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
              Start Your Project
            </button>
          </MagneticButton>
        </div>

      </div>
    </section>
  );
}

const ProjectCard = ({ category, title, image }: { category: string, title: string, image: string }) => (
  <SpotlightCard className="group h-[300px] md:h-[400px] rounded-2xl bg-gray-900 border-none">
    <div className="absolute inset-0">
      <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40" />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

    <div className="absolute bottom-0 left-0 p-8 w-full z-20">
      <span className="text-custom-bright text-xs font-bold tracking-widest uppercase mb-2 block">{category}</span>
      <div className="flex justify-between items-end">
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          <Play className="w-4 h-4 text-white fill-white" />
        </div>
      </div>
    </div>
  </SpotlightCard>
);

const TestimonialCard = ({ name, role, quote }: { name: string, role: string, quote: string }) => (
  <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
    <div className="flex gap-1 mb-6">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-4 h-4 text-custom-bright fill-custom-bright" />
      ))}
    </div>
    <p className="text-gray-300 mb-6 leading-relaxed">"{quote}"</p>
    <div>
      <div className="text-white font-bold">{name}</div>
      <div className="text-gray-500 text-sm">{role}</div>
    </div>
  </div>
);