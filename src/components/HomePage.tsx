import React, { useState } from 'react';
import Hero from './Hero';
import About from './About';
import Services from './Services';
import Portfolio from './Portfolio';
import Footer from './Footer';
import MainNavigation from './MainNavigation';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/hire');
    // Scroll to top when navigating to hire page
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleJoinTeam = () => {
    navigate('/join');
    // Scroll to top when navigating to join team page
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
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
                style={{borderColor: 'rgba(116, 36, 245, 0.1)', animationDelay: `${i * 50}ms`, animation: 'gridMove 20s ease-in-out infinite'}}
              ></div>
            ))}
          </div>
        </div>

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full particle"
            style={{backgroundColor: 'rgba(116, 36, 245, 0.3)', left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 8}s`, animationDuration: `${8 + Math.random() * 4}s`}}
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
        onGetStarted={() => {
          const element = document.getElementById('services');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onBack={() => navigate('/')}
      />

      {/* Main Content */}
      <main>
        <Hero onGetStarted={handleGetStarted} />
        <About />
        <Services onGetStarted={handleGetStarted} onJoinTeam={handleJoinTeam} />
        <Portfolio onGetStarted={handleGetStarted} />
        <Footer onGetStarted={handleGetStarted} />
      </main>
    </div>
  );
}
