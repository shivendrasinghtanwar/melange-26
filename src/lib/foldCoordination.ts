/**
 * Cross-fold coordination — keeps multiple overlay-fold components
 * (HeroFold, MileToPhotosFold, …) from triggering one another during
 * concurrent animations or trackpad-momentum tails.
 *
 *   markFoldStarted()  — call when an overlay enters opening/closing
 *   markFoldEnded()    — call when an overlay returns to closed/open
 *                        (the timeline onComplete callback is the
 *                        right place; it sets the cooldown timestamp)
 *   canStartFold()     — call before triggering open/close;
 *                        returns false if (a) some other fold is
 *                        currently animating, OR (b) less than
 *                        COOLDOWN_MS has elapsed since the most recent
 *                        fold ended (gives trackpad momentum a window
 *                        to decay)
 */

let activeFoldAnimations = 0;
let lastFoldEndedAt = 0;

/** How long after a fold's animation completes before another fold
 *  is allowed to start. Tuned for macOS trackpad momentum tails (≈ 700ms)
 *  plus a little reading-pause buffer. */
const COOLDOWN_MS = 1000;

export function markFoldStarted(): void {
  activeFoldAnimations += 1;
}

export function markFoldEnded(): void {
  activeFoldAnimations = Math.max(0, activeFoldAnimations - 1);
  lastFoldEndedAt = Date.now();
}

export function canStartFold(): boolean {
  if (activeFoldAnimations > 0) return false;
  return Date.now() - lastFoldEndedAt >= COOLDOWN_MS;
}
