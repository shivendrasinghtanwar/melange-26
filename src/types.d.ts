/// <reference types="vite/client" />

export type RsvpPayload = {
  Name: string;
  Phone: string;
  Guests: '1' | '2' | '3' | '4' | '5';
  Message?: string;
};

export type RsvpStatus = 'idle' | 'submitting' | 'success' | 'error';

export type RsvpResult =
  | { ok: true; row?: number }
  | { ok: false; error: string };
