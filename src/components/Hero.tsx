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
  // The in-flow copy carries the document's <h1> wordmark; the
  // (aria-hidden) overlay copy renders it as a presentational <div> so
  // there isn't a duplicate H1 in the DOM (SEO/accessibility concern).
  const WordmarkTag = (withId ? 'h1' : 'div') as 'h1' | 'div';

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
        {/* Arch + wordmark. The arch-wrap is aspect-[5/6], matching the
            mihrab SVG viewBox (600×720) exactly. The arch's corner pegs
            live at the bottom of the wrap (97% from top). The wordmark
            stack centers inside the wrap as before; the date + RSVP are
            absolute-positioned at the bottom edge of the wrap so they
            land right at the peg row, regardless of viewport. The
            "unfold" link sits outside the wrap. */}
        <div className="arch-wrap w-[min(94vw,920px)] aspect-[5/6] max-h-[85svh] relative flex items-center justify-center">
          <svg className="arch" aria-hidden="true">
            <use href="#mihrab" />
          </svg>

          <div className="relative px-6 sm:px-12 pt-6 sm:pt-8 flex flex-col items-center">
            <p className="smallcaps text-pink mb-2">{EVENT.family}</p>
            <p className="font-italicserif italic text-inkSoft text-base sm:text-lg mb-6 sm:mb-8">
              — invites you to —
            </p>

            <WordmarkTag
              className="wordmark tracking-tight"
              aria-label={withId ? EVENT.name : undefined}
              role={withId ? undefined : 'presentation'}
            >
              {letters.map((ch, i) => (
                <span key={i} style={{ animationDelay: `${40 + i * 80}ms` }}>
                  {ch}
                </span>
              ))}
            </WordmarkTag>

            <div className="mt-4 sm:mt-5 flex flex-col items-center">
              {/* shrink-0 so the floret isn't squeezed out of view by the
                  tagline's whitespace-nowrap at narrow viewports. */}
              <svg width="36" height="36" className="shrink-0" aria-hidden="true">
                <use href="#marigold-a" />
              </svg>
              {/* Tagline only forces a single line at ≥sm. At narrow
                  widths it wraps cleanly instead of overflowing and
                  squeezing the floret. */}
              <p className="mt-3 font-italicserif italic text-ink text-base sm:text-[1.5rem] leading-snug sm:whitespace-nowrap">
                {EVENT.tagline}
              </p>
            </div>
          </div>

          {/* Date + RSVP, pinned to the bottom of the arch-wrap so they
              align with the leg-pegs across all viewports. */}
          <div className="absolute inset-x-0 bottom-[5%] flex flex-col items-center px-6 sm:px-12 text-center">
            <div className="flex items-center justify-center text-ink">
              <span className="stamp text-base sm:text-lg text-pink whitespace-nowrap">
                {EVENT.date.dayNum} {EVENT.date.month} {EVENT.date.year}
              </span>
            </div>
            <a
              href="#rsvp"
              className="ink-link ink-link--center mt-3 sm:mt-4 smallcaps text-pink"
              onClick={smoothScroll}
            >
              RSVP
            </a>
          </div>
        </div>

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
