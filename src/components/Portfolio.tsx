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
    <section id="portfolio" className="w-screen h-screen flex-shrink-0 flex items-center justify-center relative overflow-hidden bg-[#050511] px-6">

      <motion.div
        className="max-w-7xl mx-auto w-full relative z-10 flex flex-col justify-center h-full"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, margin: "-10%" }}
      >

        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 shrink-0">
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-custom-bright" />
              <span className="text-xs font-medium text-gray-300">Selected Work</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-bold text-white leading-tight">
              Visual{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet">
                Masterpieces.
              </span>
            </h2>
          </motion.div>
          <motion.div variants={itemVariants}>
            <MagneticButton>
              <button className="px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                View All Projects <ArrowRight className="w-4 h-4" />
              </button>
            </MagneticButton>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
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
  <motion.div variants={itemVariants} className="h-full">
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
  </motion.div>
);