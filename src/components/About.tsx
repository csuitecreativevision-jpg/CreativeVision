import React from 'react';
import { Play, Users, Clock } from 'lucide-react';
import CountingNumber from './CountingNumber';
import { RevealText } from './ui/RevealText';
import { SpotlightCard } from './ui/SpotlightCard';

export default function About() {
  return (
    <section id="about" className="py-32 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <RevealText classNameWrapper="mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-custom-bright" />
                <span className="text-xs font-medium text-gray-300">About Us</span>
              </div>
            </RevealText>

            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Crafting Visual <br />
              <span className="text-custom-purple">Stories.</span>
            </h2>

            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              CreativeVision is more than an editing house. We are your post-production partner, turning raw footage into compelling narratives that drive results.
            </p>

            <div className="grid grid-cols-3 gap-8">
              <StatItem number={5000} suffix="+" label="Projects" />
              <StatItem number={98} suffix="%" label="Satisfaction" />
              <StatItem number={24} suffix="h" label="Turnaround" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-custom-purple to-custom-blue rounded-3xl opacity-20 blur-2xl" />
            <SpotlightCard className="relative rounded-3xl bg-black/40 border-white/10 p-8 backdrop-blur-xl">
              <div className="space-y-8">
                <FeatureRow
                  icon={<Play className="w-5 h-5 text-white" />}
                  title="Premium Quality"
                  desc="Cinema-grade color grading and sound design."
                />
                <FeatureRow
                  icon={<Users className="w-5 h-5 text-white" />}
                  title="Expert Team"
                  desc="Curated roster of top-tier editors."
                />
                <FeatureRow
                  icon={<Clock className="w-5 h-5 text-white" />}
                  title="Fast Delivery"
                  desc="Rapid turnaround without compromising quality."
                />
              </div>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </section>
  );
}

const StatItem = ({ number, suffix, label }: { number: number, suffix: string, label: string }) => (
  <div>
    <div className="text-3xl font-bold text-white mb-1 flex items-baseline">
      <CountingNumber target={number} suffix={suffix} />
    </div>
    <div className="text-sm text-gray-500 uppercase tracking-wider">{label}</div>
  </div>
);

const FeatureRow = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="flex gap-4">
    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>
  </div>
);