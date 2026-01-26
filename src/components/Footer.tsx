import React from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';



export default function Footer() {
  const visibleSections = useScrollAnimation();

  return (
    <footer
      id="footer"
      data-animate

      className="py-16 px-6 border-t border-custom-purple/30 relative z-10"
      style={{
        opacity: visibleSections.has('footer') ? 1 : 0,
        transform: visibleSections.has('footer')
          ? 'translateY(0px)'
          : 'translateY(30px)',
        transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img
              src="/Untitled design (3).png"
              alt="CreativeVision Logo"
              className="h-10 w-auto"
            />
            <span className="text-3xl font-poppins font-bold text-glow text-gradient-primary">
              CreativeVision
            </span>
          </div>

          <p className="text-gray-200 font-medium mb-2">
            © 2025 CreativeVision. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}