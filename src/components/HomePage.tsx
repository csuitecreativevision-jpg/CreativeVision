import { useState, useEffect } from 'react';
import Hero from './Hero';
import About from './About';
import Services from './Services';
import Portfolio from './Portfolio';
import BookingSection from './BookingSection';
import TrustSignals from './sections/TrustSignals';
import CareersSection from './CareersSection';
import PricingSection from './PricingSection';
import { HorizontalScrollWrapper } from './layout/HorizontalScrollWrapper';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

const Slide = ({ children, id, className = "", enableFlash = false }: { children: React.ReactNode, id?: string, className?: string, enableFlash?: boolean }) => {
  return (
    <section id={id} className={`w-screen h-screen flex-shrink-0 flex items-center justify-center relative overflow-hidden ${className}`}>
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
  const [isMobile, setIsMobile] = useState(false);
  const [navOverride, setNavOverride] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Force scroll to top on mount to restart the experience
    window.scrollTo(0, 0);
  }, []);



  const Content = (
    <>
      {/* 0 */}
      <Slide id="hero" className="hero-slide">
        <Hero onGetStarted={() => setNavOverride(6)} />
      </Slide>

      {/* 1 */}
      <Slide className="trust-slide" enableFlash>
        <TrustSignals />
      </Slide>

      {/* 2 */}
      <Slide className="about-slide">
        <About />
      </Slide>

      {/* 3 */}
      <Slide className="services-slide">
        <Services onGetStarted={() => setNavOverride(6)} onJoinTeam={() => setNavOverride(7)} />
      </Slide>

      {/* 4 */}
      <Slide className="portfolio-slide">
        <Portfolio onGetStarted={() => setNavOverride(6)} />
      </Slide>

      {/* 5 */}
      <Slide className="booking-slide">
        <BookingSection id="booking" />
      </Slide>

      {/* 6: Hidden - Pricing Plans */}
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

      {/* 7: Hidden - Careers */}
      <Slide className="careers-slide">
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

      {isMobile ? (
        <main className="flex flex-col">
          <div id="hero"><Hero onGetStarted={() => navigate('/hire')} /></div>
          <About />
          <Services onGetStarted={() => navigate('/hire')} onJoinTeam={() => navigate('/join')} />
          <Portfolio onGetStarted={() => navigate('/hire')} />
          <BookingSection id="booking" />
        </main>
      ) : (
        <HorizontalScrollWrapper contentWidth="800vh" overrideIndex={navOverride}>
          {Content}
        </HorizontalScrollWrapper>
      )}
    </div>
  );
}
