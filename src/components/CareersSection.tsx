import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Scissors, Sparkles, Zap, Video, Check, XCircle, ChevronDown, ArrowRight } from 'lucide-react';
import { submitApplicationToMonday } from '../services/mondayService';

interface CareersSectionProps {
    id?: string;
    className?: string;
    onBack?: () => void;
}

export default function CareersSection({ id, className, onBack }: CareersSectionProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [subStep, setSubStep] = useState(0);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        specialization: '',
        portfolioLink: '',
        hasWorkedBefore: '',
        experienceDescription: '',
        toolsUsed: '',
        motionGraphicsExp: '',
        workflowDescription: '',
        successMetric: '',
        whyJoin: '',
        employmentStatus: '',
        isStudent: '',
        expectedRate: '',
        resumeFile: null as File | null,
    });

    const steps = [
        { id: 'path', title: 'Path' },
        { id: 'basic', title: 'Basic Info' },
        { id: 'experience', title: 'Experience' },
        { id: 'workflow', title: 'Workflow' },
        { id: 'fit', title: 'Brand Fit' },
        { id: 'availability', title: 'Availability' },
    ];

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
            description: 'Extract and edit the best moments from long-form content for highlight reels.',
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
            description: 'Craft comprehensive narratives for documentaries, tutorials, and extended content.',
            icon: Video,
        },
    ];

    const rateOptions = [
        '₱350 - ₱400',
        '₱500 - ₱700',
        '₱1,000 - ₱1,500+',
    ];

    const handleSpecializationSelect = (id: string) => {
        handleInputChange('specialization', id);
        setCurrentStep(1);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const isStepValid = (step: number) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        switch (step) {
            case 0: return !!formData.specialization;
            case 1: return formData.fullName && emailRegex.test(formData.email) && formData.portfolioLink;
            case 2: return formData.hasWorkedBefore && formData.experienceDescription && formData.toolsUsed && formData.motionGraphicsExp;
            case 3: return formData.workflowDescription && formData.successMetric;
            case 4: return !!formData.whyJoin;
            case 5: return formData.employmentStatus && formData.isStudent && formData.expectedRate;
            default: return false;
        }
    };

    const nextStep = () => {
        if (currentStep === 3) {
            if (subStep === 0) {
                if (formData.workflowDescription) {
                    setSubStep(1);
                }
                return;
            } else if (subStep === 1) {
                if (formData.successMetric) {
                    setSubStep(0);
                    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
                }
                return;
            }
        }

        if (isStepValid(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
        }
    };

    const prevStep = () => {
        if (currentStep === 3 && subStep === 1) {
            setSubStep(0);
            return;
        }
        setCurrentStep(prev => Math.max(prev - 1, 0));
        setSubStep(0);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            await submitApplicationToMonday({
                ...formData,
                specialization: specializations.find(s => s.id === formData.specialization)?.title || formData.specialization,
                resumeFile: undefined,
            });

            setSubmitStatus('success');
        } catch (error) {
            console.error('Error submitting application:', error);
            setSubmitStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Undefined error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            fullName: '', email: '', specialization: '', portfolioLink: '', resumeFile: null,
            hasWorkedBefore: '', experienceDescription: '', toolsUsed: '', motionGraphicsExp: '',
            workflowDescription: '', successMetric: '', whyJoin: '',
            employmentStatus: '', isStudent: '', expectedRate: '',
        });
        setCurrentStep(0);
        setSubmitStatus('idle');
    };

    // --- Success View ---
    if (submitStatus === 'success') {
        return (
            <section id={id} className={`min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden ${className}`}>
                <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-violet-600/20 rounded-full blur-[120px]"
                    />
                </div>

                <div className="relative z-10 w-full max-w-xl bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[2rem] p-12 text-center shadow-2xl">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', duration: 0.8 }}
                        className="w-24 h-24 bg-violet-500/20 border border-violet-500/50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
                    >
                        <Check className="w-12 h-12 text-violet-400" />
                    </motion.div>
                    <h2 className="font-display text-4xl font-bold text-white mb-4 text-glow-premium">Application Submitted!</h2>
                    <p className="text-white/50 mb-10 text-lg font-light leading-relaxed">
                        Thank you for your interest in joining Creative Vision. We have received your details and will review them shortly.
                    </p>
                    <button
                        onClick={handleReset}
                        className="px-8 py-4 rounded-full bg-white text-black font-bold hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]"
                    >
                        Submit Another Application
                    </button>
                </div>
            </section>
        );
    }

    // --- Main Form ---
    return (
        <section
            id={id}
            className={`min-h-screen bg-[#0a0a0c] text-white selection:bg-violet-500/30 flex flex-col overflow-hidden font-sans relative ${className}`}
        >
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-violet-600/20 rounded-full blur-[120px]"
                    />
                </div>
            </div>

            {/* Navigation */}
            <motion.nav
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute top-0 left-0 z-50 w-full px-6 pt-6 md:px-10 md:pt-8 flex justify-start items-center pointer-events-none"
            >
                <button
                    onClick={onBack}
                    className="group flex items-center gap-3 text-xs font-bold tracking-[0.2em] uppercase text-white/50 hover:text-white transition-colors bg-[#1a1a1a]/50 border border-white/10 px-4 py-2.5 md:px-6 md:py-3 rounded-full backdrop-blur-md pointer-events-auto"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Return
                </button>
            </motion.nav>

            {/* Main Content */}
            <main className="flex-1 flex flex-col z-10 px-4 md:px-10 pb-6 max-w-4xl mx-auto w-full pt-20 md:pt-16">

                {/* Header */}
                <div className="flex flex-col items-center text-center mb-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-center w-full"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 mb-3 backdrop-blur-md">
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                            <span className="text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase">Application Form</span>
                        </div>

                        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight leading-[1.1] mb-5 text-glow-premium">
                            <span className="text-white/90">Join the </span>
                            <span className="italic text-violet-400 text-glow-violet">Roster.</span>
                        </h1>

                        {/* Premium Stepper */}
                        <div className="w-full max-w-2xl mx-auto flex items-center justify-between relative">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-white/10 z-0" />
                            <motion.div
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] bg-violet-500 z-0"
                                initial={{ width: '0%' }}
                                animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                                transition={{ duration: 0.5, ease: 'easeInOut' }}
                            />

                            {steps.map((step, index) => {
                                const isActive = index === currentStep;
                                const isCompleted = index < currentStep;

                                return (
                                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${isActive
                                                ? 'bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] scale-110'
                                                : isCompleted
                                                    ? 'bg-white text-black'
                                                    : 'bg-[#0a0a0c] border border-white/20 text-white/40'
                                            }`}>
                                            {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                                        </div>
                                        <span className={`absolute -bottom-5 text-[8px] md:text-[9px] font-medium tracking-wider uppercase whitespace-nowrap transition-colors duration-500 hidden md:block ${isActive ? 'text-violet-400' : isCompleted ? 'text-white/70' : 'text-white/30'
                                            }`}>
                                            {step.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>

                {/* Form Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full bg-white/[0.01] backdrop-blur-2xl border border-white/[0.05] rounded-[2rem] p-5 md:p-6 lg:p-8 shadow-2xl relative overflow-hidden mt-4"
                >
                    {/* Subtle inner glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                    {submitStatus === 'error' ? (
                        <div className="text-center py-12 relative z-10">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                                <XCircle className="w-8 h-8 text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Submission Failed</h3>
                            <p className="text-red-300/70 mb-6 font-light">{errorMessage || 'An unexpected error occurred.'}</p>
                            <button
                                onClick={() => setSubmitStatus('idle')}
                                className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 text-white transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={(e) => e.preventDefault()} className="relative z-10">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep + (currentStep === 3 ? `-${subStep}` : '')}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                >
                                    {/* Step 0: Specialization Cards */}
                                    {currentStep === 0 && (
                                        <div className="space-y-6">
                                            <div className="text-center mb-8">
                                                <h2 className="text-2xl font-display text-white mb-2 text-glow-premium">Select your specialization</h2>
                                                <p className="text-white/40 text-sm font-light">Choose the path that best fits your expertise.</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {specializations.map((option) => (
                                                    <div
                                                        key={option.id}
                                                        onClick={() => handleSpecializationSelect(option.id)}
                                                        className={`group relative flex items-start gap-4 p-6 rounded-2xl border transition-all duration-500 cursor-pointer text-left overflow-hidden ${formData.specialization === option.id
                                                                ? 'bg-violet-500/10 border-violet-500/50 shadow-[0_0_30px_rgba(139,92,246,0.15)]'
                                                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/20'
                                                            }`}
                                                    >
                                                        <div className={`relative w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-500 ${formData.specialization === option.id
                                                                ? 'bg-violet-500/20 border-violet-500/50'
                                                                : 'bg-white/5 border-white/10 group-hover:bg-white/10'
                                                            }`}>
                                                            <option.icon className={`w-5 h-5 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 ${formData.specialization === option.id ? 'text-violet-400' : 'text-white/60 group-hover:text-white'
                                                                }`} strokeWidth={1.5} />
                                                        </div>

                                                        <div className="flex-1 pt-0.5">
                                                            <h3 className={`text-lg font-bold mb-1 transition-colors duration-500 ${formData.specialization === option.id ? 'text-white' : 'text-white/80 group-hover:text-white'
                                                                }`}>
                                                                {option.title}
                                                            </h3>
                                                            <p className="text-white/40 text-xs font-light leading-relaxed">{option.description}</p>
                                                        </div>

                                                        {formData.specialization === option.id && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="absolute top-4 right-4 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center"
                                                            >
                                                                <Check className="w-3 h-3 text-white" />
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 1: Basic Information */}
                                    {currentStep === 1 && (
                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest">Selected Path</label>
                                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                                                    <span className="text-white/90 font-medium">
                                                        {specializations.find(s => s.id === formData.specialization)?.title || 'Select a Path'}
                                                    </span>
                                                    <button
                                                        onClick={() => setCurrentStep(0)}
                                                        className="text-xs text-violet-400 hover:text-violet-300 uppercase tracking-widest font-bold transition-colors"
                                                    >
                                                        Change
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <InputGroup label="Full Name*" subLabel="Your legal or professional name" value={formData.fullName} onChange={v => handleInputChange('fullName', v)} placeholder="John Doe" />
                                                <InputGroup label="Email Address*" subLabel="Where we should send updates" value={formData.email} onChange={v => handleInputChange('email', v)} placeholder="john@example.com" type="email" />
                                            </div>
                                            <InputGroup label="Portfolio / Showreel / Resume Link*" subLabel="Drive, YouTube, Vimeo, Behance, or website" value={formData.portfolioLink} onChange={v => handleInputChange('portfolioLink', v)} placeholder="https://..." />
                                        </div>
                                    )}

                                    {/* Step 2: Experience & Skills */}
                                    {currentStep === 2 && (
                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <label className="block text-sm font-medium text-white/80">
                                                    Have you worked as a video editor for a brand, business, or client before?*
                                                    <span className="block text-[11px] text-white/40 mt-0.5 font-light">Professional or freelance experience</span>
                                                </label>
                                                <div className="flex gap-3">
                                                    <RadioOption label="Yes" value="Yes" checked={formData.hasWorkedBefore === 'Yes'} onChange={() => handleInputChange('hasWorkedBefore', 'Yes')} />
                                                    <RadioOption label="No" value="No" checked={formData.hasWorkedBefore === 'No'} onChange={() => handleInputChange('hasWorkedBefore', 'No')} />
                                                </div>
                                            </div>
                                            <TextAreaGroup label="Briefly describe your video editing experience*" subLabel="Types of videos, platforms, years of experience, notable clients or projects" value={formData.experienceDescription} onChange={v => handleInputChange('experienceDescription', v)} placeholder="Enter details..." maxLength={1500} />
                                            <TextAreaGroup label="What video editing software and tools do you primarily use?*" subLabel='e.g., Premiere Pro, After Effects, DaVinci Resolve, CapCut, Photoshop, plugins, etc.' value={formData.toolsUsed} onChange={v => handleInputChange('toolsUsed', v)} placeholder="Premiere Pro, After Effects..." />
                                            <TextAreaGroup label='Do you have experience with motion graphics, animation, or VFX?*' subLabel='If yes, briefly describe what you can do. If none, write "No experience."' value={formData.motionGraphicsExp} onChange={v => handleInputChange('motionGraphicsExp', v)} placeholder="Lower thirds, transitions..." />
                                        </div>
                                    )}

                                    {/* Step 3: Workflow & Quality */}
                                    {currentStep === 3 && (
                                        <div className="space-y-8">
                                            {subStep === 0 && (
                                                <TextAreaGroup label="Describe your editing workflow from raw footage to final delivery*" subLabel="Include steps like organizing footage, rough cut, revisions, color, sound, export" value={formData.workflowDescription} onChange={v => handleInputChange('workflowDescription', v)} placeholder="My process..." minHeight="160px" />
                                            )}
                                            {subStep === 1 && (
                                                <TextAreaGroup label="How do you determine if a video edit is successful?*" subLabel="e.g., client feedback, engagement metrics, retention, storytelling clarity" value={formData.successMetric} onChange={v => handleInputChange('successMetric', v)} placeholder="Client satisfaction..." minHeight="160px" />
                                            )}
                                        </div>
                                    )}

                                    {/* Step 4: Brand Fit */}
                                    {currentStep === 4 && (
                                        <div className="space-y-8">
                                            <TextAreaGroup label="Why do you want to work with Creative Vision?*" subLabel="What attracts you to our brand and how your editing style aligns with our content" value={formData.whyJoin} onChange={v => handleInputChange('whyJoin', v)} placeholder="I align with the style..." minHeight="160px" />
                                        </div>
                                    )}

                                    {/* Step 5: Availability & Rates */}
                                    {currentStep === 5 && (
                                        <div className="space-y-10">
                                            <div className="space-y-4">
                                                <label className="block text-sm font-medium text-white/80">
                                                    Current Employment Status*
                                                    <span className="block text-[11px] text-white/40 mt-0.5 font-light">Select your current working arrangement</span>
                                                </label>
                                                <div className="flex flex-wrap gap-3">
                                                    {['Freelance', 'Full-time', 'Part-time', 'Student', 'Other'].map(opt => (
                                                        <RadioOption key={opt} label={opt} value={opt} checked={formData.employmentStatus === opt} onChange={() => handleInputChange('employmentStatus', opt)} />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="block text-sm font-medium text-white/80">
                                                    Are you currently a student?*
                                                    <span className="block text-[11px] text-white/40 mt-0.5 font-light">This helps us understand your schedule and availability</span>
                                                </label>
                                                <div className="flex gap-3">
                                                    <RadioOption label="Yes" value="Yes" checked={formData.isStudent === 'Yes'} onChange={() => handleInputChange('isStudent', 'Yes')} />
                                                    <RadioOption label="No" value="No" checked={formData.isStudent === 'No'} onChange={() => handleInputChange('isStudent', 'No')} />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="block text-sm font-medium text-white/80">
                                                    Expected rate per video*
                                                    <span className="block text-[11px] text-white/40 mt-0.5 font-light">Select your standard rate range in PHP</span>
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={formData.expectedRate}
                                                        onChange={e => handleInputChange('expectedRate', e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white appearance-none focus:outline-none focus:border-violet-500/50 focus:bg-black/40 transition-all cursor-pointer font-light"
                                                        required
                                                    >
                                                        <option value="" disabled className="bg-[#0a0a0f]">Select a range...</option>
                                                        {rateOptions.map(opt => (
                                                            <option key={opt} value={opt} className="bg-[#0a0a0f]">{opt}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation Buttons */}
                            {currentStep > 0 && (
                                <div className="flex items-center justify-between pt-8 mt-8 border-t border-white/5">
                                    <button
                                        onClick={prevStep}
                                        className="px-6 py-2.5 rounded-full border border-white/10 hover:bg-white/5 text-white/70 hover:text-white font-medium transition-all flex items-center gap-2 text-sm tracking-wide"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Back
                                    </button>

                                    {currentStep < steps.length - 1 ? (
                                        <button
                                            onClick={nextStep}
                                            disabled={!isStepValid(currentStep) && !(currentStep === 3 && subStep === 0 && !!formData.workflowDescription)}
                                            className="px-8 py-2.5 rounded-full bg-white text-black font-bold hover:scale-105 transition-all flex items-center gap-2 text-sm tracking-wide disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                                        >
                                            Next Step <ArrowRight className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!isStepValid(5) || isSubmitting}
                                            className="px-8 py-2.5 rounded-full bg-violet-500 text-white font-bold hover:bg-violet-400 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all flex items-center gap-2 text-sm tracking-wide disabled:opacity-50 disabled:hover:shadow-none disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </form>
                    )}
                </motion.div>
            </main>
        </section>
    );
}

// --- Helpers ---

interface InputGroupProps {
    label: string; subLabel?: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string;
}
const InputGroup = ({ label, subLabel, value, onChange, placeholder, type = 'text' }: InputGroupProps) => (
    <div>
        <label className="flex flex-col justify-end text-sm font-medium text-white/80 mb-2">
            <span>{label}</span>
            {subLabel ? (
                <span className="block text-[11px] text-white/40 mt-0.5 font-light">{subLabel}</span>
            ) : (
                <span className="block text-[11px] text-transparent mt-0.5 font-light select-none" aria-hidden="true">placeholder</span>
            )}
        </label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-black/40 transition-all font-light text-sm"
            placeholder={placeholder}
            required
        />
    </div>
);

interface TextAreaGroupProps {
    label: string; subLabel?: string; value: string; onChange: (value: string) => void; placeholder: string; maxLength?: number; minHeight?: string;
}
const TextAreaGroup = ({ label, subLabel, value, onChange, placeholder, maxLength, minHeight = '100px' }: TextAreaGroupProps) => (
    <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
            {label}
            {subLabel && <span className="block text-[11px] text-white/40 mt-0.5 font-light">{subLabel}</span>}
        </label>
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            maxLength={maxLength}
            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-black/40 transition-all resize-none font-light text-sm"
            style={{ minHeight }}
            placeholder={placeholder}
            required
        />
        {maxLength && <div className="text-right text-xs text-white/30 mt-1.5">{value.length} / {maxLength}</div>}
    </div>
);

const RadioOption = ({ label, value, checked, onChange }: { label: string; value: string; checked: boolean; onChange: () => void }) => (
    <label className={`flex items-center gap-2 px-5 py-2.5 rounded-full border cursor-pointer transition-all ${checked
            ? 'bg-violet-500/20 border-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]'
            : 'bg-black/20 border-white/10 text-white/60 hover:bg-white/[0.04] hover:text-white/90'
        }`}>
        <input type="radio" className="hidden" checked={checked} onChange={onChange} />
        <span className="text-sm font-medium tracking-wide">{label}</span>
    </label>
);
