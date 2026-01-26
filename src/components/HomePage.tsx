import { useState } from 'react';
import Hero from './Hero';
import About from './About';
import Services from './Services';
import Portfolio from './Portfolio';
import Footer from './Footer';
import MainNavigation from './MainNavigation';
import PricingSection from './PricingSection';
import CareersSection from './CareersSection';

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen text-white relative">

      {/* Navigation */}
      <MainNavigation
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onGetStarted={() => scrollToSection('pricing')}
        onBack={() => { }}
      />

      {/* Main Content */}
      <main>
        <div id="hero">
          <Hero onGetStarted={() => scrollToSection('pricing')} />
        </div>
        <About />
        <Services onGetStarted={() => scrollToSection('pricing')} onJoinTeam={() => scrollToSection('careers')} />
        <Portfolio onGetStarted={() => scrollToSection('pricing')} />
        <PricingSection id="pricing" />
        <CareersSection id="careers" />
        <Footer />
      </main>
    </div>
  );
}
