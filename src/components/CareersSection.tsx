import { useState, useRef, FormEvent } from 'react';
import { Upload, ChevronDown, Check, User, Briefcase, Zap, Video, Clock, DollarSign, ArrowRight, ArrowLeft, Play, Scissors, Sparkles, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard } from './ui/SpotlightCard';
import { MagneticButton } from './ui/MagneticButton';
import { ScrollReveal } from './ui/ScrollReveal';
import { submitApplicationToMonday } from '../services/mondayService';

interface CareersSectionProps {
    id?: string;
    className?: string;
}

export default function CareersSection({ id, className }: CareersSectionProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Form State (Matching 13 specific questions)
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        specialization: '', // Step 0
        portfolioLink: '',

        // Experience
        hasWorkedBefore: '',
        experienceDescription: '',
        toolsUsed: '',
        motionGraphicsExp: '',

        // Workflow
        workflowDescription: '',
        successMetric: '',

        // Brand Fit
        whyJoin: '',

        // Availability
        employmentStatus: '',
        isStudent: '',
        expectedRate: '',

        resumeFile: null as File | null
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const steps = [
        { title: "Your Path", icon: <User className="w-5 h-5" /> }, // Step 0
        { title: "Basic Info", icon: <User className="w-5 h-5" /> }, // Step 1
        { title: "Experience", icon: <Briefcase className="w-5 h-5" /> }, // Step 2
        { title: "Workflow", icon: <Zap className="w-5 h-5" /> }, // Step 3
        { title: "Brand Fit", icon: <Video className="w-5 h-5" /> }, // Step 4
        { title: "Availability", icon: <Clock className="w-5 h-5" /> }, // Step 5
    ];

    // Comprehensive Specialization Data
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
            description: 'Extract and edit the best moments from long-form content for highlight reels.',
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
            description: 'Craft comprehensive narratives for documentaries, tutorials, and extended content.',
            icon: <Video className="w-8 h-8" />,
            color: '#00034d',
            gradient: 'linear-gradient(135deg, #00034d 0%, #7424f5 100%)'
        }
    ];

    const rateOptions = [
        "₱350 - ₱400",
        "₱500 - ₱700",
        "₱1,000 - ₱1,500+"
    ];

    const handleSpecializationSelect = (id: string) => {
        handleInputChange('specialization', id);
        // Auto-advance
        setDirection(1);
        setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Validation per step
    const isStepValid = (step: number) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        switch (step) {
            case 0: return !!formData.specialization;
            case 1: return formData.fullName && emailRegex.test(formData.email) && formData.portfolioLink;
            case 2: return formData.hasWorkedBefore && formData.experienceDescription && formData.toolsUsed && formData.motionGraphicsExp;
            case 3: return formData.workflowDescription && formData.successMetric;
            case 4: return formData.whyJoin;
            case 5: return formData.employmentStatus && formData.isStudent && formData.expectedRate;
            default: return false;
        }
    };

    const nextStep = () => {
        if (isStepValid(currentStep)) {
            setDirection(1);
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
        } else {
            alert("Please fill in all required fields to proceed.");
        }
    };

    const prevStep = () => {
        setDirection(-1);
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            await submitApplicationToMonday({
                ...formData,
                specialization: specializations.find(s => s.id === formData.specialization)?.title || formData.specialization,
                resumeFile: undefined, // Step removed
            });

            setSubmitStatus('success');
            // Reset Form can be handled by user navigating away or "Apply Another" button
        } catch (error) {
            console.error('Error submitting application:', error);
            setSubmitStatus('error');
            setErrorMessage(error instanceof Error ? error.message : "Undefined error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            fullName: '', email: '', specialization: '', portfolioLink: '', resumeFile: null,
            hasWorkedBefore: '', experienceDescription: '', toolsUsed: '', motionGraphicsExp: '',
            workflowDescription: '', successMetric: '', whyJoin: '',
            employmentStatus: '', isStudent: '', expectedRate: ''
        });
        setCurrentStep(0);
        setSubmitStatus('idle');
    };



    // Animation Variants
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    // Render Success View
    if (submitStatus === 'success') {
        return (
            <section id={id} className={`w-screen min-h-screen flex-shrink-0 relative overflow-hidden px-6 py-20 flex flex-col justify-center items-center ${className}`}>
                <div className="max-w-xl w-full">
                    <SpotlightCard className="p-12 text-center bg-white/5 border-custom-bright/50">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", duration: 0.8 }}
                            className="w-24 h-24 bg-custom-bright rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(124,58,237,0.5)]"
                        >
                            <Check className="w-12 h-12 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold text-white mb-4">Application Submitted!</h2>
                        <p className="text-gray-300 mb-8 text-lg">
                            Thank you for your interest in joining Creative Vision. We have received your details and will review them shortly.
                        </p>
                        <MagneticButton>
                            <button onClick={handleReset} className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors">
                                Submit Another Application
                            </button>
                        </MagneticButton>
                    </SpotlightCard>
                </div>
            </section>
        )
    }

    return (
        <section id={id} className={`w-screen min-h-screen flex-shrink-0 relative overflow-hidden px-6 py-20 flex flex-col justify-center ${className}`}>
            <div className="max-w-5xl mx-auto w-full relative z-10">
                <ScrollReveal animation="fade-up">
                    <div className="text-center mb-8">
                        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 animate-fade-in">
                            <div className="w-2 h-2 rounded-full bg-custom-bright animate-pulse" />
                            <span className="text-xs font-medium text-gray-300 tracking-wider uppercase">Application Form</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-glow">
                            Step {currentStep + 1} of {steps.length}: <span className="text-custom-bright">{steps[currentStep].title}</span>
                        </h2>

                        {/* Progress Bar */}
                        <div className="w-full max-w-md mx-auto h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
                            <motion.div
                                className="h-full bg-custom-bright"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>
                </ScrollReveal>

                <div className="relative min-h-[600px]">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={currentStep}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className="w-full"
                        >
                            <div
                                className="relative rounded-3xl max-h-[70vh] overflow-y-auto custom-scrollbar bg-white/5 border border-white/10 backdrop-blur-md"
                            >
                                <SpotlightCard className="p-8 md:p-12 min-h-full bg-transparent border-none">
                                    {submitStatus === 'error' ? (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
                                                <XCircle className="w-8 h-8 text-red-500" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">Submission Failed</h3>
                                            <p className="text-red-300 mb-6">{errorMessage || "An unexpected error occurred."}</p>
                                            <button onClick={() => setSubmitStatus('idle')} className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                                                Try Again
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">

                                            {/* Step 0: Specialization Cards */}
                                            {currentStep === 0 && (
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {specializations.map((spec) => (
                                                        <div
                                                            key={spec.id}
                                                            onClick={() => handleSpecializationSelect(spec.id)}
                                                            className={`cursor-pointer rounded-2xl p-6 border transition-all group relative overflow-hidden ${formData.specialization === spec.id ? 'bg-white/10 border-custom-bright ring-2 ring-custom-bright/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                                        >
                                                            {/* Background Gradient Hint */}
                                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: spec.gradient }} />

                                                            <div className="relative z-10 flex items-start gap-4">
                                                                <div className="p-3 rounded-xl bg-black/30 text-white" style={{ color: spec.color }}>
                                                                    {spec.icon}
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-custom-bright transition-colors">{spec.title}</h3>
                                                                    <p className="text-sm text-gray-400 leading-snug">{spec.description}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Step 1: Basic Information */}
                                            {currentStep === 1 && (
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-400 mb-2">Confirm Position</label>
                                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                                            <span className="text-white font-medium">
                                                                {specializations.find(s => s.id === formData.specialization)?.title || "Select a Position"}
                                                            </span>
                                                            <button onClick={() => setCurrentStep(0)} className="text-xs text-custom-bright hover:underline uppercase tracking-wider font-bold">Change</button>
                                                        </div>
                                                    </div>
                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        <InputGroup label="1. Full Name*" subLabel="(Max 255 characters)" value={formData.fullName} onChange={v => handleInputChange('fullName', v)} placeholder="John Doe" />
                                                        <InputGroup label="2. Email Address*" value={formData.email} onChange={v => handleInputChange('email', v)} placeholder="john@example.com" type="email" />
                                                    </div>
                                                    <InputGroup label="3. Portfolio / Showreel / Resume Link*" subLabel="(Drive, YouTube, Vimeo, Behance, or website)" value={formData.portfolioLink} onChange={v => handleInputChange('portfolioLink', v)} placeholder="https://..." />
                                                </div>
                                            )}

                                            {/* Step 2: Experience & Skills */}
                                            {currentStep === 2 && (
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <label className="block text-sm font-medium text-gray-400">4. Have you worked as a video editor for a brand, business, or client before?*</label>
                                                        <div className="flex gap-4">
                                                            <RadioOption label="Yes" value="Yes" checked={formData.hasWorkedBefore === 'Yes'} onChange={() => handleInputChange('hasWorkedBefore', 'Yes')} />
                                                            <RadioOption label="No" value="No" checked={formData.hasWorkedBefore === 'No'} onChange={() => handleInputChange('hasWorkedBefore', 'No')} />
                                                        </div>
                                                    </div>
                                                    <TextAreaGroup label="5. Briefly describe your video editing experience*" subLabel="(Types of videos, platforms, years of experience, notable clients or projects)" value={formData.experienceDescription} onChange={v => handleInputChange('experienceDescription', v)} placeholder="Enter details..." maxLength={1500} />
                                                    <TextAreaGroup label="6. What video editing software and tools do you primarily use?*" subLabel="(e.g., Premiere Pro, After Effects, DaVinci Resolve, CapCut, Photoshop, plugins, etc.)" value={formData.toolsUsed} onChange={v => handleInputChange('toolsUsed', v)} placeholder="Premiere Pro, After Effects..." />
                                                    <TextAreaGroup label="7. Do you have experience with motion graphics, animation, or VFX?*" subLabel="If yes, briefly describe what you can do. If none, write “No experience.”" value={formData.motionGraphicsExp} onChange={v => handleInputChange('motionGraphicsExp', v)} placeholder="Lower thirds, transitions..." />
                                                </div>
                                            )}

                                            {/* Step 3: Workflow & Quality */}
                                            {currentStep === 3 && (
                                                <div className="space-y-6">
                                                    <TextAreaGroup label="8. Describe your editing workflow from raw footage to final delivery*" subLabel="(Include steps like organizing footage, rough cut, revisions, color, sound, export)" value={formData.workflowDescription} onChange={v => handleInputChange('workflowDescription', v)} placeholder="My process..." />
                                                    <TextAreaGroup label="9. How do you determine if a video edit is successful?*" subLabel="(e.g., client feedback, engagement metrics, retention, storytelling clarity)" value={formData.successMetric} onChange={v => handleInputChange('successMetric', v)} placeholder="Client satisfaction..." />
                                                </div>
                                            )}

                                            {/* Step 4: Brand Fit */}
                                            {currentStep === 4 && (
                                                <div className="space-y-6">
                                                    <TextAreaGroup label="10. Why do you want to work with Creative Vision?*" subLabel="(What attracts you to our brand and how your editing style aligns with our content)" value={formData.whyJoin} onChange={v => handleInputChange('whyJoin', v)} placeholder="I align with the style..." />
                                                </div>
                                            )}

                                            {/* Step 5: Availability & Rates (And Submit) */}
                                            {currentStep === 5 && (
                                                <div className="space-y-8">
                                                    <div className="space-y-3">
                                                        <label className="block text-sm font-medium text-gray-400">11. Current Employment Status*</label>
                                                        <div className="flex flex-wrap gap-4">
                                                            {['Freelance', 'Full-time', 'Part-time', 'Student', 'Other'].map(opt => (
                                                                <RadioOption key={opt} label={opt} value={opt} checked={formData.employmentStatus === opt} onChange={() => handleInputChange('employmentStatus', opt)} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="block text-sm font-medium text-gray-400">12. Are you currently a student?*</label>
                                                        <div className="flex gap-4">
                                                            <RadioOption label="Yes" value="Yes" checked={formData.isStudent === 'Yes'} onChange={() => handleInputChange('isStudent', 'Yes')} />
                                                            <RadioOption label="No" value="No" checked={formData.isStudent === 'No'} onChange={() => handleInputChange('isStudent', 'No')} />
                                                        </div>
                                                    </div>

                                                    {/* Expected Rate Dropdown */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-400 mb-2">13. Expected rate per video*</label>
                                                        <div className="relative">
                                                            <select
                                                                value={formData.expectedRate}
                                                                onChange={e => handleInputChange('expectedRate', e.target.value)}
                                                                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white appearance-none focus:outline-none focus:border-custom-bright/50 focus:bg-black/40 transition-all cursor-pointer"
                                                                required
                                                            >
                                                                <option value="" disabled>Select a range...</option>
                                                                {rateOptions.map(opt => (
                                                                    <option key={opt} value={opt} className="bg-gray-900">{opt}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Navigation Buttons */}
                                            <div className="flex items-center justify-between pt-8">
                                                {currentStep > 0 ? (
                                                    <button
                                                        onClick={prevStep}
                                                        className="px-6 py-3 rounded-xl bg-white/5 opacity-60 hover:opacity-100 hover:bg-white/10 text-white font-medium transition-all flex items-center gap-2"
                                                    >
                                                        <ArrowLeft className="w-4 h-4" /> Back
                                                    </button>
                                                ) : <div />}

                                                {currentStep < steps.length - 1 ? (
                                                    // Only show Next button
                                                    currentStep === 0 ? null : (
                                                        <MagneticButton className="inline-block">
                                                            <button
                                                                onClick={nextStep}
                                                                className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-custom-bright hover:text-white transition-all flex items-center gap-2"
                                                            >
                                                                Next Step <ArrowRight className="w-4 h-4" />
                                                            </button>
                                                        </MagneticButton>
                                                    )
                                                ) : (
                                                    <MagneticButton className="inline-block">
                                                        <button
                                                            onClick={handleSubmit}
                                                            disabled={!isStepValid(5) || isSubmitting}
                                                            className={`px-10 py-4 rounded-full font-bold text-lg transition-all ${isStepValid(5) && !isSubmitting
                                                                ? 'bg-custom-bright text-white hover:bg-custom-purple shadow-lg shadow-custom-purple/25'
                                                                : 'bg-white/10 text-gray-500 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            {isSubmitting ? 'Sending...' : 'Submit Now'}
                                                        </button>
                                                    </MagneticButton>
                                                )}
                                            </div>

                                        </form>
                                    )}
                                </SpotlightCard>
                            </div>
                        </motion.div>
                    </AnimatePresence>                </div>
            </div>
        </section>
    );
}

// Helpers
interface InputGroupProps {
    label: string; subLabel?: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; icon?: React.ReactNode;
}
const InputGroup = ({ label, subLabel, value, onChange, placeholder, type = "text", icon }: InputGroupProps) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label} {subLabel && <span className="block text-xs text-gray-500 mt-0.5 font-normal">{subLabel}</span>}</label>
        <div className="relative">
            <input type={type} value={value} onChange={e => onChange(e.target.value)} className={`w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-custom-bright/50 focus:bg-black/40 transition-all ${icon ? 'pl-10' : ''}`} placeholder={placeholder} required />
            {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</div>}
        </div>
    </div>
);
interface TextAreaGroupProps {
    label: string; subLabel?: string; value: string; onChange: (value: string) => void; placeholder: string; maxLength?: number;
}
const TextAreaGroup = ({ label, subLabel, value, onChange, placeholder, maxLength }: TextAreaGroupProps) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label} {subLabel && <span className="block text-xs text-gray-500 mt-0.5 font-normal">{subLabel}</span>}</label>
        <textarea value={value} onChange={e => onChange(e.target.value)} maxLength={maxLength} className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-custom-bright/50 focus:bg-black/40 transition-all min-h-[120px]" placeholder={placeholder} required />
        {maxLength && <div className="text-right text-xs text-gray-600 mt-1">{value.length} / {maxLength}</div>}
    </div>
);
const RadioOption = ({ label, value, checked, onChange }: { label: string, value: string, checked: boolean, onChange: () => void }) => (
    <label className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-all ${checked ? 'bg-custom-bright border-custom-bright text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
        <input type="radio" className="hidden" checked={checked} onChange={onChange} />
        <span className="text-sm font-medium">{label}</span>
    </label>
);
