import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

// A row of example videos. Each shows its picture until you press play, then plays right there
// (lighter than loading four YouTube players at once, and nothing moves on its own).

const VIDEOS = [
  { id: 'DFsizBNcfIA', label: 'Long video example 1', vertical: false },
  { id: 'n4ha0vyW7Vc', label: 'Short video example 1', vertical: true },
  { id: '4iQHoaFQr8E', label: 'Long video example 2', vertical: false },
  { id: 'g7EigqBCJco', label: 'Short video example 2', vertical: true },
];

function VideoTile({ id, label, vertical }: { id: string; label: string; vertical: boolean }) {
  const [playing, setPlaying] = useState(false);
  const size = vertical
    ? 'w-[46vw] aspect-[9/16] sm:w-auto sm:h-[320px] lg:h-[400px]'
    : 'w-[84vw] aspect-video sm:w-auto sm:h-[320px] lg:h-[400px]';

  return (
    <div className={`relative shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-black ${size}`}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={label}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="h-full w-full"
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 h-full w-full text-left">
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-[1.02] group-hover:opacity-100"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <span className="absolute bottom-4 left-4 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-black shadow-lg transition group-hover:scale-105">
              <Play className="ml-0.5 h-4 w-4 fill-black" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-white" aria-hidden="true">{vertical ? 'Short video' : 'Long video'}</span>
          </span>
          <span className="sr-only">Play {label}</span>
        </button>
      )}
    </div>
  );
}

export function VideoStrip() {
  const scroller = useRef<HTMLDivElement>(null);
  const move = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <div>
      <div
        ref={scroller}
        role="region"
        aria-label="Video examples (scroll sideways for more)"
        tabIndex={0}
        className="cv-strip -mx-4 flex snap-x snap-mandatory items-center gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8"
      >
        {VIDEOS.map((video) => (
          <VideoTile key={video.id} {...video} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => move(-1)}
          className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/80 transition hover:border-white/35 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Previous videos</span>
        </button>
        <button
          type="button"
          onClick={() => move(1)}
          className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/80 transition hover:border-white/35 hover:text-white"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">More videos</span>
        </button>
      </div>
    </div>
  );
}
