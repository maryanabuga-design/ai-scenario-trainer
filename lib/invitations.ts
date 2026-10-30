import { useMemo } from "react";
import { isEmailFormat, normaliseEmail } from "@/lib/auth-validation";
import { DEFAULT_GROUP_ID, isScope } from "@/lib/groups";
import { createStore } from "@/lib/store";

/**
 * Invite students (DESIGN.md: Instructor, Invite students). SIMULATED: no email is sent. The parsing
 * is pure; the pending list is kept in this browser (a shared key, versioned, tolerant).
 */
/** The invite link of a group code (each group has its own code in `content/demo-cohort.json`). */
export const inviteLink = (code: string, origin = "https://scenario-trainer.example") =>
  `${origin}/join/${code}`;
export const MAX_INVITATIONS = 100;

export type Invitation = {
  email: string;
  invitedAt: number;
  groupId: string;
  /** When the invited person created an account through the join link (the invitation is then "Joined"). */
  joinedAt?: number;
};

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
export const withInvitations = (
  pending: Invitation[],
  emails: string[],
  now: number,
  groupId: string = DEFAULT_GROUP_ID,
) =>
  [...emails.map((email) => ({ email, invitedAt: now, groupId })), ...pending].slice(
    0,
    MAX_INVITATIONS,
  );

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
    const { email, invitedAt, groupId, joinedAt } = entry as Record<string, unknown>;
    if (typeof email !== "string" || !isEmailFormat(email)) continue;
    if (typeof invitedAt !== "number" || !Number.isFinite(invitedAt)) continue;
    const normal = normaliseEmail(email);
    if (list.some((other) => other.email === normal)) continue;
    list.push({
      email: normal,
      invitedAt,
      groupId: typeof groupId === "string" && isScope(groupId) ? groupId : DEFAULT_GROUP_ID,
      ...(typeof joinedAt === "number" && Number.isFinite(joinedAt) && { joinedAt }),
    });
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

/** The invitations of a group that are still pending (not joined yet). */
export const pendingOf = (list: Invitation[], groupId: string) =>
  list.filter((entry) => entry.groupId === groupId && entry.joinedAt === undefined);

/** The invitation sent to an address, if any (the address is compared in lower case). */
export const invitationFor = (list: Invitation[], email: string): Invitation | undefined =>
  list.find((entry) => entry.email === normaliseEmail(email));

/** The list with the invitation of this address marked Joined; a list without one is returned as it is. */
export function markJoined(list: Invitation[], email: string, now: number): Invitation[] {
  const target = normaliseEmail(email);
  return list.map((entry) =>
    entry.email === target && entry.joinedAt === undefined ? { ...entry, joinedAt: now } : entry,
  );
}
