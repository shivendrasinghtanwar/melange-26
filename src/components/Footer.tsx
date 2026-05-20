import { EVENT } from '../lib/config';

function smoothScroll(e: React.MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute('href');
  if (!href || !href.startsWith('#')) return;
  const target = document.querySelector(href);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function Footer() {
  return (
    <footer className="px-5 sm:px-10 pb-14 pt-8 text-center">
      <div className="flex flex-col items-center">
        <svg width="120" height="92" aria-hidden="true">
          <use href="#paisley-m" />
        </svg>
        <p className="mt-5 font-italicserif italic text-burgundy text-xl sm:text-2xl">
          With love, the family.
        </p>
        <p className="mt-1 font-italicserif italic text-inkSoft text-sm">
          {EVENT.couple.groom.split(' ')[0]} &amp; {EVENT.couple.bride.split(' ')[0]}
          &nbsp;·&nbsp; {EVENT.honoree.name.split(' ')[0]} &nbsp;·&nbsp; the Tanwars
        </p>

        <div className="mt-7 w-full max-w-md">
          <div className="blockprint-band thin" />
        </div>

        <p className="mt-6 smallcaps text-pink">
          {EVENT.name} &nbsp;·&nbsp; {EVENT.date.dayNum} . {EVENT.date.monthRoman} . {EVENT.date.yearRoman} &nbsp;·&nbsp; {EVENT.city}
        </p>
        <p className="mt-3 text-xs text-inkSoft/70 font-italicserif italic">
          Printed in warm cream and Jaipur pink, for a family, by a family.
        </p>
        <p className="mt-6 text-[11px] text-inkSoft/60">
          <a href="#top" onClick={smoothScroll} className="hover:text-pink transition-colors">
            Return to the top
          </a>
        </p>
      </div>
    </footer>
  );
}
