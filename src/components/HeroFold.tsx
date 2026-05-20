import { useEffect, useRef, useState } from 'react';
import { Hero } from './Hero';

/**
 * Hero → Milestones "bottom-fold open" transition (one-shot).
 *
 * The first scroll input (wheel, touch swipe, arrow key, page-down, click on
 * any in-page anchor) triggers a 1.2s CSS animation that rotates the hero
 * around its top edge so the bottom edge swings forward + down, revealing
 * the milestones rendered directly below. During the animation, body scroll
 * is locked — the user can't pause or reverse the fold mid-way.
 *
 * Once the animation completes, the lid is hidden (`display:none` via the
 * .card-frame--open class), body scroll is unlocked, and the user is at
 * scroll position 0 with the Milestones section at the top of the viewport.
 *
 * Reduced motion, deep links (any URL hash other than #top), and reloads
 * partway down the page all skip directly to the 'open' state.
 */

type FoldState = 'closed' | 'opening' | 'open';

const FOLD_DURATION_MS = 1200;
const TRIGGER_KEYS = new Set([
  'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'End', 'Home',
]);
const TOUCH_THRESHOLD_PX = 10;

export function HeroFold() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<FoldState>('closed');

  // Initial state check — skip the fold under reduced motion, mid-page
  // reload, or deep link to a specific section.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState('open');
      return;
    }
    if (window.scrollY > 50) {
      setState('open');
      return;
    }
    const hash = window.location.hash;
    if (hash && hash !== '#top') {
      setState('open');
    }
  }, []);

  // Lock body scroll + listen for trigger input while the fold isn't open.
  useEffect(() => {
    if (state === 'open') return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyTouchAction = body.style.touchAction;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';

    let touchStartY = 0;
    const canTrigger = state === 'closed';
    const trigger = () => { if (canTrigger) setState('opening'); };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY !== 0 || e.deltaX !== 0) trigger();
    };
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const y = e.touches[0]?.clientY ?? 0;
      if (Math.abs(touchStartY - y) > TOUCH_THRESHOLD_PX) trigger();
    };
    const onKey = (e: KeyboardEvent) => {
      if (TRIGGER_KEYS.has(e.key)) {
        e.preventDefault();
        trigger();
      }
    };
    // Catch any in-page anchor click (skip-link, unfold CTA, etc.) and
    // re-route it through the fold animation. Capture phase so we win
    // against the link's own onClick handler.
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('a[href^="#"]')) {
        e.preventDefault();
        e.stopPropagation();
        trigger();
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick, true);

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.touchAction = prevBodyTouchAction;
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick, true);
    };
  }, [state]);

  // Once the animation finishes, advance to the 'open' state — that's
  // what hides the lid and releases the scroll lock.
  useEffect(() => {
    if (state !== 'opening') return;
    const t = window.setTimeout(() => setState('open'), FOLD_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [state]);

  return (
    <div ref={frameRef} className={`card-frame card-frame--${state}`}>
      <div className="card-pin">
        <div className="hero-lid">
          <Hero />
        </div>
      </div>
    </div>
  );
}
