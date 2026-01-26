import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Lenis from 'lenis';
import { BackgroundLayout } from './components/layout/BackgroundLayout';
import HomePage from './components/HomePage';
import HireUsPage from './components/HireUsPage';
import JoinTeamPage from './components/JoinTeamPage';
import ThankYouPage from './components/ThankYouPage';
import LoginPage from './components/LoginPage';

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5, // Increased from 1.2 for "heavier" feel
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 0.8, // Reduced from 1 for more weight
      smoothTouch: false,
      touchMultiplier: 1.5, // Reduced from 2 to avoid "slippery" feel
    } as any);

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleThankYou = () => {
    navigate('/thank-you');
  };

  return (
    <BackgroundLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/hire" element={<HireUsPage onBack={handleBack} />} />
        <Route path="/join" element={<JoinTeamPage onBack={handleBack} onThankYou={handleThankYou} />} />
        <Route path="/thank-you" element={<ThankYouPage onBack={handleBack} />} />
        <Route path="/cvportal" element={<LoginPage />} />
      </Routes>
    </BackgroundLayout>
  );
}