import { EVENT } from '../lib/config';

function returnToTop(e: React.MouseEvent<HTMLAnchorElement>) {
  // Post-fold, the original #top element (inside the hero lid) is
  // display:none — so target.scrollIntoView would silently no-op. Scroll
  // straight to scroll-position 0 instead, which is where the page now
  // starts (Milestones at top).
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function Footer() {
  return (
    <footer className="px-5 sm:px-10 pb-14 pt-8 text-center">
      <div className="flex flex-col items-center">
        <svg width="120" height="92" aria-hidden="true">
          <use href="#paisley-m" />
        </svg>
        <p className="mt-5 font-italicserif italic text-burgundy text-xl sm:text-2xl">
          With love, the Tanwar family.
        </p>
        <p className="mt-1 font-italicserif italic text-inkSoft text-sm">
          {/* Each pair wrapped in whitespace-nowrap so name pairs don't
              split awkwardly when the line wraps at narrow widths. */}
          <span className="whitespace-nowrap">The Tanwars</span>
          &nbsp;·&nbsp;
          <span className="whitespace-nowrap">
            {EVENT.honoree.spouse.split(' ')[0]} &amp; {EVENT.honoree.name.split(' ')[0]}
          </span>
          &nbsp;·&nbsp;
          <span className="whitespace-nowrap">
            {EVENT.couple.groom.split(' ')[0]} &amp; {EVENT.couple.bride.split(' ')[0]}
          </span>
        </p>

        <div className="mt-7 w-full max-w-md">
          <div className="blockprint-band thin" />
        </div>

        <p className="mt-6 smallcaps text-pink">
          {EVENT.name} &nbsp;·&nbsp; {EVENT.date.yearRoman}
        </p>
        <p className="mt-6 text-[11px] text-inkSoft/60">
          <a href="#top" onClick={returnToTop} className="hover:text-pink transition-colors">
            Return to the top
          </a>
        </p>
      </div>
    </footer>
  );
}
