import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { EVENT } from '../lib/config';
import { Reveal } from './Reveal';

/* Milestones — three reason cards.
   Desktop: 3-column grid (see .milestones__grid in index.css).
   Mobile:  horizontal scroll-snap carousel of one full-width card at
            a time, with pagination dots. Keeps the whole section in
            ~one viewport so the SectionSnap orchestrator can treat it
            as a single page — otherwise the lower cards are hidden
            beneath the fold and a swipe-up snaps the user straight to
            the Gallery, never letting them see milestones II and III.

   SectionSnap (src/components/SectionSnap.tsx) is taught to ignore
   primarily-horizontal touches, so swipes inside the carousel don't
   trigger an unwanted vertical section jump. */

type MilestoneData = {
  numeral: string;
  eyebrow: string;
  title: string;
  iconHref: string;
  attribution: ReactNode;
  body: ReactNode;
  meta: string;
  variant?: 'center';
};

const MILESTONES: MilestoneData[] = [
  {
    numeral: 'I',
    eyebrow: 'The reason',
    title: 'Love',
    iconHref: '#marigold-a',
    attribution: <>{EVENT.couple.groom.split(' ')[0]} &amp; {EVENT.couple.bride.split(' ')[0]}</>,
    body: (
      <>
        The wedding reception of <em>{EVENT.couple.groom}</em> &amp; <em>{EVENT.couple.bride}</em>,
        quietly married on the 12<sup>th</sup> of December, 2025.
      </>
    ),
    meta: 'Reception · the marriage',
  },
  {
    numeral: 'II',
    eyebrow: 'The occasion',
    title: 'Life',
    iconHref: '#marigold-b',
    attribution: <>{EVENT.honoree.name.split(' ')[0]}, at sixty</>,
    body: (
      <>
        The 60<sup>th</sup> birthday of <em>{EVENT.honoree.name}</em> — matriarch, teacher, gentle
        keeper of every family story worth keeping.
      </>
    ),
    meta: 'Sashtipoorti · sixty turns of the sun',
    variant: 'center',
  },
  {
    numeral: 'III',
    eyebrow: 'The farewell',
    title: 'Legacy',
    iconHref: '#marigold-c',
    attribution: <>{EVENT.honoree.school}, with thanks</>,
    body: (
      <>
        {EVENT.honoree.name.split(' ')[0]}&rsquo;s retirement from <em>{EVENT.honoree.school}</em>,
        where she has taught — and shaped — a generation of students.
      </>
    ),
    meta: `${EVENT.honoree.school} · a teaching life`,
  },
];

export function Milestones({ id }: { id?: string } = {}) {
  const carouselRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 767px)').matches
      : false,
  );
  // Set while we teleport from a ghost to its real counterpart, so the
  // settled-position handler doesn't re-fire on the landing card.
  const isJumpingRef = useRef(false);

  // Track viewport so the ghost copies only render when the carousel
  // is actually active (desktop grid would otherwise show 5 cards).
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Carousel with infinite loop. The rendered children on mobile are:
  //   [ghost = copy of LAST real, real-0, real-1, real-2, ghost = copy of FIRST real]
  // On mount we scroll to the first real card (DOM index 1). When the
  // user reaches a ghost (the first or last DOM child), a scrollend
  // listener teleports them to the matching real card on the opposite
  // side — visually invisible because the ghost IS a copy of the real.
  useEffect(() => {
    const el = carouselRef.current;
    if (!el || !isMobile) return;

    const cards = Array.from(el.children) as HTMLElement[];
    const realCount = MILESTONES.length;
    const lastIdx = cards.length - 1;

    const centerOf = (c: HTMLElement) =>
      c.offsetLeft - (el.clientWidth - c.clientWidth) / 2;

    // Initial: land on the first real card (DOM index 1)
    el.scrollLeft = centerOf(cards[1]);

    const jumpTo = (domIdx: number) => {
      const t = cards[domIdx];
      if (!t) return;
      isJumpingRef.current = true;
      el.scrollLeft = centerOf(t);
      // Give the browser a frame to settle, then clear.
      setTimeout(() => {
        isJumpingRef.current = false;
      }, 120);
    };

    // Use scrollend when available (Chrome/Edge/Firefox 109+); otherwise
    // fall back to a debounced scroll listener that fires when the
    // user has stopped moving for ~90ms.
    const settle = () => {
      if (isJumpingRef.current) return;
      const center = el.scrollLeft + el.clientWidth / 2;
      let closest = 0;
      let best = Infinity;
      cards.forEach((c, i) => {
        const cc = c.offsetLeft + c.clientWidth / 2;
        const d = Math.abs(cc - center);
        if (d < best) { best = d; closest = i; }
      });
      if (closest === 0) {
        // Ghost (copy of last) → teleport to real last
        jumpTo(realCount);
        setActive(realCount - 1);
      } else if (closest === lastIdx) {
        // Ghost (copy of first) → teleport to real first
        jumpTo(1);
        setActive(0);
      } else {
        setActive(closest - 1);
      }
    };

    // `scrollend` is supported in Chromium 114+, Firefox 109+. Fall
    // back to a debounced scroll listener on Safari and older browsers.
    if ('onscrollend' in (el as HTMLElement)) {
      const onScrollEnd = () => settle();
      (el as HTMLElement).addEventListener('scrollend', onScrollEnd as EventListener);
      return () => (el as HTMLElement).removeEventListener('scrollend', onScrollEnd as EventListener);
    }

    let timer: number | null = null;
    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(settle, 90);
    };
    el.addEventListener('scroll', onScroll);
    return () => {
      if (timer) clearTimeout(timer);
      el.removeEventListener('scroll', onScroll);
    };
  }, [isMobile]);

  const scrollToIndex = (dotIdx: number) => {
    const cards = carouselRef.current?.children;
    // Dot indexes (0..n-1) map to DOM indexes 1..n on mobile (ghost at 0),
    // and to 0..n-1 on desktop (no ghosts — but desktop is grid mode, this
    // path doesn't really run there).
    const domIdx = isMobile ? dotIdx + 1 : dotIdx;
    const target = cards?.[domIdx] as HTMLElement | undefined;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  // Render order: ghost(last) + reals + ghost(first) on mobile,
  // just the reals on desktop (CSS grid would otherwise show 5 cards).
  const cardsToRender: MilestoneData[] = isMobile
    ? [MILESTONES[MILESTONES.length - 1], ...MILESTONES, MILESTONES[0]]
    : MILESTONES;

  return (
    /* Section is full-bleed (no horizontal padding or max-width) so
       the trailing blockprint-band can reach the viewport edges, the
       same way Gallery does it. The header + carousel + dots each
       carry their own max-w-6xl wrapper. */
    <section
      id={id}
      className="paper-cloth paper-edge--soft min-h-screen flex flex-col pt-6 sm:pt-10 pb-6 sm:pb-10"
    >
      <div className="text-center shrink-0 px-5 sm:px-10 max-w-6xl mx-auto w-full">
        <Reveal>
          <p className="smallcaps text-pink">The Three Milestones</p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="font-display text-burgundy text-3xl sm:text-5xl md:text-6xl mt-3 sm:mt-5 leading-[1.02]">
            One evening,
            <br />
            <span className="font-italicserif italic text-pink">three reasons</span> to gather.
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <div className="mt-4 sm:mt-7 flex justify-center" aria-hidden="true">
            <svg className="opacity-90 w-9 h-9 sm:w-12 sm:h-12">
              <use href="#marigold-a" />
            </svg>
          </div>
        </Reveal>
        <Reveal delay={220}>
          <p className="mt-3 sm:mt-7 max-w-xl mx-auto text-inkSoft font-italicserif italic text-base sm:text-lg leading-snug sm:leading-relaxed">
            Three quiet stories, folded together into one warm {EVENT.city} night — the kind of night a
            family remembers out loud, for years.
          </p>
        </Reveal>
      </div>

      {/* Grid wrapper deliberately drops the max-w-6xl constraint
          (which kept the desktop cards huddled in the middle) and uses
          generous progressive padding so the three columns spread
          across the viewport — modern, in line with the Gallery's
          edge-to-edge feel. The header above keeps its max-w-6xl. */}
      <div className="flex-1 flex flex-col px-5 sm:px-10 lg:px-16 xl:px-24 w-full">
        <ol
          ref={carouselRef}
          className="milestones__grid flex-1 mt-4 sm:mt-20 md:mt-24"
          role="list"
        >
          {cardsToRender.map((m, i) => {
            const isGhost = isMobile && (i === 0 || i === cardsToRender.length - 1);
            return (
              <Reveal delay={100 + i * 80} key={`card-${i}-${m.numeral}`}>
                <li
                  className={`milestone ${m.variant === 'center' ? 'milestone--center' : ''}`}
                  aria-hidden={isGhost ? true : undefined}
                >
                  <span className="milestone__numeral">{m.numeral}</span>
                  <p className="milestone__eyebrow">{m.eyebrow}</p>
                  <h3 className="milestone__title">{m.title}</h3>
                  <div className="milestone__rule" aria-hidden="true" />
                  <p className="milestone__attribution">
                    <svg width="22" height="22"><use href={m.iconHref} /></svg>
                    {m.attribution}
                  </p>
                  <p className="milestone__body">{m.body}</p>
                  <p className="milestone__meta">{m.meta}</p>
                </li>
              </Reveal>
            );
          })}
        </ol>
      </div>

      <div
        className="milestones__dots md:hidden mt-3 shrink-0"
        role="tablist"
        aria-label="Milestone navigation"
      >
        {MILESTONES.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-label={`Go to milestone ${i + 1}`}
            aria-selected={i === active}
            onClick={() => scrollToIndex(i)}
            className={`milestones__dot ${i === active ? 'is-active' : ''}`}
          />
        ))}
      </div>

      {/* Bottom blockprint divider, full-bleed at section level so it
          spans viewport edges (matches Gallery / Details / RsvpForm). */}
      <div className="pt-6 sm:pt-8 shrink-0" aria-hidden="true">
        <div className="blockprint-band" />
      </div>
    </section>
  );
}
