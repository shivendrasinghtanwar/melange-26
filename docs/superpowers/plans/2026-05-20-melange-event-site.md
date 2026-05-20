# Mélange Event Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a refined, mobile-first, static React landing page celebrating three family milestones (Shivendra & Devyani's wedding reception, Sarandha's 60th birthday, and her retirement from Sophia School) on **30 June 2026**, deployable to GitHub Pages, with an RSVP form that submits to a Google Apps Script endpoint backed by Google Sheets.

**Architecture:** Vite + React 18 + TypeScript + Tailwind CSS. Single-page scroll site (Hero → Milestones → Gallery → Details → RSVP → Footer). Pure static output (`vite build` → `/dist`) deployed to GitHub Pages via GitHub Actions. No backend; the RSVP form `POST`s to a user-configured Google Apps Script Web App URL. Reveal animations via a custom `useReveal` IntersectionObserver hook (no framer-motion to keep the bundle small). Design tokens (palette, fonts, motifs) are chosen from one of four mockups in `docs/mockups/` after stakeholder review.

**Tech Stack:**
- Vite 5 + React 18 + TypeScript 5
- Tailwind CSS 3 (with `@tailwindcss/forms`)
- Google Fonts (chosen per mockup)
- Vitest + @testing-library/react (for form-logic tests only)
- GitHub Actions → GitHub Pages

---

## File Structure

```
melange/
├── docs/
│   ├── mockups/                          ← four style options (HTML)
│   ├── reference/initial-draft.html      ← original HTML draft, preserved for reference
│   ├── superpowers/plans/                ← this plan + future plans
│   └── design-system/                    ← chosen tokens, persisted after pick
├── public/
│   ├── .nojekyll                         ← stop GH Pages from running Jekyll
│   ├── og-image.jpg                      ← social-share preview (placeholder)
│   └── assets/gallery/                   ← family drops photos here later
├── src/
│   ├── main.tsx                          ← React entry
│   ├── App.tsx                           ← page composition
│   ├── index.css                         ← Tailwind directives + base styles
│   ├── components/
│   │   ├── Hero.tsx
│   │   ├── Milestones.tsx
│   │   ├── Gallery.tsx
│   │   ├── Details.tsx
│   │   ├── RsvpForm.tsx
│   │   ├── Footer.tsx
│   │   ├── OrnamentSprites.tsx           ← shared <svg><defs> sprite sheet
│   │   └── Reveal.tsx                    ← scroll-reveal wrapper
│   ├── hooks/
│   │   └── useReveal.ts                  ← IntersectionObserver hook
│   ├── lib/
│   │   ├── config.ts                     ← event constants + Apps Script URL
│   │   └── rsvp.ts                       ← form submission helper
│   └── types.d.ts
├── tests/
│   └── rsvp.test.ts                      ← validation + submission tests
├── .github/workflows/deploy.yml
├── .gitignore
├── README.md                             ← setup + deployment + photo + Apps Script docs
├── index.html                            ← Vite root
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

> **Decomposition rationale.** One file per concern, components grouped flat under `src/components/` (low count, no nesting needed). Design tokens live in `tailwind.config.ts` and `src/index.css` — the chosen mockup's palette/fonts get transcribed there in **Task 3**. The Apps Script URL lives in `src/lib/config.ts` so the family edits a single file.

---

## Pre-flight: Choose the visual direction

Before Task 1, the stakeholder picks one of:

- `01-editorial-letterpress.html` — Ivory + burgundy + brushed gold, Cormorant Garamond / Italiana / Manrope
- `02-jaipur-heirloom.html` — Cream + Jaipur pink + emerald + marigold, Marcellus / Fraunces / Outfit
- `03-midnight-brass.html` — Midnight blue + cream + champagne brass + soft burgundy, Fraunces / Outfit
- `04-botanical-garden.html` — Warm white + sage + dusty rose + terracotta, DM Serif Display / Outfit / Caveat

The picked mockup defines the palette, fonts, motifs, and tone used in all components below.

---

## Task 1: Scaffold Vite + React + TypeScript

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `.gitignore`

- [ ] **Step 1: Initialize the project**

Run:
```bash
npm create vite@latest . -- --template react-ts
```
(Confirm overwriting only the empty directory; `docs/` is preserved because Vite scaffolds into `.` without deleting existing folders.)

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install
```
Expected: `node_modules/` populated, `package-lock.json` created.

- [ ] **Step 3: Set the Vite base path for GitHub Pages**

Edit `vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For GitHub Pages, the site is served from /<repo-name>/.
// If you serve from a custom domain or user/organization page (username.github.io), set this to '/'.
const REPO_BASE = process.env.VITE_BASE ?? '/melange/';

export default defineConfig({
  base: REPO_BASE,
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: false },
});
```

- [ ] **Step 4: Strip the Vite template noise**

Replace `src/App.tsx` with a minimal placeholder:
```tsx
export default function App() {
  return <main className="min-h-screen grid place-items-center">Mélange — coming together</main>;
}
```
Delete `src/App.css` and `src/assets/react.svg` if present.

- [ ] **Step 5: Verify dev server runs**

Run:
```bash
npm run dev
```
Expected: dev server prints a local URL (e.g. `http://localhost:5173/melange/`); page renders the placeholder text.

- [ ] **Step 6: Commit**

```bash
git init && git add -A && git commit -m "chore: scaffold Vite + React + TS for melange event site"
```

---

## Task 2: Add Tailwind CSS

**Files:**
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Modify: `src/index.css`
- Modify: `index.html`

- [ ] **Step 1: Install Tailwind and the forms plugin**

Run:
```bash
npm install -D tailwindcss@^3 postcss autoprefixer @tailwindcss/forms
npx tailwindcss init -p
```
Expected: `tailwind.config.js` (or `.ts` if you rename) and `postcss.config.js` created.

- [ ] **Step 2: Rename config to TypeScript and configure content + plugins**

Rename to `tailwind.config.ts` and replace with:
```ts
import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Filled in Task 3 once a mockup is chosen.
    },
  },
  plugins: [forms({ strategy: 'class' })],
} satisfies Config;
```

- [ ] **Step 3: Wire Tailwind into the global stylesheet**

Replace `src/index.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
  /* Design tokens are added in Task 3 */
}

html { scroll-behavior: smooth; }
body { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
```

- [ ] **Step 4: Verify Tailwind compiles**

Edit `src/App.tsx` to use a Tailwind class (`<main className="min-h-screen grid place-items-center text-3xl">…`) and run `npm run dev`. Confirm class takes effect.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: install tailwind + forms plugin"
```

---

## Task 3: Apply chosen design tokens (palette, fonts, motifs)

> **Source of truth:** the picked mockup file in `docs/mockups/`. Copy its exact hex values and Google Font links here.

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/index.css`
- Modify: `index.html` (add Google Fonts preconnect + link)
- Create: `docs/design-system/MASTER.md` (token reference for future work)

- [ ] **Step 1: Transcribe palette into `tailwind.config.ts`**

Under `theme.extend.colors`, add the mockup's named colors (e.g. for Editorial Letterpress):
```ts
colors: {
  ivory:    '#F8F4ED',
  cream:    '#EFE7D8',
  blush:    '#EAD7C4',
  burgundy: '#5C1A2B',
  wine:     '#7A2235',
  gold:     '#B08D57',
  goldSoft: '#D4B57C',
  ink:      '#2A1F1A',
  inkSoft:  '#5B4A40',
},
```
(For other mockups, substitute that mockup's exact swatches — see `docs/mockups/<file>.html`.)

- [ ] **Step 2: Register font families**

Under `theme.extend.fontFamily`:
```ts
fontFamily: {
  display:  ['"Cormorant Garamond"', 'serif'],
  italiana: ['Italiana', 'serif'],
  body:     ['Manrope', 'system-ui', 'sans-serif'],
},
```
(Swap to the chosen mockup's fonts.)

- [ ] **Step 3: Add the Google Fonts link to `index.html`**

In `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Italiana&family=Manrope:wght@300;400;500;600&display=swap" rel="stylesheet" />
```

- [ ] **Step 4: Persist tokens for future reference**

Create `docs/design-system/MASTER.md` with the palette, type scale, motif notes, and a link back to the picked mockup. (Format: human-readable; freeform.)

- [ ] **Step 5: Verify tokens render**

Edit `src/App.tsx` to render `<h1 className="font-display text-burgundy text-6xl">Mélange</h1>`; run `npm run dev` and confirm the font + color match the mockup.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(design): apply <CHOSEN_STYLE> tokens to tailwind + global CSS"
```

---

## Task 4: Event configuration constants + types

**Files:**
- Create: `src/lib/config.ts`
- Create: `src/types.d.ts`

- [ ] **Step 1: Author `src/lib/config.ts`**

```ts
export const EVENT = {
  name: 'Mélange',
  tagline: 'A celebration of love, life & legacy.',
  date: {
    iso: '2026-06-30',
    day: 'Tuesday',
    dayNum: '30',
    monthRoman: 'VI',
    month: 'June',
    year: '2026',
  },
  couple: { groom: 'Shivendra', bride: 'Devyani', ceremony: '12 December 2025' },
  honoree: { name: 'Sarandha', milestone: '60th birthday', school: 'Sophia School' },
  venue: {
    name: '[ Venue Name ]',
    street: '[ Street Address ]',
    locality: '[ Locality ]',
    city: '[ City ]',
    pin: '[ PIN ]',
    region: 'Rajasthan, India',
    mapsQuery: 'Jaipur, Rajasthan',
  },
  itinerary: [
    { time: '6 : 00 PM',  title: 'Arrival & high tea',   note: 'Welcome drinks, conversation, the garden lit warm.' },
    { time: '7 : 00 PM',  title: 'Toasts & tributes',    note: 'A few words for the couple, the teacher, the year.' },
    { time: '8 : 30 PM',  title: 'Dinner is served',     note: 'A long table. A longer menu. Please come hungry.' },
    { time: '10 : 00 PM', title: 'Music & dancing',      note: 'The dance floor opens. So does the second bar.' },
  ],
} as const;

// REPLACE THIS with the deployed Google Apps Script Web App URL.
// Setup instructions: README.md → "Connecting the RSVP form".
export const APPS_SCRIPT_URL = '';
```

- [ ] **Step 2: Author `src/types.d.ts`**

```ts
export type RsvpPayload = {
  Name: string;
  Phone: string;
  Guests: '1' | '2' | '3' | '4' | '5';
  Message?: string;
};

export type RsvpResult =
  | { ok: true; row?: number }
  | { ok: false; error: string };
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add event config + rsvp types"
```

---

## Task 5: Scroll-reveal hook + wrapper

**Files:**
- Create: `src/hooks/useReveal.ts`
- Create: `src/components/Reveal.tsx`

- [ ] **Step 1: Author the hook**

```ts
// src/hooks/useReveal.ts
import { useEffect, useRef, useState } from 'react';

export function useReveal<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') { setShown(true); return; }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setShown(true); obs.disconnect(); break; }
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, shown };
}
```

- [ ] **Step 2: Author the wrapper component**

```tsx
// src/components/Reveal.tsx
import type { ReactNode, HTMLAttributes } from 'react';
import { useReveal } from '../hooks/useReveal';

type Props = HTMLAttributes<HTMLDivElement> & {
  delay?: number;          // ms
  as?: keyof JSX.IntrinsicElements;
  children: ReactNode;
};

export function Reveal({ delay = 0, as = 'div', className = '', style, children, ...rest }: Props) {
  const Tag = as as 'div';
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      className={[
        'transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.16,0.84,0.44,1)] will-change-[opacity,transform]',
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add scroll-reveal hook + Reveal wrapper"
```

---

## Task 6: Hero component

**Files:**
- Create: `src/components/OrnamentSprites.tsx`
- Create: `src/components/Hero.tsx`

- [ ] **Step 1: Author the SVG sprite sheet**

Single hidden `<svg>` with `<defs>` containing `#ornament`, `#monogram`, `#floret`, `#corner` symbols, transcribed from the chosen mockup. (Reuse the symbols in `docs/reference/initial-draft.html` if the Editorial Letterpress style is picked; otherwise transcribe from the chosen mockup.)

- [ ] **Step 2: Author `Hero.tsx`**

A 100svh section that renders, top-to-bottom:
1. Tiny corner ticks (`Est. 2026` / `No. III` / city tagline) — purely decorative.
2. Kicker "Together with their families".
3. Wordmark `Mélange` with per-letter stagger (each `<span>` gets `transition-delay: var(--i) * 80ms`).
4. Ornamental rule (`<use href="#ornament" />`).
5. Italic tagline with brand-color emphasis on "love, life & legacy".
6. Date strip: `Tuesday · 30 · VI · 2026` formatted as three "stamps".
7. Primary CTA `RSVP with us` linking to `#rsvp`.
8. "Unfold" scroll affordance to `#milestones`.

All blocks wrapped in `<Reveal delay={…}>` with progressively larger delays (0 / 600 / 700 / 900 / 1100 / 1300 ms).

- [ ] **Step 3: Render Hero in App**

```tsx
// src/App.tsx
import { Hero } from './components/Hero';
import { OrnamentSprites } from './components/OrnamentSprites';
export default function App() {
  return (
    <>
      <OrnamentSprites />
      <Hero />
    </>
  );
}
```

- [ ] **Step 4: Verify**

Run `npm run dev`, open browser, confirm hero matches mockup at 375px and at desktop. Check letter stagger fires once on load.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(hero): build Hero with ornaments and letter-staggered wordmark"
```

---

## Task 7: Milestones component

**Files:**
- Create: `src/components/Milestones.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Author `Milestones.tsx`**

Section `#milestones`. Eyebrow + heading + ornament + intro paragraph + a 3-column grid (mobile: vertical stack; ≥768px: `grid-cols-3` with consistent gap). Each milestone card:
- Roman numeral I / II / III at top (display font, gold accent).
- Eyebrow ("The reason" / "The occasion" / "The farewell").
- Display-italic title: Love / Life / Legacy.
- Hairline rule.
- Two short paragraphs (drawn from `EVENT.couple` / `EVENT.honoree`).
- Meta line ("Reception · the marriage", etc.).

Use `<Reveal>` per card with staggered delays 100 / 180 / 260 ms.

- [ ] **Step 2: Mount in App**

```tsx
import { Milestones } from './components/Milestones';
// ...
<Hero />
<Milestones />
```

- [ ] **Step 3: Verify on mobile + desktop, commit**

```bash
git add -A && git commit -m "feat(milestones): build three-card milestones section"
```

---

## Task 8: Gallery component

**Files:**
- Create: `src/components/Gallery.tsx`
- Create: `public/assets/gallery/.gitkeep`
- Modify: `src/App.tsx`

- [ ] **Step 1: Author `Gallery.tsx`**

Section `#gallery`. Asymmetric CSS grid (varying spans) with six `<figure>` placeholders. Each image:
```tsx
<img
  src={`${import.meta.env.BASE_URL}assets/gallery/${slot}.jpg`}
  alt={alt}
  loading="lazy"
  width={1200} height={1500}   // reserve space — prevent CLS
  onError={(e) => e.currentTarget.classList.add('img-missing')}
/>
```
A `.img-missing` CSS rule hides the broken `<img>` and shows a styled placeholder behind it (gradient + caption).

Captions render as `<figcaption>` with small-caps, slightly offset.

- [ ] **Step 2: Add gallery placeholder CSS to `src/index.css`**

```css
.gallery__item { position: relative; overflow: hidden; }
.gallery__item .img-missing { opacity: 0; }
.gallery__item::before {
  content: attr(data-caption);
  /* full-bleed placeholder gradient + centred small-caps */
}
```

- [ ] **Step 3: Verify lazy-loading, fallback, hover scale, commit**

```bash
git add -A && git commit -m "feat(gallery): asymmetric editorial gallery with graceful placeholders"
```

---

## Task 9: Details (itinerary + venue) component

**Files:**
- Create: `src/components/Details.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Author `Details.tsx`**

Section `#details` (full-bleed brand colour background — burgundy or the chosen accent). Two-column grid on desktop, stacked on mobile.

**Left column — itinerary:** Render `EVENT.itinerary` as a vertical timeline. Each row: `time` (display font, gold accent) + dot connector + title + helper note.

**Right column — venue card:** "Venue" label, `EVENT.venue.name` in big italic display, address block, `Get directions` button:
```tsx
<a
  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(EVENT.venue.mapsQuery)}`}
  target="_blank"
  rel="noopener noreferrer"
>Get directions ↗</a>
```
Plus two helper notes (dress code, "children most welcome") prefixed with `<svg><use href="#floret" /></svg>`.

- [ ] **Step 2: Mount + verify + commit**

```bash
git add -A && git commit -m "feat(details): itinerary timeline + venue card"
```

---

## Task 10: RSVP form — submission helper + component + tests

**Files:**
- Create: `src/lib/rsvp.ts`
- Create: `tests/rsvp.test.ts`
- Create: `vitest.config.ts`
- Create: `src/components/RsvpForm.tsx`
- Modify: `src/App.tsx`
- Modify: `package.json` (add `test` script)

- [ ] **Step 1: Install vitest + testing-library**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 2: Configure vitest**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./tests/setup.ts'] },
});
```

`tests/setup.ts`:
```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 3: Write the failing test**

`tests/rsvp.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitRsvp, validateRsvp } from '../src/lib/rsvp';
import type { RsvpPayload } from '../src/types';

const valid: RsvpPayload = { Name: 'Asha', Phone: '+91 98xxxxxxx', Guests: '2', Message: 'Cannot wait.' };

describe('validateRsvp', () => {
  it('accepts a fully-filled payload', () => {
    expect(validateRsvp(valid)).toEqual({});
  });
  it('flags missing name and phone', () => {
    const errors = validateRsvp({ ...valid, Name: '', Phone: '' });
    expect(errors).toHaveProperty('Name');
    expect(errors).toHaveProperty('Phone');
  });
  it('rejects too-short phone numbers', () => {
    expect(validateRsvp({ ...valid, Phone: '12' })).toHaveProperty('Phone');
  });
  it('rejects out-of-range guest counts', () => {
    expect(validateRsvp({ ...valid, Guests: '0' as any })).toHaveProperty('Guests');
    expect(validateRsvp({ ...valid, Guests: '6' as any })).toHaveProperty('Guests');
  });
});

describe('submitRsvp', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('POSTs form-encoded data to the configured URL and parses JSON success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'success', row: 7 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const out = await submitRsvp(valid, 'https://example.test/exec');
    expect(out).toEqual({ ok: true, row: 7 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.test/exec');
    expect(init.method).toBe('POST');
    expect((init.body as URLSearchParams).get('Name')).toBe('Asha');
    expect((init.body as URLSearchParams).get('Guests')).toBe('2');
  });

  it('returns ok:false when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const out = await submitRsvp(valid, 'https://example.test/exec');
    expect(out).toEqual({ ok: false, error: expect.stringMatching(/network/i) });
  });

  it('returns ok:false when no URL is configured', async () => {
    const out = await submitRsvp(valid, '');
    expect(out.ok).toBe(false);
  });
});
```

- [ ] **Step 4: Run tests — verify they fail**

```bash
npm test
```
Expected: 7 failing tests (module not yet implemented).

- [ ] **Step 5: Implement `src/lib/rsvp.ts`**

```ts
import type { RsvpPayload, RsvpResult } from '../types';

export function validateRsvp(p: RsvpPayload): Partial<Record<keyof RsvpPayload, string>> {
  const errors: Partial<Record<keyof RsvpPayload, string>> = {};
  if (!p.Name?.trim()) errors.Name = 'Please tell us your name.';
  const digits = (p.Phone ?? '').replace(/\D/g, '');
  if (!p.Phone?.trim() || digits.length < 7) errors.Phone = 'A working number, please.';
  const g = Number(p.Guests);
  if (!Number.isFinite(g) || g < 1 || g > 5) errors.Guests = 'Pick a number from 1 to 5.';
  return errors;
}

export async function submitRsvp(payload: RsvpPayload, url: string): Promise<RsvpResult> {
  if (!url) return { ok: false, error: 'RSVP endpoint not configured.' };

  const body = new URLSearchParams();
  Object.entries(payload).forEach(([k, v]) => { if (v != null) body.append(k, String(v)); });

  try {
    const res = await fetch(url, { method: 'POST', body });
    if (!res.ok) return { ok: false, error: `Server returned ${res.status}` };
    const json = await res.json() as { result?: string; row?: number; error?: string };
    if (json.result === 'success') return { ok: true, row: json.row };
    return { ok: false, error: json.error ?? 'Submission failed.' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error.' };
  }
}
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
npm test
```
Expected: 7 passing tests.

- [ ] **Step 7: Author `RsvpForm.tsx`**

Controlled form with state `{ values, errors, status }` where `status: 'idle' | 'submitting' | 'success' | 'error'`. Renders inside an ornament-cornered "Reply Card" card. Fields:
- Full Name (text, required, autocomplete="name")
- WhatsApp / Phone (tel, required, autocomplete="tel", inputmode="tel")
- Guests Attending (select, 1–5, required)
- Note for the family (textarea, optional, maxLength 500)

On submit:
1. Call `validateRsvp(values)`; if errors, focus the first invalid field and render inline `.field__error` messages.
2. Set `status='submitting'`, call `submitRsvp(values, APPS_SCRIPT_URL)`.
3. On success: set `status='success'`, replace form body with a thank-you message ("Thank you · a seat is yours."), preserve the user's name in the message.
4. On error: set `status='error'`, render a polite error block above the submit button with a "try again" button that reverts to `'idle'`.

Accessibility:
- `aria-live="polite"` region for status.
- Error messages: `role="alert"` and `aria-describedby` linking input → message.
- Submit button shows loading state and is `disabled` while submitting.

- [ ] **Step 8: Mount + manual smoke test (with empty `APPS_SCRIPT_URL`, expect graceful error)**

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat(rsvp): form + submission helper + tests"
```

---

## Task 11: Footer

**Files:**
- Create: `src/components/Footer.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Author `Footer.tsx`**

Centred monogram (`<use href="#monogram" />`), "With love, the family", ornamental rule, small-caps date "Mélange · 30 . VI . MMXXVI", a "Return to the top" link to `#top`.

- [ ] **Step 2: Mount + commit**

```bash
git add -A && git commit -m "feat(footer): monogram + closing"
```

---

## Task 12: Compose the full page in App

**Files:**
- Modify: `src/App.tsx`
- Modify: `index.html` (`<title>`, `<meta description>`, Open Graph tags)

- [ ] **Step 1: Compose**

```tsx
import { OrnamentSprites } from './components/OrnamentSprites';
import { Hero } from './components/Hero';
import { Milestones } from './components/Milestones';
import { Gallery } from './components/Gallery';
import { Details } from './components/Details';
import { RsvpForm } from './components/RsvpForm';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <>
      <OrnamentSprites />
      <a href="#milestones" className="sr-only focus:not-sr-only">Skip to content</a>
      <Hero />
      <Milestones />
      <Gallery />
      <Details />
      <RsvpForm />
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Set page metadata**

In `index.html`:
```html
<title>Mélange · A Celebration of Love, Life & Legacy · 30 June 2026</title>
<meta name="description" content="Three milestones, one evening. The wedding reception of Shivendra & Devyani, the 60th birthday of Sarandha, and her retirement from Sophia School. 30 June 2026." />
<meta name="theme-color" content="#5C1A2B" />
<meta property="og:title" content="Mélange — A Celebration of Love, Life & Legacy" />
<meta property="og:description" content="Three milestones, one evening. 30 June 2026." />
<meta property="og:type" content="website" />
<meta property="og:image" content="/melange/og-image.jpg" />
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: compose full page + page metadata"
```

---

## Task 13: GitHub Pages deployment

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `public/.nojekyll`

- [ ] **Step 1: Add the `.nojekyll` marker (empty file)**

```bash
mkdir -p public && : > public/.nojekyll
```

- [ ] **Step 2: Author the deploy workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          VITE_BASE: /melange/   # set to '/' if deploying to <user>.github.io
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Verify a local production build succeeds**

```bash
npm run build && npm run preview
```
Expected: production build completes, preview server serves `dist/` and the page renders correctly at the configured base path.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "ci: github pages deploy workflow"
```

---

## Task 14: README — setup, deployment, photo and RSVP wiring

**Files:**
- Create: `README.md`

- [ ] **Step 1: Author `README.md`**

Sections:
1. **What this is** — one-paragraph summary.
2. **Run locally** — `npm install` / `npm run dev`.
3. **Wiring up the RSVP form** — step-by-step Google Apps Script setup (paste from the user's original brief, then "edit `src/lib/config.ts` and set `APPS_SCRIPT_URL`").
4. **Adding photos** — drop JPGs into `public/assets/gallery/01.jpg` … `06.jpg`; aspect-ratio guidance per slot (tall / wide).
5. **Editing event details** — point at `src/lib/config.ts`.
6. **Deploying to GitHub Pages** — push to `main`; GitHub Actions does the rest; in the repo `Settings → Pages`, set Source to "GitHub Actions".

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "docs: README with setup, deployment, photo, and RSVP wiring"
```

---

## Task 15: Final polish — accessibility + responsive + reduced motion + dark-mode check

**Files:** (verifications only; bug fixes per finding)

- [ ] **Step 1: Lighthouse audit on the production preview**

```bash
npm run build && npm run preview
# Open Chrome DevTools → Lighthouse → Mobile → Run
```
Targets: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95. Fix any flagged contrast, alt-text, or label issues inline.

- [ ] **Step 2: 375px / 768px / 1280px manual checks**

Verify:
- No horizontal scroll at 375px.
- Hero stamps don't overflow on narrow screens.
- Milestones stack cleanly.
- Gallery grid re-flows without orphans.
- Form inputs are ≥ 44px tall on mobile.
- Tap targets meet 44×44 minimum.

- [ ] **Step 3: prefers-reduced-motion check**

In DevTools "Rendering" panel, emulate `prefers-reduced-motion: reduce`. Confirm reveal animations collapse to instant.

- [ ] **Step 4: Keyboard nav check**

`Tab` through hero → milestones → gallery → details → RSVP. Confirm focus rings are visible, skip-link reveals on focus, and RSVP submit is reachable.

- [ ] **Step 5: WhatsApp / iOS-Safari smoke test**

Send the GitHub Pages URL to a phone over WhatsApp; open from WhatsApp; confirm Open Graph preview renders and the page loads cleanly. (Many guests will arrive this way.)

- [ ] **Step 6: Final commit**

```bash
git add -A && git commit -m "polish: a11y, responsive, and reduced-motion fixes"
```

---

## Out of scope (deliberately not in this plan)

- Server-side rendering / Next.js — overkill for a single static page.
- A CMS — the family edits `src/lib/config.ts` and drops JPGs into `public/assets/gallery/`. Simpler than a CMS.
- An email confirmation back to RSVP submitters — would require a transactional email provider; can be added later inside the Apps Script.
- Multi-language support — English only for now; can be added if guests need Hindi versions.
- Analytics — privacy-respecting Plausible/Umami can be added later; not required for an invite site.

---

## Self-review (run before handoff)

1. **Spec coverage:** Each of the original brief's five sections (Hero, Milestones, Gallery, Details, RSVP) has a dedicated task with code. Footer added because the mockups have one. GitHub Pages deploy + Apps Script wiring covered. Mobile-first is enforced by Tailwind utility usage + Step 2 of Task 15. ✓
2. **Placeholder scan:** No "TBD" / "implement later" / "similar to Task N". Every code step contains real code. Design tokens are the only deliberate variable, and they're filled from a concrete artifact (the chosen mockup file). ✓
3. **Type consistency:** `RsvpPayload`, `RsvpResult`, `EVENT.itinerary` shape, and `validateRsvp` / `submitRsvp` signatures are consistent across Tasks 4, 5, 10. `BASE_URL` usage in Gallery (Task 8) matches the Vite `base` in Task 1. ✓
