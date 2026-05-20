import { EVENT } from '../lib/config';
import { Reveal } from './Reveal';

export function Milestones({ id }: { id?: string } = {}) {
  return (
    <section id={id} className="px-5 sm:px-10 max-w-6xl mx-auto pt-6 sm:pt-10 pb-10">
      <div className="text-center">
        <Reveal>
          <p className="smallcaps text-pink">The Three Milestones</p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="font-display text-burgundy text-4xl sm:text-5xl md:text-6xl mt-5 leading-[1.02]">
            One evening,
            <br />
            <span className="font-italicserif italic text-pink">three reasons</span> to gather.
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <div className="mt-7 flex justify-center" aria-hidden="true">
            <svg width="48" height="48" className="opacity-90">
              <use href="#marigold-a" />
            </svg>
          </div>
        </Reveal>
        <Reveal delay={220}>
          <p className="mt-7 max-w-xl mx-auto text-inkSoft font-italicserif italic text-lg leading-relaxed">
            Three quiet stories, folded together into one warm {EVENT.city} night — the kind of night a
            family remembers out loud, for years.
          </p>
        </Reveal>
      </div>

      <ol className="milestones__grid mt-20 sm:mt-24" role="list">
        <Reveal delay={100}>
          <li className="milestone">
            <span className="milestone__numeral">I</span>
            <p className="milestone__eyebrow">The reason</p>
            <h3 className="milestone__title">Love</h3>
            <div className="milestone__rule" aria-hidden="true" />
            <p className="milestone__attribution">
              <svg width="22" height="22"><use href="#marigold-a" /></svg>
              {EVENT.couple.groom.split(' ')[0]} &amp; {EVENT.couple.bride.split(' ')[0]}
            </p>
            <p className="milestone__body">
              The wedding reception of <em>{EVENT.couple.groom}</em> &amp; <em>{EVENT.couple.bride}</em>,
              quietly married on the 12<sup>th</sup> of December, 2025.
            </p>
            <p className="milestone__meta">Reception · the marriage</p>
          </li>
        </Reveal>

        <Reveal delay={180}>
          <li className="milestone milestone--center">
            <span className="milestone__numeral">II</span>
            <p className="milestone__eyebrow">The occasion</p>
            <h3 className="milestone__title">Life</h3>
            <div className="milestone__rule" aria-hidden="true" />
            <p className="milestone__attribution">
              <svg width="22" height="22"><use href="#marigold-b" /></svg>
              {EVENT.honoree.name.split(' ')[0]}, at sixty
            </p>
            <p className="milestone__body">
              The 60<sup>th</sup> birthday of <em>{EVENT.honoree.name}</em> — matriarch, teacher, gentle
              keeper of every family story worth keeping.
            </p>
            <p className="milestone__meta">Sashtipoorti · sixty turns of the sun</p>
          </li>
        </Reveal>

        <Reveal delay={260}>
          <li className="milestone">
            <span className="milestone__numeral">III</span>
            <p className="milestone__eyebrow">The farewell</p>
            <h3 className="milestone__title">Legacy</h3>
            <div className="milestone__rule" aria-hidden="true" />
            <p className="milestone__attribution">
              <svg width="22" height="22"><use href="#marigold-c" /></svg>
              {EVENT.honoree.school}, with thanks
            </p>
            <p className="milestone__body">
              {EVENT.honoree.name.split(' ')[0]}&rsquo;s retirement from <em>{EVENT.honoree.school}</em>,
              where she has taught — and shaped — a generation of students.
            </p>
            <p className="milestone__meta">{EVENT.honoree.school} · a teaching life</p>
          </li>
        </Reveal>
      </ol>
    </section>
  );
}
