import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

/* Memory album — two CSS-keyframe marquees drifting in opposite
   directions.

   How the loop stays seamless
   ---------------------------
   The track renders the photo list TWICE inline. The keyframe shifts
   it from translateX(0) to translateX(-50%) — i.e. through exactly
   one copy's worth. At the end of the cycle the viewport is looking
   at the start of the second copy, which is identical to the start
   of the first, so the jump back to 0 is invisible.

   The only requirement: one copy of the list must be at least as wide
   as the viewport, otherwise empty space appears at the wrap. With
   four unique photos per row at ~250–280px, four photos alone fall
   short on desktop, so we repeat the source list REPEAT_PER_ROW
   times before rendering it twice in the track. At 8× × 4 unique =
   32 items per copy ≈ 8000px, covering even 4K viewports.

   Photo assets live in public/assets/gallery-web/ — converted from
   the originals in public/assets/gallery/ (HEIF→JPEG, downscaled to
   1600px long-edge) via utils/heif_to_jpg.py. */

const REPEAT_PER_ROW = 4;

const photo = (filename: string) =>
  `${import.meta.env.BASE_URL}assets/gallery-web/${filename}`;

type Photo = {
  ar: '4-3' | '3-4' | '16-9' | '1-1';
  frame: 1 | 2 | 3;
  src: string;
  alt: string;
  caption: ReactNode;
};

/* Photos are deliberately jumbled — couple moments and Sarandha's
   teaching life shuffled together rather than segregated into a
   "couple row" and a "school row". Reads as one continuous family
   album with three stories braided into it. */
const ROW_TOP: Photo[] = [
  {
    ar: '4-3', frame: 1,
    src: photo('family_1.jpg'),
    alt: 'The Tanwar family',
    caption: 'the family, together',
  },
  {
    ar: '16-9', frame: 3,
    src: photo('sarandha_school/IMG_20210106_002338.jpg'),
    alt: 'Sarandha with her students at the Taj Mahal',
    caption: 'a class outing · Agra',
  },
  {
    ar: '3-4', frame: 2,
    src: photo('shivdi_hyd_1.jpg'),
    alt: 'Shivendra and Divyani, evening portrait',
    caption: 'an evening · Hyderabad',
  },
  {
    ar: '3-4', frame: 1,
    src: photo('sarandha_school/6f5d7495-8674-447d-aae0-fedc3a463497.jpg'),
    alt: 'Sarandha with three colleagues on a terrace',
    caption: 'a Sunday on the terrace',
  },
  {
    ar: '16-9', frame: 3,
    src: photo('shivdi_bali_2.jpg'),
    alt: 'Shivendra and Divyani at the Bali cliffs',
    caption: 'Bali · the cliffs',
  },
  {
    ar: '3-4', frame: 2,
    src: photo('sarandha_school/B612_20230810_193431_572.jpg'),
    alt: 'Sarandha and a colleague, indoor portrait',
    caption: 'between two friends',
  },
  {
    ar: '3-4', frame: 1,
    src: photo('shivdi_nashik.jpg'),
    alt: 'Shivendra and Divyani at twilight',
    caption: 'twilight · December',
  },
  {
    ar: '16-9', frame: 3,
    src: photo('sarandha_school/96dbc085-e68f-44e7-97b1-d653b570de39.jpg'),
    alt: 'Sophia School faculty, Christmas gathering',
    caption: 'the staff room · Sophia',
  },
];

const ROW_BOTTOM: Photo[] = [
  {
    ar: '3-4', frame: 2,
    src: photo('shivdi_nashik_2.jpg'),
    alt: 'Shivendra and Divyani in the garden at dusk',
    caption: 'the garden, at dusk',
  },
  {
    ar: '3-4', frame: 1,
    src: photo('sarandha_school/B612_20230827_213834_992.jpg'),
    alt: 'Sarandha with two colleagues, afternoon portrait',
    caption: 'an afternoon out',
  },
  {
    ar: '4-3', frame: 3,
    src: photo('shivdi_bali_1.jpg'),
    alt: 'Shivendra and Divyani by the sea in Bali',
    caption: 'the sea · Uluwatu',
  },
  {
    ar: '3-4', frame: 2,
    src: photo('sarandha_school/B612_20230827_213436_610.jpg'),
    alt: "Sarandha and colleagues at a Rajasthani haveli",
    caption: 'the haveli · summer',
  },
  {
    ar: '3-4', frame: 1,
    src: photo('shivdi_1.jpg'),
    alt: 'Shivendra and Divyani above the city',
    caption: 'above the city',
  },
  {
    ar: '4-3', frame: 3,
    src: photo('sarandha_school/a062c831-5945-4c9c-8c61-86111d39e5ee.jpg'),
    alt: 'Sarandha and colleagues by the pool',
    caption: 'by the water',
  },
  {
    ar: '3-4', frame: 2,
    src: photo('shivdi_goa_1.jpg'),
    alt: 'Shivendra and Divyani in Goa',
    caption: 'Goa · monsoon',
  },
  {
    ar: '4-3', frame: 1,
    src: photo('sarandha_school/a7a33656-e409-4fe3-b0c9-247a8f2580ef.jpg'),
    alt: "Sarandha's colleagues, gathered",
    caption: 'colleagues, gathered',
  },
];

function PhotoSlide({ p, k }: { p: Photo; k: string }) {
  return (
    <figure key={k} className={`marquee__item ar-${p.ar}`}>
      <div className={`photo-frame photo-${p.frame}`}>
        <img className="photo-image" src={p.src} alt={p.alt} loading="lazy" />
      </div>
      <figcaption className="smallcaps marquee__caption">{p.caption}</figcaption>
    </figure>
  );
}

function MarqueeRow({ photos, direction, label }: {
  photos: Photo[];
  direction: 'rtl' | 'ltr';
  label: string;
}) {
  const oneCopy = Array.from({ length: REPEAT_PER_ROW }, () => photos).flat();
  return (
    <div
      className={`marquee memory-marquee marquee--${direction}`}
      role="region"
      aria-label={label}
    >
      <div className="marquee__track">
        {oneCopy.map((p, i) => <PhotoSlide k={`a-${i}`} p={p} key={`a-${i}`} />)}
        {oneCopy.map((p, i) => <PhotoSlide k={`b-${i}`} p={p} key={`b-${i}`} />)}
      </div>
    </div>
  );
}

export function Gallery({ id }: { id?: string } = {}) {
  return (
    <section
      id={id}
      className="paper-cloth paper-cloth--no-sides paper-edge--soft min-h-screen flex flex-col pt-6 sm:pt-10"
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
        <MarqueeRow photos={ROW_TOP} direction="rtl" label="Memory album, top row" />
        <MarqueeRow photos={ROW_BOTTOM} direction="ltr" label="Memory album, bottom row" />
      </div>

      <div className="px-0 py-6 sm:py-8" aria-hidden="true">
        <div className="blockprint-band" />
      </div>
    </section>
  );
}
