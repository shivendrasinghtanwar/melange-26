import type { ReactNode } from 'react';
import { Reveal } from './Reveal';
import { EVENT } from '../lib/config';

/* Memory album — two continuous marquee strips drifting in opposite
   directions. Each strip's content is rendered twice inline (with the
   duplicates aria-hidden) so the translateX(-50%) keyframe makes a
   truly seamless loop. CSS lives in src/index.css under "Memory album". */

type Photo = {
  ar: '4-3' | '3-4' | '16-9' | '1-1';
  frame: 1 | 2 | 3;
  tag: string;
  /** Inner content of the gradient frame: either a large italic
   *  "photo-caption-num" mark, or a multi-line "frame-flourish" phrase. */
  inner:
    | { kind: 'num'; text: ReactNode }
    | { kind: 'flourish'; lines: [string] | [string, string]; size?: 'sm' | 'md' };
  caption: ReactNode;
};

const ROW_TOP: Photo[] = [
  {
    ar: '4-3', frame: 1, tag: 'No. I',
    inner: { kind: 'num', text: <>XII<span className="text-cream/60">·</span>25</> },
    caption: <>the ceremony &nbsp;·&nbsp; {EVENT.couple.ceremonyShort}</>,
  },
  {
    ar: '3-4', frame: 2, tag: 'No. II',
    inner: { kind: 'flourish', lines: ['around', 'the haveli'] },
    caption: 'around the haveli · spring 2026',
  },
  {
    ar: '16-9', frame: 3, tag: 'No. III',
    inner: { kind: 'flourish', lines: ['a classroom,', 'thirty years on'] },
    caption: 'Sophia School · last bell',
  },
  {
    ar: '1-1', frame: 1, tag: 'No. IV',
    inner: { kind: 'flourish', lines: ['family,', 'gathered'], size: 'sm' },
    caption: 'family portrait · winter 2025',
  },
  {
    ar: '4-3', frame: 2, tag: 'No. V',
    inner: { kind: 'num', text: "'92" },
    caption: 'Sarandha’s class of ’92',
  },
  {
    ar: '3-4', frame: 3, tag: 'No. VI',
    inner: { kind: 'flourish', lines: ['the morning', 'after'] },
    caption: 'the morning after',
  },
  {
    ar: '16-9', frame: 1, tag: 'No. VII',
    inner: { kind: 'flourish', lines: ['Bikaner,', 'on the way'] },
    caption: 'Bikaner, on the way',
  },
  {
    ar: '1-1', frame: 2, tag: 'No. VIII',
    inner: { kind: 'flourish', lines: ['tea at', 'the haveli'], size: 'sm' },
    caption: 'tea at the haveli',
  },
];

const ROW_BOTTOM: Photo[] = [
  {
    ar: '16-9', frame: 2, tag: 'No. IX',
    inner: { kind: 'flourish', lines: ['the courtyard,', 'at dusk'] },
    caption: 'the courtyard · early evening',
  },
  {
    ar: '1-1', frame: 3, tag: 'No. X',
    inner: { kind: 'flourish', lines: ['a quiet', 'page'], size: 'sm' },
    caption: 'the staff room · last week',
  },
  {
    ar: '3-4', frame: 1, tag: 'No. XI',
    inner: { kind: 'flourish', lines: ['the long', 'drive home'] },
    caption: 'Jaipur to Bikaner · February',
  },
  {
    ar: '4-3', frame: 2, tag: 'No. XII',
    inner: { kind: 'num', text: 'MMXXV' },
    caption: 'an anniversary, quietly',
  },
  {
    ar: '16-9', frame: 1, tag: 'No. XIII',
    inner: { kind: 'flourish', lines: ['the school', 'verandah'] },
    caption: 'Sophia School · the verandah',
  },
  {
    ar: '1-1', frame: 3, tag: 'No. XIV',
    inner: { kind: 'flourish', lines: ['two', 'generations'], size: 'sm' },
    caption: 'two generations, one frame',
  },
  {
    ar: '3-4', frame: 2, tag: 'No. XV',
    inner: { kind: 'flourish', lines: ['marigold', '& rain'] },
    caption: 'marigold & rain · monsoon 2025',
  },
  {
    ar: '4-3', frame: 1, tag: '& more',
    inner: { kind: 'flourish', lines: ['… and many', 'more to come'] },
    caption: '… and many more to come',
  },
];

function PhotoItem({ p, dup }: { p: Photo; dup: boolean }) {
  return (
    <figure className={`marquee__item ar-${p.ar}`} aria-hidden={dup || undefined}>
      <div className={`photo-frame photo-${p.frame}`}>
        <span className="smallcaps frame-tag">{p.tag}</span>
        {p.inner.kind === 'num' ? (
          <div className="photo-caption-num">{p.inner.text}</div>
        ) : (
          <div className={`frame-flourish ${p.inner.size === 'sm' ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>
            {p.inner.lines[0]}
            <br />
            {p.inner.lines[1] ?? ''}
          </div>
        )}
      </div>
      <figcaption className="smallcaps marquee__caption">{p.caption}</figcaption>
    </figure>
  );
}

function MarqueeRow({ direction, photos, label }: { direction: 'rtl' | 'ltr'; photos: Photo[]; label: string }) {
  return (
    <div className={`marquee marquee--${direction}`} role="region" aria-roledescription="carousel" aria-label={label}>
      <div className="marquee__track">
        {photos.map((p, i) => (
          <PhotoItem key={`o-${i}`} p={p} dup={false} />
        ))}
        {photos.map((p, i) => (
          <PhotoItem key={`d-${i}`} p={p} dup />
        ))}
      </div>
    </div>
  );
}

export function Gallery() {
  return (
    /* Three-part vertical section, sized to one viewport (min-h-screen):
       — header at top (eyebrow + Moments, kept. + intro)
       — content (two marquee rows) fills the middle via flex-1
       — bottom divider sits at the foot of the section
       The trailing blockprint-band that used to live in App.tsx now
       belongs to this section, so the section + divider together fit
       within one 100vh — same vertical rhythm as the Milestones screen. */
    <section
      id="album"
      className="min-h-screen flex flex-col pt-6 sm:pt-10"
      aria-labelledby="album-title"
    >
      <div className="px-5 sm:px-10 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
          <div className="max-w-xl">
            <Reveal>
              <p className="smallcaps text-emerald">A Memory Album</p>
            </Reveal>
            <Reveal delay={80}>
              <h2
                id="album-title"
                className="mt-3 sm:mt-4 font-display text-burgundy leading-[1.05] text-4xl sm:text-5xl md:text-[3.4rem]"
              >
                Moments, <span className="font-italicserif italic text-pink">kept.</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={160}>
            <p className="font-italicserif italic text-inkSoft text-base sm:text-lg max-w-sm sm:text-right">
              A few photographs from a year that took the long way round to this evening.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6 sm:gap-8 py-6 sm:py-8">
        <MarqueeRow direction="rtl" photos={ROW_TOP} label="Memory album, top row" />
        <MarqueeRow direction="ltr" photos={ROW_BOTTOM} label="Memory album, bottom row" />
      </div>

      <div className="px-0 py-6 sm:py-8" aria-hidden="true">
        <div className="blockprint-band" />
      </div>
    </section>
  );
}
