import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import { BackgroundLayout } from './components/layout/BackgroundLayout';
import { CinematicOverlay } from './components/ui/CinematicOverlay';
import { Preloader } from './components/ui/Preloader';
import HomePage from './components/HomePage';
import HireUsPage from './components/HireUsPage';
import JoinTeamPage from './components/JoinTeamPage';
import ThankYouPage from './components/ThankYouPage';
import PortalPage from './components/PortalPage';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Secret portal logic
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const handleSecretClick = () => {
    const now = Date.now();
    if (now - lastClickTime > 2000) {
      setClickCount(1);
    } else {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount >= 5) window.location.href = '/portal';
    }
    setLastClickTime(now);
  };

  useEffect(() => {
    // Lenis removed for native scroll feel
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleThankYou = () => {
    navigate('/thank-you');
  };

  return (
    <BackgroundLayout>
      {location.pathname !== '/portal' && <Preloader />}
      <CinematicOverlay />

      {/* Global Floating Secret Portal Trigger - Bottom Left */}
      {location.pathname !== '/portal' && (
        <div className="fixed left-6 bottom-6 z-50 opacity-10 hover:opacity-40 transition-opacity duration-300">
          <img
            src="/Untitled design (3).png"
            alt="CV"
            className="w-10 h-10 object-contain cursor-pointer"
            onClick={handleSecretClick}
          />
        </div>
      )}

      {/* Main Routing */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/hire" element={<HireUsPage onBack={handleBack} />} />
        <Route path="/join" element={<JoinTeamPage onBack={handleBack} onThankYou={handleThankYou} />} />
        <Route path="/thank-you" element={<ThankYouPage onBack={handleBack} />} />
        <Route path="/portal" element={<PortalPage />} />
      </Routes>
    </BackgroundLayout>
  );
}