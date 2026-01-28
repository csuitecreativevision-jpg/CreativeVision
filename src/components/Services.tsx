import { motion } from 'framer-motion';
import { Briefcase, Users, ArrowRight, Star, Zap } from 'lucide-react';
import { SpotlightCard } from './ui/SpotlightCard';
import { MagneticButton } from './ui/MagneticButton';

interface ServicesProps {
  onGetStarted: () => void;
  onJoinTeam: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.215, 0.610, 0.355, 1.000] as const }
  }
};

export default function Services({ onGetStarted, onJoinTeam }: ServicesProps) {
  return (
    <section id="services" className="w-screen h-screen flex-shrink-0 flex items-center justify-center relative overflow-hidden bg-[#050511] px-[clamp(1rem,3vw,2rem)]">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-custom-purple/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-custom-blue/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        className="max-w-7xl mx-auto relative z-10 w-full h-full flex flex-col justify-center py-[clamp(1rem,4vh,3rem)]"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, margin: "-10%" }}
      >
        {/* Header - Fluid & Compact */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-[clamp(1rem,4vh,3rem)] gap-4 flex-shrink-0">
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-2 md:mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-custom-bright" />
              <span className="text-[clamp(0.6rem,1vw,0.75rem)] md:text-xs font-medium text-gray-300">Choose Your Path</span>
            </div>
            <h2 className="text-[clamp(2.5rem,6vw,6rem)] font-bold text-white leading-tight">
              Cinematic{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet">
                Precision.
              </span>
            </h2>
          </motion.div>
          <motion.p variants={itemVariants} className="max-w-md text-[clamp(0.8rem,1.1vw,1rem)] text-gray-400 leading-relaxed hidden md:block">
            We don't just edit videos. We engineer attention. Choose your path to excellence below.
          </motion.p>
        </div>

        {/* Cards Grid - Elastic Fitting */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-[clamp(0.75rem,2vw,1.5rem)] flex-1 min-h-0 w-full">

          {/* Hire Us Card */}
          <motion.div variants={itemVariants} className="flex-1 min-h-0 w-full">
            <SpotlightCard className="h-full rounded-3xl bg-white/5 p-[clamp(1.2rem,3vw,2.5rem)] border-white/10 relative overflow-hidden group flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500 hidden md:block">
                <Briefcase className="w-[clamp(4rem,10vw,10rem)] h-[clamp(4rem,10vw,10rem)] text-custom-bright -mr-8 -mt-8 transform rotate-12" />
              </div>

              <div className="relative z-10">
                <div className="w-[clamp(2.5rem,4vw,3rem)] h-[clamp(2.5rem,4vw,3rem)] rounded-xl bg-custom-bright/20 flex items-center justify-center mb-[clamp(1rem,3vh,1.5rem)] border border-white/10 shrink-0">
                  <Zap className="w-[clamp(1rem,2vw,1.5rem)] h-[clamp(1rem,2vw,1.5rem)] text-custom-bright" />
                </div>
                <h3 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-white mb-2 shrink-0">Hire CreativeVision</h3>
                <p className="text-gray-400 text-[clamp(0.8rem,1vw,1rem)] mb-[clamp(1rem,3vh,2rem)] max-w-sm line-clamp-3 md:line-clamp-none">
                  Transform your raw footage into high-converting assets with professional turnaround.
                </p>

                <div className="grid grid-cols-2 gap-2 md:gap-3 mb-[clamp(1rem,3vh,2rem)] text-[clamp(0.7rem,1vw,0.9rem)]">
                  <FeatureItem text="4K Post-Production" />
                  <FeatureItem text="Sound Design" />
                  <FeatureItem text="Color Grading" />
                  <FeatureItem text="VFX & Motion" />
                </div>

                <MagneticButton className="w-full mt-auto shrink-0">
                  <button
                    onClick={onGetStarted}
                    className="w-full py-[clamp(0.75rem,2vh,1rem)] bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-[clamp(0.8rem,1vw,1rem)]"
                  >
                    Start Project <ArrowRight className="w-4 h-4" />
                  </button>
                </MagneticButton>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Join Team Card */}
          <motion.div variants={itemVariants} className="flex-1 min-h-0 w-full">
            <SpotlightCard className="h-full rounded-3xl bg-custom-purple/10 p-[clamp(1.2rem,3vw,2.5rem)] border-white/10 relative overflow-hidden group flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500 hidden md:block">
                <Users className="w-[clamp(4rem,10vw,10rem)] h-[clamp(4rem,10vw,10rem)] text-white -mr-8 -mt-8 transform -rotate-12" />
              </div>

              <div className="relative z-10">
                <div className="w-[clamp(2.5rem,4vw,3rem)] h-[clamp(2.5rem,4vw,3rem)] rounded-xl bg-white/10 flex items-center justify-center mb-[clamp(1rem,3vh,1.5rem)] border border-white/10 shrink-0">
                  <Star className="w-[clamp(1rem,2vw,1.5rem)] h-[clamp(1rem,2vw,1.5rem)] text-white" />
                </div>
                <h3 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-white mb-2 shrink-0">Join The Roster</h3>
                <p className="text-gray-300 text-[clamp(0.8rem,1vw,1rem)] mb-[clamp(1rem,3vh,2rem)] max-w-sm line-clamp-3 md:line-clamp-none">
                  Are you a world-class editor? Join our distributed team of creatives.
                </p>

                <div className="grid grid-cols-2 gap-2 md:gap-3 mb-[clamp(1rem,3vh,2rem)] text-gray-300 text-[clamp(0.7rem,1vw,0.9rem)]">
                  <FeatureItem text="Remote First" />
                  <FeatureItem text="Global Clients" />
                  <FeatureItem text="Fair Pay" />
                  <FeatureItem text="Creative Freedom" />
                </div>

                <MagneticButton className="w-full mt-auto shrink-0">
                  <button
                    onClick={onJoinTeam}
                    className="w-full py-[clamp(0.75rem,2vh,1rem)] bg-transparent border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-[clamp(0.8rem,1vw,1rem)]"
                  >
                    Apply Now <ArrowRight className="w-4 h-4" />
                  </button>
                </MagneticButton>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

const FeatureItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2">
    <div className="w-1.5 h-1.5 rounded-full bg-custom-bright flex-shrink-0" />
    <span className="text-sm font-medium">{text}</span>
  </div>
);