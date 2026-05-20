import { useEffect, useRef, useState } from 'react';
import { Hero } from './Hero';

/**
 * Fold-open / fold-close overlay (reversible, infinite).
 *
 * The Hero is rendered as a normal 100svh section in App.tsx. This
 * component mounts a fixed overlay on top that displays a visual copy of
 * the hero, and runs the fold open + close animations.
 *
 * State machine:
 *   closed   — overlay visible at scrollY=0, lid flat & opaque, scroll
 *              input blocked. Any scroll input → opening.
 *   opening  — 1.2s fold-open animation; in parallel, scrollY animates
 *              0 → window.innerHeight. → open.
 *   open     — overlay unmounted (returns null), page is at the
 *              Milestones section, scroll is fully normal. The first
 *              upward scroll input AT the milestones-top boundary
 *              (scrollY ≤ innerHeight) → closing.
 *   closing  — 1.2s fold-close animation (mirror of open); in parallel,
 *              scrollY animates from current down to 0. → closed.
 *
 * Both transitions can repeat indefinitely. Reduced motion, mid-page
 * reloads, and deep-link hashes skip directly to 'open'.
 */

type FoldState = 'closed' | 'opening' | 'open' | 'closing';

const FOLD_DURATION_MS = 1400;
const TRIGGER_DOWN_KEYS = new Set(['ArrowDown', 'PageDown', ' ', 'End']);
const TRIGGER_UP_KEYS   = new Set(['ArrowUp',   'PageUp',   'Home']);
const TOUCH_THRESHOLD_PX = 10;

/* ---------------------------------------------------------------------
 * Debug logging — toggle with `?debug=fold` in the URL OR by setting
 * window.__foldDebug = true in the console. Logs go to console.log with
 * a [fold] prefix so they're easy to grep / paste back.
 * Remove this block (and all log() calls below) once the bug is closed.
 * ------------------------------------------------------------------ */
// Silenced now that the bug is closed. Flip to true (or gate on
// ?debug=fold) if anything ever needs to be diagnosed again.
const DEBUG_ENABLED = false;

function log(event: string, data?: Record<string, unknown>) {
  if (!DEBUG_ENABLED) return;
  const t = Math.round(performance.now()).toString().padStart(6, ' ');
  // eslint-disable-next-line no-console
  console.log(`[fold ${t}ms] ${event}`, data ?? '');
}

export function HeroFold() {
  const [state, setState] = useState<FoldState>('closed');
  const stateRef = useRef<FoldState>(state);
  stateRef.current = state;

  // Wall-clock time of the most recent state transition. Used to gate the
  // scroll-up close trigger so trackpad momentum at the end of the open
  // gesture (which keeps emitting tiny upward wheel events for ~700ms on
  // macOS) doesn't accidentally fire close right after open completes.
  const stateChangedAt = useRef<number>(Date.now());
  useEffect(() => { stateChangedAt.current = Date.now(); }, [state]);

  // Skip the fold entirely under reduced motion / mid-page reload /
  // deep link to a specific section.
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

  // Mount-once listeners — they read latest state through stateRef.
  // overscroll-behavior:none is also applied for the component's lifetime
  // so the browser doesn't swallow boundary wheel events on macOS
  // (rubber-band) or mobile (pull-to-refresh).
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverscroll = html.style.overscrollBehavior;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    html.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';

    let touchStartY = 0;

    // The boundary between the hero zone and the milestones zone is the
    // document-Y position of the #milestones section. Compute it fresh
    // each call via getBoundingClientRect() + scrollY (robust against
    // layout shifts) instead of window.innerHeight (which on mobile is
    // bigger than 100svh whenever the URL bar isn't fully extended —
    // that mismatch was the cause of the open→close infinite loop).
    const getMilestonesBoundary = () => {
      const el = document.getElementById('milestones');
      if (!el) return window.innerHeight;
      return el.getBoundingClientRect().top + window.scrollY;
    };

    const triggerOpen  = (why: string) => {
      if (stateRef.current === 'closed') { log('triggerOpen', { why }); setState('opening'); }
    };
    const triggerClose = (why: string) => {
      if (stateRef.current === 'open') { log('triggerClose', { why }); setState('closing'); }
    };

    // Wheel / touch / key handlers fire the OPEN trigger only.
    // Closing the fold via scroll-input is gone — too easy to false-fire
    // from trackpad momentum-bounce artefacts (macOS sends tiny negative
    // deltaY events as a multi-second scroll decays, which read as
    // "scroll up at boundary" the moment the open animation completes).
    // Reverse-fold is still available via the "Return to the top" link
    // in the footer; that's an explicit user action, no momentum.
    // Meanwhile the hero is in document flow, so plain scroll-up from
    // milestones naturally reveals it — no animation needed.

    const onWheel = (e: WheelEvent) => {
      const s = stateRef.current;
      const scrollY = Math.round(window.scrollY);
      const boundary = Math.round(getMilestonesBoundary());
      log('wheel', { state: s, deltaY: e.deltaY, scrollY, boundary, cx: e.clientX, cy: e.clientY });
      if (s === 'opening' || s === 'closing') {
        e.preventDefault();
        return;
      }
      if (s === 'closed') {
        e.preventDefault();
        triggerOpen('wheel/closed');
      }
      // s === 'open': do nothing, let the browser scroll normally.
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
      log('touchstart', { state: stateRef.current, y: touchStartY });
    };

    const onTouchMove = (e: TouchEvent) => {
      const s = stateRef.current;
      if (s === 'opening' || s === 'closing') {
        e.preventDefault();
        return;
      }
      const y = e.touches[0]?.clientY ?? 0;
      const delta = touchStartY - y;
      log('touchmove', { state: s, delta, y, scrollY: Math.round(window.scrollY) });
      if (s === 'closed') {
        e.preventDefault();
        if (Math.abs(delta) > TOUCH_THRESHOLD_PX) triggerOpen('touch/closed');
      }
      // s === 'open': do nothing.
    };

    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const isDown = TRIGGER_DOWN_KEYS.has(e.key);
      const isUp   = TRIGGER_UP_KEYS.has(e.key);
      if (!isDown && !isUp) return;
      log('keydown', { state: s, key: e.key });
      if (s === 'opening' || s === 'closing') {
        e.preventDefault();
        return;
      }
      if (s === 'closed') {
        e.preventDefault();
        triggerOpen('key/closed');
      }
      // s === 'open': do nothing.
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const s = stateRef.current;
      const href = anchor.getAttribute('href') || '';
      log('click', { state: s, href });
      if (s === 'closed') {
        e.preventDefault();
        e.stopPropagation();
        triggerOpen(`click ${href}`);
        return;
      }
      if (s === 'open') {
        // Only the Footer's "Return to the top" link triggers a close.
        if (href === '#top') {
          e.preventDefault();
          e.stopPropagation();
          triggerClose('click #top');
        }
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    };

    // Scroll-up reverse-fold trigger. Two safeguards keep trackpad-momentum
    // false-fires from re-creating the open→close loop bug:
    //   1) Cooldown: ignore for 1000ms after the most recent state change.
    //      That's longer than typical macOS trackpad momentum-decay tails.
    //   2) Threshold: require scrollY to be at least 50px below the
    //      milestones boundary. A real swipe-up crosses 50px easily; a
    //      decaying-momentum tail rarely moves the page that far.
    const onScroll = () => {
      if (stateRef.current !== 'open') return;
      if (Date.now() - stateChangedAt.current < 1000) return; // cooldown
      const boundary = getMilestonesBoundary();
      if (window.scrollY < boundary - 50) {
        log('onScroll: substantial up-scroll past boundary', {
          scrollY: Math.round(window.scrollY),
          boundary: Math.round(boundary),
          dy: Math.round(window.scrollY - boundary),
        });
        triggerClose('scroll-up past boundary');
      }
    };

    window.addEventListener('wheel',      onWheel,      { passive: false, capture: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true,  capture: true });
    window.addEventListener('touchmove',  onTouchMove,  { passive: false, capture: true });
    window.addEventListener('keydown',    onKey,        true);
    window.addEventListener('click',      onClick,      true);
    window.addEventListener('scroll',     onScroll,     { passive: true });

    return () => {
      html.style.overscrollBehavior = prevHtmlOverscroll;
      body.style.overscrollBehavior = prevBodyOverscroll;
      window.removeEventListener('wheel',      onWheel,      true);
      window.removeEventListener('touchstart', onTouchStart, true);
      window.removeEventListener('touchmove',  onTouchMove,  true);
      window.removeEventListener('keydown',    onKey,        true);
      window.removeEventListener('click',      onClick,      true);
      window.removeEventListener('scroll',     onScroll);
    };
  }, []);

  // During 'opening', animate scrollY up to the milestones section. The
  // scroll completes in the first 70% of the animation (while the lid is
  // still opaque) so that when the lid fades from t=0.7 onward the page
  // beneath is already at the right place. Using #milestones offsetTop
  // (not window.innerHeight) is more accurate on mobile where 100svh and
  // the live innerHeight can disagree by tens of pixels because of the
  // URL bar.
  useEffect(() => {
    if (state !== 'opening') return;
    const el = document.getElementById('milestones');
    const target = el ? el.getBoundingClientRect().top + window.scrollY : window.innerHeight;
    log('state → opening: starting open animation', { fromScrollY: Math.round(window.scrollY), target: Math.round(target) });
    return animateFold({
      tag: 'open',
      start: window.scrollY,
      target,
      scrollDuration: FOLD_DURATION_MS * 0.7,
      totalDuration: FOLD_DURATION_MS,
      scrollDelay: 0,
      onComplete: () => { log('open animation complete → state=open', { scrollY: Math.round(window.scrollY) }); setState('open'); },
    });
  }, [state]);

  // During 'closing', mirror the opening — but delay the scroll by 30%
  // of the duration so the lid has time to rotate back in and become
  // opaque first. The scroll then happens invisibly behind the opaque
  // lid, ending exactly when the lid finishes its rotation home.
  useEffect(() => {
    if (state !== 'closing') return;
    log('state → closing: starting close animation', { fromScrollY: Math.round(window.scrollY) });
    return animateFold({
      tag: 'close',
      start: window.scrollY,
      target: 0,
      scrollDuration: FOLD_DURATION_MS * 0.7,
      totalDuration: FOLD_DURATION_MS,
      scrollDelay: FOLD_DURATION_MS * 0.3,
      onComplete: () => { log('close animation complete → state=closed', { scrollY: Math.round(window.scrollY) }); setState('closed'); },
    });
  }, [state]);

  if (state === 'open') return null;

  return (
    <div className={`fold-overlay fold-overlay--${state}`} aria-hidden="true">
      <div className="fold-overlay__lid">
        <Hero withId={false} />
      </div>
    </div>
  );
}

type AnimateFoldOpts = {
  /** Short label for logs: 'open' or 'close'. */
  tag: string;
  start: number;
  target: number;
  scrollDelay: number;
  scrollDuration: number;
  totalDuration: number;
  onComplete: () => void;
};

function animateFold({
  tag,
  start,
  target,
  scrollDelay,
  scrollDuration,
  totalDuration,
  onComplete,
}: AnimateFoldOpts) {
  const startTime = performance.now();
  let rafId = 0;
  let cancelled = false;
  let frame = 0;

  // CRITICAL: index.css sets `html { scroll-behavior: smooth }`. The
  // legacy two-arg `window.scrollTo(x, y)` honors that CSS — meaning
  // every frame's scrollTo would kick off a smooth scroll. Rapid-fire
  // smooth scrolls don't compose: the browser keeps animating to stale
  // targets after our rAF loop ends, overshooting the snap and landing
  // somewhere mid-page. That overshoot was the cause of the close
  // immediately firing after open (e.g. scrollY=905 when target=1008).
  // Force instant scrolling for the animation, restore on exit.
  const html = document.documentElement;
  const prevScrollBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  log(`${tag}: animateFold start`, { start, target, scrollDelay, scrollDuration, totalDuration, prevScrollBehavior });

  const restore = () => { html.style.scrollBehavior = prevScrollBehavior; };

  const step = () => {
    if (cancelled) return;
    frame++;
    const elapsed = performance.now() - startTime;
    const scrollElapsed = Math.max(0, elapsed - scrollDelay);
    const t = Math.min(1, scrollElapsed / scrollDuration);
    const eased = 1 - Math.pow(1 - t, 3);
    const y = start + (target - start) * eased;
    window.scrollTo(0, y);
    // Frame-grain logs are too noisy, but log a few key checkpoints.
    if (frame === 1 || t === 1 || frame % 12 === 0) {
      log(`${tag}: frame ${frame}`, { elapsed: Math.round(elapsed), t: +t.toFixed(2), targetY: Math.round(y), actualScrollY: Math.round(window.scrollY) });
    }
    if (elapsed < totalDuration) {
      rafId = requestAnimationFrame(step);
    } else {
      window.scrollTo(0, target);
      log(`${tag}: final snap`, { target, actualScrollY: Math.round(window.scrollY), frames: frame });
      restore();
      onComplete();
    }
  };
  rafId = requestAnimationFrame(step);

  return () => {
    cancelled = true;
    if (rafId) cancelAnimationFrame(rafId);
    log(`${tag}: cancelled`, { frame });
    restore();
  };
}
