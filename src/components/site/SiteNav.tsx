import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import { DASHBOARD_URL } from './links';

const LINKS = [
  { to: '/#services', label: 'Services' },
  { to: '/dashboards', label: 'Dashboards' },
  { to: '/#work', label: 'Our work' },
  { to: '/#faq', label: 'FAQ' },
];

export function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <img src="/Untitled design (3).png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
      <span className="text-[17px] tracking-tight">
        <span className="font-semibold text-white">Creative</span>
        <span className="font-display italic text-violet-300">Vision</span>
      </span>
    </span>
  );
}

/** The website's top bar: links, client sign in and "Start a project" (a menu on phones). */
export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.key]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const solid = scrolled || open;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-black"
      >
        Skip to content
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-[90] border-b transition-colors duration-300 ${
          solid ? 'border-white/[0.07] bg-[#050508]/90 backdrop-blur-xl' : 'border-transparent bg-transparent'
        }`}
      >
        <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="CreativeVision, home" className="rounded-lg">
            <Brand />
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="rounded-full px-3.5 py-2 text-sm text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-2 md:flex">
            <a href={DASHBOARD_URL} className="rounded-full px-3.5 py-2 text-sm text-white/75 transition-colors hover:text-white">
              Client sign in
            </a>
            <Link
              to="/start"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-violet-100"
            >
              Start a project <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="site-menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-white md:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
        </nav>

        {open && (
          <div id="site-menu" className="border-t border-white/[0.06] px-4 pb-6 pt-2 md:hidden">
            <ul className="flex flex-col">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="block rounded-xl px-3 py-3.5 text-base text-white/85 hover:bg-white/[0.05]">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={DASHBOARD_URL} className="block rounded-xl px-3 py-3.5 text-base text-white/85 hover:bg-white/[0.05]">
                  Client sign in
                </a>
              </li>
            </ul>
            <Link to="/start" className="mt-3 flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-base font-semibold text-black">
              Start a project <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </header>
    </>
  );
}
