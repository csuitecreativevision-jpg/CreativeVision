import type { ReactNode } from 'react';
import { ArrowUpRight, Bot, CalendarDays, Check, HandHeart, MapPin, MessageSquare, Play } from 'lucide-react';
import { Reveal } from './Reveal';

// "Dashboards we've built": real projects. Pictures are public pages or drawings with made-up
// details, never real people's information.

type Example = {
  name: string;
  kind: string;
  text: string;
  points: string[];
  link?: { href: string; label: string };
  picture: ReactNode;
  caption: string;
};

function BrowserFrame({ address, children }: { address: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0b14] shadow-[0_30px_90px_-25px_rgba(124,58,237,0.4)]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-3 truncate rounded-md bg-white/[0.05] px-3 py-1 text-[11px] text-white/50">{address}</span>
      </div>
      {children}
    </div>
  );
}

/** A drawing of a community platform's home screen (made-up events). */
function CommunityMock() {
  const events = [
    { title: 'Community breakfast', when: 'Sat · 8:00 AM', place: 'Main hall' },
    { title: 'Volunteer orientation', when: 'Sun · 2:00 PM', place: 'Room 2' },
    { title: 'Family retreat', when: 'Next month', place: 'Retreat house' },
  ];
  return (
    <div
      role="img"
      aria-label="A drawing of a community platform: upcoming events people can sign up for, new volunteer applications, and a chatbot answering a visitor's question."
      className="select-none"
    >
      <BrowserFrame address="My Dad’s Place">
        <div aria-hidden="true" className="grid gap-3 p-4 sm:grid-cols-[1fr_12rem] sm:p-5">
          <div className="rounded-xl border border-white/[0.06]">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2 text-[11px] font-medium text-white/60">
              <CalendarDays className="h-3.5 w-3.5 text-violet-300" /> Upcoming events
            </div>
            {events.map((e) => (
              <div key={e.title} className="flex items-center justify-between gap-3 border-b border-white/[0.04] px-3 py-2.5 last:border-0">
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-white/90">{e.title}</div>
                  <div className="flex items-center gap-1 truncate text-[10.5px] text-white/40">
                    {e.when} · <MapPin className="h-3 w-3" /> {e.place}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-violet-400/10 px-2 py-0.5 text-[10px] text-violet-200 ring-1 ring-inset ring-violet-400/25">Sign up</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-white/[0.06] p-3">
              <div className="flex items-center gap-2 text-[11px] font-medium text-white/60">
                <HandHeart className="h-3.5 w-3.5 text-violet-300" /> Volunteers
              </div>
              <div className="mt-2 text-[11px] text-white/55">New applications to review</div>
              <span className="mt-2 inline-block rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-200 ring-1 ring-inset ring-emerald-400/25">Review</span>
            </div>
            <div className="rounded-xl border border-white/[0.06] p-3">
              <div className="flex items-center gap-2 text-[11px] font-medium text-white/60">
                <Bot className="h-3.5 w-3.5 text-violet-300" /> Chat
              </div>
              <div className="mt-2 rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-[10.5px] text-white/70">Is the hall free next Saturday?</div>
              <div className="mt-1.5 rounded-lg bg-violet-500/15 px-2.5 py-1.5 text-[10.5px] text-violet-100">Yes! You can book it from the Venues page.</div>
            </div>
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
}

/** A drawing of a client checking a video in the CreativeVision dashboard (made-up names). */
function ReviewMock() {
  const notes = [
    { at: '0:12', text: 'Can the logo be a bit bigger?' },
    { at: '0:45', text: 'Love this part!' },
  ];
  return (
    <div
      role="img"
      aria-label="A drawing of a client checking a video in the dashboard: the video, their notes at exact moments, and buttons to approve it or ask for changes."
      className="select-none"
    >
      <BrowserFrame address="dashboard.creativevision.dev">
        <div aria-hidden="true" className="grid gap-3 p-4 sm:grid-cols-[1fr_12rem] sm:p-5">
          <div>
            <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-600/40 via-fuchsia-500/20 to-indigo-600/30">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-black">
                <Play className="ml-0.5 h-4 w-4 fill-black" />
              </span>
              <div className="absolute inset-x-3 bottom-3 h-1 rounded-full bg-white/20">
                <div className="h-1 w-2/5 rounded-full bg-white/80" />
                <span className="absolute left-[12%] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-amber-300" />
                <span className="absolute left-[45%] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-amber-300" />
              </div>
            </div>
            <div className="mt-2.5 text-[12px] font-medium text-white/90">Product launch reel · Version 2</div>
            <div className="text-[10.5px] text-white/40">Harbor &amp; Co.</div>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-[11px] font-medium text-white/60">
              <MessageSquare className="h-3.5 w-3.5 text-violet-300" /> Notes
            </div>
            {notes.map((n) => (
              <div key={n.at} className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-[10.5px] text-white/70">
                <span className="mr-1.5 font-semibold text-amber-200">{n.at}</span>
                {n.text}
              </div>
            ))}
            <div className="mt-auto grid gap-1.5 pt-1">
              <span className="rounded-lg bg-emerald-500/80 py-1.5 text-center text-[11px] font-semibold text-white">Approve</span>
              <span className="rounded-lg border border-white/15 py-1.5 text-center text-[11px] text-white/70">Ask for changes</span>
            </div>
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
}

const EXAMPLES: Example[] = [
  {
    name: 'CreativeVision',
    kind: 'Our own studio',
    text: 'The dashboard we run CreativeVision on every day, for our clients, video editors, admins and social media team.',
    points: [
      'Clients send footage, follow every project and approve videos',
      'Editors get their work, deadlines and pay in one place',
      'Payroll, invoices and payslips on schedule',
      'Messages, video meetings, a shared calendar and an AI helper',
    ],
    picture: <ReviewMock />,
    caption: 'A drawing with made-up names and numbers; the real one is private.',
  },
  {
    name: 'Philippine Nurses Association, Inc.',
    kind: 'National convention',
    text: 'The website, online registration and admin dashboard for the PNA National Annual Convention 2026.',
    points: [
      'Online registration for individuals and groups, with receipts',
      'Payment checks by the admins and the accountant',
      'QR codes emailed to every participant for check-in',
      'Name stickers and ID badges printed in batches',
      'Daily attendance check-in and conference kit claiming',
    ],
    link: { href: 'https://pna-events.com', label: 'Visit pna-events.com' },
    picture: (
      <BrowserFrame address="pna-events.com">
        <img
          src="/work/pna-events.jpg"
          alt="The Philippine Nurses Association convention website, with its Register Now button"
          width={1440}
          height={900}
          loading="lazy"
          className="block h-auto w-full"
        />
      </BrowserFrame>
    ),
    caption: 'The public website. The admin dashboard behind it holds members’ details, so it isn’t shown.',
  },
  {
    name: 'My Dad’s Place',
    kind: 'Community platform',
    text: 'A home for a community: events, volunteers and venue bookings, with a chatbot that answers visitors’ questions.',
    points: [
      'Events people can find and sign up for',
      'Volunteer applications reviewed in one place',
      'Venue booking',
      'An AI chatbot that answers common questions',
      'Sign-up with email codes, so every account is real',
    ],
    picture: <CommunityMock />,
    caption: 'A drawing with made-up events.',
  },
];

export function WorkExamples() {
  return (
    <div className="space-y-20">
      {EXAMPLES.map((example, i) => (
        <article key={example.name} className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal className={i % 2 ? 'lg:order-2' : ''}>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-violet-300">{example.kind}</p>
            <h3 className="mt-3 font-display text-3xl font-medium tracking-tight text-white md:text-4xl">{example.name}</h3>
            <p className="mt-4 text-lg leading-relaxed text-white/75">{example.text}</p>
            <ul className="mt-6 space-y-3">
              {example.points.map((point) => (
                <li key={point} className="flex gap-3 text-[15px] leading-snug text-white/85">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
            {example.link && (
              <a
                href={example.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-2 font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
              >
                {example.link.label} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </Reveal>
          <Reveal delay={0.1} className={i % 2 ? 'lg:order-1' : ''}>
            {example.picture}
            <p className="mt-3 text-center text-sm text-white/50">{example.caption}</p>
          </Reveal>
        </article>
      ))}
    </div>
  );
}
