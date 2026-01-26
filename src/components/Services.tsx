import React from 'react';
import { Briefcase, Users, ArrowRight, Star, Zap } from 'lucide-react';
import { SpotlightCard } from './ui/SpotlightCard';
import { RevealText } from './ui/RevealText';
import { MagneticButton } from './ui/MagneticButton';

interface ServicesProps {
  onGetStarted: () => void;
  onJoinTeam: () => void;
}

export default function Services({ onGetStarted, onJoinTeam }: ServicesProps) {
  return (
    <section id="services" className="relative py-32 px-6 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-custom-purple/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-custom-blue/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
          <div>
            <RevealText classNameWrapper="mb-4">
              <span className="text-custom-bright font-medium tracking-widest text-sm uppercase">Our Expertise</span>
            </RevealText>
            <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              <RevealText delay={0.1}>Cinematic</RevealText> <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright to-white">
                <RevealText delay={0.2}>Precision.</RevealText>
              </span>
            </h2>
          </div>
          <p className="max-w-md text-gray-400 text-lg leading-relaxed mb-4">
            We don't just edit videos. We engineer attention. Choose your path to excellence below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hire Us - Large Card */}
          <SpotlightCard className="rounded-3xl bg-white/5 p-8 md:p-12 border-white/10 relative overflow-hidden flex flex-col justify-between min-h-[500px]">
            <div className="absolute flex top-0 right-0 p-8 opacity-20">
              <Briefcase className="w-64 h-64 text-custom-bright -mr-20 -mt-20 transform rotate-12" />
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-custom-bright/20 flex items-center justify-center mb-8 backdrop-blur-md border border-white/10">
                <Zap className="w-8 h-8 text-custom-bright" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-4">Hire CreativeVision</h3>
              <p className="text-gray-400 text-lg max-w-sm">
                Transform your raw footage into high-converting assets. Professional turnaround, unlimited revisions.
              </p>
            </div>

            <div className="relative z-10 mt-12">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <FeatureItem text="4K Post-Production" />
                <FeatureItem text="Sound Design" />
                <FeatureItem text="Color Grading" />
                <FeatureItem text="VFX & Motion" />
              </div>

              <MagneticButton className="w-full">
                <button
                  onClick={onGetStarted}
                  className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 group"
                >
                  Start Project <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </MagneticButton>
            </div>
          </SpotlightCard>

          {/* Join Team - Large Card */}
          <SpotlightCard className="rounded-3xl bg-custom-purple/20 p-8 md:p-12 border-white/10 relative overflow-hidden flex flex-col justify-between min-h-[500px]">
            <div className="absolute flex top-0 right-0 p-8 opacity-20">
              <Users className="w-64 h-64 text-white -mr-20 -mt-20 transform -rotate-12" />
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-8 backdrop-blur-md border border-white/10">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-4">Join The Roster</h3>
              <p className="text-gray-300 text-lg max-w-sm">
                Are you a world-class editor? Join our distributed team of creatives working on top-tier projects.
              </p>
            </div>

            <div className="relative z-10 mt-12">
              <div className="grid grid-cols-2 gap-4 mb-8 text-gray-300">
                <FeatureItem text="Remote First" />
                <FeatureItem text="Global Clients" />
                <FeatureItem text="Fair Pay" />
                <FeatureItem text="Creative Freedom" />
              </div>

              <MagneticButton className="w-full">
                <button
                  onClick={onJoinTeam}
                  className="w-full py-4 bg-transparent border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 group"
                >
                  Apply Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </MagneticButton>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}

const FeatureItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2">
    <div className="w-1.5 h-1.5 rounded-full bg-custom-bright" />
    <span className="text-sm font-medium">{text}</span>
  </div>
);