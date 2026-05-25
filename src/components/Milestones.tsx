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

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    // The carousel scrolls horizontally on mobile; observe each
    // direct child and mark the one that's mostly visible as active.
    // Skip on desktop (no scroll-snap, no carousel UX needed).
    const isCarouselMode = () => window.matchMedia('(max-width: 767px)').matches;
    if (!isCarouselMode()) return;

    const cards = Array.from(el.children) as HTMLElement[];
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            const idx = cards.indexOf(entry.target as HTMLElement);
            if (idx >= 0) setActive(idx);
          }
        });
      },
      { root: el, threshold: [0.55, 0.85] },
    );
    cards.forEach(c => io.observe(c));
    return () => io.disconnect();
  }, []);

  const scrollToIndex = (i: number) => {
    const cards = carouselRef.current?.children;
    const target = cards?.[i] as HTMLElement | undefined;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  return (
    /* Section is full-bleed (no horizontal padding or max-width) so
       the trailing blockprint-band can reach the viewport edges, the
       same way Gallery does it. The header + carousel + dots each
       carry their own max-w-6xl wrapper. */
    <section
      id={id}
      className="min-h-screen flex flex-col pt-6 sm:pt-10 pb-6 sm:pb-10"
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
          {MILESTONES.map((m, i) => (
            <Reveal delay={100 + i * 80} key={i}>
              <li className={`milestone ${m.variant === 'center' ? 'milestone--center' : ''}`}>
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
          ))}
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
