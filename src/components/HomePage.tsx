import { useState, useEffect } from 'react';
import Hero from './Hero';
import About from './About';
import Services from './Services';
import Portfolio from './Portfolio';
import MainNavigation from './MainNavigation';
import PricingSection from './PricingSection';
import CareersSection from './CareersSection';
import TrustSignals from './sections/TrustSignals';
import { HorizontalScrollWrapper } from './layout/HorizontalScrollWrapper';

import { motion } from 'framer-motion';

const Slide = ({ children, id, className = "" }: { children: React.ReactNode, id?: string, className?: string }) => (
  <section id={id} className={`w-screen h-screen flex-shrink-0 flex items-center justify-center relative overflow-hidden ${className}`}>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ margin: "-20%" }} // Trigger when significant portion is visible
      className="w-full h-full flex items-center justify-center"
    >
      {children}
    </motion.div>
  </section>
);

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  // For horizontal scroll, we need real horizontal navigation.
  // We'll rely on the visual flow.
  const scrollToSection = (id: string) => {
    // Custom logic could be added here to scroll to specific % of the track
    // based on the section index, but for now linear scroll is provided.
  };

  const Content = (
    <>
      <Slide id="hero" className="hero-slide">
        <Hero onGetStarted={() => scrollToSection('pricing')} />
      </Slide>

      <Slide className="trust-slide">
        <TrustSignals />
      </Slide>

      <Slide className="about-slide">
        <About />
      </Slide>

      {/* Services might need more space, but we'll try to fit it or let it overflow if adaptable */}
      <Slide className="services-slide">
        <Services onGetStarted={() => scrollToSection('pricing')} onJoinTeam={() => scrollToSection('careers')} />
      </Slide>

      <Slide className="portfolio-slide">
        <Portfolio onGetStarted={() => scrollToSection('pricing')} />
      </Slide>

      <Slide className="pricing-slide">
        <PricingSection id="pricing" />
      </Slide>

      <Slide className="careers-slide">
        <CareersSection id="careers" />
      </Slide>
    </>
  );

  return (
    <div className="min-h-screen text-white relative bg-[#050511]">
      <MainNavigation
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onGetStarted={() => scrollToSection('pricing')}
        onBack={() => { }}
      />

      {isMobile ? (
        <main className="flex flex-col">
          <div id="hero"><Hero onGetStarted={() => scrollToSection('pricing')} /></div>
          <About />
          <Services onGetStarted={() => scrollToSection('pricing')} onJoinTeam={() => scrollToSection('careers')} />
          <Portfolio onGetStarted={() => scrollToSection('pricing')} />
          <PricingSection id="pricing" />
          <CareersSection id="careers" />
        </main>
      ) : (
        <HorizontalScrollWrapper contentWidth="800vh">
          {Content}
        </HorizontalScrollWrapper>
      )}
    </div>
  );
}
