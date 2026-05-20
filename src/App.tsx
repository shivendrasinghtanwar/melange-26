import { OrnamentSprites } from './components/OrnamentSprites';
import { Hero } from './components/Hero';
import { HeroFold } from './components/HeroFold';
import { Milestones } from './components/Milestones';
import { Gallery } from './components/Gallery';
import { Details } from './components/Details';
import { RsvpForm } from './components/RsvpForm';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <>
      <OrnamentSprites />
      <a
        href="#milestones"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-cream focus:px-4 focus:py-2 focus:border focus:border-pink"
      >
        Skip to content
      </a>

      <main>
        {/* Hero is a normal 100svh section in document flow. On first load,
            HeroFold mounts a fixed overlay on top of it; on first scroll
            input the overlay animates open and the page programmatically
            scrolls to the milestones section below. Once the overlay
            unmounts, the user can scroll back UP to see this hero
            again — it's still there in the document. */}
        <Hero />

        <Milestones id="milestones" />

        <div className="px-0 py-8 sm:py-12" aria-hidden="true">
          <div className="blockprint-band" />
        </div>

        <Gallery />

        <div className="px-0 py-8 sm:py-12" aria-hidden="true">
          <div className="blockprint-band" />
        </div>

        <Details />

        <div className="px-0 py-8 sm:py-12" aria-hidden="true">
          <div className="blockprint-band" />
        </div>

        <RsvpForm />

        <div className="px-0 pt-2 pb-6" aria-hidden="true">
          <div className="blockprint-band thin" />
        </div>

        <Footer />
      </main>

      {/* Fold-open overlay — fixed on top of everything while still
          closed/opening; returns null once the fold has played. */}
      <HeroFold />
    </>
  );
}
