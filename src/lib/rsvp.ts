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
  if (!url) return { ok: false, error: 'RSVP endpoint not configured yet — please try again in a moment.' };

  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(payload)) {
    if (v != null) body.append(k, String(v));
  }

  try {
    const res = await fetch(url, { method: 'POST', body });
    if (!res.ok) return { ok: false, error: `Server returned ${res.status}.` };
    const json = (await res.json()) as { result?: string; row?: number; error?: string };
    if (json.result === 'success') return { ok: true, row: json.row };
    return { ok: false, error: json.error ?? 'Submission failed — please try again.' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error — please try again.' };
  }
}
