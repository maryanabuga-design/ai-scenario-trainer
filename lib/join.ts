import joinCodes from "@/content/join-codes.json";
import { groups } from "@/lib/groups";
import type { Group } from "@/lib/groups";
import { normaliseEmail } from "@/lib/auth-validation";
import { createStore } from "@/lib/store";
import { invitationFor } from "@/lib/invitations";
import type { Invitation } from "@/lib/invitations";

/**
 * The join link of a group (DESIGN.md: Instructor, Students rebuilt, join link). SIMULATED: the
 * code in the address is looked up in the demo groups, and the code of the link that was opened
 * is kept until the account is created. Nothing is sent anywhere.
 */
export const JOIN_PREFIX = "/join/";

/** The group a code belongs to (compared in upper case), or undefined for an unknown code. */
export const groupByCode = (code: string): Group | undefined =>
  groups.find((group) => group.code === code.trim().toUpperCase());

/** A code as typed: spaces removed, upper case. */
export const normaliseCode = (text: string): string => text.replace(/\s+/g, "").toUpperCase();

/** What a code or link leads to: a group, an expired code (the demo `OLD-0000`) or nothing known. */
export type CodeLookup =
  { kind: "valid"; group: Group; invitedBy: string } | { kind: "expired" } | { kind: "unknown" };

export function lookupCode(text: string): CodeLookup {
  const code = normaliseCode(text);
  if ((joinCodes.expired as string[]).includes(code)) return { kind: "expired" };
  const group = groupByCode(code);
  return group ? { kind: "valid", group, invitedBy: joinCodes.instructor } : { kind: "unknown" };
}

/** The saved code of an opened join link, kept for the sign-up (versioned, tolerant, shared on the device). */
const store = createStore<string>("ast.auth.join.v1", {
  shared: true,
  sanitize: (value) => (typeof value === "string" && groupByCode(value) ? value : null),
});

export const readJoin = (): string | null => {
  const saved = store.read();
  return typeof saved === "string" && groupByCode(saved) ? saved : null;
};
export const saveJoin = (code: string): boolean => store.write(groupByCode(code) ? code : null);
export const clearJoin = (): boolean => store.write(null);

/**
 * The group a new Student account joins: the group of the opened join link, otherwise the group
 * of an invitation sent to the same address, otherwise nothing (Rescue team by default). An
 * Instructor never joins a group.
 */
export function groupToJoin(
  role: "student" | "instructor",
  email: string,
  joinCode: string | null,
  invitations: Invitation[],
): string | null {
  if (role !== "student") return null;
  const linked = joinCode ? groupByCode(joinCode) : undefined;
  if (linked) return linked.id;
  return invitationFor(invitations, normaliseEmail(email))?.groupId ?? null;
}
