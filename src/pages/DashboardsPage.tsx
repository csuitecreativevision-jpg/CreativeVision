import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { ArrowRight, Bell, CalendarDays, Clapperboard, MessagesSquare, ShieldCheck, Smartphone, Users, Wallet } from 'lucide-react';
import { SiteNav } from '../components/site/SiteNav';
import { SiteFooter } from '../components/site/SiteFooter';
import { DashboardMock } from '../components/site/DashboardMock';
import { Eyebrow, Reveal } from '../components/site/Reveal';
import { useSitePage } from '../components/site/useSitePage';
import { CALL_URL } from '../components/site/links';

const FEATURES = [
  { icon: Users, title: 'A portal for your clients', text: 'Clients send files, follow every project and approve the finished work, without long email threads.' },
  { icon: Clapperboard, title: 'Projects and tasks', text: 'Give out work, set deadlines and see who is doing what, all on one screen.' },
  { icon: Wallet, title: 'Payments and payroll', text: 'Keep track of what’s owed and what’s paid, send invoices and payslips, and pay your team on schedule.' },
  { icon: MessagesSquare, title: 'Messages and meetings', text: 'Chat, video calls and team announcements are built in, so conversations stay with the work.' },
  { icon: CalendarDays, title: 'Calendar and reminders', text: 'Deadlines, meetings and paydays in one calendar, with reminders sent before they matter.' },
  { icon: Bell, title: 'Automatic updates', text: 'People get an email or phone notification when something needs them, and nothing slips through.' },
  { icon: Smartphone, title: 'Computer and phone', text: 'It works in any browser, and installs on a phone or computer like an app.' },
  { icon: ShieldCheck, title: 'Safe and private', text: 'Everyone signs in, and each person only sees what’s meant for them.' },
];

const STEPS = [
  { title: 'Free call', text: 'Tell us how your business runs today and what slows you down.' },
  { title: 'A clear plan', text: 'We show you what we’ll build, the price and the timeline. Nothing starts until you say yes.' },
  { title: 'We build it with you', text: 'You see progress along the way and try it before it goes live.' },
  { title: 'Launch and training', text: 'We set up your accounts and show you and your team how to use it.' },
];

export const dashboardFaqs = [
  { question: 'Do I need to be good with technology?', answer: 'No. We set everything up and show you and your team how to use it. If you can use email, you can use your dashboard.' },
  {
    question: 'Can it work with the tools I already use?',
    answer: 'Often, yes. Tell us what you use today, like Google Drive, email or your payment tools, and on the call we’ll tell you what can connect.',
  },
  { question: 'How much does it cost?', answer: 'Every business is different, so we price each dashboard after the free call. You get the full price before any work starts.' },
];

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-black shadow-[0_0_40px_rgba(255,255,255,0.18)] transition hover:bg-violet-100';
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-base font-medium text-white transition hover:border-white/40 hover:bg-white/[0.05]';

function Highlight({ children }: { children: React.ReactNode }) {
  return <span className="italic text-violet-300 text-glow-violet">{children}</span>;
}

function BookCall({ label = 'Book a free call', className = primaryButton }: { label?: string; className?: string }) {
  return (
    <a href={CALL_URL} target="_blank" rel="noopener noreferrer" className={className}>
      {label} <ArrowRight className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function DashboardsPage() {
  useSitePage();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative bg-[#050508] font-sans text-white selection:bg-violet-500/30">
        <div className="bg-noise" aria-hidden="true" />
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute right-[-10%] top-[-10%] h-[45vw] w-[45vw] rounded-full bg-violet-600/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] h-[40vw] w-[40vw] rounded-full bg-indigo-500/10 blur-[140px]" />
        </div>

        <SiteNav />

        <main id="main" tabIndex={-1} className="relative z-10 outline-none">
          <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mx-auto max-w-4xl text-center">
                <Eyebrow>New · Custom dashboards</Eyebrow>
                <h1 className="font-display text-5xl font-medium leading-[1] tracking-tight text-glow-premium sm:text-6xl lg:text-7xl">
                  Your whole business, <Highlight>in one place.</Highlight>
                </h1>
                <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/75 md:text-xl">
                  CreativeVision builds private online dashboards for businesses. Your clients, team, projects and payments live together, and
                  everyone signs in from a computer or phone.
                </p>
                <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                  <BookCall />
                  <a href="#included" className={secondaryButton}>
                    See what’s included
                  </a>
                </div>
              </div>
              <Reveal className="mx-auto mt-16 max-w-5xl">
                <DashboardMock />
                <p className="mt-3 text-center text-sm text-white/50">An example dashboard. Yours is built around your business.</p>
              </Reveal>
            </div>
          </section>

          <section aria-labelledby="story-title" className="px-4 py-20 sm:px-6 lg:px-8">
            <Reveal className="glass-panel mx-auto max-w-5xl rounded-3xl p-8 md:p-14">
              <h2 id="story-title" className="font-display text-3xl font-medium tracking-tight text-glow-premium md:text-5xl">
                Built on what we use <Highlight>every day.</Highlight>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-white/75">
                We run CreativeVision on our own dashboard. Clients send footage and approve videos there, editors get their work and their
                pay there, and we see the whole studio at a glance. We’ll build one that fits the way your business works.
              </p>
            </Reveal>
          </section>

          <section id="included" aria-labelledby="included-title" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <Reveal className="max-w-3xl">
                <Eyebrow>What’s included</Eyebrow>
                <h2 id="included-title" className="font-display text-4xl font-medium tracking-tight text-glow-premium md:text-6xl">
                  Pick what your business <Highlight>needs.</Highlight>
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-white/70">
                  Every dashboard is different. These are the parts businesses ask for most; we include only the ones that help you.
                </p>
              </Reveal>
              <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {FEATURES.map(({ icon: Icon, title, text }, i) => (
                  <li key={title}>
                    <Reveal delay={(i % 4) * 0.05} className="glass-panel h-full rounded-2xl p-6">
                      <span className="grid h-11 w-11 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/15 text-violet-300">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h3 className="mt-5 text-lg font-bold">{title}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-white/70">{text}</p>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section aria-labelledby="steps-title" className="px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <Reveal className="max-w-3xl">
                <Eyebrow>How it works</Eyebrow>
                <h2 id="steps-title" className="font-display text-4xl font-medium tracking-tight text-glow-premium md:text-6xl">
                  From first call to <Highlight>launch.</Highlight>
                </h2>
              </Reveal>
              <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {STEPS.map((step, i) => (
                  <li key={step.title} className="list-none">
                    <Reveal delay={i * 0.06} className="glass-panel h-full rounded-2xl p-6">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-violet-500/20 font-semibold text-violet-200" aria-hidden="true">
                        {i + 1}
                      </span>
                      <h3 className="mt-5 text-lg font-bold">
                        <span className="sr-only">Step {i + 1}: </span>
                        {step.title}
                      </h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-white/70">{step.text}</p>
                    </Reveal>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section aria-labelledby="dash-faq-title" className="px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <h2 id="dash-faq-title" className="font-display text-3xl font-medium tracking-tight text-glow-premium md:text-5xl">
                Common <Highlight>questions</Highlight>
              </h2>
              <dl className="mt-8 space-y-4">
                {dashboardFaqs.map((faq) => (
                  <div key={faq.question} className="glass-panel rounded-2xl p-6 md:p-7">
                    <dt className="text-lg font-semibold text-white">{faq.question}</dt>
                    <dd className="mt-2 text-base leading-relaxed text-white/75">{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section aria-labelledby="dash-cta-title" className="px-4 pb-28 pt-12 sm:px-6 lg:px-8">
            <Reveal className="glass-panel relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 p-8 text-center md:p-16">
              <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]" aria-hidden="true" />
              <h2 id="dash-cta-title" className="relative font-display text-4xl font-medium tracking-tight text-glow-premium md:text-6xl">
                Let’s talk about <Highlight>your dashboard.</Highlight>
              </h2>
              <p className="relative mx-auto mt-5 max-w-xl text-lg text-white/75">
                A free call, no pressure. You’ll leave with a clear idea of what we’d build for you.
              </p>
              <div className="relative mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <BookCall />
                <Link to="/#services" className={secondaryButton}>
                  Need videos too?
                </Link>
              </div>
            </Reveal>
          </section>
        </main>

        <SiteFooter />
      </div>
    </MotionConfig>
  );
}
