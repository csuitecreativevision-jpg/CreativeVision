
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
    <section id="services" className="w-screen h-screen flex-shrink-0 flex items-center justify-center relative overflow-hidden bg-[#050511] px-6">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-custom-purple/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-custom-blue/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 w-full flex flex-col justify-center h-full max-h-screen py-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-8 shrink-0">
          <div>
            <RevealText classNameWrapper="mb-2">
              <span className="text-custom-bright font-medium tracking-widest text-sm uppercase">Our Expertise</span>
            </RevealText>
            <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              <RevealText delay={0.1}>Cinematic</RevealText>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright to-white">
                <RevealText delay={0.2}>Precision.</RevealText>
              </span>
            </h2>
          </div>
          <p className="max-w-md text-gray-400 text-base leading-relaxed hidden md:block">
            We don't just edit videos. We engineer attention. Choose your path to excellence below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[60%] lg:h-[500px]">
          {/* Hire Us - Card */}
          <SpotlightCard className="rounded-3xl bg-white/5 p-8 border-white/10 relative overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute flex top-0 right-0 p-8 opacity-20">
              <Briefcase className="w-48 h-48 text-custom-bright -mr-10 -mt-10 transform rotate-12" />
            </div>

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-custom-bright/20 flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                <Zap className="w-6 h-6 text-custom-bright" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Hire CreativeVision</h3>
              <p className="text-gray-400 text-base max-w-sm">
                Transform your raw footage into high-converting assets. Professional turnaround.
              </p>
            </div>

            <div className="relative z-10 mt-8">
              <div className="grid grid-cols-2 gap-3 mb-6">
                <FeatureItem text="4K Post-Production" />
                <FeatureItem text="Sound Design" />
                <FeatureItem text="Color Grading" />
                <FeatureItem text="VFX & Motion" />
              </div>

              <MagneticButton className="w-full">
                <button
                  onClick={onGetStarted}
                  className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 group"
                >
                  Start Project <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </MagneticButton>
            </div>
          </SpotlightCard>

          {/* Join Team - Card */}
          <SpotlightCard className="rounded-3xl bg-custom-purple/20 p-8 border-white/10 relative overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute flex top-0 right-0 p-8 opacity-20">
              <Users className="w-48 h-48 text-white -mr-10 -mt-10 transform -rotate-12" />
            </div>

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Join The Roster</h3>
              <p className="text-gray-300 text-base max-w-sm">
                Are you a world-class editor? Join our distributed team of creatives.
              </p>
            </div>

            <div className="relative z-10 mt-8">
              <div className="grid grid-cols-2 gap-3 mb-6 text-gray-300">
                <FeatureItem text="Remote First" />
                <FeatureItem text="Global Clients" />
                <FeatureItem text="Fair Pay" />
                <FeatureItem text="Creative Freedom" />
              </div>

              <MagneticButton className="w-full">
                <button
                  onClick={onJoinTeam}
                  className="w-full py-3 bg-transparent border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 group"
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