import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Scissors, Sparkles, Zap, Video, ArrowRight, User, Briefcase, Send, Wrench, TrendingUp, Loader2 } from 'lucide-react';
import MainNavigation from './MainNavigation';
import { SpotlightCard } from './ui/SpotlightCard';
import { MagneticButton } from './ui/MagneticButton';
import Footer from './Footer';
import { submitApplicationToMonday } from '../services/mondayService';

interface SpecializationPageProps {
  onBack: () => void;
  onThankYou: () => void;
}

const specializations = [
  {
    id: 'short-form',
    title: 'Short-form Video Editor',
    description: 'Create engaging short-form content for social media platforms like TikTok, Instagram Reels, and YouTube Shorts.',
    icon: Play,
  },
  {
    id: 'clipper',
    title: 'Clipper',
    description: 'Extract and edit the best moments from long-form content to create compelling highlight reels and clips.',
    icon: Scissors,
  },
  {
    id: 'animator',
    title: 'Animator',
    description: 'Bring stories to life through creative animation, character design, and dynamic visual storytelling.',
    icon: Sparkles,
  },
  {
    id: 'motion-graphics',
    title: 'Motion Graphics Editor',
    description: 'Design and animate graphics, titles, and visual effects that enhance the storytelling experience.',
    icon: Zap,
  },
  {
    id: 'long-form',
    title: 'Long-form Video Editor',
    description: 'Craft comprehensive narratives for documentaries, tutorials, and extended content that captivates audiences.',
    icon: Video,
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.215, 0.610, 0.355, 1.000] as const }
  }
};

export default function SpecializationPage({ onBack, onThankYou }: SpecializationPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    hasExperience: '',
    contentType: '',
    successfulVideo: '',
    comfortableVideoTypes: '',
    editingProcess: '',
    engagementTechnique: '',
    successMeasurement: '',
    motionGraphicsExperience: '',
    stayUpdated: '',
    toolsSoftware: '',
    whyJoin: '',
    portfolioLink: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare data
      const applicationData = {
        specialization: selectedSpecialization || 'Unknown',
        ...formData,
        message: `Experience: ${formData.hasExperience}\nContent: ${formData.contentType}\nResult: ${formData.successfulVideo}`
      };

      await submitApplicationToMonday(applicationData);
      console.log('Form submitted to Monday.com');
      onThankYou();
    } catch (error) {
      console.error("Submission error:", error);
      // Proceed to Thank You even if backend fails (graceful degradation)
      onThankYou();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return Object.values(formData).every(value => value.trim() !== '') && selectedSpecialization;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050511] text-white">
      {/* Background Elements - Aligned with Home */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-custom-purple/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-custom-blue/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-custom-purple/5 via-transparent to-transparent opacity-40" />
      </div>

      <MainNavigation
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onGetStarted={() => { }}
        onBack={onBack}
      />

      <div className="pt-32 pb-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">

          {/* Intro Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              What Do You
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet">
                Specialize In?
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Choose your area of expertise and join our team of creative professionals.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {!selectedSpecialization ? (
              <motion.div
                key="grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
              >
                {specializations.map((spec) => (
                  <motion.div key={spec.id} variants={itemVariants} className="h-full">
                    <div
                      onClick={() => setSelectedSpecialization(spec.id)}
                      className="h-full cursor-pointer group"
                    >
                      <SpotlightCard className="h-full rounded-3xl bg-white/5 p-8 border-white/10 group-hover:border-custom-bright/30 transition-colors">
                        <div className="mb-6">
                          <div className="w-16 h-16 rounded-2xl bg-custom-bright/10 flex items-center justify-center mb-6 border border-white/5 group-hover:bg-custom-bright/20 transition-colors">
                            <spec.icon className="w-8 h-8 text-custom-bright" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-3">{spec.title}</h3>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            {spec.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm font-medium text-custom-bright">
                          <span>Apply for this role</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </SpotlightCard>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto"
              >
                {/* Header with Back Button */}
                <div className="flex flex-col items-center mb-12">
                  <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
                    <div className="w-10 h-10 rounded-xl bg-custom-bright/20 flex items-center justify-center">
                      {React.createElement(specializations.find(s => s.id === selectedSpecialization)?.icon || Play, { className: "w-5 h-5 text-custom-bright" })}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {specializations.find(s => s.id === selectedSpecialization)?.title}
                      </h2>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Application Form</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedSpecialization(null)}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" /> Choose a different specialization
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <User className="w-5 h-5 text-custom-bright" />
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      <Input
                        label="Full Name"
                        value={formData.fullName}
                        onChange={(v: any) => handleInputChange('fullName', v)}
                        placeholder="Enter your full name"
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={(v: any) => handleInputChange('email', v)}
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-custom-bright" />
                      Experience
                    </h3>
                    <div className="space-y-4">
                      <TextArea
                        label="Experience Description"
                        value={formData.hasExperience}
                        onChange={(v: any) => handleInputChange('hasExperience', v)}
                        placeholder="Have you worked as a video editor? Describe your experience..."
                      />
                      <TextArea
                        label="Content Types"
                        value={formData.contentType}
                        onChange={(v: any) => handleInputChange('contentType', v)}
                        placeholder="What types of content have you edited?"
                      />
                      <TextArea
                        label="Key Project"
                        value={formData.successfulVideo}
                        onChange={(v: any) => handleInputChange('successfulVideo', v)}
                        placeholder="Link to your most impactful video and tell us about it..."
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <Video className="w-5 h-5 text-custom-bright" />
                      Skills & Process
                    </h3>
                    <div className="space-y-4">
                      <TextArea
                        label="Comfort Zone"
                        value={formData.comfortableVideoTypes}
                        onChange={(v: any) => handleInputChange('comfortableVideoTypes', v)}
                        placeholder="What formats are you most comfortable with?"
                      />
                      <TextArea
                        label="Editing Process"
                        value={formData.editingProcess}
                        onChange={(v: any) => handleInputChange('editingProcess', v)}
                        placeholder="Walk us through your workflow..."
                      />
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-custom-bright" />
                      Performance
                    </h3>
                    <div className="space-y-4">
                      <TextArea
                        label="Success Measurement"
                        value={formData.successMeasurement}
                        onChange={(v: any) => handleInputChange('successMeasurement', v)}
                        placeholder="How do you measure success?"
                      />
                      <TextArea
                        label="Motion Graphics"
                        value={formData.motionGraphicsExperience}
                        onChange={(v: any) => handleInputChange('motionGraphicsExperience', v)}
                        placeholder="Describe your VFX/Motion Graphics experience..."
                      />
                    </div>
                  </div>

                  {/* Tools */}
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <Wrench className="w-5 h-5 text-custom-bright" />
                      Tools & Portfolio
                    </h3>
                    <div className="space-y-4">
                      <Input
                        label="Software"
                        value={formData.toolsSoftware}
                        onChange={(v: any) => handleInputChange('toolsSoftware', v)}
                        placeholder="Premiere, After Effects, Resolve..."
                      />
                      <TextArea
                        label="Motivation"
                        value={formData.whyJoin}
                        onChange={(v: any) => handleInputChange('whyJoin', v)}
                        placeholder="Why CreativeVision?"
                      />
                      <Input
                        label="Portfolio Link"
                        value={formData.portfolioLink}
                        onChange={(v: any) => handleInputChange('portfolioLink', v)}
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex justify-center pt-8">
                    <MagneticButton>
                      <button
                        type="submit"
                        disabled={!isFormValid() || isSubmitting}
                        className={`px-12 py-4 rounded-full font-bold flex items-center gap-2 transition-all duration-300 ${isFormValid() && !isSubmitting
                            ? 'bg-custom-bright text-black hover:bg-white'
                            : 'bg-white/10 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                          </>
                        ) : (
                          <>
                            Submit Application <Send className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </MagneticButton>
                  </div>

                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      <Footer />
    </div>
  );
}

const Input = ({ label, value, onChange, placeholder, type = "text" }: any) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-custom-bright/50 focus:bg-white/10 transition-colors"
      placeholder={placeholder}
      required
    />
  </div>
);

const TextArea = ({ label, value, onChange, placeholder }: any) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-custom-bright/50 focus:bg-white/10 transition-colors h-32 resize-none"
      placeholder={placeholder}
      required
    />
  </div>
);