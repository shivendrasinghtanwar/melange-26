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
// RSVP endpoint — paste the deployed Google Apps Script Web App URL here.
// (Setup instructions: README.md → "Connecting the RSVP form".)
// Leave blank and the form will render but reject submissions with a
// polite "RSVP endpoint not configured" message.
// ──────────────────────────────────────────────────────────────────────────

export const APPS_SCRIPT_URL = '';
