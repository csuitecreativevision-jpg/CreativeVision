import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { MagneticButton } from './ui/MagneticButton';
import { useNavigate, useLocation } from 'react-router-dom';

interface MainNavigationProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  onGetStarted: () => void;
  onBack?: () => void;
}

export default function MainNavigation({
  isMenuOpen,
  setIsMenuOpen,
  onGetStarted,
  onBack
}: MainNavigationProps) {
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();
  const navigate = useNavigate();
  const location = useLocation();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const scrollToSection = (sectionId: string) => {
    // If not on homepage, navigate home first
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <motion.header
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: -100, opacity: 0 }
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
    >
      <nav className="pointer-events-auto flex items-center gap-2 p-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/20">

        {/* Logo Area */}
        <div className="pl-4 pr-2 flex items-center gap-3">
          <img
            src="/Untitled design (3).png"
            alt="Logo"
            className="h-8 w-auto hover:rotate-12 transition-transform duration-500 cursor-pointer"
            onClick={() => scrollToSection('hero')}
          />
          <button
            onClick={() => scrollToSection('hero')}
            className="text-lg font-bold tracking-tight text-white hidden sm:block"
          >
            CreativeVision
          </button>
        </div>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-white/10 hidden md:block" />

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          <NavButton onClick={() => scrollToSection('about')}>About</NavButton>
          <NavButton onClick={() => scrollToSection('services')}>Services</NavButton>
          <NavButton onClick={() => scrollToSection('portfolio')}>Work</NavButton>
          <NavButton onClick={() => scrollToSection('pricing')}>Pricing</NavButton>
          <NavButton onClick={() => scrollToSection('careers')}>Careers</NavButton>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pl-2">
          <MagneticButton>
            <button
              onClick={() => scrollToSection('pricing')}
              className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Start Project
            </button>
          </MagneticButton>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white md:hidden transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="pointer-events-auto absolute top-20 left-4 right-4 p-4 rounded-2xl bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 flex flex-col gap-2"
        >
          <MobileNavLink onClick={() => scrollToSection('about')}>About</MobileNavLink>
          <MobileNavLink onClick={() => scrollToSection('services')}>Services</MobileNavLink>
          <MobileNavLink onClick={() => scrollToSection('portfolio')}>Work</MobileNavLink>
          <MobileNavLink onClick={() => scrollToSection('pricing')}>Pricing</MobileNavLink>
          <MobileNavLink onClick={() => scrollToSection('careers')}>Careers</MobileNavLink>
          <div className="h-[1px] bg-white/10 my-2" />
          <MobileNavLink onClick={() => scrollToSection('pricing')} primary>Start Project</MobileNavLink>
        </motion.div>
      )}

    </motion.header>
  );
}

const NavButton = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 rounded-full text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
  >
    {children}
  </button>
);

const MobileNavLink = ({ children, onClick, primary }: { children: React.ReactNode, onClick: () => void, primary?: boolean }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors",
      primary ? "bg-white text-black" : "text-gray-300 hover:bg-white/5 hover:text-white"
    )}
  >
    {children}
  </button>
);