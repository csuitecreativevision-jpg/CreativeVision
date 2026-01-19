import React from 'react';

interface NavigationProps {
  onBack?: () => void;
  showBackButton?: boolean;
}

export default function Navigation({ onBack, showBackButton = false }: NavigationProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-premium border-b border-white/10 backdrop-blur-premium">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Back button or empty space */}
          <div className="flex items-center">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-medium"
              >
                <span>←</span>
                <span>Go back</span>
              </button>
            )}
          </div>
          
          {/* Center - Logo and Brand */}
          <div className="flex items-center gap-3">
            <img 
              src="/Untitled design (3).png" 
              alt="Creative Vision Logo" 
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold">Creative Vision</span>
          </div>
          
          {/* Right side - empty for now */}
          <div></div>
        </div>
      </div>
    </header>
  );
}