// The website's public pages: what search engines and link previews show for each one.
// Used in the browser (App.tsx keeps the tab title, description and canonical address up to date)
// and when the pages are pre-built for search engines (scripts/prerender.mjs).
export const SITE_URL = 'https://www.creativevision.dev';
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export type RouteMeta = {
  path: string;
  title: string;
  description: string;
  /** Pre-build the page's content into its HTML (it has a server-safe page component). */
  prerender?: 'home' | 'dashboards';
};

export const ROUTES: RouteMeta[] = [
  {
    path: '/',
    title: 'CreativeVision | Video Editing & Custom Dashboards',
    description:
      'CreativeVision edits short and long videos people actually watch, and builds custom dashboards that keep your clients, team, projects and payments in one place.',
    prerender: 'home',
  },
  {
    path: '/dashboards',
    title: 'Custom Dashboards for Your Business | CreativeVision',
    description:
      'CreativeVision builds private online dashboards for businesses: a client portal, projects, team, payments, messages and a calendar in one place, on computer and phone.',
    prerender: 'dashboards',
  },
  {
    path: '/start',
    title: 'Start a Project | CreativeVision',
    description: 'Tell CreativeVision what you need: short videos, long videos, both, or a custom dashboard. See what’s included and book a free call.',
  },
  {
    path: '/portfolio',
    title: 'Our Work | CreativeVision',
    description: 'Short and long video edits by the CreativeVision team for creators and brands.',
  },
  {
    path: '/pricing/short-form',
    title: 'Short Video Editing Plans | CreativeVision',
    description: 'CreativeVision plans for editing Reels, TikTok and YouTube Shorts.',
  },
  {
    path: '/pricing/long-form',
    title: 'Long Video Editing Plans | CreativeVision',
    description: 'CreativeVision plans for editing YouTube videos, podcasts, courses and ads.',
  },
  {
    path: '/pricing/mixed',
    title: 'Short and Long Video Plans | CreativeVision',
    description: 'CreativeVision plans that combine short and long video editing.',
  },
  {
    path: '/join',
    title: 'Join Our Team | CreativeVision',
    description: 'Video editors: apply to join the CreativeVision team.',
  },
];

export const routeMeta = (pathname: string) => {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return ROUTES.find((route) => route.path === path);
};

export const canonicalUrl = (path: string) => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`);
