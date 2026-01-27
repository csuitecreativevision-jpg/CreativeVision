import { Briefcase, Users, ArrowRight, Star, Zap } from 'lucide-react';
import { SpotlightCard } from './ui/SpotlightCard';
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

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-custom-bright" />
              <span className="text-xs font-medium text-gray-300">Choose Your Path</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-bold text-white leading-tight">
              Cinematic{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet">
                Precision.
              </span>
            </h2>
          </div>
          <p className="max-w-md text-gray-400 text-base leading-relaxed hidden md:block">
            We don't just edit videos. We engineer attention. Choose your path to excellence below.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Hire Us Card */}
          <SpotlightCard className="rounded-3xl bg-white/5 p-8 md:p-10 border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <Briefcase className="w-40 h-40 text-custom-bright -mr-8 -mt-8 transform rotate-12" />
            </div>

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-custom-bright/20 flex items-center justify-center mb-6 border border-white/10">
                <Zap className="w-6 h-6 text-custom-bright" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Hire CreativeVision</h3>
              <p className="text-gray-400 text-base mb-8 max-w-sm">
                Transform your raw footage into high-converting assets with professional turnaround.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                <FeatureItem text="4K Post-Production" />
                <FeatureItem text="Sound Design" />
                <FeatureItem text="Color Grading" />
                <FeatureItem text="VFX & Motion" />
              </div>

              <MagneticButton className="w-full">
                <button
                  onClick={onGetStarted}
                  className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  Start Project <ArrowRight className="w-4 h-4" />
                </button>
              </MagneticButton>
            </div>
          </SpotlightCard>

          {/* Join Team Card */}
          <SpotlightCard className="rounded-3xl bg-custom-purple/10 p-8 md:p-10 border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <Users className="w-40 h-40 text-white -mr-8 -mt-8 transform -rotate-12" />
            </div>

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 border border-white/10">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Join The Roster</h3>
              <p className="text-gray-300 text-base mb-8 max-w-sm">
                Are you a world-class editor? Join our distributed team of creatives.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8 text-gray-300">
                <FeatureItem text="Remote First" />
                <FeatureItem text="Global Clients" />
                <FeatureItem text="Fair Pay" />
                <FeatureItem text="Creative Freedom" />
              </div>

              <MagneticButton className="w-full">
                <button
                  onClick={onJoinTeam}
                  className="w-full py-4 bg-transparent border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  Apply Now <ArrowRight className="w-4 h-4" />
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
    <div className="w-1.5 h-1.5 rounded-full bg-custom-bright flex-shrink-0" />
    <span className="text-sm font-medium">{text}</span>
  </div>
);