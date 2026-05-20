import { EVENT } from '../lib/config';
import { Reveal } from './Reveal';

export function Details() {
  return (
    <section id="details" className="section--burgundy relative px-5 sm:px-10 py-24 sm:py-28">
      <div className="max-w-6xl mx-auto">
        <div className="text-center">
          <Reveal>
            <p className="smallcaps text-goldSoft">The Particulars</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="font-display text-cream text-4xl sm:text-5xl md:text-6xl mt-5 leading-[1.02]">
              Where to be,
              <br />
              <span className="font-italicserif italic text-goldSoft">and when.</span>
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <div className="mt-7 flex justify-center" aria-hidden="true">
              <svg width="38" height="38" className="opacity-90" style={{ color: '#D4B57C' }}>
                <use href="#marigold-b" />
              </svg>
            </div>
          </Reveal>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-[1.1fr,1fr] gap-16 md:gap-12 lg:gap-20">
          {/* LEFT: itinerary */}
          <Reveal delay={120}>
            <div>
              <h3 className="font-italicserif italic font-medium text-cream text-3xl">The Evening</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/65 max-w-[36ch] text-pretty">
                A loose order of things. Stay for any of it, or for all of it.
              </p>

              <ol className="timeline mt-10" role="list">
                {EVENT.itinerary.map((item) => (
                  <li className="timeline__row" key={item.time}>
                    <span className="timeline__time">{item.time}</span>
                    <span className="timeline__dot" aria-hidden="true" />
                    <div className="timeline__body">
                      <p className="timeline__title">{item.title}</p>
                      <p className="timeline__note">{item.note}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>

          {/* RIGHT: venue */}
          <Reveal delay={220}>
            <aside>
              <h3 className="font-italicserif italic font-medium text-cream text-3xl">The Place</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/65 max-w-[36ch] text-pretty">
                Held under one roof, with parking on-site.
              </p>

              <div className="mt-10">
                <p className="venue__label">Venue</p>
                <p className="font-italicserif italic text-cream text-3xl sm:text-4xl mt-2 leading-tight">
                  {EVENT.venue.name}
                </p>
                <p className="venue__addr mt-4">
                  {EVENT.venue.street}
                  <br />
                  {EVENT.venue.locality}, {EVENT.city} — {EVENT.venue.pin}
                  <br />
                  {EVENT.region}
                </p>

                <a
                  className="venue__cta mt-8"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(EVENT.venue.mapsQuery)}`}
                >
                  <span>Get directions</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M3 11 L11 3 M5 3 H11 V9"
                      stroke="currentColor"
                      strokeWidth="0.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>

                <p className="venue__note mt-10">
                  <svg
                    className="inline-block w-3 h-3 mr-2 align-[-1px]"
                    style={{ color: '#D4B57C' }}
                    aria-hidden="true"
                  >
                    <use href="#floret-dot" />
                  </svg>
                  Dress code: <span className="text-cream">Indian formal, or as you please.</span>
                </p>
                <p className="venue__note mt-2">
                  <svg
                    className="inline-block w-3 h-3 mr-2 align-[-1px]"
                    style={{ color: '#D4B57C' }}
                    aria-hidden="true"
                  >
                    <use href="#floret-dot" />
                  </svg>
                  Children most welcome.
                </p>
              </div>
            </aside>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
