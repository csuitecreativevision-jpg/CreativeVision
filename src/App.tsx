import { useEffect } from 'react';
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