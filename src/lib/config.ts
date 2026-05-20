// ──────────────────────────────────────────────────────────────────────────
// EVENT CONSTANTS — edit these to retune copy, date, or venue.
// ──────────────────────────────────────────────────────────────────────────

export const EVENT = {
  name: 'Mélange',
  tagline: 'A celebration of love, life & legacy.',
  family: 'Tanwar Family',
  city: 'Bikaner',
  region: 'Rajasthan, India',

  date: {
    iso: '2026-06-30',
    day: 'Tuesday',
    dayNum: '30',
    monthRoman: 'VI',
    month: 'June',
    year: '2026',
    yearRoman: 'MMXXVI',
    rsvpBy: '15 June 2026',
  },

  couple: {
    groom: 'Shivendra Singh Tanwar',
    bride: 'Divyani Jain',
    ceremony: '12 December 2025',
    ceremonyRoman: '12 . XII . 2025',
  },

  honoree: {
    name: 'Sarandha Tanwar',
    milestone: '60th birthday',
    school: 'Sophia School',
  },

  venue: {
    name: '[ Venue Name ]',
    street: '[ Street Address ]',
    locality: '[ Locality ]',
    pin: '[ PIN ]',
    mapsQuery: 'Bikaner, Rajasthan',
  },

  itinerary: [
    { time: '6 : 00 PM',  title: 'Arrival & high tea',   note: 'Welcome drinks, conversation, the courtyard lit warm.' },
    { time: '7 : 00 PM',  title: 'Toasts & tributes',    note: 'A few words for the couple, the teacher, the year.' },
    { time: '8 : 30 PM',  title: 'Dinner is served',     note: 'A long table. A longer menu. Please come hungry.' },
    { time: '10 : 00 PM', title: 'Music & dancing',      note: 'The dance floor opens. So does the second bar.' },
  ],
} as const;

// ──────────────────────────────────────────────────────────────────────────
// RSVP endpoint — pulled from VITE_APPS_SCRIPT_URL at build time.
//
//   • Local dev: create a `.env.local` file at the repo root with
//       VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
//     (Vite ignores .env.local in version control automatically.)
//
//   • Production: the GitHub Actions workflow injects the value from
//     the `APPS_SCRIPT_URL` repository secret.
//
// Leaving the variable unset is fine — the form will render but reject
// submissions with a polite "endpoint not configured" message.
// ──────────────────────────────────────────────────────────────────────────

export const APPS_SCRIPT_URL = (import.meta.env.VITE_APPS_SCRIPT_URL ?? '').trim();
