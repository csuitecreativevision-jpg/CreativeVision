import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { BackgroundLayout } from './components/layout/BackgroundLayout';
import { CinematicOverlay } from './components/ui/CinematicOverlay';
import { Preloader } from './components/ui/Preloader';

// Lazy Load Pages
const HomePage = lazy(() => import('./pages/HomePage'));
const HireUsPage = lazy(() => import('./pages/HireUsPage'));
const JoinPage = lazy(() => import('./pages/JoinPage'));
const StartProjectPage = lazy(() => import('./pages/StartProjectPage'));
const ThankYouPage = lazy(() => import('./pages/ThankYouPage'));
const PortalPage = lazy(() => import('./pages/PortalPage'));
const PortalRouter = lazy(() => import('./pages/PortalRouter'));
const AdminPortal = lazy(() => import('./pages/AdminPortal'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminManagement = lazy(() => import('./pages/admin/AdminManagement'));
const AdminProjectAssignment = lazy(() => import('./pages/admin/AdminProjectAssignment'));
const AdminBoards = lazy(() => import('./pages/admin/AdminBoards'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminTeam = lazy(() => import('./pages/admin/AdminTeam'));
const AdminClients = lazy(() => import('./pages/admin/AdminClients'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const EditorPortal = lazy(() => import('./pages/EditorPortal'));
const ClientPortal = lazy(() => import('./pages/ClientPortal'));

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

  return (
    <BackgroundLayout>
      {location.pathname !== '/portal' && location.pathname !== '/admin-dashboard' && <Preloader />}
      <CinematicOverlay />

      {/* Global Floating Secret Portal Trigger - Bottom Left */}
      {location.pathname !== '/portal' && location.pathname !== '/admin-dashboard' && (
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
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white"><Preloader /></div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/hire" element={<HireUsPage onBack={handleBack} />} />
          <Route path="/join" element={<JoinPage onBack={() => {
            navigate('/', { state: { target: 'services' } });
          }} />} />
          <Route path="/start" element={<StartProjectPage onBack={() => {
            navigate('/', { state: { target: 'services' } });
          }} />} />
          <Route path="/thank-you" element={<ThankYouPage onBack={handleBack} />} />
          <Route path="/portal" element={<PortalPage />} />
          <Route path="/admin-dashboard" element={<PortalRouter />} />
          <Route path="/admin-portal" element={<AdminPortal />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminOverview />} />
            <Route path="management" element={<AdminManagement />} />
            <Route path="assign-project" element={<AdminProjectAssignment />} />
            <Route path="boards" element={<AdminBoards />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>
          <Route path="/editor-portal" element={<EditorPortal />} />
          <Route path="/client-portal" element={<ClientPortal />} />
        </Routes>
      </Suspense>
    </BackgroundLayout>
  );
}