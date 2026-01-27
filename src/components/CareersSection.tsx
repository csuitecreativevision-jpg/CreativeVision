import { useState, useEffect, FormEvent, useRef } from 'react';
import { ArrowRight, Video, Play, Scissors, Sparkles, Zap, ArrowLeft, Upload, ChevronDown, Check } from 'lucide-react';
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<{
        fullName: string;
        email: string;
        specialization: string;
        portfolioLink: string;
        resumeFile: File | null;
        message: string;
    }>({
        fullName: '',
        email: '',
        specialization: '',
        portfolioLink: '',
        resumeFile: null,
        message: '' // Kept for generic message/why join if needed, or we can hide it
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const specializations = [
        { id: 'short-form', title: 'Short-form Video Editor' },
        { id: 'clipper', title: 'Clipper' },
        { id: 'animator', title: 'Animator' },
        { id: 'motion-graphics', title: 'Motion Graphics Editor' },
        { id: 'long-form', title: 'Long-form Video Editor' }
    ];

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({
                ...prev,
                resumeFile: e.target.files![0]
            }));
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFormData(prev => ({
                ...prev,
                resumeFile: e.dataTransfer.files[0]
            }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.specialization) {
            alert("Please select a position.");
            return;
        }

        setIsSubmitting(true);

        try {
            await submitApplicationToMonday({
                ...formData,
                specialization: specializations.find(s => s.id === formData.specialization)?.title || formData.specialization,
                message: formData.message || "No additional message",
            });

            alert('Application sent successfully!');
            setFormData({
                fullName: '',
                email: '',
                specialization: '',
                portfolioLink: '',
                resumeFile: null,
                message: ''
            });
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error('Error submitting application:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = () => {
        return formData.fullName.trim() !== '' &&
            formData.email.trim() !== '' &&
            formData.specialization !== '' &&
            formData.portfolioLink.trim() !== '';
    };

    // Secret portal logic preserved
    const [clickCount, setClickCount] = useState(0);
    const [lastClickTime, setLastClickTime] = useState(0);
    const handleSecretClick = () => {
        const now = Date.now();
        if (now - lastClickTime > 2000) {
            setClickCount(1);
        } else {
            const newCount = clickCount + 1;
            setClickCount(newCount);
            if (newCount >= 5) window.location.href = '/portal';
        }
        setLastClickTime(now);
    };

    return (
        <section id={id} className={`w-screen min-h-screen flex-shrink-0 flex items-center justify-center relative overflow-hidden px-6 py-20 ${className}`}>
            <div className="max-w-4xl mx-auto flex flex-col w-full">
                <ScrollReveal animation="fade-up">
                    <div className="text-center mb-12">
                        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 animate-fade-in">
                            <div className="w-2 h-2 rounded-full bg-custom-bright animate-pulse" />
                            <span className="text-xs font-medium text-gray-300 tracking-wider uppercase">We are hiring</span>
                        </div>

                        <h2 className="text-4xl md:text-6xl font-bold mb-6 text-glow leading-[1.1]">
                            Join The <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-bright via-white to-custom-violet">
                                Team
                            </span>
                        </h2>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                            Ready to create? Restore your legacy.
                        </p>
                    </div>
                </ScrollReveal>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-sm"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Position Selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Position</label>
                            <div className="relative">
                                <select
                                    value={formData.specialization}
                                    onChange={e => handleInputChange('specialization', e.target.value)}
                                    className="w-full px-4 py-4 rounded-xl bg-black/20 border border-white/10 text-white appearance-none focus:outline-none focus:border-custom-bright/50 focus:bg-black/40 transition-all cursor-pointer"
                                    required
                                >
                                    <option value="" disabled>Select a position...</option>
                                    {specializations.map(spec => (
                                        <option key={spec.id} value={spec.id} className="bg-gray-900">{spec.title}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                            </div>
                        </div>

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

                        {/* Resume Upload - Drag n Drop */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Resume / CV</label>
                            <div
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group ${formData.resumeFile ? 'border-custom-bright bg-custom-bright/10' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx"
                                />
                                <div className="flex flex-col items-center gap-3">
                                    {formData.resumeFile ? (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-custom-bright flex items-center justify-center">
                                                <Check className="w-6 h-6 text-white" />
                                            </div>
                                            <p className="font-medium text-white">{formData.resumeFile.name}</p>
                                            <p className="text-sm text-gray-400">Click to change</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-custom-bright/20 transition-colors">
                                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-custom-bright transition-colors" />
                                            </div>
                                            <p className="font-medium text-gray-300 group-hover:text-white transition-colors">Click or drag resume here</p>
                                            <p className="text-sm text-gray-500">PDF, DOC (Max 10MB)</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <InputGroup
                            label="Portfolio Link"
                            value={formData.portfolioLink}
                            onChange={v => handleInputChange('portfolioLink', v)}
                            placeholder="https://your-portfolio.com"
                        />

                        {/* Hidden/Optional Message field needed for API interface or keep as generic "Why Join?" */}
                        <div className="hidden">
                            <textarea
                                value={formData.message}
                                onChange={e => handleInputChange('message', e.target.value)}
                            />
                        </div>

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
                </motion.div>

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
