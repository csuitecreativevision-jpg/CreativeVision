import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarCheck, Clock, Mail, ShieldCheck } from 'lucide-react';
import { SiteNav } from '../components/site/SiteNav';
import { SiteFooter } from '../components/site/SiteFooter';
import { Eyebrow } from '../components/site/Reveal';
import { useSitePage } from '../components/site/useSitePage';
import { BOOKING_API } from '../components/site/links';

// "Book a free call": they pick any day and time, confirm their email with a 6-digit code, and the
// request goes to the Super Admin in the CreativeVision dashboard to approve or decline. They hear
// back by email (with a link to join the call once it's approved).

type Topic = 'video' | 'dashboard' | 'both' | 'other';
const TOPICS: { value: Topic; label: string; text: string }[] = [
  { value: 'video', label: 'Video editing', text: 'Short or long videos' },
  { value: 'dashboard', label: 'A custom dashboard', text: 'For your business' },
  { value: 'both', label: 'Both', text: 'Videos and a dashboard' },
  { value: 'other', label: 'Something else', text: 'Tell us below' },
];

const field =
  'w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/35 transition focus:border-violet-400/70 focus:bg-white/[0.06] focus:outline-none';
const label = 'mb-2 block text-sm font-medium text-white/85';

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BOOKING_API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new Error('We couldn’t reach our booking system. Please check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data as T;
}

const localTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function BookPage() {
  useSitePage();
  const [params] = useSearchParams();
  const initialTopic = (['video', 'dashboard', 'both', 'other'] as Topic[]).find((t) => t === params.get('topic')) ?? 'video';
  const plan = params.get('plan');

  const [step, setStep] = useState<'form' | 'code' | 'done'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [topic, setTopic] = useState<Topic>(initialTopic);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [message, setMessage] = useState(plan ? `I'm interested in: ${plan}.` : '');
  const [website, setWebsite] = useState(''); // hidden; only bots fill it in
  const [id, setId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const timeZone = useMemo(localTimeZone, []);
  const today = useMemo(() => dateKey(new Date()), []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const when = date && time ? new Date(`${date}T${time}`) : null;
  const whenText = when
    ? when.toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '';

  const sendRequest = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!when || Number.isNaN(when.getTime())) return setError('Please pick a day and a time.');
    if (when.getTime() < Date.now() + 2 * 3_600_000) return setError('Please pick a time at least 2 hours from now.');
    setBusy(true);
    try {
      const result = await post<{ id: string }>('/api/public/bookings', {
        name,
        email,
        company: company || null,
        topic,
        message: message || null,
        startsAt: when.toISOString(),
        timeZone,
        website: website || null,
      });
      setId(result.id);
      setCode('');
      setResendIn(30);
      setStep('code');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (code.replace(/\D/g, '').length !== 6) return setError('Please type the 6-digit code from the email.');
    setBusy(true);
    try {
      await post('/api/public/bookings/verify', { id, code });
      setStep('done');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    setBusy(true);
    try {
      await post('/api/public/bookings/resend', { id });
      setResendIn(30);
      setCode('');
      codeRef.current?.focus();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const errorBox = error ? (
    <p ref={errorRef} tabIndex={-1} role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 outline-none">
      {error}
    </p>
  ) : null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative bg-[#050508] font-sans text-white selection:bg-violet-500/30">
        <div className="bg-noise" aria-hidden="true" />
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute right-[-10%] top-[-10%] h-[45vw] w-[45vw] rounded-full bg-violet-600/10 blur-[120px]" />
        </div>
        <SiteNav />

        <main id="main" tabIndex={-1} className="relative z-10 px-4 pb-24 pt-28 outline-none sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="lg:pt-6">
              <Eyebrow>Free call</Eyebrow>
              <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-glow-premium md:text-6xl">
                Let’s <span className="italic text-violet-300 text-glow-violet">talk.</span>
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-white/75">
                Pick a day and time that suits you. We’ll check it and email you as soon as it’s confirmed, with a link to join the call.
              </p>
              <ul className="mt-8 space-y-4 text-base text-white/80">
                <li className="flex gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" aria-hidden="true" /> A 30-minute video call, free and with no obligation
                </li>
                <li className="flex gap-3">
                  <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" aria-hidden="true" /> Join from your browser: nothing to install, no account needed
                </li>
                <li className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" aria-hidden="true" /> We only use your details to set up the call
                </li>
              </ul>
            </div>

            <div className="glass-panel rounded-3xl border border-white/10 p-6 md:p-9">
              {step === 'form' && (
                <form onSubmit={sendRequest} className="space-y-6" noValidate={false}>
                  <h2 className="text-xl font-bold">Request a call</h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="book-name" className={label}>
                        Your name
                      </label>
                      <input id="book-name" required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
                    </div>
                    <div>
                      <label htmlFor="book-email" className={label}>
                        Email
                      </label>
                      <input id="book-email" type="email" required maxLength={200} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="book-company" className={label}>
                      Company or brand <span className="font-normal text-white/50">(optional)</span>
                    </label>
                    <input id="book-company" maxLength={150} autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} className={field} />
                  </div>

                  <fieldset>
                    <legend className={label}>What would you like to talk about?</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {TOPICS.map((t) => (
                        <label
                          key={t.value}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                            topic === t.value ? 'border-violet-400/60 bg-violet-500/10' : 'border-white/10 hover:border-white/25'
                          }`}
                        >
                          <input type="radio" name="topic" value={t.value} checked={topic === t.value} onChange={() => setTopic(t.value)} className="mt-1 accent-violet-500" />
                          <span>
                            <span className="block text-base font-medium text-white">{t.label}</span>
                            <span className="block text-sm text-white/60">{t.text}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className={label}>When works for you?</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="book-date" className="sr-only">
                          Day
                        </label>
                        <input id="book-date" type="date" required min={today} value={date} onChange={(e) => setDate(e.target.value)} className={`${field} [color-scheme:dark]`} />
                      </div>
                      <div>
                        <label htmlFor="book-time" className="sr-only">
                          Time
                        </label>
                        <input id="book-time" type="time" required step={900} value={time} onChange={(e) => setTime(e.target.value)} className={`${field} [color-scheme:dark]`} />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-white/60">
                      In your time zone ({timeZone.replace(/_/g, ' ')}). {whenText && <span className="text-white/85">You picked {whenText}.</span>}
                    </p>
                  </fieldset>

                  <div>
                    <label htmlFor="book-message" className={label}>
                      Anything we should know? <span className="font-normal text-white/50">(optional)</span>
                    </label>
                    <textarea id="book-message" rows={4} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} className={field} />
                  </div>

                  <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
                    <label htmlFor="book-website">Website</label>
                    <input id="book-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                  </div>

                  {errorBox}
                  <div>
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-semibold text-black transition hover:bg-violet-100 disabled:opacity-60 sm:w-auto"
                    >
                      {busy ? 'Sending…' : 'Send me a code'} <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <p className="mt-3 text-sm text-white/60">We’ll email you a 6-digit code to confirm your email address.</p>
                  </div>
                </form>
              )}

              {step === 'code' && (
                <form onSubmit={confirmCode} className="space-y-6">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-violet-500/15 text-violet-300" aria-hidden="true">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold">Check your email</h2>
                    <p className="mt-2 text-base text-white/75">
                      We sent a 6-digit code to <strong className="text-white">{email}</strong>. It works for 10 minutes. Can’t find it? Check your spam folder.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="book-code" className={label}>
                      Your code
                    </label>
                    <input
                      id="book-code"
                      ref={codeRef}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9 ]*"
                      maxLength={7}
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ''))}
                      className={`${field} max-w-[14rem] text-center text-2xl font-semibold tracking-[0.4em]`}
                    />
                  </div>
                  {errorBox}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-semibold text-black transition hover:bg-violet-100 disabled:opacity-60"
                    >
                      {busy ? 'Checking…' : 'Confirm and send request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void resend()}
                      disabled={busy || resendIn > 0}
                      className="rounded-full px-4 py-3 text-sm font-medium text-white/80 underline decoration-white/30 underline-offset-4 hover:text-white disabled:no-underline disabled:opacity-50"
                    >
                      {resendIn > 0 ? `Send a new code (${resendIn}s)` : 'Send a new code'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setStep('form');
                    }}
                    className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Change my details
                  </button>
                </form>
              )}

              {step === 'done' && (
                <div className="space-y-5" role="status">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-300" aria-hidden="true">
                    <CalendarCheck className="h-5 w-5" />
                  </span>
                  <h2 className="text-2xl font-bold">Request sent!</h2>
                  <p className="text-base leading-relaxed text-white/75">
                    Thanks, {name.split(' ')[0]}. You asked for a call on <strong className="text-white">{whenText}</strong>. We’ll email{' '}
                    <strong className="text-white">{email}</strong> as soon as it’s confirmed, with a link to join.
                  </p>
                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-black hover:bg-violet-100">
                      Back to home
                    </Link>
                    <Link to="/#work" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-base font-medium text-white hover:border-white/40">
                      See our work
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    </MotionConfig>
  );
}
