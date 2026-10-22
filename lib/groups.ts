import cohort from "@/content/demo-cohort.json";

/**
 * The demo groups of the Instructor side (DESIGN.md: Instructor, Overview rebuilt and two demo
 * groups). Pure: groups are fixed demo data, so every group figure is the same helper applied to
 * the participants of a scope (`inScope`), never a second calculation. Not built yet: creating,
 * renaming or changing groups.
 */
export type Group = {
  id: string;
  name: string;
  code: string;
  /** The readiness of the group a week ago, a whole percent (demo data; the Overview trend line compares with it). */
  lastWeekReadiness?: number;
};

export const groups: Group[] = cohort.groups;

/** The group every local student account belongs to. */
export const DEFAULT_GROUP_ID = groups[0].id;

/** The scope that spans every group. */
export const ALL_GROUPS = "all";

/** "all" or the id of one group. */
export type Scope = string;

export const isScope = (value: unknown): value is Scope =>
  value === ALL_GROUPS || (typeof value === "string" && groups.some((group) => group.id === value));

export const groupById = (id: string): Group | undefined => groups.find((group) => group.id === id);

/** "All groups" or the group's name. */
export const scopeName = (scope: Scope): string =>
  scope === ALL_GROUPS ? "All groups" : (groupById(scope)?.name ?? "All groups");

/** The subtitle of the Overview: "Here is how Rescue team is doing." */
export const scopeSubtitle = (scope: Scope): string =>
  scope === ALL_GROUPS
    ? "Here is how your groups are doing."
    : `Here is how ${scopeName(scope)} is doing.`;

/** The items of the scope: everything for All groups, otherwise those of the one group. */
export function inScope<T extends { groupId: string }>(items: T[], scope: Scope): T[] {
  return scope === ALL_GROUPS ? items : items.filter((item) => item.groupId === scope);
}

/** Group ids that exist, once each, in group order. */
export const knownGroupIds = (ids: string[]): string[] =>
  groups.map((group) => group.id).filter((id) => ids.includes(id));

/** The exams of the scope: those whose audience includes the group (every exam for All groups). */
export function examsInScope<T extends { groupIds: string[] }>(exams: T[], scope: Scope): T[] {
  return scope === ALL_GROUPS ? exams : exams.filter((exam) => exam.groupIds.includes(scope));
}

/** The people an exam is for: the participants of its groups. */
export const examPeople = <T extends { groupId: string }>(
  people: T[],
  exam: { groupIds: string[] },
): T[] => people.filter((person) => exam.groupIds.includes(person.groupId));

/** "Rescue team, Military training". */
export const groupNames = (ids: string[]): string =>
  ids.map((id) => groupById(id)?.name ?? id).join(", ");

/** "14 students" / "1 student". */
export const studentsText = (n: number) => `${n} ${n === 1 ? "student" : "students"}`;

/** The group of an account as it is saved: a known group id, otherwise nothing. */
export const cleanAccountGroup = (value: unknown): string | undefined =>
  typeof value === "string" && value !== ALL_GROUPS && isScope(value) ? value : undefined;
