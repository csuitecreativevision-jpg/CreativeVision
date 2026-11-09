import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Clapperboard, LayoutDashboard, Minus, Plus } from 'lucide-react';
import { SiteNav } from '../components/site/SiteNav';
import { SiteFooter } from '../components/site/SiteFooter';
import { DashboardMock } from '../components/site/DashboardMock';
import { VideoStrip } from '../components/site/VideoStrip';
import { Eyebrow, Reveal } from '../components/site/Reveal';
import { useSitePage } from '../components/site/useSitePage';
import { CALL_URL } from '../components/site/links';

const isServer = typeof window === 'undefined';

export const faqs = [
  {
    question: 'What is CreativeVision?',
    answer:
      'CreativeVision is a video editing team that also builds custom dashboards. We edit short and long videos for creators and brands, and we build private online dashboards that keep a business’s clients, team, projects and payments in one place.',
  },
  {
    question: 'How fast will I get my videos?',
    answer:
      'Most short videos are ready in 24 to 48 hours. Longer or more detailed videos usually take 3 to 5 business days. We confirm the timeline with you before we start.',
  },
  {
    question: 'Can you handle a lot of videos every month?',
    answer:
      'Yes. You get dedicated editors who learn your style, so the quality stays the same even at 30 or more videos a month per creator.',
  },
  {
    question: 'Can I ask for changes?',
    answer:
      'Yes. Every video includes two rounds of changes. You leave your notes right on the video, at the exact moment you mean.',
  },
  {
    question: 'What kinds of videos do you edit?',
    answer: 'Short videos for Reels, TikTok and YouTube Shorts, long YouTube videos and podcasts, ads, online courses and trailers.',
  },
  {
    question: 'What is a custom dashboard?',
    answer:
      'A private website just for your business. Your clients, team, projects, files and payments live in one place, and everyone signs in from a computer or phone. We build it around the way you already work.',
  },
  {
    question: 'How much does a dashboard cost, and how long does it take?',
    answer:
      'It depends on what you need. After a free call, we send you a clear plan with the price and the timeline. Nothing starts until you say yes.',
  },
];

const ROTATING = ['Content', 'Watch Time', 'Stories', 'Footage', 'Views'];

const STATS = [
  { value: 250, suffix: 'M+', label: 'Views generated' },
  { value: 24, suffix: 'h', label: 'Turnaround time' },
  { value: 98, suffix: '%', label: 'Retention rate' },
  { value: 2, suffix: 'x', label: 'Average ROI' },
];

const CLIENTS = [
  { name: 'RFX', style: 'tracking-[0.3em] text-2xl md:text-3xl font-black uppercase' },
  { name: 'Kala Capital Partners', style: 'tracking-[0.08em] text-sm md:text-lg font-bold uppercase' },
  { name: 'Kerns Marketing', style: 'tracking-[0.12em] text-base md:text-xl font-bold uppercase' },
];

const STEPS = [
  { title: 'Tell us what you need', text: 'Pick a service and book a free call with us.' },
  { title: 'Get a clear plan', text: 'We agree on what you’ll get, the price and the timeline before any work starts.' },
  { title: 'We get to work', text: 'You check every video, or every part of your dashboard, and ask for changes along the way.' },
];

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-black shadow-[0_0_40px_rgba(255,255,255,0.18)] transition hover:bg-violet-100';
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-base font-medium text-white transition hover:border-white/40 hover:bg-white/[0.05]';

function Highlight({ children }: { children: React.ReactNode }) {
  return <span className="italic text-violet-300 text-glow-violet">{children}</span>;
}

export default function HomePage() {
  useSitePage();
  const location = useLocation();
  const reduce = useReducedMotion();

  // Links like /#work or /#faq (from the menu or other pages) scroll to that part of the page.
  useEffect(() => {
    let id = location.hash.replace('#', '');
    if (id === 'showcase') id = 'work';
    const state = location.state as { target?: string } | null;
    if (!id && state?.target === 'services') id = 'services';
    const timer = window.setTimeout(() => {
      // The logo or "Home" while already here: back to the top.
      if (!id) return window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }, 60);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative bg-[#050508] font-sans text-white selection:bg-violet-500/30">
        <div className="bg-noise" aria-hidden="true" />
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute left-[-10%] top-[-10%] h-[40vw] w-[40vw] rounded-full bg-violet-600/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[50vw] w-[50vw] rounded-full bg-fuchsia-600/10 blur-[150px]" />
        </div>

        <SiteNav />

        <main id="main" tabIndex={-1} className="relative z-10 outline-none">
          <Hero />
          <Services />
          <DashboardSpotlight />
          <Work />
          <Results />
          <About />
          <HowItWorks />
          <Faq />
          <FinalCta />
        </main>

        <SiteFooter />
      </div>
    </MotionConfig>
  );
}

function Hero() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % ROTATING.length), 3000);
    return () => window.clearInterval(timer);
  }, [reduce]);

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-4 pb-16 pt-28 text-center sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.07)_0%,transparent_55%)]" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-5xl">
        <p className="glass-panel mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white/75">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" aria-hidden="true" />
          Accepting new clients
        </p>

        <h1 className="font-display text-5xl font-medium leading-[0.95] tracking-tight text-glow-premium sm:text-7xl lg:text-8xl">
          <span className="sr-only">Turn content into revenue.</span>
          <span aria-hidden="true" className="flex flex-col items-center gap-1 sm:gap-3">
            <span>Turn</span>
            <span className="inline-grid place-items-center">
              {isServer ? (
                <span className="italic text-violet-300 text-glow-violet">{ROTATING[0]}</span>
              ) : (
                <AnimatePresence initial={false} mode="sync">
                  <motion.span
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'linear' }}
                    className="col-start-1 row-start-1 italic text-violet-300 text-glow-violet"
                  >
                    {ROTATING[index]}
                  </motion.span>
                </AnimatePresence>
              )}
            </span>
            <span>Into Revenue.</span>
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/75 md:text-xl">
          <strong className="font-semibold text-white">CreativeVision</strong> edits videos people actually watch, and builds custom
          dashboards that keep your clients, team and projects in one place.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/start" className={primaryButton}>
            Start a project <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link to="/#work" className={secondaryButton}>
            See our work
          </Link>
        </div>

        <p className="mt-8 text-sm text-white/65">
          <span className="mr-2 rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-violet-200">New</span>
          We now build custom dashboards for businesses.{' '}
          <Link to="/dashboards" className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
            See how they work
          </Link>
        </p>
      </div>
    </section>
  );
}

function ServiceCard({
  icon: Icon,
  title,
  badge,
  text,
  points,
  link,
}: {
  icon: typeof Clapperboard;
  title: string;
  badge?: string;
  text: string;
  points: string[];
  link: { to: string; label: string };
}) {
  return (
    <article className="glass-panel flex h-full flex-col rounded-3xl p-7 md:p-9">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/15 text-violet-300">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        {badge && <span className="rounded-full bg-violet-500/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-violet-200">{badge}</span>}
      </div>
      <h3 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h3>
      <p className="mt-3 text-base leading-relaxed text-white/70">{text}</p>
      <ul className="mt-6 space-y-3">
        {points.map((point) => (
          <li key={point} className="flex gap-3 text-[15px] leading-snug text-white/85">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
            {point}
          </li>
        ))}
      </ul>
      <Link to={link.to} className="mt-8 inline-flex items-center gap-2 self-start font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
        {link.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-3xl">
          <Eyebrow>What we do</Eyebrow>
          <h2 id="services-title" className="font-display text-4xl font-medium tracking-tight text-glow-premium md:text-6xl">
            Two ways we help you <Highlight>grow.</Highlight>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/70">
            Great videos bring people in. A good dashboard keeps the work running smoothly behind the scenes. Choose one, or both.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <ServiceCard
              icon={Clapperboard}
              title="Video editing"
              text="Send us your raw footage. Get back videos that are ready to post, and made to keep people watching."
              points={[
                'Short videos for Reels, TikTok and YouTube Shorts',
                'Long YouTube videos, podcasts, courses and ads',
                'Color, sound, captions and motion graphics',
                'Most short videos ready in 24 to 48 hours',
                'Two rounds of changes included',
              ]}
              link={{ to: '/start', label: 'See video plans' }}
            />
          </Reveal>
          <Reveal delay={0.1}>
            <ServiceCard
              icon={LayoutDashboard}
              title="Custom dashboards"
              badge="New"
              text="Your own private website for running your business, built around the way you already work."
              points={[
                'A client portal to send files, follow progress and approve work',
                'Projects, deadlines and your team in one view',
                'Payments, invoices and payroll kept track of for you',
                'Chat, video meetings and announcements built in',
                'Works on computer and phone, and installs like an app',
              ]}
              link={{ to: '/dashboards', label: 'See how dashboards work' }}
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function DashboardSpotlight() {
  return (
    <section aria-labelledby="spotlight-title" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <Eyebrow>Custom dashboards</Eyebrow>
          <h2 id="spotlight-title" className="font-display text-4xl font-medium tracking-tight text-glow-premium md:text-6xl">
            One place for <Highlight>everything.</Highlight>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/70">
            No more chasing files in email threads or updates across five different apps. Your clients, team, projects and payments
            live together in one dashboard, the same kind we run CreativeVision on every day.
          </p>
          <ul className="mt-7 space-y-3">
            {['Clients see exactly where their project is', 'Your team always knows what’s next', 'You see the whole business at a glance'].map(
              (point) => (
                <li key={point} className="flex gap-3 text-base text-white/85">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                  {point}
                </li>
              ),
            )}
          </ul>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/dashboards" className={primaryButton}>
              Learn more <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <a href={CALL_URL} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
              Book a free call<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <DashboardMock />
          <p className="mt-3 text-center text-sm text-white/50">An example dashboard. Yours is built around your business.</p>
        </Reveal>
      </div>
    </section>
  );
}

function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className="scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Eyebrow>Our work</Eyebrow>
            <h2 id="work-title" className="font-display text-4xl font-medium tracking-tight text-glow-premium md:text-6xl">
              Videos made to be <Highlight>watched.</Highlight>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/70">A few recent edits. Press play on any video to watch it here.</p>
          </div>
          <Link to="/portfolio" className="inline-flex items-center gap-2 font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
            View all projects <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>
        <VideoStrip />
      </div>
    </section>
  );
}

function StatNumber({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(isServer ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) return setShown(value);
    const controls = animate(0, value, { duration: 1.6, ease: 'easeOut', onUpdate: (latest) => setShown(Math.round(latest)) });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <>
      <span ref={ref} aria-hidden="true">
        {shown}
        {suffix}
      </span>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
    </>
  );
}

function Results() {
  return (
    <section aria-labelledby="results-title" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl text-center">
        <Reveal>
          <h2 id="results-title" className="font-display text-4xl font-medium tracking-tight text-glow-premium md:text-6xl">
            Trusted by brands that <Highlight>grow.</Highlight>
          </h2>
        </Reveal>
        <dl className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.06} className="glass-panel flex flex-col-reverse items-center justify-center rounded-2xl p-6 md:p-9">
              <dt className="mt-2 text-sm font-medium text-white/65">{stat.label}</dt>
              <dd className="text-4xl font-black text-violet-300 text-glow-violet md:text-5xl">
                <StatNumber value={stat.value} suffix={stat.suffix} />
              </dd>
            </Reveal>
          ))}
        </dl>
        <Reveal className="mt-14">
          <h3 className="text-sm font-medium uppercase tracking-[0.2em] text-white/60">Clients and partners</h3>
          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CLIENTS.map((client) => (
              <li key={client.name} className="glass-panel flex items-center justify-center rounded-2xl px-6 py-8">
                <span className={`${client.style} text-white/70`}>{client.name}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8">
      <Reveal className="glass-panel mx-auto max-w-5xl rounded-3xl p-8 md:p-14">
        <Eyebrow>About us</Eyebrow>
        <h2 id="about-title" className="font-display text-4xl font-medium tracking-tight text-glow-premium md:text-5xl">
          About <Highlight>CreativeVision</Highlight>
        </h2>
        <div className="mt-6 space-y-4 text-lg leading-relaxed text-white/75">
          <p>
            CreativeVision started as a team of video editors. As we grew, keeping every client, editor and video organized got harder,
            so we built our own dashboard to run the whole studio in one place.
          </p>
          <p>
            Today we do both: we edit videos for creators and brands, and we build custom dashboards for businesses that want the same
            kind of order behind the scenes.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-3xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 id="how-title" className="font-display text-4xl font-medium tracking-tight text-glow-premium md:text-6xl">
            Simple from <Highlight>start</Highlight> to finish.
          </h2>
        </Reveal>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="list-none">
              <Reveal delay={i * 0.08} className="glass-panel h-full rounded-3xl p-7 md:p-8">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-violet-500/20 font-semibold text-violet-200" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-xl font-bold">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-white/70">{step.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <Eyebrow>Questions</Eyebrow>
          <h2 id="faq-title" className="font-display text-4xl font-medium tracking-tight text-glow-premium md:text-6xl">
            Frequently asked <Highlight>questions</Highlight>
          </h2>
        </Reveal>
        <div className="mt-10 flex flex-col gap-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={faq.question}
                className={`glass-panel overflow-hidden rounded-2xl border transition-colors ${isOpen ? 'border-violet-400/40 bg-white/[0.06]' : 'border-white/10'}`}
              >
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left md:px-8"
                  >
                    <span className="text-base font-medium text-white md:text-lg">{faq.question}</span>
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${isOpen ? 'border-violet-400/50 bg-violet-500/20 text-violet-200' : 'border-white/15 text-white/70'}`}
                      aria-hidden="true"
                    >
                      {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>
                </h3>
                <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} hidden={!isOpen && !isServer}>
                  <p className="max-w-3xl px-6 pb-6 text-base leading-relaxed text-white/75 md:px-8">{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="px-4 pb-28 pt-12 sm:px-6 lg:px-8">
      <Reveal className="glass-panel relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 p-8 text-center md:p-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]" aria-hidden="true" />
        <h2 id="cta-title" className="relative font-display text-4xl font-medium tracking-tight text-glow-premium md:text-6xl">
          Ready when <Highlight>you are.</Highlight>
        </h2>
        <p className="relative mx-auto mt-5 max-w-xl text-lg text-white/75">Tell us what you need, and we’ll take it from there.</p>
        <div className="relative mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/start" className={primaryButton}>
            Start a project <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <a href={CALL_URL} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
            Book a free call<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        <p className="relative mt-8 text-base text-white/65">
          Are you a video editor?{' '}
          <Link to="/join" className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
            Join our team
          </Link>
        </p>
      </Reveal>
    </section>
  );
}
