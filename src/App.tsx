import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

import { BackgroundLayout } from './components/layout/BackgroundLayout';
import HomePage from './components/HomePage';
import HireUsPage from './components/HireUsPage';
import JoinTeamPage from './components/JoinTeamPage';
import ThankYouPage from './components/ThankYouPage';
import LoginPage from './components/LoginPage';

export default function App() {
  const navigate = useNavigate();

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