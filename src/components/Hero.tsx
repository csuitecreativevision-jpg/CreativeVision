import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-12 px-4" style={{backgroundColor: '#100024'}}>
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-40 blur-3xl animate-pulse glow-purple" style={{background: 'radial-gradient(circle, #7424f5 0%, #581cd9 100%)'}}></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-30 blur-3xl animate-pulse delay-1000 glow-purple" style={{background: 'radial-gradient(circle, #581cd9 0%, #3a14b7 100%)'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-25 blur-2xl animate-pulse delay-500 glow-purple" style={{background: 'radial-gradient(circle, #3a14b7 0%, #01077c 100%)'}}></div>
        
        {/* Cinematic particles */}
        <div className="absolute top-0 left-1/4 w-1 h-1 rounded-full particle animation-delay-200" style={{backgroundColor: '#7424f5'}}></div>
        <div className="absolute top-0 right-1/3 w-1 h-1 rounded-full particle animation-delay-400" style={{backgroundColor: '#581cd9'}}></div>
        <div className="absolute top-0 left-2/3 w-1 h-1 rounded-full particle animation-delay-600" style={{backgroundColor: '#3a14b7'}}></div>
      </div>

      <div className="relative z-10 text-center w-full animate-fade-in-up">
        <h1 className="text-6xl md:text-8xl font-poppins font-bold text-white mb-8 md:mb-6 leading-tight text-glow">
          {/* Mobile layout - stacked lines */}
          <span className="block md:hidden px-2">
            <span className="block">Elevating</span>
            <span className="block">Your Brand</span>
            <span className="block">One Pixel</span>
            <span className="block" style={{background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 30%, #7c3aed 60%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
              at a Time
            </span>
          </span>
          
          {/* Desktop layout - 2 lines */}
          <span className="hidden md:block">
            <span className="block">Elevating Your Brand</span>
            <span className="block" style={{background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 30%, #7c3aed 60%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
              One Pixel at a Time
            </span>
          </span>
        </h1>

        <p className="text-lg md:text-2xl text-gray-100 mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-600 px-4">
          We Deliver <span className="font-bold" style={{background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 30%, #7c3aed 60%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>Quality and Creativity</span> in Every Frame
          <br />
          — Because <span className="font-bold" style={{background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 30%, #7c3aed 60%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>YOUR STORY</span> Deserves the Best.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up animation-delay-600 px-4">
          <button 
            onClick={() => {
              const element = document.getElementById('services');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="group button-premium px-8 py-4 text-white font-poppins font-semibold rounded-full shadow-depth glow-purple-intense overflow-hidden max-w-xs sm:max-w-none mx-auto" 
            style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}
          >
            <span className="relative flex items-center gap-2">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </button>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-3 h-3 rounded-full float-animation delay-300 glow-purple" style={{backgroundColor: '#7424f5'}}></div>
      <div className="absolute bottom-32 right-32 w-2 h-2 rounded-full float-animation delay-700 glow-purple" style={{backgroundColor: '#581cd9'}}></div>
      <div className="absolute top-1/3 right-20 w-4 h-4 rounded-full float-rotate glow-purple-intense" style={{background: 'linear-gradient(135deg, #7424f5 0%, #581cd9 100%)'}}></div>
    </section>
  );
}