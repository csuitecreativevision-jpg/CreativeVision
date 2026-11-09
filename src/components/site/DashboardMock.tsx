import { Bell, Briefcase, CalendarDays, Clapperboard, LayoutDashboard, MessagesSquare, Users, Wallet } from 'lucide-react';

// A drawn example of a custom dashboard (made-up names and numbers), so visitors can picture one.

const NAV = [
  { icon: LayoutDashboard, label: 'Overview', active: true },
  { icon: Clapperboard, label: 'Projects' },
  { icon: Users, label: 'Clients' },
  { icon: Briefcase, label: 'Team' },
  { icon: Wallet, label: 'Payments' },
  { icon: CalendarDays, label: 'Calendar' },
  { icon: MessagesSquare, label: 'Messages' },
];

const STATS = [
  { label: 'Active projects', value: '12' },
  { label: 'Waiting for review', value: '3' },
  { label: 'Paid this month', value: '$8,420' },
];

const TONES = {
  amber: 'bg-amber-400/10 text-amber-200 ring-amber-400/25',
  violet: 'bg-violet-400/10 text-violet-200 ring-violet-400/25',
  emerald: 'bg-emerald-400/10 text-emerald-200 ring-emerald-400/25',
  sky: 'bg-sky-400/10 text-sky-200 ring-sky-400/25',
} as const;

const ROWS: { name: string; client: string; status: string; tone: keyof typeof TONES }[] = [
  { name: 'Product launch reel', client: 'Harbor & Co.', status: 'Ready for review', tone: 'amber' },
  { name: 'Podcast episode 14', client: 'Morning Mic', status: 'Editing', tone: 'violet' },
  { name: 'Course module 3', client: 'Bright Path Academy', status: 'Approved', tone: 'emerald' },
  { name: 'Customer story', client: 'Lumen Coffee', status: 'Sent to client', tone: 'sky' },
];

const TODAY = ['2:00 PM · Team meeting', 'Payroll cutoff today', '3 new files from Lumen Coffee'];

export function DashboardMock({ className = '' }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="An example dashboard: a menu with Overview, Projects, Clients, Team, Payments, Calendar and Messages; this month's numbers; and a list of video projects showing whether each is being edited, ready for review, approved or sent to the client."
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0b14]/95 shadow-[0_30px_90px_-25px_rgba(124,58,237,0.45)] ${className}`}
    >
      <div aria-hidden="true" className="select-none">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ml-3 truncate rounded-md bg-white/[0.05] px-3 py-1 text-[11px] text-white/50">dashboard.yourbusiness.com</span>
        </div>

        <div className="flex">
          <div className="hidden w-40 shrink-0 border-r border-white/[0.06] p-3 sm:block">
            {NAV.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`mb-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] ${active ? 'bg-violet-500/15 text-white' : 'text-white/50'}`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-violet-300' : ''}`} />
                {label}
              </div>
            ))}
          </div>

          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] text-white/45">Good morning, Alex</div>
                <div className="text-sm font-semibold text-white">Here&apos;s your week</div>
              </div>
              <div className="relative grid h-8 w-8 place-items-center rounded-full border border-white/10 text-white/60">
                <Bell className="h-3.5 w-3.5" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-violet-400" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5 sm:p-3">
                  <div className="text-[10px] leading-tight text-white/45 sm:text-[11px]">{stat.label}</div>
                  <div className="mt-1 text-base font-semibold text-white sm:text-lg">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_11rem]">
              <div className="overflow-hidden rounded-xl border border-white/[0.06]">
                <div className="border-b border-white/[0.06] px-3 py-2 text-[11px] font-medium text-white/60">Projects</div>
                {ROWS.map((row) => (
                  <div key={row.name} className="flex items-center justify-between gap-3 border-b border-white/[0.04] px-3 py-2.5 last:border-0">
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-medium text-white/90">{row.name}</div>
                      <div className="truncate text-[10.5px] text-white/40">{row.client}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ring-1 ring-inset ${TONES[row.tone]}`}>{row.status}</span>
                  </div>
                ))}
              </div>
              <div className="hidden rounded-xl border border-white/[0.06] p-3 lg:block">
                <div className="text-[11px] font-medium text-white/60">Today</div>
                {TODAY.map((item) => (
                  <div key={item} className="mt-2.5 flex gap-2 text-[11px] leading-snug text-white/55">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400/80" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
