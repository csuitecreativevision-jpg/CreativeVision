import { Suspense, lazy, useEffect, useLayoutEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { BackgroundLayout } from './components/layout/BackgroundLayout';
import { CinematicOverlay } from './components/ui/CinematicOverlay';
import { MainChatbot } from './components/MainChatbot';
import { canonicalUrl, routeMeta } from './seo/routes';

// The website (www.creativevision.dev). The old client/editor portal that used Monday.com was
// removed on 2026-11-09: clients and the team use the CreativeVision dashboard
// (dashboard.creativevision.dev), and the old portal addresses redirect there (vercel.json).

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

const HomePage = lazy(sitePages.home);
const DashboardsPage = lazy(sitePages.dashboards);
const BookPage = lazy(sitePages.book);
const HireUsPage = lazy(() => import('./pages/HireUsPage'));
const JoinPage = lazy(sitePages.join);
const StartProjectPage = lazy(sitePages.start);
const ThankYouPage = lazy(() => import('./pages/ThankYouPage'));
const PortfolioPage = lazy(sitePages.portfolio);
const PricingPage = lazy(sitePages.pricing);

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

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

  // Pages change instantly and open at the top (pages with a #section scroll there themselves).
  useLayoutEffect(() => {
    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;
    if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const warm = () => Object.values(sitePages).forEach((load) => void load().catch(() => undefined));
    const idle = (window as Window & { requestIdleCallback?: (callback: () => void) => number }).requestIdleCallback;
    if (idle) idle(warm);
    else window.setTimeout(warm, 1500);
  }, []);

  const handleBack = () => navigate(-1);
  const backToServices = () => navigate('/', { state: { target: 'services' } });

  return (
    <BackgroundLayout>
      <CinematicOverlay />
      {location.pathname !== '/' && <MainChatbot />}

      <div className="max-w-full overflow-x-clip">
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboards" element={<DashboardsPage />} />
            <Route path="/book" element={<BookPage />} />
            <Route path="/hire" element={<HireUsPage onBack={handleBack} />} />
            <Route path="/join" element={<JoinPage onBack={backToServices} />} />
            <Route path="/start" element={<StartProjectPage />} />
            <Route path="/thank-you" element={<ThankYouPage onBack={handleBack} />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/pricing/:type" element={<PricingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BackgroundLayout>
  );
}
