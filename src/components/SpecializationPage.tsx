import React, { useState } from 'react';
import { Play, Scissors, Sparkles, Zap, Video, ArrowRight, User, Mail, Briefcase, Link, FileText, TrendingUp, Award, Wrench, Heart, Send } from 'lucide-react';
import MainNavigation from './MainNavigation';

interface SpecializationPageProps {
  onBack: () => void;
  onThankYou: () => void;
}

export default function SpecializationPage({ onBack, onThankYou }: SpecializationPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', { specialization: selectedSpecialization, ...formData });
    onThankYou();
  };

  const isFormValid = () => {
    return Object.values(formData).every(value => value.trim() !== '') && selectedSpecialization;
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{backgroundColor: '#100024'}}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{background: 'linear-gradient(135deg, transparent 0%, rgba(116, 36, 245, 0.2) 50%, transparent 100%)'}}></div>
          <div className="grid grid-cols-12 gap-4 h-full w-full transform rotate-12 scale-150">
            {[...Array(144)].map((_, i) => (
              <div
                key={i}
                className="border rounded-lg"
                style={{
                  borderColor: 'rgba(116, 36, 245, 0.1)',
                  animationDelay: `${i * 50}ms`,
                  animation: 'gridMove 20s ease-in-out infinite'
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full particle"
            style={{
              backgroundColor: 'rgba(116, 36, 245, 0.3)',
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          ></div>
        ))}

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse glow-purple" style={{background: 'radial-gradient(circle, rgba(116, 36, 245, 0.2) 0%, rgba(88, 28, 217, 0.2) 100%)'}}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000 glow-purple" style={{background: 'radial-gradient(circle, rgba(88, 28, 217, 0.2) 0%, rgba(58, 20, 183, 0.2) 100%)'}}></div>
      </div>

      {/* Navigation */}
      <MainNavigation 
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onGetStarted={() => {}}
        isHirePage={true}
        onBack={onBack}
      />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-glow">
            What Do You
            <span className="block" style={{background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 30%, #7c3aed 60%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
              Specialize In?
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Choose your area of expertise and join our team of creative professionals. 
            Each specialization offers unique opportunities to showcase your skills and grow your career.
          </p>
        </div>
      </section>

      {/* Specialization Cards */}
      {!selectedSpecialization && (
        <section className="py-12 px-6 relative z-10 scroll-animate">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {specializations.map((spec, index) => (
                <div
                  key={spec.id}
                  onClick={() => setSelectedSpecialization(spec.id)}
                  className="group cursor-pointer relative rounded-3xl p-8 glass-premium shadow-depth hover-glow transition-all duration-500 border overflow-hidden transform hover:scale-105"
                  style={{borderColor: '#3a14b7'}}
                >
                  {/* Gradient Background */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{background: `${spec.gradient.replace('100%)', '10%)')}`}}></div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 glow-purple" style={{background: `radial-gradient(circle, ${spec.color}30, ${spec.color}20)`}}></div>
                  
                  <div className="relative z-10 text-center">
                    <div className="mb-6">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 glow-purple-intense" style={{background: spec.gradient}}>
                        <div style={{color: 'white'}} className="icon-float">
                          {spec.icon}
                        </div>
                      </div>
                      <h3 className="text-2xl font-poppins font-bold text-white mb-4">{spec.title}</h3>
                      <p className="text-gray-200 leading-relaxed">
                        {spec.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-sm font-medium group-hover:text-white transition-colors duration-300" style={{color: spec.color}}>
                      <span>Apply for this role</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Application Form */}
      {selectedSpecialization && (
        <section className="py-12 px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Selected Specialization Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-4 glass-premium p-6 rounded-2xl border mb-8" style={{borderColor: '#3a14b7'}}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center glow-purple-intense" style={{background: specializations.find(s => s.id === selectedSpecialization)?.gradient}}>
                  {specializations.find(s => s.id === selectedSpecialization)?.icon}
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-white">
                    {specializations.find(s => s.id === selectedSpecialization)?.title}
                  </h2>
                  <p className="text-gray-300">Application Form</p>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedSpecialization(null)}
                className="text-gray-300 hover:text-white transition-colors duration-300 mb-8"
              >
                ← Choose a different specialization
              </button>
            </div>

            {/* Application Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="glass-premium p-8 rounded-3xl border" style={{borderColor: '#3a14b7'}}>
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <User className="w-6 h-6" style={{color: '#7424f5'}} />
                  Basic Information
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-200 font-medium mb-3">What's your full name? *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-premium border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                      style={{borderColor: '#3a14b7'}}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 font-medium mb-3">What's your email address? *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-premium border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                      style={{borderColor: '#3a14b7'}}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="glass-premium p-8 rounded-3xl border" style={{borderColor: '#3a14b7'}}>
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <Briefcase className="w-6 h-6" style={{color: '#7424f5'}} />
                  Experience
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-200 font-medium mb-3">Have you worked as a video editor for a brand, business, or project before? *</label>
                    <textarea
                      value={formData.hasExperience}
                      onChange={(e) => handleInputChange('hasExperience', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-premium border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 h-32 resize-none"
                      style={{borderColor: '#3a14b7'}}
                      placeholder="Please describe your video editing experience..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 font-medium mb-3">If yes, what type of content did you edit? *</label>
                    <textarea
                      value={formData.contentType}
                      onChange={(e) => handleInputChange('contentType', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-premium border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 h-32 resize-none"
                      style={{borderColor: '#3a14b7'}}
                      placeholder="Describe the types of content you've edited (social media, commercials, documentaries, etc.)..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 font-medium mb-3">What's the most successful or impactful video you've edited? (Share link if available.) *</label>
                    <textarea
                      value={formData.successfulVideo}
                      onChange={(e) => handleInputChange('successfulVideo', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-premium border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 h-32 resize-none"
                      style={{borderColor: '#3a14b7'}}
                      placeholder="Tell us about your most successful video and include a link if possible..."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="glass-premium p-8 rounded-3xl border" style={{borderColor: '#3a14b7'}}>
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <Video className="w-6 h-6" style={{color: '#7424f5'}} />
                  Editing Skills
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-200 font-medium mb-3">What types of videos are you most comfortable editing (e.g., short-form, long-form, ads, social media, YouTube, reels)? *</label>
                    <textarea
                      value={formData.comfortableVideoTypes}
                      onChange={(e) => handleInputChange('comfortableVideoTypes', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-premium border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 h-32 resize-none"
                      style={{borderColor: '#3a14b7'}}
                      placeholder="List the types of videos you're most comfortable editing..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 font-medium mb-3">Walk us through your editing process from raw footage to final export. *</label>
                    <textarea
                      value={formData.editingProcess}
                      onChange={(e) => handleInputChange('editingProcess', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-premium border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 h-40 resize-none"
                      style={{borderColor: '#3a14b7'}}
                      placeholder="Describe your step-by-step editing workflow..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 font-medium mb-3">What's one editing technique you've used that really improved a video's engagement or storytelling? *</label>
                    <textarea
                      value={formData.engagementTechnique}
                      onChange={(e) => handleInputChange('engagementTechnique', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-premium border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 h-32 resize-none"
                      style={{borderColor: '#3a14b7'}}
                      placeholder="Share a specific technique that boosted engagement..."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="glass-premium p-8 rounded-3xl border" style={{borderColor: '#3a14b7'}}>
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6" style={{color: '#7424f5'}} />
                  Performance & Growth
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-200 font-medium mb-3">How do you measure whether a video you've edited is successful? *</label>
                    <textarea
                      value={formData.successMeasurement}
                      onChange={(e) => handleInputChange('successMeasurement', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-premium border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 h-32 resize-none"
                      style={{borderColor: '#3a14b7'}}
                      placeholder="Explain how you measure video success (views, engagement, conversions, etc.)..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 font-medium mb-3">Have you worked with motion graphics, animation, or VFX? If yes, describe your experience. *</label>
                    <textarea
                      value={formData.motionGraphicsExperience}
                      onChange={(e) => handleInputChange('motionGraphicsExperience', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-premium border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 h-32 resize-none"
                      style={{borderColor: '#3a14b7'}}
                      placeholder="Describe your motion graphics/animation/VFX experience or write 'No experience' if none..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 font-medium mb-3">How do you stay updated with new video editing trends, tools, and techniques? *</label>
                    <textarea
                      value={formData.stayUpdated}
                      onChange={(e) => handleInputChange('stayUpdated', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-premium border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 h-32 resize-none"
                      style={{borderColor: '#3a14b7'}}
                      placeholder="Share how you keep up with industry trends and new techniques..."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="glass-premium p-8 rounded-3xl border" style={{borderColor: '#3a14b7'}}>
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <Wrench className="w-6 h-6" style={{color: '#7424f5'}} />
                  Tools & Motivation
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-200 font-medium mb-3">What video editing software and tools do you use most often? *</label>
                    <input
                      type="text"
                      value={formData.toolsSoftware}
                      onChange={(e) => handleInputChange('toolsSoftware', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-premium border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                      style={{borderColor: '#3a14b7'}}
                      placeholder="e.g., Adobe Premiere Pro, After Effects, DaVinci Resolve, Final Cut Pro..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 font-medium mb-3">Why do you want to edit videos for our brand? *</label>
                    <textarea
                      value={formData.whyJoin}
                      onChange={(e) => handleInputChange('whyJoin', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-premium border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 h-32 resize-none"
                      style={{borderColor: '#3a14b7'}}
                      placeholder="Tell us what attracts you to Creative Vision and how you see yourself contributing..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 font-medium mb-3">Link to your portfolio or resume *</label>
                    <input
                      type="url"
                      value={formData.portfolioLink}
                      onChange={(e) => handleInputChange('portfolioLink', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-premium border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                      style={{borderColor: '#3a14b7'}}
                      placeholder="https://your-portfolio.com or resume link"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-8">
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className={`button-premium px-12 py-4 text-white font-poppins font-semibold rounded-full shadow-depth overflow-hidden transition-all duration-300 ${
                    isFormValid() 
                      ? 'glow-purple-intense hover:scale-105' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  style={{background: isFormValid() ? 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)' : 'linear-gradient(135deg, #666 0%, #444 100%)'}}
                >
                  <span className="relative flex items-center gap-3">
                    <Send className="w-5 h-5" />
                    Submit Application
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </button>
                
                <p className="text-gray-300 text-sm mt-4">
                  We'll review your application within 48 hours and get back to you
                </p>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-6 border-t relative z-10 mt-16" style={{borderColor: 'rgba(116, 36, 245, 0.3)'}}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="/Untitled design (3).png" 
              alt="CreativeVision Logo" 
              className="h-8 w-auto"
            />
            <span className="text-2xl font-poppins font-bold text-glow" style={{background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 30%, #7c3aed 60%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
              CreativeVision
            </span>
          </div>
          <p className="text-gray-200 font-medium mb-1">
            © 2025 CreativeVision. All rights reserved.
          </p>
          <p className="text-sm text-gray-300">
            Join our team and help shape the future of video editing excellence.
          </p>
        </div>
      </footer>
    </div>
  );
}