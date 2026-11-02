/**
 * The simulated verification (DESIGN.md: Accounts). No email is sent: the code is a constant that
 * the Verify screen always shows. It is written here and nowhere else.
 */
export const DEMO_CODE = "482913";

/** Seconds before "Resend code" can be used again. */
export const RESEND_SECONDS = 30;

export const CODE_LENGTH = 6;

/** Wrong codes allowed before the boxes lock, and the length of the lock in seconds. */
export const MAX_WRONG_CODES = 5;
export const LOCK_SECONDS = 60;
/** The screen-reader line about the lock changes at most this often (seconds). */
export const LIVE_SECONDS = 10;

/** Whole seconds left of a lock that started at `lockedAt`; 0 once it is over or when there is none. */
export function lockRemaining(lockedAt: number | null, now: number): number {
  if (lockedAt === null) return 0;
  return Math.max(0, Math.ceil(LOCK_SECONDS - (now - lockedAt) / 1000 - 1e-9));
}

/** The seconds a screen reader hears: the time left rounded up to the next 10, so it changes rarely. */
export const announcedSeconds = (remaining: number): number =>
  Math.ceil(remaining / LIVE_SECONDS) * LIVE_SECONDS;

export const isCorrectCode = (code: string): boolean => code === DEMO_CODE;

/** "482 913": the code as it is shown, in two groups of three. */
export const formatCode = (code: string): string => `${code.slice(0, 3)} ${code.slice(3)}`;

/** Whole seconds left before a new code may be asked for, counted from `sentAt`; 0 once the time is up. */
export function resendRemaining(sentAt: number, now: number): number {
  const left = RESEND_SECONDS - (now - sentAt) / 1000;
  return Math.max(0, Math.ceil(left - 1e-9));
}

/** The digits of a pasted or typed text, at most one code long. */
export function digitsFrom(text: string): string {
  return text.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

/** "0:30": the seconds left as minutes and seconds, for the Resend countdown. */
export const formatCountdown = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
