import { Reveal } from './Reveal';
import { EVENT } from '../lib/config';

export function Gallery() {
  return (
    <section id="album" className="px-5 sm:px-10 max-w-6xl mx-auto pt-4 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div className="max-w-xl">
          <Reveal>
            <p className="smallcaps text-emerald">A Memory Album</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 font-display text-burgundy leading-[1.05] text-4xl sm:text-5xl md:text-[3.4rem]">
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

      <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
        <Reveal delay={80} className="md:col-span-5 md:row-span-2">
          <figure>
            <div className="photo-frame photo-1 aspect-[3/4] w-full p-6 flex flex-col justify-between">
              <span className="smallcaps text-cream/80">No. I</span>
              <div className="photo-caption-num">
                XII<span className="text-cream/60">·</span>25
              </div>
            </div>
            <figcaption className="mt-3 smallcaps text-inkSoft">
              The ceremony &nbsp;·&nbsp; {EVENT.couple.ceremonyShort}
            </figcaption>
          </figure>
        </Reveal>

        <Reveal delay={160} className="md:col-span-7">
          <figure>
            <div className="photo-frame photo-2 aspect-[16/9] w-full p-6 flex items-end justify-between">
              <span className="smallcaps text-cream/80">No. II</span>
              <div className="font-italicserif italic text-cream/90 text-2xl sm:text-3xl">
                the morning after
              </div>
            </div>
            <figcaption className="mt-3 smallcaps text-inkSoft">
              Around the haveli &nbsp;·&nbsp; spring 2026
            </figcaption>
          </figure>
        </Reveal>

        <Reveal delay={240} className="md:col-span-7">
          <figure>
            <div className="photo-frame photo-3 aspect-[4/3] w-full p-6 flex items-start justify-between">
              <div className="font-italicserif italic text-cream/90 text-2xl sm:text-3xl leading-tight max-w-[16ch]">
                a classroom,
                <br />
                thirty&nbsp;years on
              </div>
              <span className="smallcaps text-cream/80">No. III</span>
            </div>
            <figcaption className="mt-3 smallcaps text-inkSoft">
              Sophia School &nbsp;·&nbsp; last bell
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
