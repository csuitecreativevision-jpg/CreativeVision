import { useEffect } from 'react';

/**
 * For the website's normal scrolling pages (home, dashboards): shows the page scrollbar, lets
 * people select text and draws clear keyboard focus rings (see `html.cv-scroll` in index.css).
 * The tab title and description come from src/seo/routes.ts (App.tsx).
 */
export function useSitePage() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('cv-scroll');
    return () => html.classList.remove('cv-scroll');
  }, []);
}
