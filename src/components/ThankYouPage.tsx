import React from 'react';
import { CheckCircle, ArrowRight, Mail, Clock, Users } from 'lucide-react';
import MainNavigation from './MainNavigation';

interface ThankYouPageProps {
  onBack: () => void;
}

export default function ThankYouPage({ onBack }: ThankYouPageProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Ensure page loads from top when component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

      {/* Main Content */}
      <section className="pt-32 pb-16 px-6 relative z-10 min-h-screen flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-premium p-12 rounded-3xl glow-purple-intense border" style={{borderColor: '#3a14b7'}}>
            {/* Success Icon */}
            <div className="w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center glow-purple-intense icon-pulse" style={{background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'}}>
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            {/* Main Message */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-glow">
              Application
              <span className="block" style={{background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
                Submitted!
              </span>
            </h1>

            <p className="text-xl text-gray-200 mb-12 max-w-2xl mx-auto leading-relaxed">
              Thank you for your interest in joining Creative Vision! We've received your application 
              and our team is excited to review your portfolio and experience.
            </p>

            {/* Next Steps */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="glass-premium p-6 rounded-2xl border" style={{borderColor: '#3a14b7'}}>
                <Mail className="w-8 h-8 mx-auto mb-4 icon-float" style={{color: '#7424f5'}} />
                <h3 className="font-bold text-white mb-2">Confirmation Email</h3>
                <p className="text-gray-300 text-sm">Check your inbox for a confirmation email with your application details.</p>
              </div>
              
              <div className="glass-premium p-6 rounded-2xl border" style={{borderColor: '#3a14b7'}}>
                <Clock className="w-8 h-8 mx-auto mb-4 icon-float animation-delay-200" style={{color: '#7424f5'}} />
                <h3 className="font-bold text-white mb-2">Review Process</h3>
                <p className="text-gray-300 text-sm">Our team will review your application within 48 hours.</p>
              </div>
              
              <div className="glass-premium p-6 rounded-2xl border" style={{borderColor: '#3a14b7'}}>
                <Users className="w-8 h-8 mx-auto mb-4 icon-float animation-delay-400" style={{color: '#7424f5'}} />
                <h3 className="font-bold text-white mb-2">Interview</h3>
                <p className="text-gray-300 text-sm">If selected, we'll schedule a creative interview to discuss your vision.</p>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="glass-premium p-8 rounded-2xl border mb-8" style={{borderColor: '#3a14b7'}}>
              <h3 className="text-2xl font-bold text-white mb-6">What Happens Next?</h3>
              <div className="space-y-4 text-left max-w-2xl mx-auto">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}>
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Portfolio Review</h4>
                    <p className="text-gray-300 text-sm">Our creative team will carefully review your portfolio and application materials.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}>
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Initial Response</h4>
                    <p className="text-gray-300 text-sm">You'll hear back from us within 48 hours with next steps or feedback.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}>
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Creative Interview</h4>
                    <p className="text-gray-300 text-sm">If selected, we'll schedule a video call to discuss your creative vision and goals.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onBack}
                className="button-premium px-8 py-4 text-white font-poppins font-semibold rounded-full shadow-depth glow-purple-intense overflow-hidden"
                style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}
              >
                <span className="relative flex items-center gap-2">
                  Back to Home
                  <ArrowRight className="w-5 h-5" />
                </span>
              </button>
              
              <button
                onClick={() => window.open('mailto:team@creativevision.com', '_blank')}
                className="button-premium px-8 py-4 text-white font-poppins font-semibold rounded-full border-2 glass-premium shadow-cinematic hover:shadow-cinematic-lg"
                style={{borderColor: '#3a14b7'}}
              >
                <span className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Us
                </span>
              </button>
            </div>

            <p className="text-gray-300 text-sm mt-6">
              Questions? Feel free to reach out to us at{' '}
              <a href="mailto:team@creativevision.com" className="text-purple-400 hover:text-purple-300 transition-colors duration-300">
                team@creativevision.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t relative z-10" style={{borderColor: 'rgba(116, 36, 245, 0.3)'}}>
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
        </div>
      </footer>
    </div>
  );
}