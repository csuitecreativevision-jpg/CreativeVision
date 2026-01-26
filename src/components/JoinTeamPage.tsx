import { useState, useEffect, FormEvent } from 'react';
import { ArrowRight, User, Briefcase, Link, Video, Play, Scissors, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import MainNavigation from './MainNavigation';
import Footer from './Footer';
import { SpotlightCard } from './ui/SpotlightCard';
import { MagneticButton } from './ui/MagneticButton';
import { sendApplicationEmail, initEmailJS } from '../services/emailService';

interface SpecializationPageProps {
  onBack: () => void;
  onThankYou: () => void;
}

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


  useEffect(() => {
    initEmailJS();
  }, []);

  const specializations = [
    {
      id: 'short-form',
      title: 'Short-form Video Editor',
      description: 'Create engaging short-form content for social media platforms like TikTok, Instagram Reels, and YouTube Shorts.',
      icon: <Play className="w-8 h-8" />,
      color: '#7424f5',
      gradient: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'
    },
    {
      id: 'clipper',
      title: 'Clipper',
      description: 'Extract and edit the best moments from long-form content to create compelling highlight reels and clips.',
      icon: <Scissors className="w-8 h-8" />,
      color: '#581cd9',
      gradient: 'linear-gradient(135deg, #581cd9 0%, #3a14b7 100%)'
    },
    {
      id: 'animator',
      title: 'Animator',
      description: 'Bring stories to life through creative animation, character design, and dynamic visual storytelling.',
      icon: <Sparkles className="w-8 h-8" />,
      color: '#3a14b7',
      gradient: 'linear-gradient(135deg, #3a14b7 0%, #01077c 100%)'
    },
    {
      id: 'motion-graphics',
      title: 'Motion Graphics Editor',
      description: 'Design and animate graphics, titles, and visual effects that enhance the storytelling experience.',
      icon: <Zap className="w-8 h-8" />,
      color: '#01077c',
      gradient: 'linear-gradient(135deg, #01077c 0%, #00034d 100%)'
    },
    {
      id: 'long-form',
      title: 'Long-form Video Editor',
      description: 'Craft comprehensive narratives for documentaries, tutorials, and extended content that captivates audiences.',
      icon: <Video className="w-8 h-8" />,
      color: '#00034d',
      gradient: 'linear-gradient(135deg, #00034d 0%, #7424f5 100%)'
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSpecialization) return;

    setIsSubmitting(true);

    try {
      const result = await sendApplicationEmail({
        ...formData,
        specialization: specializations.find(s => s.id === selectedSpecialization)?.title || selectedSpecialization
      });

      if (result.success) {
        // Scroll to top before navigating to thank you page
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Small delay to ensure scroll completes before navigation
        setTimeout(() => {
          onThankYou();
        }, 300);
      } else {
        console.error('Failed to send application:', result.error);
        alert('Failed to send application. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return Object.values(formData).every(value => value.trim() !== '') && selectedSpecialization;
  };

  return (
    <div className="min-h-screen text-white relative">

      <MainNavigation
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onGetStarted={() => { }}
        isJoinTeamPage={true}
        onBack={onBack}
      />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-custom-bright animate-pulse" />
            <span className="text-xs font-medium text-gray-300 tracking-wider uppercase">We are hiring</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-glow leading-[1.1]">
            What Do You <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-purple via-custom-bright to-white">
              Specialize In?
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Join a distributed team of elite creatives. Choose your path below.
          </p>
        </div>
      </section>

      {/* Specialization Cards */}
      {!selectedSpecialization && (
        <section className="py-12 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {specializations.map((spec) => (
                <div
                  key={spec.id}
                  onClick={() => setSelectedSpecialization(spec.id)}
                  className="h-full"
                >
                  <SpotlightCard
                    className="rounded-3xl p-8 cursor-pointer border-white/10 bg-white/5 hover:bg-white/10 transition-colors group h-full flex flex-col"
                    spotlightColor={spec.color}
                  >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110" style={{ background: spec.gradient + '40' }}>
                      <div className="text-white">{spec.icon}</div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3" style={{ color: spec.color }}>{spec.title}</h3>
                    <p className="text-gray-400 leading-relaxed flex-grow">
                      {spec.description}
                    </p>

                    <div className="mt-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                      <span>Select Role</span> <ArrowRight className="w-4 h-4" />
                    </div>
                  </SpotlightCard>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Application Form */}
      {selectedSpecialization && (
        <section className="py-12 px-6 relative z-10">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 mb-8"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: specializations.find(s => s.id === selectedSpecialization)?.gradient }}>
                  {specializations.find(s => s.id === selectedSpecialization)?.icon}
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-white">
                    {specializations.find(s => s.id === selectedSpecialization)?.title}
                  </h2>
                  <p className="text-sm text-gray-400">Application Form</p>
                </div>
              </motion.div>

              <div>
                <button
                  onClick={() => setSelectedSpecialization(null)}
                  className="text-gray-400 hover:text-white transition-colors text-sm underline underline-offset-4"
                >
                  ← Choose a different specialization
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <SpotlightCard className="p-8 rounded-3xl bg-white/5 border-white/10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <User className="w-5 h-5 text-custom-bright" /> Basic Info
                </h3>
                <div className="space-y-6">
                  <InputGroup
                    label="Full Name"
                    value={formData.fullName}
                    onChange={v => handleInputChange('fullName', v)}
                    placeholder="John Doe"
                  />
                  <InputGroup
                    label="Email Address"
                    value={formData.email}
                    onChange={v => handleInputChange('email', v)}
                    placeholder="john@example.com"
                    type="email"
                  />
                </div>
              </SpotlightCard>

              <SpotlightCard className="p-8 rounded-3xl bg-white/5 border-white/10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-custom-bright" /> Experience
                </h3>
                <div className="space-y-6">
                  <TextAreaGroup
                    label="Relevant Experience"
                    value={formData.hasExperience}
                    onChange={v => handleInputChange('hasExperience', v)}
                    placeholder="Tell us about your previous roles..."
                  />
                  <TextAreaGroup
                    label="Best Work (Link)"
                    value={formData.successfulVideo}
                    onChange={v => handleInputChange('successfulVideo', v)}
                    placeholder="https://..."
                  />
                </div>
              </SpotlightCard>

              <SpotlightCard className="p-8 rounded-3xl bg-white/5 border-white/10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <Link className="w-5 h-5 text-custom-bright" /> Portfolio
                </h3>
                <div className="space-y-6">
                  <InputGroup
                    label="Portfolio URL"
                    value={formData.portfolioLink}
                    onChange={v => handleInputChange('portfolioLink', v)}
                    placeholder="https://your-portfolio.com"
                  />
                  <TextAreaGroup
                    label="Why CreativeVision?"
                    value={formData.whyJoin}
                    onChange={v => handleInputChange('whyJoin', v)}
                    placeholder="What excites you about joining us?"
                  />
                </div>
              </SpotlightCard>

              <div className="text-center pt-8">
                <MagneticButton strength={0.2} className="inline-block">
                  <button
                    type="submit"
                    disabled={!isFormValid() || isSubmitting}
                    className={`px-10 py-4 rounded-full font-bold text-lg transition-all ${isFormValid() && !isSubmitting
                      ? 'bg-custom-bright text-white hover:bg-custom-purple shadow-lg shadow-custom-purple/25'
                      : 'bg-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    {isSubmitting ? 'Sending...' : 'Submit Application'}
                  </button>
                </MagneticButton>
              </div>

            </form>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

interface InputGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}

const InputGroup = ({ label, value, onChange, placeholder, type = "text" }: InputGroupProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-custom-bright/50 focus:bg-black/40 transition-all"
      placeholder={placeholder}
      required
    />
  </div>
);

interface TextAreaGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const TextAreaGroup = ({ label, value, onChange, placeholder }: TextAreaGroupProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-custom-bright/50 focus:bg-black/40 transition-all min-h-[120px]"
      placeholder={placeholder}
      required
    />
  </div>
);