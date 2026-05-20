import { useEffect, useRef } from 'react';
import { Hero } from './Hero';
import { Milestones } from './Milestones';

/**
 * Hero → Milestones "bottom-fold open" transition.
 *
 * Structure:
 *   .card-frame (200svh, the scroll runway)
 *     .card-pin   (sticky, 100svh, the pinned viewport)
 *       .hero-stage  (3D perspective context)
 *         .card-inside-preview  (the milestones, rendered behind the lid)
 *         .hero-lid             (the Hero, rotates around its top edge —
 *                                 bottom swings forward + down, revealing
 *                                 the milestones underneath)
 *
 * Scroll mechanics: as the user scrolls the first 100svh through the
 * .card-frame, the JS sets --progress 0→1 on the frame element. CSS reads
 * --progress to drive `rotateX(progress * 110deg)` on the lid.
 *
 * After progress = 1, the pin un-sticks and the milestones preview scrolls
 * away with it. The "real" Milestones section sits directly after this
 * component in App.tsx — visually continuous with the preview the user
 * just saw inside the fold.
 *
 * Reduced motion: --progress is set to 1 immediately and scroll listeners
 * are skipped, so the Hero appears static and Milestones follows.
 */
export function HeroFold() {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      frame.style.setProperty('--progress', '1');
      return;
    }

    let rafId = 0;
    const update = () => {
      rafId = 0;
      const rect = frame.getBoundingClientRect();
      const total = frame.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.max(0, Math.min(1, -rect.top / total)) : 1;
      frame.style.setProperty('--progress', p.toFixed(4));
    };
    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={frameRef} className="card-frame">
      <div className="card-pin">
        <div className="hero-stage">
          {/* Milestones content sits behind the lid; gradually revealed as the
              lid rotates forward and down. aria-hidden because the real,
              focusable Milestones renders directly after this fold. */}
          <div className="card-inside-preview" aria-hidden="true">
            <Milestones />
          </div>
          <div className="hero-lid">
            <Hero />
          </div>
        </div>
      </div>
    </div>
  );
}
