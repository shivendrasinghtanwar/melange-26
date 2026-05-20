import { OrnamentSprites } from './components/OrnamentSprites';
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
        {/* Hero acts as the closed cover; on scroll it folds open downward
            (rotates around its top edge) to reveal the milestones inside.
            The Hero and the milestones preview both live inside HeroFold. */}
        <HeroFold />

        {/* The "real" milestones section continues directly after the fold,
            visually continuous with the preview the user just saw revealed. */}
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
    </>
  );
}
