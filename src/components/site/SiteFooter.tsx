import { Link } from 'react-router-dom';
import { Brand } from './SiteNav';
import { DASHBOARD_URL } from './links';

const linkClass = 'text-white/65 transition-colors hover:text-white';

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.07] px-4 pb-24 pt-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Brand />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            Video editing and custom dashboards for creators and growing businesses.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Services</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link to="/pricing/short-form" className={linkClass}>Short videos</Link></li>
            <li><Link to="/pricing/long-form" className={linkClass}>Long videos</Link></li>
            <li><Link to="/dashboards" className={linkClass}>Custom dashboards</Link></li>
            <li><Link to="/portfolio" className={linkClass}>Our work</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Get in touch</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link to="/start" className={linkClass}>Start a project</Link></li>
            <li><Link to="/book" className={linkClass}>Book a free call</Link></li>
            <li><Link to="/join" className={linkClass}>Join our team</Link></li>
            <li><a href={DASHBOARD_URL} className={linkClass}>Client sign in</a></li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-7xl text-xs text-white/50">© {new Date().getFullYear()} CreativeVision. All rights reserved.</p>
    </footer>
  );
}
