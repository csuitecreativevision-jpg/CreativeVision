import { motion } from 'framer-motion';
import { Play, ArrowRight } from 'lucide-react';
import { SpotlightCard } from './ui/SpotlightCard';
import { MagneticButton } from './ui/MagneticButton';

interface PortfolioProps {
  onGetStarted: () => void;
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

export default function Portfolio(_props: PortfolioProps) {
  return (
    <section id="portfolio" className="w-screen h-screen flex-shrink-0 flex items-center justify-center relative overflow-hidden bg-[#050511] px-[clamp(1rem,3vw,2rem)]">

      <motion.div
        className="max-w-7xl mx-auto w-full relative z-10 flex flex-col justify-center h-full py-[clamp(1rem,4vh,3rem)]"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, margin: "-10%" }}
      >

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-[clamp(1rem,4vh,3rem)] gap-4 shrink-0">
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-2 md:mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-custom-bright" />
              <span className="text-[clamp(0.6rem,1vw,0.75rem)] md:text-xs font-medium text-gray-300">Selected Work</span>
            </div>
            <h2 className="text-[clamp(2.5rem,6vw,6rem)] font-bold text-white leading-tight">
              Visual{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet">
                Masterpieces.
              </span>
            </h2>
          </motion.div>
          <motion.div variants={itemVariants} className="hidden md:block">
            <MagneticButton>
              <button className="px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors flex items-center gap-2 text-[clamp(0.8rem,1vw,1rem)]">
                View All Projects <ArrowRight className="w-4 h-4" />
              </button>
            </MagneticButton>
          </motion.div>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-3 gap-[clamp(0.75rem,2vw,1.5rem)] w-full flex-1 min-h-0 md:flex-none md:h-auto">
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
      </motion.div>
    </section>
  );
}

const ProjectCard = ({ category, title, image }: { category: string, title: string, image: string }) => (
  <motion.div variants={itemVariants} className="flex-1 min-h-0 w-full md:flex-none md:aspect-[3/4]">
    <SpotlightCard className="group h-full w-full rounded-xl md:rounded-2xl bg-gray-900 border-none relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute bottom-0 left-0 p-[clamp(1rem,3vw,2rem)] w-full z-20">
        <span className="text-custom-bright text-[clamp(0.6rem,0.8vw,0.75rem)] md:text-xs font-bold tracking-widest uppercase mb-1 md:mb-2 block">{category}</span>
        <div className="flex justify-between items-end">
          <h3 className="text-[clamp(1.1rem,1.8vw,1.5rem)] md:text-2xl font-bold text-white">{title}</h3>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transform translate-y-0 md:translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <Play className="w-[clamp(0.8rem,1vw,1rem)] h-[clamp(0.8rem,1vw,1rem)] text-white fill-white" />
          </div>
        </div>
      </div>
    </SpotlightCard>
  </motion.div>
);