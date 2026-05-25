import { useRef, useState, type FormEvent } from 'react';
import { APPS_SCRIPT_URL, EVENT } from '../lib/config';
import { submitRsvp, validateRsvp } from '../lib/rsvp';
import { Reveal } from './Reveal';
import type { RsvpPayload, RsvpStatus } from '../types';

const emptyPayload: RsvpPayload = { Name: '', Phone: '', Guests: '' as RsvpPayload['Guests'], Message: '' };

export function RsvpForm() {
  const [values, setValues] = useState<RsvpPayload>(emptyPayload);
  const [errors, setErrors] = useState<Partial<Record<keyof RsvpPayload, string>>>({});
  const [status, setStatus] = useState<RsvpStatus>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const guestsRef = useRef<HTMLSelectElement>(null);

  const update = <K extends keyof RsvpPayload>(key: K, v: RsvpPayload[K]) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    const v = validateRsvp(values);
    setErrors(v);
    if (Object.keys(v).length) {
      if (v.Name) nameRef.current?.focus();
      else if (v.Phone) phoneRef.current?.focus();
      else if (v.Guests) guestsRef.current?.focus();
      return;
    }

    setStatus('submitting');
    const out = await submitRsvp(values, APPS_SCRIPT_URL);
    if (out.ok) {
      setStatus('success');
    } else {
      setStatus('error');
      setServerError(out.error);
    }
  }

  if (status === 'success') {
    return (
      <section id="rsvp" className="paper-cloth paper-edge--soft min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col justify-center px-5 sm:px-10">
          <div className="text-center max-w-2xl mx-auto">
            <p className="smallcaps text-emerald">Reply received</p>
            <h2 className="mt-4 font-display text-burgundy leading-[1.05] text-4xl sm:text-5xl md:text-[3.4rem]">
              Thank you, <span className="font-italicserif italic text-pink">{values.Name.split(' ')[0]}.</span>
            </h2>
            <p className="mt-5 font-italicserif italic text-inkSoft text-base sm:text-lg">
              A seat (or {values.Guests}) has been kept for you. See you on {EVENT.date.day}.
            </p>
          </div>
        </div>
        <div className="px-0 py-6 sm:py-8" aria-hidden="true">
          <div className="blockprint-band" />
        </div>
      </section>
    );
  }

  /* Same three-part 100vh pattern as Milestones / Gallery / Details:
     — Header (eyebrow + headline + intro) at top
     — Content (the reply card form) fills the middle via flex-1
     — Bottom divider sits at the foot of the section
     pt-16/20 mirrors Details, giving the header breathing room from
     the on-dark divider that sits at the bottom of the burgundy
     Particulars section above. */
  return (
    <section id="rsvp" className="paper-cloth paper-edge--soft min-h-screen flex flex-col pt-16 sm:pt-20">
      <div className="px-5 sm:px-10 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto">
          <Reveal>
            <p className="smallcaps text-emerald">The favour of a reply</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 font-display text-burgundy leading-[1.05] text-4xl sm:text-5xl md:text-[3.4rem]">
              Kindly <span className="font-italicserif italic text-pink">RSVP.</span>
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-5 font-italicserif italic text-inkSoft text-base sm:text-lg">
              A short note from you so we can lay an extra plate, and find you in the crowd.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-5 sm:px-10 py-8 sm:py-10">
        <Reveal delay={200} className="relative max-w-2xl mx-auto w-full">
          <form className="reply-card relative p-7 sm:p-10" onSubmit={onSubmit} noValidate autoComplete="on">
          {/* corner flourishes */}
          <svg className="absolute top-2 left-2" width="56" height="56" aria-hidden="true">
            <use href="#corner-flourish" />
          </svg>
          <svg className="absolute top-2 right-2" width="56" height="56" style={{ transform: 'scaleX(-1)' }} aria-hidden="true">
            <use href="#corner-flourish" />
          </svg>
          <svg className="absolute bottom-2 left-2" width="56" height="56" style={{ transform: 'scaleY(-1)' }} aria-hidden="true">
            <use href="#corner-flourish" />
          </svg>
          <svg className="absolute bottom-2 right-2" width="56" height="56" style={{ transform: 'scale(-1, -1)' }} aria-hidden="true">
            <use href="#corner-flourish" />
          </svg>

          <div className="ornament-rule mb-5">
            <span className="smallcaps">Reply Card</span>
          </div>

          <p className="font-italicserif italic text-center text-[#1A0805] font-medium text-lg mb-7">
            Please reply on or before <span className="text-pink">{EVENT.date.rsvpBy}</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            <label className="sm:col-span-2 block">
              <span className="field-label">Your name, in full</span>
              <input
                ref={nameRef}
                className={`field font-display text-lg ${errors.Name ? 'field--invalid' : ''}`}
                type="text"
                name="Name"
                value={values.Name}
                onChange={(e) => update('Name', e.target.value)}
                placeholder="e.g. Asha &amp; Family"
                autoComplete="name"
                aria-invalid={!!errors.Name}
                aria-describedby={errors.Name ? 'err-name' : undefined}
              />
              {errors.Name && (
                <span id="err-name" className="field-error" role="alert">{errors.Name}</span>
              )}
            </label>

            <label className="block">
              <span className="field-label">WhatsApp / phone</span>
              <input
                ref={phoneRef}
                className={`field text-base ${errors.Phone ? 'field--invalid' : ''}`}
                type="tel"
                name="Phone"
                value={values.Phone}
                onChange={(e) => update('Phone', e.target.value)}
                placeholder="+91 ·"
                autoComplete="tel"
                inputMode="tel"
                aria-invalid={!!errors.Phone}
                aria-describedby={errors.Phone ? 'err-phone' : undefined}
              />
              {errors.Phone && (
                <span id="err-phone" className="field-error" role="alert">{errors.Phone}</span>
              )}
            </label>

            <label className="block">
              <span className="field-label">Guests attending</span>
              <select
                ref={guestsRef}
                className={`field text-base ${errors.Guests ? 'field--invalid' : ''}`}
                name="Guests"
                value={values.Guests}
                onChange={(e) => update('Guests', e.target.value as RsvpPayload['Guests'])}
                aria-invalid={!!errors.Guests}
              >
                <option value="" disabled>Including yourself…</option>
                <option value="1">1 — just me</option>
                <option value="2">2 — and one more</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
              {errors.Guests && (
                <span className="field-error" role="alert">{errors.Guests}</span>
              )}
            </label>

            <label className="sm:col-span-2 block">
              <span className="field-label">A note for the family <span className="text-inkSoft/70">— optional</span></span>
              <textarea
                rows={2}
                className="field text-base"
                name="Message"
                value={values.Message ?? ''}
                onChange={(e) => update('Message', e.target.value)}
                maxLength={500}
                placeholder="A line, a memory, a song request…"
              />
            </label>

            <div className="sm:col-span-2 mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <p className="font-italicserif italic text-[#1A0805] font-medium text-base" aria-live="polite">
                {status === 'error' && serverError
                  ? <span className="text-pinkDeep">{serverError}</span>
                  : 'We’ll save you a seat, and a marigold.'}
              </p>
              <button
                type="submit"
                className="btn-primary btn-primary--solid"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Sending…' : 'Send with love →'}
              </button>
            </div>
          </div>
        </form>
      </Reveal>
      </div>

      <div className="px-0 py-6 sm:py-8" aria-hidden="true">
        <div className="blockprint-band" />
      </div>
    </section>
  );
}
