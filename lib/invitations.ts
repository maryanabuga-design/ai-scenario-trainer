import { useMemo } from "react";
import { isEmailFormat, normaliseEmail } from "@/lib/auth-validation";
import { createStore } from "@/lib/store";

/**
 * Invite students (DESIGN.md: Instructor, Invite students). SIMULATED: no email is sent. The parsing
 * is pure; the pending list is kept in this browser (a shared key, versioned, tolerant).
 */
export const GROUP_CODE = "QT-A7K2";
export const INVITE_LINK = `https://scenario-trainer.example/join/${GROUP_CODE}`;
export const MAX_INVITATIONS = 100;
export const PROTOTYPE_LINE = "Prototype: no emails are sent.";

export type Invitation = { email: string; invitedAt: number };

/** The addresses of a text (separated by commas, semicolons, spaces or new lines): valid ones, once each, and the invalid ones. */
export function parseEmails(text: string): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const word of text.split(/[\s,;]+/).filter((entry) => entry !== "")) {
    const email = normaliseEmail(word);
    if (isEmailFormat(email)) {
      if (!valid.includes(email)) valid.push(email);
    } else if (!invalid.includes(word)) invalid.push(word);
  }
  return { valid, invalid };
}

/** Splits the valid addresses into the new ones and the ones already invited. */
export function splitNew(valid: string[], pending: Invitation[]) {
  const known = new Set(pending.map((entry) => entry.email));
  return {
    fresh: valid.filter((email) => !known.has(email)),
    duplicates: valid.filter((email) => known.has(email)),
  };
}

/** The new invitations first, then the earlier ones, at most MAX_INVITATIONS. */
export const withInvitations = (pending: Invitation[], emails: string[], now: number) =>
  [...emails.map((email) => ({ email, invitedAt: now })), ...pending].slice(0, MAX_INVITATIONS);

/** "Invited 21 Oct". */
const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
export const invitedLine = (at: number) => `Invited ${dayMonth.format(at)}`;

/** The amber line for addresses that are not valid ("Not valid: a, b"), or "". */
export const invalidLine = (invalid: string[]) =>
  invalid.length === 0 ? "" : `Not a valid address: ${invalid.join(", ")}`;

export function cleanInvitations(value: unknown): Invitation[] | null {
  if (!Array.isArray(value)) return null;
  const list: Invitation[] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue;
    const { email, invitedAt } = entry as Record<string, unknown>;
    if (typeof email !== "string" || !isEmailFormat(email)) continue;
    if (typeof invitedAt !== "number" || !Number.isFinite(invitedAt)) continue;
    const normal = normaliseEmail(email);
    if (list.some((other) => other.email === normal)) continue;
    list.push({ email: normal, invitedAt });
  }
  return list.slice(0, MAX_INVITATIONS);
}

const store = createStore<Invitation[]>("ast.invitations.v1", {
  shared: true,
  sanitize: cleanInvitations,
});

export const readInvitations = (): Invitation[] => cleanInvitations(store.read()) ?? [];

/** The pending invitations, "loading" until the browser has been read. */
export function useInvitations(): Invitation[] | "loading" {
  const raw = store.useValue();
  return useMemo(() => (raw === "loading" ? "loading" : (cleanInvitations(raw) ?? [])), [raw]);
}

export const saveInvitations = (list: Invitation[]): boolean => store.write(list);
