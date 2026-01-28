import { useState, useEffect, useCallback } from 'react';
import Hero from './Hero';
import Services from './Services';
import Portfolio from './Portfolio';
import TrustSignals from './sections/TrustSignals';
import ProblemSection from './sections/ProblemSection';
import CareersSection from './CareersSection';
import PricingSection from './PricingSection';
import PlanShowcase from './PlanShowcase';
import SummarySection from './sections/SummarySection';
import ExperienceIntro from './sections/ExperienceIntro';
import { HorizontalScrollWrapper } from './layout/HorizontalScrollWrapper';
import { packages } from '../data/pricingData';
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
  const [navOverride, setNavOverride] = useState<number | null>(null);
  const [projectFlowActive, setProjectFlowActive] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePlanNext = useCallback((currentIndex: number) => {
    setNavOverride(currentIndex + 1);
  }, []);

  const handleStartProject = useCallback(() => {
    setProjectFlowActive(true);
    setTimeout(() => setNavOverride(6), 50);
  }, []);

  const handlePlanBack = (currentIndex: number) => {
    if (currentIndex === 6) {
      // Back from Intro Slide -> Exit Project Flow
      setProjectFlowActive(false);
      setNavOverride(4); // Visually lock to Services (Index 4)

      // Restore scroll position after DOM update so the user can scroll again
      // Increased timeout to ensure height reconciliation is complete
      setTimeout(() => {
        const scrollTarget = 4 * window.innerHeight; // 4th slide position
        window.scrollTo({
          top: scrollTarget,
          behavior: 'auto' // Use auto/instant to prevent fighting
        });

        // Unlock navigation in next frame
        requestAnimationFrame(() => {
          setNavOverride(null);
        });
      }, 300);
    } else {
      setNavOverride(currentIndex - 1);
    }
  };

  const Content = (
    <>
      {/* 0: Hero */}
      <Slide id="hero" className="hero-slide">
        <Hero onGetStarted={handleStartProject} />
      </Slide>

      {/* 1: Problem */}
      <Slide className="problem-slide">
        <ProblemSection />
      </Slide>

      {/* 2: Portfolio */}
      <Slide className="portfolio-slide" enableFlash>
        <Portfolio onGetStarted={handleStartProject} />
      </Slide>

      {/* 3: Trust */}
      <Slide className="trust-slide">
        <TrustSignals />
      </Slide>

      {/* 4: Services */}
      <Slide className="services-slide">
        <Services onGetStarted={handleStartProject} onJoinTeam={() => setNavOverride(13)} />
      </Slide>

      {/* 5: Summary / Ending (Visible) */}
      <Slide className="summary-slide">
        <SummarySection />
      </Slide>

      {/* -- PROJECT FLOW START -- */}

      {/* 6: Experience Intro (Conditionally Rendered) */}
      {projectFlowActive && (
        <Slide className="intro-slide flex">
          <div className="relative w-full h-full">
            <button
              onClick={() => handlePlanBack(6)}
              className="absolute top-8 left-8 z-50 px-6 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md uppercase text-sm tracking-widest font-bold"
            >
              ← Back
            </button>
            <ExperienceIntro onNext={() => handlePlanNext(6)} />
          </div>
        </Slide>
      )}

      {/* 7-11: Individual Plan Showcases (Conditionally Rendered) */}
      {projectFlowActive && packages.map((pkg, index) => {
        const slideIndex = 7 + index;
        return (
          <Slide key={pkg.name} className={`plan-slide-${index} flex`}>
            <div className="relative w-full h-full">
              <button
                onClick={() => handlePlanBack(slideIndex)}
                className="absolute top-8 left-8 z-50 px-6 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md uppercase text-sm tracking-widest font-bold"
              >
                ← Back
              </button>
              <PlanShowcase
                packageData={pkg}
                onNext={() => handlePlanNext(slideIndex)}
                onSelect={() => {
                  setNavOverride(12);
                }}
              />
            </div>
          </Slide>
        );
      })}

      {/* 12: Pricing Comparison Grid (Conditionally Rendered) */}
      {projectFlowActive && (
        <Slide className="pricing-slide flex">
          <div className="relative w-full h-full">
            <button
              onClick={() => setNavOverride(11)} // Back to last plan (Platinum is 11)
              className="absolute top-8 left-8 z-50 px-6 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md uppercase text-sm tracking-widest font-bold"
            >
              ← Back
            </button>
            <PricingSection id="pricing" />
          </div>
        </Slide>
      )}

      {/* 13: Careers (Hidden unless accessed) */}
      <Slide className={`careers-slide ${navOverride === 13 ? 'flex' : 'hidden'}`}>
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

  // Calculate effective index for scroll wrapper
  // If Project Flow is INACTIVE, the intermediate slides (6-12) are hidden.
  // So index 13 (Careers) physically shifts to position 6 (after Summary).
  const effectiveIndex = navOverride === 13 && !projectFlowActive ? 6 : navOverride;

  // Base 6 (0-5) + Project 7 (6-12) + Careers 1 (13)
  const totalSlides = 6 + (projectFlowActive ? 7 : 0) + (navOverride === 13 ? 1 : 0);
  const contentWidth = `${totalSlides * 100}vh`;

  return (
    <div className="min-h-screen text-white relative bg-[#050511]">
      {/* Global Camera Flash Overlay */}
      <div id="camera-flash" className="fixed inset-0 bg-white pointer-events-none z-[100] opacity-0 mix-blend-overlay"></div>

      <HorizontalScrollWrapper contentWidth={contentWidth} overrideIndex={effectiveIndex}>
        {Content}
      </HorizontalScrollWrapper>
    </div>
  );
}
