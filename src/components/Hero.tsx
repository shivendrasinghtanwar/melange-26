import { EVENT } from '../lib/config';

const letters = [...EVENT.name];

function smoothScroll(e: React.MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute('href');
  if (!href || !href.startsWith('#')) return;
  const target = document.querySelector(href);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function Hero({ withId = true }: { withId?: boolean } = {}) {
  return (
    <header
      id={withId ? 'top' : undefined}
      className="hero-cloth paper-edge relative min-h-[100svh] max-h-[100svh] flex flex-col overflow-hidden"
    >
      {/* decorative Ganesh outlines on the left and right (desktop only) */}
      <svg className="ganesh-side ganesh-side--left" aria-hidden="true">
        <use href="#ganesh" />
      </svg>
      <svg className="ganesh-side ganesh-side--right" aria-hidden="true">
        <use href="#ganesh" />
      </svg>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-10 pt-8 pb-4 text-center">
        {/* Arch + wordmark */}
        <div className="arch-wrap w-[min(94vw,780px)] aspect-[5/6] max-h-[72svh] flex items-center justify-center">
          <svg className="arch" aria-hidden="true">
            <use href="#mihrab" />
          </svg>

          <div className="relative px-6 sm:px-12 pt-6 sm:pt-8 flex flex-col items-center">
            <p className="smallcaps text-pink mb-2">{EVENT.family}</p>
            <p className="font-italicserif italic text-inkSoft text-base sm:text-lg mb-2">
              — invites you to —
            </p>

            <h1 className="wordmark tracking-tight" aria-label={EVENT.name}>
              {letters.map((ch, i) => (
                <span key={i} style={{ animationDelay: `${40 + i * 80}ms` }}>
                  {ch}
                </span>
              ))}
            </h1>

            <div className="mt-4 sm:mt-5 flex flex-col items-center">
              <svg width="36" height="36" aria-hidden="true">
                <use href="#marigold-a" />
              </svg>
              <p className="mt-3 font-italicserif italic text-ink text-base sm:text-[1.5rem] leading-snug whitespace-nowrap">
                {EVENT.tagline}
              </p>
            </div>
          </div>
        </div>

        {/* Date strip */}
        <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-ink">
          <span className="stamp text-sm sm:text-base">{EVENT.date.day.toUpperCase()}</span>
          <span className="w-px h-5 bg-pink/40" aria-hidden="true" />
          <span className="stamp text-base sm:text-lg text-pink">
            {EVENT.date.dayNum} · {EVENT.date.monthRoman} · {EVENT.date.year}
          </span>
          <span className="w-px h-5 bg-pink/40" aria-hidden="true" />
          <span className="stamp text-sm sm:text-base">{EVENT.city.toUpperCase()}</span>
        </div>

        {/* CTA */}
        <a href="#rsvp" className="ink-link mt-5 smallcaps text-pink" onClick={smoothScroll}>
          RSVP with us
        </a>

        <a
          href="#milestones"
          onClick={smoothScroll}
          className="mt-8 sm:mt-10 text-inkSoft hover:text-pink transition-colors text-sm font-italicserif italic flex flex-col items-center gap-1"
        >
          unfold
          <span aria-hidden="true" className="text-base">↓</span>
        </a>
      </div>
    </header>
  );
}
