import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

/* Memory album — two continuous marquee strips drifting in opposite
   directions. Each strip's content is rendered twice inline (with the
   duplicates aria-hidden) so the translateX(-50%) keyframe makes a
   truly seamless loop. CSS lives in src/index.css under "Memory album".

   Photo assets live in public/assets/gallery-web/ — converted from
   the originals in public/assets/gallery/ (HEIF→JPEG, downscaled to
   1600px long-edge) via utils/heif_to_jpg.py. See the README in that
   folder for the conversion recipe. */

/** Build the absolute URL to a gallery photo, honouring the Vite
 *  `base` (so it works under both the local dev `/` and the deployed
 *  `/melange-26/`). */
const photo = (filename: string) =>
  `${import.meta.env.BASE_URL}assets/gallery-web/${filename}`;

type Photo = {
  ar: '4-3' | '3-4' | '16-9' | '1-1';
  frame: 1 | 2 | 3;
  tag: string;
  src: string;
  alt: string;
  caption: ReactNode;
};

const ROW_TOP: Photo[] = [
  {
    ar: '4-3', frame: 1, tag: 'No. I',
    src: photo('family_1.jpg'),
    alt: 'The Tanwar family',
    caption: 'the family, together',
  },
  {
    ar: '3-4', frame: 2, tag: 'No. II',
    src: photo('shivdi_hyd_1.jpg'),
    alt: 'Shivendra and Divyani, evening portrait',
    caption: 'an evening · Hyderabad',
  },
  {
    ar: '16-9', frame: 3, tag: 'No. III',
    src: photo('shivdi_bali_2.jpg'),
    alt: 'Shivendra and Divyani at the Bali cliffs',
    caption: 'Bali · the cliffs',
  },
  {
    ar: '3-4', frame: 1, tag: 'No. IV',
    src: photo('shivdi_nashik.jpg'),
    alt: 'Shivendra and Divyani at twilight',
    caption: 'twilight · December',
  },
];

const ROW_BOTTOM: Photo[] = [
  {
    ar: '3-4', frame: 2, tag: 'No. V',
    src: photo('shivdi_nashik_2.jpg'),
    alt: 'Shivendra and Divyani in the garden at dusk',
    caption: 'the garden, at dusk',
  },
  {
    ar: '4-3', frame: 3, tag: 'No. VI',
    src: photo('shivdi_bali_1.jpg'),
    alt: 'Shivendra and Divyani by the sea in Bali',
    caption: 'the sea · Uluwatu',
  },
  {
    ar: '3-4', frame: 1, tag: 'No. VII',
    src: photo('shivdi_1.jpg'),
    alt: 'Shivendra and Divyani above the city',
    caption: 'above the city',
  },
  {
    ar: '3-4', frame: 2, tag: 'No. VIII',
    src: photo('shivdi_goa_1.jpg'),
    alt: 'Shivendra and Divyani in Goa',
    caption: 'Goa · monsoon',
  },
];

function PhotoItem({ p, dup }: { p: Photo; dup: boolean }) {
  return (
    <figure className={`marquee__item ar-${p.ar}`} aria-hidden={dup || undefined}>
      <div className={`photo-frame photo-${p.frame}`}>
        <span className="smallcaps frame-tag">{p.tag}</span>
        <img className="photo-image" src={p.src} alt={p.alt} loading="lazy" />
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

export function Gallery({ id }: { id?: string } = {}) {
  return (
    /* Three-part vertical section, sized to one viewport (min-h-screen):
       — header at top (eyebrow + Moments, kept. + intro)
       — content (two marquee rows) fills the middle via flex-1
       — bottom divider sits at the foot of the section
       The trailing blockprint-band that used to live in App.tsx now
       belongs to this section, so the section + divider together fit
       within one 100vh — same vertical rhythm as the Milestones screen.
       id is optional so this component can be rendered as an overlay
       copy (inside MileToPhotosFold) without producing a duplicate
       `#album` in the DOM. */
    <section
      id={id}
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
