import { useState } from 'react';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Briefcase,
    Check,
    ChevronRight,
    Search,
    DollarSign,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminProjectAssignment() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Form State
    const [formData, setFormData] = useState({
        projectName: '',
        projectType: 'Video Editing', // Video Editing, Graphic Design, etc.
        client: '',
        price: '',
        editor: '',
        deadline: ''
    });

    // Mock Data (replace with real fetches later)
    const projectTypes = ['Video Editing', 'Thumbnail Design', 'Channel Management', 'Shorts/Reels'];
    const users = ['Editor 1', 'Editor 2', 'Manager 1']; // Need to fetch real users

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-12">
            {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                        ${step === s ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30 scale-110' :
                            step > s ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-500'}
                    `}>
                        {step > s ? <Check className="w-5 h-5" /> : s}
                    </div>
                    {s < 3 && (
                        <div className={`w-24 h-1 mx-4 rounded-full transition-all duration-300 ${step > s ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <AdminPageLayout
            title="Project Assignment"
            subtitle="Configure and assign new projects to your team."
        >
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/admin-portal/management')}
                    className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Hub
                </button>

                {renderStepIndicator()}

                <GlassCard className="p-8 relative overflow-hidden border border-white/10 !bg-[#151523]/90">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                    <Briefcase className="w-5 h-5 mr-3 text-violet-400" />
                                    Project Details
                                </h3>

                                {/* Project Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Project Name</label>
                                    <input
                                        type="text"
                                        value={formData.projectName}
                                        onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                                        placeholder="e.g. Nike Commercial Edit Q1"
                                        className="w-full bg-[#0E0E1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
                                    />
                                </div>

                                {/* Project Type */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Project Type</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {projectTypes.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setFormData({ ...formData, projectType: type })}
                                                className={`p-4 rounded-xl border text-left transition-all ${formData.projectType === type
                                                    ? 'bg-violet-500/20 border-violet-500 text-white'
                                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className="font-bold block">{type}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                    <DollarSign className="w-5 h-5 mr-3 text-emerald-400" />
                                    Client & Pricing
                                </h3>

                                {/* Client (Mock for now) */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Client</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder="Search client..."
                                            className="w-full bg-[#0E0E1A] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
                                        />
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Project Budget / Price</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</div>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="0.00"
                                            className="w-full bg-[#0E0E1A] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-600 font-mono"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                    <User className="w-5 h-5 mr-3 text-blue-400" />
                                    Assign to Team
                                </h3>

                                <div className="space-y-4">
                                    {users.map(user => (
                                        <button
                                            key={user}
                                            onClick={() => setFormData({ ...formData, editor: user })}
                                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${formData.editor === user
                                                ? 'bg-blue-500/20 border-blue-500'
                                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold">
                                                    {user.charAt(0)}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-white font-bold">{user}</p>
                                                    <p className="text-xs text-gray-400">Available • 3 Projects Active</p>
                                                </div>
                                            </div>
                                            {formData.editor === user && <Check className="w-5 h-5 text-blue-400" />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
                        <button
                            onClick={step === 1 ? () => navigate('/admin-portal/management') : handleBack}
                            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            {step === 1 ? 'Cancel' : 'Back'}
                        </button>

                        <button
                            onClick={step === 3 ? () => console.log('Submit', formData) : handleNext}
                            className="flex items-center px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-violet-600/30 transition-all active:scale-95"
                        >
                            {step === 3 ? 'Create Assignment' : 'Continue'}
                            {step < 3 && <ChevronRight className="w-4 h-4 ml-2" />}
                        </button>
                    </div>
                </GlassCard>
            </div>
        </AdminPageLayout>
    );
}
