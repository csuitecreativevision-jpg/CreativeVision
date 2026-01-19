import React, { useState } from 'react';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Portfolio from './components/Portfolio';
import Footer from './components/Footer';
import HireUsPage from './components/HireUsPage';
import JoinTeamPage from './components/JoinTeamPage';
import ThankYouPage from './components/ThankYouPage';
import MainNavigation from './components/MainNavigation';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'hire' | 'join' | 'thank-you'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleGetStarted = () => {
    setCurrentPage('hire');
    // Scroll to top when navigating to hire page
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleJoinTeam = () => {
    setCurrentPage('join');
    // Scroll to top when navigating to join team page
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleThankYou = () => {
    setCurrentPage('thank-you');
  };

  const handleBack = () => {
    setCurrentPage('home');
    // Scroll to top when going back
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentPage === 'hire') {
    return <HireUsPage onBack={handleBack} />;
  }

  if (currentPage === 'join') {
    return <JoinTeamPage onBack={handleBack} onThankYou={handleThankYou} />;
  }

  if (currentPage === 'thank-you') {
    return <ThankYouPage onBack={handleBack} />;
  }

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
        onBack={() => setCurrentPage('home')}
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