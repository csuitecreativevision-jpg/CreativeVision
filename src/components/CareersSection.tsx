import { useState, useEffect, FormEvent } from 'react';
import { ArrowRight, Video, Play, Scissors, Sparkles, Zap, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard } from './ui/SpotlightCard';
import { MagneticButton } from './ui/MagneticButton';
import { ScrollReveal } from './ui/ScrollReveal';
import { sendApplicationEmail, initEmailJS } from '../services/emailService';

interface CareersSectionProps {
    id?: string;
    className?: string;
}

export default function CareersSection({ id, className }: CareersSectionProps) {
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
                alert('Application sent successfully! We will get back to you soon.');
                setSelectedSpecialization(null);
                setFormData(prev => ({ ...prev, fullName: '', email: '' })); // Reset key fields
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

    const [clickCount, setClickCount] = useState(0);
    const [lastClickTime, setLastClickTime] = useState(0);

    const handleSecretClick = () => {
        const now = Date.now();
        if (now - lastClickTime > 2000) {
            setClickCount(1);
        } else {
            const newCount = clickCount + 1;
            setClickCount(newCount);
            if (newCount >= 5) {
                // Secret unlocked
                window.location.href = '/portal';
            }
        }
        setLastClickTime(now);
    };

    return (
        <section id={id} className={`w-screen h-screen flex-shrink-0 flex items-center justify-center relative overflow-hidden px-6 ${className}`}>
            <div className="max-w-7xl mx-auto flex flex-col w-full">
                <ScrollReveal animation="fade-up">
                    <div className="text-center mb-16">
                        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 animate-fade-in">
                            <div className="w-2 h-2 rounded-full bg-custom-bright animate-pulse" />
                            <span className="text-xs font-medium text-gray-300 tracking-wider uppercase">We are hiring</span>
                        </div>

                        <h2 className="text-4xl md:text-6xl font-bold mb-6 text-glow leading-[1.1]">
                            What Do You <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet">
                                Specialize In?
                            </span>
                        </h2>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                            Join a distributed team of elite creatives. Choose your path below.
                        </p>
                    </div>
                </ScrollReveal>

                <AnimatePresence mode="wait">
                    {!selectedSpecialization ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-auto"
                        >
                            {specializations.map((spec, index) => (
                                <ScrollReveal key={spec.id} animation="blur-reveal" delay={index * 0.1}>
                                    <div
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
                                </ScrollReveal>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-3xl mx-auto mb-auto"
                        >
                            <div className="mb-8">
                                <button
                                    onClick={() => setSelectedSpecialization(null)}
                                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to roles
                                </button>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-sm">
                                <div className="mb-8 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: specializations.find(s => s.id === selectedSpecialization)?.gradient }}>
                                        {specializations.find(s => s.id === selectedSpecialization)?.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">Apply for {specializations.find(s => s.id === selectedSpecialization)?.title}</h3>
                                        <p className="text-gray-400">Join the team</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
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

                                    <TextAreaGroup
                                        label="Relevant Experience & Links"
                                        value={formData.hasExperience}
                                        onChange={v => handleInputChange('hasExperience', v)}
                                        placeholder="Tell us about your experience and drop your portfolio links here..."
                                    />

                                    <div className="pt-4">
                                        <MagneticButton className="w-full">
                                            <button
                                                type="submit"
                                                disabled={!isFormValid() || isSubmitting}
                                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${isFormValid() && !isSubmitting
                                                    ? 'bg-custom-bright text-white hover:bg-custom-purple'
                                                    : 'bg-white/10 text-gray-500 cursor-not-allowed'
                                                    }`}
                                            >
                                                {isSubmitting ? 'Sending...' : 'Submit Application'}
                                            </button>
                                        </MagneticButton>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Secret Portal Trigger - Center Bottom */}
                <div className="mt-16 flex justify-center pb-8 opacity-20 hover:opacity-50 transition-opacity">
                    <img
                        src="/Untitled design (3).png"
                        alt="CV"
                        className="w-8 h-8 object-contain cursor-pointer"
                        onClick={handleSecretClick}
                    />
                </div>
            </div>
        </section>
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
