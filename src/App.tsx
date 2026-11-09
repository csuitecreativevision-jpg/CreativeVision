import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { AnimatePresence, motion } from 'framer-motion';
import { BackgroundLayout } from './components/layout/BackgroundLayout';
import { CinematicOverlay } from './components/ui/CinematicOverlay';
import { ThreeLogoLoader } from './components/ui/ThreeLogoLoader';
import { MainChatbot } from './components/MainChatbot';
import { canonicalUrl, routeMeta } from './seo/routes';

// The website's pages. They're loaded quietly in the background once the first page is up
// (see the effect in App), so moving between them is instant.
const sitePages = {
  home: () => import('./pages/HomePage'),
  dashboards: () => import('./pages/DashboardsPage'),
  book: () => import('./pages/BookPage'),
  start: () => import('./pages/StartProjectPage'),
  portfolio: () => import('./pages/PortfolioPage'),
  pricing: () => import('./pages/PricingPage'),
  join: () => import('./pages/JoinPage'),
};

// Lazy Load Pages
const HomePage = lazy(sitePages.home);
const DashboardsPage = lazy(sitePages.dashboards);
const BookPage = lazy(sitePages.book);
const HireUsPage = lazy(() => import('./pages/HireUsPage'));
const JoinPage = lazy(sitePages.join);
const StartProjectPage = lazy(sitePages.start);
const ThankYouPage = lazy(() => import('./pages/ThankYouPage'));
const PortfolioPage = lazy(sitePages.portfolio);
const PricingPage = lazy(sitePages.pricing);
const PortalPage = lazy(() => import('./pages/PortalPage'));
const PortalRouter = lazy(() => import('./pages/PortalRouter'));
const AdminPortal = lazy(() => import('./pages/AdminPortal'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminManagement = lazy(() => import('./pages/admin/AdminManagement'));
const AdminProjectAssignment = lazy(() => import('./pages/admin/AdminProjectAssignment'));
const AdminClientOnboarding = lazy(() => import('./pages/admin/AdminClientOnboarding'));
const AdminBoards = lazy(() => import('./pages/admin/AdminBoards'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminTeam = lazy(() => import('./pages/admin/AdminTeam'));
const AdminClients = lazy(() => import('./pages/admin/AdminClients'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminApprovalCenter = lazy(() => import('./pages/admin/AdminApprovalCenter'));
const AdminDeploymentCenter = lazy(() => import('./pages/admin/AdminDeploymentCenter'));
const AdminDeployedProjects = lazy(() => import('./pages/admin/AdminDeployedProjects'));
const EditorPortal = lazy(() => import('./pages/EditorPortal'));
const ClientPortal = lazy(() => import('./pages/ClientPortal'));
const AdminUserManagement = lazy(() => import('./pages/admin/AdminUserManagement'));
const AdminTimeLogs = lazy(() => import('./pages/admin/AdminTimeLogs'));
const AdminLeaveApprovals = lazy(() => import('./pages/admin/AdminLeaveApprovals'));
const AdminCalendar = lazy(() => import('./pages/admin/AdminCalendar'));

const isNativeAppShell = Capacitor.isNativePlatform();

/** The old portal (and its 3D logo loading screen); every other address is the website. */
const PORTAL_PREFIXES = ['/portal', '/admin-dashboard', '/admin-portal', '/editor-portal', '/client-portal'];
const isPortalRoute = (path: string) => PORTAL_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const REQUIRED_SECRET_CLICKS = 2;
  const [routeLoading, setRouteLoading] = useState(false);
  const prevPathRef = useRef(location.pathname);
  const routeLoaderTimerRef = useRef<number | null>(null);

  // Secret portal logic
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const handleSecretClick = () => {
    const now = Date.now();
    if (now - lastClickTime > 2000) {
      setClickCount(1);
    } else {
      setClickCount((previousCount) => {
        const newCount = previousCount + 1;
        if (newCount >= REQUIRED_SECRET_CLICKS) {
          window.location.href = '/portal';
        }
        return newCount;
      });
    }
    setLastClickTime(now);
  };

  useEffect(() => {
    // Lenis removed for native scroll feel
  }, []);

  // The tab title, description and canonical address of each public page (src/seo/routes.ts),
  // so search engines index www.creativevision.dev and each page's own address.
  useEffect(() => {
    const meta = routeMeta(location.pathname);
    if (!meta) return;
    document.title = meta.title;
    const set = (selector: string, attribute: 'content' | 'href', value: string) => {
      document.querySelector(selector)?.setAttribute(attribute, value);
    };
    const url = canonicalUrl(meta.path);
    set('meta[name="description"]', 'content', meta.description);
    set('link[rel="canonical"]', 'href', url);
    set('meta[property="og:url"]', 'content', url);
    set('meta[property="og:title"]', 'content', meta.title);
    set('meta[property="og:description"]', 'content', meta.description);
  }, [location.pathname]);

  useLayoutEffect(() => {
    const isStartupNativePath =
      isNativeAppShell &&
      (location.pathname === '/' ||
        location.pathname === '/admin-dashboard' ||
        location.pathname === '/portal');
    if (isStartupNativePath) {
      prevPathRef.current = location.pathname;
      setRouteLoading(false);
      return;
    }
    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;
    // Website pages change instantly and open at the top (pages with a #section scroll there
    // themselves); the loading screen is only for the portal.
    if (!isPortalRoute(location.pathname)) {
      setRouteLoading(false);
      if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      return;
    }
    setRouteLoading(true);
    if (routeLoaderTimerRef.current) {
      window.clearTimeout(routeLoaderTimerRef.current);
    }
    routeLoaderTimerRef.current = window.setTimeout(() => {
      setRouteLoading(false);
    }, 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (isNativeAppShell || isPortalRoute(location.pathname)) return;
    const warm = () => Object.values(sitePages).forEach((load) => void load().catch(() => undefined));
    const idle = (window as Window & { requestIdleCallback?: (callback: () => void) => number }).requestIdleCallback;
    if (idle) idle(warm);
    else window.setTimeout(warm, 1500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (routeLoaderTimerRef.current) {
        window.clearTimeout(routeLoaderTimerRef.current);
      }
    };
  }, []);

  const handleBack = () => {
    navigate(-1);
  };
  const isPortalPath =
    location.pathname.startsWith('/admin-portal') ||
    location.pathname.startsWith('/editor-portal') ||
    location.pathname.startsWith('/client-portal');
  const suppressNativeLoader =
    isNativeAppShell &&
    (location.pathname === '/' ||
      location.pathname === '/admin-dashboard' ||
      location.pathname === '/portal');

  return (
    <BackgroundLayout>
      <AnimatePresence>
        {!suppressNativeLoader && routeLoading ? (
          <motion.div
            className={`fixed inset-0 z-[120] ${isPortalPath && !isNativeAppShell ? 'lg:left-[240px]' : ''}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <ThreeLogoLoader />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {/* Preloader removed */}
      <CinematicOverlay />

      {/* Global Floating Secret Portal Trigger - Bottom Left */}
      {!isNativeAppShell &&
        location.pathname !== '/portal' &&
        location.pathname !== '/admin-dashboard' &&
        !location.pathname.startsWith('/admin-portal') &&
        !location.pathname.startsWith('/editor-portal') &&
        !location.pathname.startsWith('/client-portal') && (
          <>
            <div className="fixed left-6 bottom-6 z-50 opacity-10 hover:opacity-40 transition-opacity duration-300">
              <img
                src="/Untitled design (3).png"
                alt="CV"
                className="w-10 h-10 object-contain cursor-pointer"
                width="40"
                height="40"
                onClick={handleSecretClick}
              />
            </div>
            {location.pathname !== '/' && <MainChatbot />}
          </>
        )}

      {/* Main Routing */}
      <motion.div
        className="max-w-full overflow-x-clip"
        animate={{ opacity: !suppressNativeLoader && routeLoading && !isPortalPath ? 0 : 1 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        <Suspense fallback={suppressNativeLoader || !isPortalRoute(location.pathname) ? null : <ThreeLogoLoader />}>
          <Routes>
            <Route
              path="/"
              element={
                isNativeAppShell ? (
                  <Navigate to="/admin-dashboard" replace />
                ) : (
                  <HomePage />
                )
              }
            />
            <Route path="/dashboards" element={<DashboardsPage />} />
            <Route path="/book" element={<BookPage />} />
            <Route path="/hire" element={<HireUsPage onBack={handleBack} />} />
            <Route path="/join" element={<JoinPage onBack={() => {
              navigate('/', { state: { target: 'services' } });
            }} />} />
            <Route path="/start" element={<StartProjectPage onBack={() => {
              navigate('/', { state: { target: 'services' } });
            }} />} />
            <Route path="/thank-you" element={<ThankYouPage onBack={handleBack} />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/pricing/:type" element={<PricingPage />} />
            <Route path="/portal" element={<PortalPage />} />
            <Route path="/admin-dashboard" element={<PortalRouter />} />
            <Route path="/admin-portal" element={<AdminPortal />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<AdminOverview />} />
              <Route path="management" element={<AdminManagement />} />
              <Route path="assign-project" element={<AdminProjectAssignment />} />
              <Route path="client-onboarding" element={<AdminClientOnboarding />} />
              <Route path="boards" element={<AdminBoards />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="team" element={<AdminTeam />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="users" element={<AdminUserManagement />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="approvals" element={<AdminApprovalCenter />} />
              <Route path="deployed-projects" element={<AdminDeployedProjects />} />
              <Route path="deployments" element={<AdminDeploymentCenter />} />
              <Route path="time-logs" element={<AdminTimeLogs />} />
              <Route path="leave-approvals" element={<AdminLeaveApprovals />} />
              <Route path="calendar" element={<AdminCalendar />} />
            </Route>
            <Route path="/editor-portal" element={<EditorPortal />} />
            <Route path="/client-portal" element={<ClientPortal />} />
          </Routes>
        </Suspense>
      </motion.div>
    </BackgroundLayout>
  );
}