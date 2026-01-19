import React from 'react';
import { Menu, X, ArrowLeft } from 'lucide-react';

interface MainNavigationProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  onGetStarted: () => void;
  isHirePage?: boolean;
  isJoinTeamPage?: boolean;
  onBack?: () => void;
}

export default function MainNavigation({ 
  isMenuOpen, 
  setIsMenuOpen, 
  onGetStarted, 
  isHirePage = false,
  isJoinTeamPage = false,
  onBack 
}: MainNavigationProps) {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const handleGetStarted = () => {
    if (isHirePage) {
      // Scroll to top of hire page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onGetStarted();
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-premium border-b backdrop-blur-premium" style={{borderColor: 'rgba(116, 36, 245, 0.3)'}}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Back button or Logo */}
          <div className="flex items-center gap-4">
            {(isHirePage || isJoinTeamPage) && onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            
            <button 
              onClick={onBack || (() => window.location.reload())}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img 
                src="/Untitled design (3).png" 
                alt="CreativeVision Logo" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-poppins font-bold text-glow" style={{background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 30%, #7c3aed 60%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
                CreativeVision
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          {!isHirePage && !isJoinTeamPage && (
            <nav className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => scrollToSection('about')}
                className="text-gray-200 hover:text-white transition-colors font-medium"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('services')}
                className="text-gray-200 hover:text-white transition-colors font-medium"
              >
                Services
              </button>
              <button 
                onClick={() => scrollToSection('portfolio')}
                className="text-gray-200 hover:text-white transition-colors font-medium"
              >
                Portfolio
              </button>
            </nav>
          )}

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={handleGetStarted}
              className="button-premium px-6 py-3 text-white font-poppins font-semibold rounded-full shadow-depth glow-purple-intense overflow-hidden" 
              style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}
            >
              <span className="relative">
                {isHirePage ? 'Get Started' : 'Get Started →'}
              </span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white hover:text-purple-300 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t" style={{borderColor: 'rgba(116, 36, 245, 0.3)'}}>
            <nav className="flex flex-col gap-4 pt-4">
              {!isHirePage && !isJoinTeamPage && (
                <>
                  <button 
                    onClick={() => scrollToSection('about')}
                    className="text-gray-200 hover:text-white transition-colors font-medium text-left"
                  >
                    About
                  </button>
                  <button 
                    onClick={() => scrollToSection('services')}
                    className="text-gray-200 hover:text-white transition-colors font-medium text-left"
                  >
                    Services
                  </button>
                  <button 
                    onClick={() => scrollToSection('portfolio')}
                    className="text-gray-200 hover:text-white transition-colors font-medium text-left"
                  >
                    Portfolio
                  </button>
                </>
              )}
              <button 
                onClick={handleGetStarted}
                className="button-premium px-6 py-3 text-white font-poppins font-semibold rounded-full shadow-depth glow-purple-intense overflow-hidden mt-2" 
                style={{background: 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)'}}
              >
                <span className="relative">
                  {isHirePage ? 'Get Started' : 'Get Started →'}
                </span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}