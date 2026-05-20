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
    <section id="album" className="pt-4 pb-10" aria-labelledby="album-title">
      <div className="px-5 sm:px-10 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="max-w-xl">
            <Reveal>
              <p className="smallcaps text-emerald">A Memory Album</p>
            </Reveal>
            <Reveal delay={80}>
              <h2
                id="album-title"
                className="mt-4 font-display text-burgundy leading-[1.05] text-4xl sm:text-5xl md:text-[3.4rem]"
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

      <div className="mt-12 sm:mt-14">
        <MarqueeRow direction="rtl" photos={ROW_TOP} label="Memory album, top row" />
        <div className="mt-8 sm:mt-10">
          <MarqueeRow direction="ltr" photos={ROW_BOTTOM} label="Memory album, bottom row" />
        </div>
      </div>

      <div className="px-5 sm:px-10 max-w-3xl mx-auto mt-14 sm:mt-20">
        <div className="ornament-rule">
          <span className="smallcaps text-pink">a film reel of memories</span>
        </div>
        <p className="mt-4 text-center font-italicserif italic text-inkSoft text-sm sm:text-base">
          Real photographs will replace these gradients in the weeks before the evening.
        </p>
      </div>
    </section>
  );
}
