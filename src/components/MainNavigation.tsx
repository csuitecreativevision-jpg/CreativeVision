import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
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
  onGetStarted: _,
  onBack: __
}: MainNavigationProps) {
  const [isCompact, setIsCompact] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { scrollY } = useScroll();
  const navigate = useNavigate();
  const location = useLocation();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const isScrollDown = latest > 50;
    setIsCompact(isScrollDown);
  });

  const isExpanded = !isCompact || isHovered || isMenuOpen;

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
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
      className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
    >
      <motion.nav
        layout
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={false}
        animate={{
          width: isExpanded ? "auto" : "auto",
          mixBlendMode: isExpanded ? "normal" : "difference"
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30
        }}
        className={cn(
          "pointer-events-auto flex items-center gap-2 p-2 rounded-full border shadow-2xl transition-colors duration-500",
          isExpanded
            ? "bg-black/60 backdrop-blur-xl border-white/10 shadow-black/20 pr-4"
            : "bg-white/90 border-white/20 shadow-white/10 pr-2 pl-2"
        )}
      >

        {/* Logo Area */}
        <motion.div layout className="flex items-center gap-3 pl-2">
          <img
            src="/Untitled design (3).png"
            alt="Logo"
            className="h-8 w-8 hover:rotate-12 transition-transform duration-500 cursor-pointer object-contain"
            onClick={() => scrollToSection('hero')}
          />
          <AnimatePresence>
            {isExpanded && (
              <motion.button
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => scrollToSection('hero')}
                className="text-lg font-bold tracking-tight text-white whitespace-nowrap overflow-hidden"
              >
                CreativeVision
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Actions & Links - Only visible when expanded */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center overflow-hidden"
            >
              {/* Divider */}
              <div className="h-6 w-[1px] bg-white/10 hidden md:block mx-3" />

              {/* Desktop Links */}
              <div className="hidden md:flex items-center gap-1">
                <NavButton onClick={() => scrollToSection('about')}>About</NavButton>
                <NavButton onClick={() => scrollToSection('services')}>Services</NavButton>
                <NavButton onClick={() => scrollToSection('portfolio')}>Work</NavButton>
                <NavButton onClick={() => scrollToSection('pricing')}>Pricing</NavButton>
                <NavButton onClick={() => scrollToSection('careers')}>Careers</NavButton>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 pl-3">
                <MagneticButton>
                  <button
                    onClick={() => navigate('/start')}
                    className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap"
                  >
                    Start Project
                  </button>
                </MagneticButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-full hover:bg-white/10 md:hidden ml-auto"
        >
          {isMenuOpen ? <X className={cn("w-5 h-5", isExpanded ? "text-white" : "text-black")} /> : <Menu className={cn("w-5 h-5", isExpanded ? "text-white" : "text-black")} />}
        </button>

      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="pointer-events-auto absolute top-20 left-4 right-4 p-4 rounded-2xl bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 flex flex-col gap-2 shadow-2xl"
          >
            <MobileNavLink onClick={() => scrollToSection('about')}>About</MobileNavLink>
            <MobileNavLink onClick={() => scrollToSection('services')}>Services</MobileNavLink>
            <MobileNavLink onClick={() => scrollToSection('portfolio')}>Work</MobileNavLink>
            <MobileNavLink onClick={() => scrollToSection('pricing')}>Pricing</MobileNavLink>
            <MobileNavLink onClick={() => scrollToSection('careers')}>Careers</MobileNavLink>
            <div className="h-[1px] bg-white/10 my-2" />
            <MobileNavLink onClick={() => navigate('/start')} primary>Start Project</MobileNavLink>
          </motion.div>
        )}
      </AnimatePresence>

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