import React from 'react';
import { Briefcase, Users, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface ServicesProps {
  onGetStarted: () => void;
  onJoinTeam: () => void;
}

export default function Services({ onGetStarted, onJoinTeam }: ServicesProps) {
  const visibleSections = useScrollAnimation();

  return (
    <section id="services" className="py-24 px-6" style={{backgroundColor: '#100024'}}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 
            id="services-title"
            data-animate
            className="text-5xl md:text-6xl font-poppins font-bold text-white mb-6 text-glow"
            style={{
              opacity: visibleSections.has('services-title') ? 1 : 0,
              transform: visibleSections.has('services-title') 
                ? 'translateY(0px)' 
                : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            Choose Your
            <span style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}> Path</span>
          </h2>
          <p 
            id="services-subtitle"
            data-animate
            className="text-xl text-gray-300 max-w-3xl mx-auto"
            style={{
              opacity: visibleSections.has('services-subtitle') ? 1 : 0,
              transform: visibleSections.has('services-subtitle') 
                ? 'translateY(0px)' 
                : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 200ms'
            }}
          >
            Whether you're looking to elevate your content or join our creative team, we have the perfect path for you.
          </p>
        </div>

        <div 
          id="services-cards"
          data-animate
          className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          style={{
            opacity: visibleSections.has('services-cards') ? 1 : 0,
            transform: visibleSections.has('services-cards') 
              ? 'translateY(0px)' 
              : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 400ms'
          }}
        >
          {/* Hire Us Card */}
          <div className="group relative rounded-3xl p-8 glass-premium shadow-depth hover-glow transition-all duration-500 border overflow-hidden" style={{borderColor: '#3a14b7'}}>
            {/* Gradient Background */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{background: 'linear-gradient(135deg, rgba(116, 36, 245, 0.1) 0%, rgba(88, 28, 217, 0.1) 100%)'}}></div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 glow-purple" style={{background: 'radial-gradient(circle, rgba(116, 36, 245, 0.3) 0%, rgba(88, 28, 217, 0.2) 100%)'}}></div>
            
            <div className="relative z-10">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 glow-purple-intense" style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}>
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-poppins font-bold text-white mb-2">Hire Us</h3>
                <p className="text-gray-100 leading-relaxed">
                  Ready to transform your raw footage into cinematic masterpieces? Let our expert team bring your vision to life with professional-grade editing services.
                </p>
              </div>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}></div>
                  <span className="text-sm text-gray-200">Professional video editing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}></div>
                  <span className="text-sm text-gray-200">24-hour turnaround available</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}></div>
                  <span className="text-sm text-gray-200">Unlimited revisions included</span>
                </div>
              </div>
              
              <button 
                onClick={onGetStarted}
                className="w-full button-premium px-6 py-4 text-white font-poppins font-semibold rounded-xl shadow-depth glow-purple-intense overflow-hidden" style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{background: 'linear-gradient(135deg, #581cd9 0%, #7424f5 100%)'}}></div>
                <span className="relative flex items-center justify-center gap-2">
                  Get Started Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
            </div>
          </div>

          {/* Join Our Team Card */}
          <div className="group relative rounded-3xl p-8 glass-premium shadow-depth hover-glow transition-all duration-500 border overflow-hidden" style={{borderColor: '#3a14b7'}}>
            {/* Gradient Background */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{background: 'linear-gradient(135deg, rgba(88, 28, 217, 0.1) 0%, rgba(116, 36, 245, 0.1) 100%)'}}></div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 glow-purple" style={{background: 'radial-gradient(circle, rgba(88, 28, 217, 0.3) 0%, rgba(116, 36, 245, 0.2) 100%)'}}></div>
            
            <div className="relative z-10">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 glow-purple-intense" style={{background: 'linear-gradient(135deg, #581cd9 0%, #7424f5 100%)'}}>
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-poppins font-bold text-white mb-2">Join Our Team</h3>
                <p className="text-gray-100 leading-relaxed">
                  Are you a talented video editor looking to join a dynamic creative team? Become part of our mission to create exceptional visual content that captivates audiences.
                </p>
              </div>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{background: 'linear-gradient(135deg, #581cd9 0%, #7424f5 100%)'}}></div>
                  <span className="text-sm text-gray-200">Remote-first work environment</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{background: 'linear-gradient(135deg, #581cd9 0%, #7424f5 100%)'}}></div>
                  <span className="text-sm text-gray-200">Competitive compensation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{background: 'linear-gradient(135deg, #581cd9 0%, #7424f5 100%)'}}></div>
                  <span className="text-sm text-gray-200">Creative growth opportunities</span>
                </div>
              </div>
              
              <button 
                onClick={onJoinTeam}
                className="w-full button-premium px-6 py-4 text-white font-poppins font-semibold rounded-xl shadow-depth glow-purple-intense overflow-hidden" style={{background: 'linear-gradient(135deg, #581cd9 0%, #7424f5 100%)'}}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}></div>
                <span className="relative flex items-center justify-center gap-2">
                  Apply Today
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}