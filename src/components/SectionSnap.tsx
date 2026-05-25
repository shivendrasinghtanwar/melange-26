import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { canStartFold, markFoldStarted, markFoldEnded } from '../lib/foldCoordination';

gsap.registerPlugin(ScrollToPlugin);

/**
 * Section-to-section snap-scroll orchestrator.
 *
 * One scroll input at the top of any section in SECTIONS triggers a
 * smooth programmatic scroll to the adjacent section (next on down,
 * previous on up). The intermediate scroll positions are not stoppable
 * — wheel / touch / arrow inputs are preventDefault'd for the duration
 * of the scroll, so the user always lands on a section top.
 *
 * The Hero ↔ Milestones boundary is NOT handled here — it has its own
 * full 3D fold animation in HeroFold.tsx. SectionSnap covers the other
 * three boundaries:
 *   Milestones → Gallery (Photos)
 *   Gallery     → Details   (Particulars)
 *   Details     → RsvpForm
 *
 * Cross-fold coordination via src/lib/foldCoordination.ts:
 *   markFoldStarted / markFoldEnded surround each snap so HeroFold
 *   knows to back off; canStartFold() blocks SectionSnap from firing
 *   for ~1s after any fold ends, absorbing trackpad-momentum tails.
 *
 * Reduced-motion: SectionSnap doesn't intercept any input — the page
 * just scrolls as a normal long document.
 */

/** Section IDs in document order — the snap orchestrator navigates
 *  between adjacent entries. */
const SECTIONS = ['milestones', 'album', 'details', 'rsvp'];

const SNAP_DURATION = 1.1;          // seconds — slightly longer for smoother feel
const SNAP_EASE     = 'power3.inOut'; // stronger ease than power2; more cinematic
const BOUNDARY_BUFFER_PX = 80;
const TOUCH_THRESHOLD_PX = 10;
// Vertical-over-horizontal dominance required to trigger a section
// snap. If Δy isn't at least 1.5× Δx, the swipe is treated as
// horizontal and left for any in-section carousel to consume.
const VERTICAL_DOMINANCE_RATIO = 1.5;

const TRIGGER_DOWN_KEYS = new Set(['ArrowDown', 'PageDown', ' ', 'End']);
const TRIGGER_UP_KEYS   = new Set(['ArrowUp',   'PageUp',   'Home']);

export function SectionSnap() {
  const transitioningRef = useRef<boolean>(false);

  // Skip the whole orchestrator under reduced motion.
  const reducedMotionRef = useRef<boolean>(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const getSectionTop = (id: string): number | null => {
      const el = document.getElementById(id);
      if (!el) return null;
      return el.getBoundingClientRect().top + window.scrollY;
    };

    // Returns the index of the section the user is currently AT (their
    // scrollY is within BOUNDARY_BUFFER_PX of that section's top edge).
    // Returns -1 if they're not at any section boundary — e.g. they're
    // at Hero, or scrolled within a section's body, or past Footer.
    const findCurrentIndex = (): number => {
      const y = window.scrollY;
      for (let i = 0; i < SECTIONS.length; i++) {
        const top = getSectionTop(SECTIONS[i]);
        if (top === null) continue;
        if (Math.abs(y - top) < BOUNDARY_BUFFER_PX) return i;
      }
      return -1;
    };

    const snapTo = (target: number) => {
      transitioningRef.current = true;
      markFoldStarted();
      gsap.to(window, {
        scrollTo: { y: target },
        duration: SNAP_DURATION,
        ease: SNAP_EASE,
        onComplete: () => {
          markFoldEnded();
          transitioningRef.current = false;
        },
      });
    };

    /**
     * Handle a directional scroll intent (down=+1, up=-1).
     * Returns true if the event should be preventDefault'd by the
     * caller — i.e. the user IS at a section boundary AND wants to
     * navigate (whether or not we can actually start the snap right
     * now, e.g. cooldown). Returns false to let the browser scroll.
     */
    const handleDirection = (direction: 1 | -1): boolean => {
      const i = findCurrentIndex();
      if (i < 0) return false;                       // not at any boundary
      const next = i + direction;
      if (next < 0 || next >= SECTIONS.length) return false; // out of range

      // We're at a section boundary AND want to navigate — block the
      // native scroll either way.
      if (!canStartFold()) return true;              // cooldown — block but don't snap
      if (transitioningRef.current) return true;     // already snapping

      const target = getSectionTop(SECTIONS[next]);
      if (target === null) return true;

      snapTo(target);
      return true;
    };

    let touchStartY = 0;
    let touchStartX = 0;

    const onWheel = (e: WheelEvent) => {
      if (reducedMotionRef.current) return;
      if (transitioningRef.current) {
        e.preventDefault();
        return;
      }
      const direction: 1 | -1 = e.deltaY > 0 ? 1 : -1;
      if (handleDirection(direction)) e.preventDefault();
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
      touchStartX = e.touches[0]?.clientX ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (reducedMotionRef.current) return;
      if (transitioningRef.current) {
        e.preventDefault();
        return;
      }
      const y = e.touches[0]?.clientY ?? 0;
      const x = e.touches[0]?.clientX ?? 0;
      const deltaY = touchStartY - y;
      const deltaX = touchStartX - x;
      // Require Δy to be clearly dominant before treating this as a
      // vertical swipe. A purely vertical gesture has Δx ≈ 0 and
      // sails through; a diagonal that's only marginally more
      // vertical than horizontal stays with the in-section horizontal
      // carousel (e.g. Milestones on mobile). Without this guard a
      // sideways swipe with a slight downward arc would also page-
      // snap the user to the next section.
      if (Math.abs(deltaY) < TOUCH_THRESHOLD_PX) return;
      if (Math.abs(deltaY) < Math.abs(deltaX) * VERTICAL_DOMINANCE_RATIO) return;
      const direction: 1 | -1 = deltaY > 0 ? 1 : -1;
      if (handleDirection(direction)) e.preventDefault();
    };

    const onKey = (e: KeyboardEvent) => {
      if (reducedMotionRef.current) return;
      if (transitioningRef.current) {
        e.preventDefault();
        return;
      }
      const isDown = TRIGGER_DOWN_KEYS.has(e.key);
      const isUp   = TRIGGER_UP_KEYS.has(e.key);
      if (!isDown && !isUp) return;
      const direction: 1 | -1 = isDown ? 1 : -1;
      if (handleDirection(direction)) e.preventDefault();
    };

    window.addEventListener('wheel',      onWheel,      { passive: false, capture: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true,  capture: true });
    window.addEventListener('touchmove',  onTouchMove,  { passive: false, capture: true });
    window.addEventListener('keydown',    onKey,        true);

    return () => {
      window.removeEventListener('wheel',      onWheel,      true);
      window.removeEventListener('touchstart', onTouchStart, true);
      window.removeEventListener('touchmove',  onTouchMove,  true);
      window.removeEventListener('keydown',    onKey,        true);
    };
  }, []);

  return null;
}
