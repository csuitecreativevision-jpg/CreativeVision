import { useState, useEffect } from 'react';
import Hero from './Hero';
import Services from './Services';
import Portfolio from './Portfolio';
import TrustSignals from './sections/TrustSignals';
import ProblemSection from './sections/ProblemSection';
import CareersSection from './CareersSection';
import PricingSection from './PricingSection';
import { HorizontalScrollWrapper } from './layout/HorizontalScrollWrapper';


import { motion } from 'framer-motion';

const Slide = ({ children, id, className = "", enableFlash = false }: { children: React.ReactNode, id?: string, className?: string, enableFlash?: boolean }) => {
  return (
    <section id={id} className={`w-screen h-screen flex-shrink-0 flex items-center justify-center relative overflow-hidden snap-center ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ margin: "-20%", amount: 0.3 }}
        onViewportEnter={() => {
          if (enableFlash) {
            // Dispatch a custom event or manage state locally if simple
            const flash = document.getElementById('camera-flash');
            if (flash) {
              flash.animate([
                { opacity: 0 },
                { opacity: 1 },
                { opacity: 0 }
              ], {
                duration: 300,
                easing: 'ease-out'
              });
            }
          }
        }}
        className="w-full h-full flex items-center justify-center z-10"
      >
        {children}
      </motion.div>
    </section>
  );
};

export default function HomePage() {
  const [navOverride, setNavOverride] = useState<number | null>(null);

  useEffect(() => {
    // Force scroll to top on mount to restart the experience
    window.scrollTo(0, 0);
  }, []);



  const Content = (
    <>
      {/* 0: Hero - The Hook */}
      <Slide id="hero" className="hero-slide">
        <Hero onGetStarted={() => setNavOverride(5)} />
      </Slide>

      {/* 1: Problem - Create Tension */}
      <Slide className="problem-slide">
        <ProblemSection />
      </Slide>

      {/* 2: Portfolio - The Solution (Let work speak) */}
      <Slide className="portfolio-slide" enableFlash>
        <Portfolio onGetStarted={() => setNavOverride(5)} />
      </Slide>

      {/* 3: Trust Signals - Social Proof */}
      <Slide className="trust-slide">
        <TrustSignals />
      </Slide>

      {/* 4: Services - Decision Point (Hire or Join) */}
      <Slide className="services-slide">
        <Services onGetStarted={() => setNavOverride(5)} onJoinTeam={() => setNavOverride(6)} />
      </Slide>

      {/* 5: Hidden - Pricing Plans */}
      <Slide className="pricing-slide">
        <div className="relative w-full h-full">
          <button
            onClick={() => setNavOverride(null)}
            className="absolute top-8 left-8 z-50 px-6 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md uppercase text-sm tracking-widest font-bold"
          >
            ← Back
          </button>
          <PricingSection id="pricing" />
        </div>
      </Slide>


      {/* 6: Hidden - Careers (APPLICATION FORM) - Hidden on Mobile */}
      <Slide className="careers-slide hidden md:flex">
        <div className="relative w-full h-full">
          <button
            onClick={() => setNavOverride(null)}
            className="absolute top-8 left-8 z-50 px-6 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md uppercase text-sm tracking-widest font-bold"
          >
            ← Back
          </button>
          <CareersSection id="careers" />
        </div>
      </Slide>

    </>
  );

  return (
    <div className="min-h-screen text-white relative bg-[#050511]">
      {/* Global Camera Flash Overlay */}
      <div id="camera-flash" className="fixed inset-0 bg-white pointer-events-none z-[100] opacity-0 mix-blend-overlay"></div>

      <HorizontalScrollWrapper contentWidth="700vh" overrideIndex={navOverride}>
        {Content}
      </HorizontalScrollWrapper>
    </div>
  );
}
