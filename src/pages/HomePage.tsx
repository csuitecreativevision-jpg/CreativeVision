import { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, animate, useInView } from 'framer-motion';
import { Play, TrendingDown, Clock, Eye, ArrowRight, Zap, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: "What is your typical turnaround time?",
    answer: "Our standard turnaround time is 24-48 hours for short-form content. For long-form editorial or complex VFX work, we provide a custom timeline during the onboarding phase, typically ranging from 3-5 business days."
  },
  {
    question: "How do you handle high-volume content needs?",
    answer: "We specialize in scaling output. By assigning dedicated editors to your workspace, we maintain consistent quality and style while handling up to 30+ assets per month per creator."
  },
  {
    question: "Can I request revisions on my projects?",
    answer: "Absolutely. Every project includes up to two rounds of focused revisions. We use a frame-accurate review system so you can leave precise feedback directly on the video."
  },
  {
    question: "What types of content do you specialize in?",
    answer: "We are industry leaders in high-retention short-form (Reels/TikTok/Shorts) and cinematic long-form YouTube editorial. We also handle commercial spots, course content, and branding trailers."
  }
];

function CountingNumber({ value, suffix = "" }: { value: number, suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest) + suffix);

  useEffect(() => {
    if (isInView) {
      count.set(0);
      const controls = animate(count, value, { duration: 2, ease: "easeOut" });
      return controls.stop;
    }
  }, [isInView, value, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export default function HomePage() {
  const location = useLocation();
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  useEffect(() => {
    if (location.hash === '#showcase') {
      // Small delay to ensure layout is complete before scrolling
      setTimeout(() => {
        window.scrollTo({ top: window.innerHeight * 2.9, behavior: 'instant' as ScrollBehavior });
      }, 100);
    } else if (location.state && location.state.target === 'services') {
      // Scene5 is the last scene, roughly at 80% scroll
      // Scene5 (Ready to Scale) is exactly at 4x viewport height
      setTimeout(() => {
        window.scrollTo({
          top: window.innerHeight * 4,
          behavior: 'auto'
        });
      }, 50);
      window.history.replaceState({}, document.title);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [location]);

  // 6 sections = 600vw. We want to move left by 500vw (which is 83.33% of 600vw)
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-83.333%']);

  // Global Parallax Background Orbs
  const bgY1 = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const bgY2 = useTransform(scrollYProgress, [0, 1], ['0%', '-50%']);
  const bgX1 = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <div className="bg-[#050508] text-white selection:bg-violet-500/30 font-sans overflow-x-hidden max-w-full">
      <div className="bg-noise" />

      {/* Global Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div style={{ y: bgY1, x: bgX1 }} className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-violet-600/10 rounded-full blur-[120px]" />
        <motion.div style={{ y: bgY2 }} className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-fuchsia-600/10 rounded-full blur-[150px]" />
        <motion.div style={{ y: bgY1 }} className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Scroll Rig */}
      <div ref={targetRef} className="relative h-[600vh]">
        {/* Vertical Snap Points */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="h-[100vh] snap-start" />
          <div className="h-[100vh] snap-start" />
          <div className="h-[100vh] snap-start" />
          <div className="h-[100vh] snap-start" />
          <div className="h-[100vh] snap-start" />
          <div className="h-[100vh] snap-start" />
        </div>

        <div className="sticky top-0 h-screen overflow-hidden flex items-center z-10">
          <motion.div style={{ x }} className="flex h-full w-[600vw]">
            <Scene1 />
            <Scene2 />
            <Scene3 />
            <Scene4 />
            <Scene5 />
            <Scene6 />
          </motion.div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="fixed left-1/2 -translate-x-1/2 w-32 h-[2px] bg-white/10 rounded-full overflow-hidden z-50 bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:bottom-8">
        <motion.div
          className="h-full bg-violet-500/80"
          style={{ scaleX: scrollYProgress, transformOrigin: '0% 50%' }}
        />
      </div>
    </div>
  );
}

function Scene1() {
  const words = ["Watch Time", "Content", "Stories", "Footage", "Views"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-screen h-full flex flex-col justify-center items-center relative px-4 sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.05)_0%,transparent_50%)] pointer-events-none" />
      <div className="z-10 text-center max-w-5xl mx-auto min-w-0 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full mb-10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400/80 animate-pulse" />
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/70">Accepting New Clients</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-medium leading-[0.9] tracking-tight mb-6 md:mb-8 text-glow-premium"
        >
          <div className="flex flex-col items-center justify-center gap-2 md:gap-4">
            <div>Turn</div>
            <div className="inline-grid place-items-center">
              <AnimatePresence>
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 40, filter: 'blur(8px)', scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                  exit={{ opacity: 0, y: -40, filter: 'blur(8px)', scale: 1.05 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="italic text-violet-400 text-glow-violet col-start-1 row-start-1"
                >
                  {words[index]}
                </motion.span>
              </AnimatePresence>
            </div>
            <div>Into Revenue.</div>
          </div>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="select-text text-base md:text-lg lg:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed font-light px-4 md:px-0"
        >
          Stop posting content that gets ignored. We engineer cinematic videos that hook audiences and drive conversions.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/30 text-[10px] tracking-[0.3em] uppercase flex flex-col items-center gap-6"
      >
        <span>Scroll to explore</span>
        <div className="w-[1px] h-16 bg-gradient-to-b from-white/20 to-transparent" />
      </motion.div>
    </section>
  );
}

function Scene2() {
  return (
    <section className="w-screen h-full flex flex-col justify-center items-center relative px-8 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.03)_0%,transparent_70%)] pointer-events-none" />
      <div className="z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Editorial Typography */}
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full mb-8 text-white/70"
          >
            <TrendingDown className="w-3 h-3" />
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase">Reality Check</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
            className="font-display text-4xl md:text-6xl lg:text-8xl font-medium tracking-tight mb-6 md:mb-8 leading-[0.9] text-glow-premium"
          >
            <div>
              Your content is <span className="italic text-violet-400 text-glow-violet">bleeding</span> money.
            </div>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="select-text text-base md:text-lg text-white/50 max-w-md leading-relaxed font-light"
          >
            You're paying for production, ads, and distribution—but your videos aren't converting. The market is saturated with amateur edits and weak hooks.
          </motion.p>

          {/* Mobile Stats (Visible only on small screens) */}
          <div className="grid grid-cols-1 gap-3 mt-8 md:hidden w-full">
            {[
              { stat: "87%", title: "Fail to Convert" },
              { stat: "3 sec", title: "To Capture Attention" },
              { stat: "10x", title: "Cost of Bad Content" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.2 + (i * 0.1) }}
                className="glass-panel p-5 rounded-2xl flex items-center justify-between"
              >
                <h3 className="font-display text-3xl font-medium text-violet-400 text-glow-violet">{item.stat}</h3>
                <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/70 text-right max-w-[100px]">{item.title}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Floating Fragmented Elements */}
        <div className="relative h-[500px] w-full hidden md:block" style={{ perspective: '1000px' }}>
          {[
            { icon: TrendingDown, stat: "87%", title: "Fail to Convert", desc: "Poor hooks, weak pacing.", yOffset: 0, xOffset: -80, rotate: -5, delay: 0 },
            { icon: Clock, stat: "3 sec", title: "To Capture Attention", desc: "Viewers lost instantly.", yOffset: 140, xOffset: 80, rotate: 5, delay: 0.2 },
            { icon: Eye, stat: "10x", title: "Cost of Bad Content", desc: "Wasted ad spend.", yOffset: 280, xOffset: -40, rotate: -2, delay: 0.4 }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: item.yOffset + 50 }}
              whileInView={{ opacity: 1, y: item.yOffset }}
              viewport={{ amount: 0.3 }}
              transition={{
                opacity: { duration: 0.8, delay: item.delay },
                y: { duration: 0.8, delay: item.delay, ease: "easeOut" }
              }}
              className="absolute glass-panel p-8 rounded-2xl w-[320px] shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
              style={{ left: `calc(50% - 160px + ${item.xOffset}px)`, transform: `rotateZ(${item.rotate}deg)` }}
            >
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/70 mb-6">
                <item.icon className="w-4 h-4" />
              </div>
              <h3 className="font-display text-4xl font-medium mb-2 text-violet-400 text-glow-violet">{item.stat}</h3>
              <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/70 mb-2">{item.title}</p>
              <p className="text-xs text-white/40 font-light">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Scene3() {
  return (
    <section className="w-screen h-full flex flex-col justify-center items-center relative px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.04)_0%,transparent_60%)] pointer-events-none" />
      <div className="z-10 w-full max-w-6xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="font-display text-4xl md:text-5xl lg:text-7xl font-medium tracking-tight mb-4 md:mb-6 text-glow-premium"
        >
          <div>
            Trusted by the <span className="italic text-violet-400 text-glow-violet">world's best.</span>
          </div>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="select-text text-[10px] font-medium tracking-[0.3em] uppercase text-white/40 mb-16 md:mb-24"
        >
          Delivering impact at scale
        </motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16 md:mb-24 px-4 md:px-0">
          {[
            { val: 250, suffix: "M+", label: "Views Generated" },
            { val: 24, suffix: "h", label: "Turnaround Time" },
            { val: 98, suffix: "%", label: "Retention Rate" },
            { val: 2, suffix: "x", label: "Average ROI" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.8, delay: 0.1 + (i * 0.1), ease: "easeOut" }}
              whileHover={{ y: -5, scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
              style={{ willChange: "transform, filter, opacity" }}
              className="glass-panel p-6 md:p-10 rounded-2xl flex flex-col items-center justify-center"
            >
              <h3 className="font-sans text-3xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-3 text-violet-400 text-glow-violet">
                <CountingNumber value={stat.val} suffix={stat.suffix} />
              </h3>
              <p className="text-[8px] md:text-[10px] font-medium tracking-[0.1em] md:tracking-[0.15em] uppercase text-white/40 text-center">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Client Names */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full px-4 md:px-0"
        >
          <p className="text-[10px] text-white/25 font-medium uppercase tracking-[0.25em] text-center mb-3">Clients & Partners</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: 'RFX', style: 'tracking-[0.3em] text-2xl md:text-3xl lg:text-4xl font-black uppercase' },
              { name: 'Kala Capital Partners', style: 'tracking-[0.08em] text-base md:text-lg lg:text-xl font-bold uppercase' },
              { name: 'Kerns Marketing', style: 'tracking-[0.12em] text-lg md:text-xl lg:text-2xl font-bold uppercase' },
            ].map((client, i) => (
              <div key={i} className="glass-panel rounded-2xl flex items-center justify-center py-8 md:py-10 px-4 md:px-8 group cursor-default">
                <span className={`${client.style} text-white/40 group-hover:text-white transition-colors duration-500`}>
                  {client.name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Scene4() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  const showcaseWorks = [
    {
      vid: "https://www.youtube.com/embed/DFsizBNcfIA?autoplay=1&mute=1&loop=1&playlist=DFsizBNcfIA&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1",
      type: "long",
      isYoutube: true
    },
    {
      vid: "https://www.youtube.com/embed/4iQHoaFQr8E?autoplay=1&mute=1&loop=1&playlist=4iQHoaFQr8E&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1",
      type: "long",
      isYoutube: true
    },
    {
      vid: "https://www.youtube.com/embed/n4ha0vyW7Vc?autoplay=1&mute=1&loop=1&playlist=n4ha0vyW7Vc&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1",
      type: "short",
      isYoutube: true
    },
    {
      vid: "https://www.youtube.com/embed/g7EigqBCJco?autoplay=1&mute=1&loop=1&playlist=g7EigqBCJco&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1",
      type: "short",
      isYoutube: true
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % showcaseWorks.length);
    }, 6000); // 6 seconds per slide
    return () => clearInterval(timer);
  }, [activeIndex, showcaseWorks.length]);

  return (
    <section className="w-screen h-full flex flex-col justify-center relative px-8 md:px-24 py-16 overflow-hidden">
      <div className="mb-6 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-end z-20 shrink-0 gap-6">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full mb-4 md:mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400/80" />
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/70">Selected Work</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, filter: 'blur(0px)' }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="font-display text-4xl md:text-5xl lg:text-7xl font-medium tracking-tight text-glow-premium mb-4"
          >
            <div>
              Cinematic <span className="italic text-violet-400 text-glow-violet">Excellence.</span>
            </div>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="select-text text-sm md:text-base text-white/50 font-light max-w-xl tracking-wide leading-relaxed"
          >
            A curated selection of our most impactful campaigns. We blend high-end production with data-driven strategy to create videos that don't just look beautiful—they perform.
          </motion.p>
        </div>

        <div className="flex flex-col items-end gap-4">
          <motion.button
            onClick={() => navigate('/portfolio')}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden md:flex items-center gap-2 text-xs tracking-widest uppercase font-medium hover:text-white/70 transition-colors"
          >
            View All Projects <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 w-full flex-1 min-h-0 z-10 pb-4 md:pb-8">

        {/* Active Video Showcase Carousel */}
        <div className="relative w-full flex justify-center items-center h-full max-h-[60vh]">
          {showcaseWorks.map((work, index) => {
            let offset = index - activeIndex;
            // Normalize offset for 4 items to be -1, 0, 1, 2
            if (offset < -1) offset += showcaseWorks.length;
            if (offset > 2) offset -= showcaseWorks.length;

            const isCenter = offset === 0;

            return (
              <motion.div
                key={index}
                initial={{ x: "-50%", y: "-50%", scale: 0.8, opacity: 0 }}
                animate={{
                  x: `calc(-50% + ${offset * 22}vw)`,
                  y: "-50%",
                  scale: 1 - Math.abs(offset) * 0.15,
                  opacity: Math.abs(offset) > 1 ? 0 : 1,
                  filter: offset === 0 ? "blur(0px)" : "blur(40px)",
                  zIndex: 30 - Math.abs(offset) * 10,
                }}
                transition={{ type: "spring", stiffness: 150, damping: 25 }}
                className={`absolute top-1/2 left-1/2 rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.2)] border border-white/10 bg-black/50 backdrop-blur-sm cursor-pointer flex items-center justify-center ${work.type === 'short' ? 'h-full aspect-[9/16]' : 'w-[85vw] md:w-[60vw] max-w-5xl aspect-video'
                  }`}
                onClick={() => setActiveIndex(index)}
              >
                {/* Video Content */}
                {work.isYoutube ? (
                  <iframe
                    src={work.vid}
                    title="Video Showcase"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <video
                    src={work.vid}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Premium Glass Overlay */}
                <div className="absolute inset-0 border border-white/10 rounded-2xl md:rounded-3xl pointer-events-none" />
                {!isCenter && <div className="absolute inset-0 bg-black/60 pointer-events-none transition-colors duration-500" />}

                {isCenter && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                          <Play className="w-3 h-3 text-white fill-white" />
                        </div>
                        <span className="text-xs font-medium tracking-widest uppercase text-white/90">Playing Showcase</span>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-6 mt-4 w-full">
          <button
            onClick={() => setActiveIndex((prev) => (prev - 1 + showcaseWorks.length) % showcaseWorks.length)}
            className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-white/30 transition-all text-white/50 hover:text-white backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            {showcaseWorks.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${activeIndex === i ? 'bg-violet-400 w-8' : 'bg-white/20 hover:bg-white/40'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => setActiveIndex((prev) => (prev + 1) % showcaseWorks.length)}
            className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-white/30 transition-all text-white/50 hover:text-white backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </section>
  );
}

function Scene5() {
  const navigate = useNavigate();

  return (
    <section className="w-screen h-full flex flex-col justify-center relative px-8 md:px-24 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.08)_0%,transparent_60%)] pointer-events-none" />

      <div className="z-10 w-full max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 mb-12 md:mb-16">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full mb-4 md:mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400/80" />
              <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/70">Choose Your Path</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, filter: 'blur(0px)' }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="font-display text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-glow-premium leading-[0.9]"
            >
              <div>Ready to</div>
              <div className="text-violet-400 text-glow-violet italic mt-2">Scale?</div>
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="select-text text-white/50 max-w-sm text-sm md:text-base font-light pb-2"
          >
            We don't just edit videos. We engineer attention. Choose your path to excellence below.
          </motion.p>
        </div>

        {/* Main Card: Hire CreativeVision */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="glass-panel p-8 md:p-12 rounded-3xl relative overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.1)] group hover:border-violet-500/30 transition-colors duration-500"
        >
          {/* Background glow/accents */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 group-hover:bg-violet-500/20 transition-colors duration-700 pointer-events-none" />

          {/* Watermark Icon */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
            <Zap className="w-96 h-96" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center justify-between">
            <div className="flex-1 w-full">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mb-6 md:mb-8 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                <Zap className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <h3 className="font-sans text-4xl md:text-5xl font-black mb-4 tracking-tight">Hire CreativeVision</h3>
              <p className="select-text text-white/60 mb-8 md:mb-10 max-w-lg text-base md:text-lg font-light">
                Transform your raw footage into high-converting assets with professional turnaround.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {['4K Post-Production', 'Sound Design', 'Color Grading', 'VFX & Motion'].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm md:text-base text-white/80 font-medium">
                    <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full md:w-auto shrink-0 mt-8 md:mt-0">
              <button
                onClick={() => navigate('/start')}
                className="w-full md:w-auto bg-white text-black px-10 py-5 rounded-full font-semibold text-sm md:text-base tracking-wide hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)]"
              >
                Start Project <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Join the Roster (Simple Text) */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-8 md:mt-12 text-center md:text-left px-4"
        >
          <p className="select-text text-sm md:text-base text-white/40 font-light">
            Are you a world-class editor?{' '}
            <button
              onClick={() => navigate('/join')}
              className="text-white/80 hover:text-white font-medium underline underline-offset-4 decoration-white/30 hover:decoration-white transition-all"
            >
              Join the roster
            </button>
          </p>
        </motion.div>

      </div>
    </section>
  );
}

function Scene6() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="w-screen h-full flex flex-col justify-center relative px-8 md:px-24 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.06)_0%,transparent_60%)] pointer-events-none" />
      
      <div className="z-10 w-full max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400/80" />
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/70">Support</span>
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, filter: 'blur(0px)' }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="font-display text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-12 text-glow-premium"
        >
          Frequently Asked <span className="text-violet-400 italic font-medium text-glow-violet">Questions</span>
        </motion.h2>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`glass-panel border overflow-hidden rounded-2xl transition-all duration-300 ${isOpen ? 'border-violet-500/40 bg-white/10' : 'border-white/10 hover:border-white/20'}`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-5 md:px-8 md:py-6 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className={`text-base md:text-lg font-medium transition-colors ${isOpen ? 'text-white' : 'text-white/80'}`}>
                    {faq.question}
                  </span>
                  <div className={`shrink-0 ml-4 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-violet-500/20 border-violet-500/50 text-violet-400 rotate-180' : 'border-white/10 text-white/50'}`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <p className="select-text px-6 pb-6 md:px-8 md:pb-8 text-sm md:text-base text-white/60 leading-relaxed max-w-3xl">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
