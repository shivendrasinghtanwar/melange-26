import { useEffect, useState } from 'react';

/**
 * Temporary debug overlay — visible on the live site while we diagnose the
 * fold-transition loop bug. Polls the DOM every animation frame and reports:
 *   - the current fold state (read from the .fold-overlay class)
 *   - window.scrollY
 *   - the document-Y position of #milestones (the fold boundary)
 *   - the delta (scrollY − boundary): NEGATIVE means we're above the
 *     boundary in the hero zone, which is what triggers the close transition
 *   - window.innerHeight (so we can see the URL-bar disagreement on mobile)
 *   - a rolling history of the last 8 state transitions
 *
 * Remove this component (and its mount in App.tsx) once the bug is closed.
 */
export function FoldDebugOverlay() {
  const [info, setInfo] = useState({
    state: '—',
    scrollY: 0,
    boundary: 0,
    dy: 0,
    innerH: 0,
  });
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    let rafId = 0;
    let lastSeenState = '';

    const tick = () => {
      const el = document.getElementById('milestones');
      const boundary = el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : 0;
      const scrollY = Math.round(window.scrollY);
      const overlay = document.querySelector('.fold-overlay');
      let state = 'open'; // overlay unmounted = open
      if (overlay) {
        const m = overlay.className.match(/fold-overlay--(closed|opening|closing|open)/);
        state = m?.[1] ?? '?';
      }

      if (state !== lastSeenState) {
        setHistory((h) => [...h.slice(-7), state]);
        lastSeenState = state;
      }

      setInfo({
        state,
        scrollY,
        boundary,
        dy: scrollY - boundary,
        innerH: window.innerHeight,
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const isClosing = info.state === 'closing';

  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        right: 8,
        zIndex: 9999,
        background: isClosing ? 'rgba(180, 30, 50, 0.92)' : 'rgba(0, 0, 0, 0.82)',
        color: '#fff',
        padding: '8px 10px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        lineHeight: 1.45,
        borderRadius: 4,
        pointerEvents: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        minWidth: 200,
      }}
      aria-hidden="true"
    >
      <div>
        state: <b style={{ color: isClosing ? '#ffd' : '#ffd' }}>{info.state}</b>
      </div>
      <div>
        scrollY: <b>{info.scrollY}</b> &nbsp; boundary: <b>{info.boundary}</b>
      </div>
      <div>
        dy: <b style={{ color: info.dy < -1 ? '#ff8' : '#8f8' }}>{info.dy}</b> &nbsp; innerH: {info.innerH}
      </div>
      <div style={{ marginTop: 4, fontSize: 10, opacity: 0.85 }}>
        history: {history.length ? history.join(' → ') : '—'}
      </div>
    </div>
  );
}
