import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Portfolio from '../components/Portfolio';
import TrustSignals from '../components/sections/TrustSignals';
import ProblemSection from '../components/sections/ProblemSection';
import SummarySection from '../components/sections/SummarySection';
import { HorizontalScrollWrapper } from '../components/layout/HorizontalScrollWrapper';
import { motion } from 'framer-motion';

const Slide = ({ children, id, className = "", enableFlash = false }: { children: React.ReactNode, id?: string, className?: string, enableFlash?: boolean }) => {
  return (
    <section id={id} className={`w-screen h-[100svh] flex-shrink-0 flex items-center justify-center relative overflow-hidden snap-center ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ margin: "-20%", amount: 0.3 }}
        onViewportEnter={() => {
          if (enableFlash) {
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
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.target === 'services') {
      // Services is at index 4.
      // Scroll target is roughly 4 * window.innerHeight
      // We use immediate scroll or slight delay to ensure layout is ready
      setTimeout(() => {
        window.scrollTo({
          top: 4 * window.innerHeight,
          behavior: 'auto'
        });
      }, 50);

      // Clear state to prevent scroll on refresh (optional but good practice)
      window.history.replaceState({}, document.title);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  const Content = (
    <>
      {/* 0: Hero */}
      <Slide id="hero" className="hero-slide">
        <Hero onGetStarted={() => { }} />
      </Slide>

      {/* 1: Problem */}
      <Slide className="problem-slide">
        <ProblemSection />
      </Slide>

      {/* 2: Portfolio */}
      <Slide className="portfolio-slide">
        {/* Pass empty handler or remove prop if optional. Portfolio might trigger start too. */}
        <Portfolio onGetStarted={() => { }} />
      </Slide>

      {/* 3: Trust */}
      <Slide className="trust-slide">
        <TrustSignals />
      </Slide>

      {/* 4: Services */}
      <Slide className="services-slide">
        {/* Services now uses internal navigate */}
        <Services onGetStarted={() => { }} />
      </Slide>

      {/* 5: Summary / Ending */}
      <Slide className="summary-slide">
        <SummarySection />
      </Slide>
    </>
  );

  // Base 6 slides only
  const contentWidth = `${6 * 100}vh`;

  return (
    <div className="min-h-screen text-white relative bg-[#050511]">
      {/* Global Camera Flash Overlay */}
      <div id="camera-flash" className="fixed inset-0 bg-white pointer-events-none z-[100] opacity-0 mix-blend-overlay"></div>

      <HorizontalScrollWrapper contentWidth={contentWidth} overrideIndex={null}>
        {Content}
      </HorizontalScrollWrapper>
    </div>
  );
}
