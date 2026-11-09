// Server build used only by scripts/prerender.mjs: renders the website's main pages to HTML, so
// search engines and link previews read the real text without running the app.
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardsPage from './pages/DashboardsPage';

export { ROUTES, SITE_URL, canonicalUrl } from './seo/routes';

const PAGES = { home: HomePage, dashboards: DashboardsPage };

export function render(page: keyof typeof PAGES, url: string) {
  const Page = PAGES[page];
  return renderToString(
    <StaticRouter location={url}>
      <Page />
    </StaticRouter>,
  );
}
