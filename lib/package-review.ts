import { LEARNING_PATH } from "@/lib/package-read";
import type { Issue, PackageData, PathPart } from "@/lib/package-read";

/**
 * The guided review of a content package (DESIGN.md: Guided review of a content package). Pure: an
 * item is flagged "must" (blocks Publish) or "confirm" (a machine-made choice to confirm); items
 * without an issue need nothing. `N` of "Review N items" is the number of flagged items, a skipped
 * item counts again, and the review visits them in the order of the tabs.
 */
export type FlaggedItem = {
  /** "guide:0", "steps:1:2", "scenario:0", "questions:3", or "guide:all" for a note about a whole part. */
  key: string;
  tab: PathPart;
  kind: "must" | "confirm";
  /** The most important issue: a must fix before a please confirm. */
  primary: Issue;
  issues: Issue[];
  /** A note about a whole part: no edit screen, fixed in the files. */
  whole: boolean;
};

const PREFIX_TAB: Record<string, PathPart> = {
  guide: "guide",
  steps: "steps",
  scenario: "scenario",
  questions: "quiz",
};

/** The tab an item key belongs to, or null for a key that is none of the four parts. */
export const tabOfKey = (key: string): PathPart | null => PREFIX_TAB[key.split(":")[0]] ?? null;

/** The flagged items in review order (Guide, Steps, Scenario, Quiz; items in the order they appear). */
export function flaggedItems(issues: Issue[]): FlaggedItem[] {
  const groups = new Map<string, Issue[]>();
  for (const issue of issues) {
    if (issue.kind === "note") continue;
    groups.set(issue.key, [...(groups.get(issue.key) ?? []), issue]);
  }
  const items: FlaggedItem[] = [];
  for (const [key, list] of groups) {
    const tab = tabOfKey(key);
    if (tab === null) continue;
    const primary = list.find((issue) => issue.kind === "must") ?? list[0];
    items.push({
      key,
      tab,
      kind: primary.kind === "must" ? "must" : "confirm",
      primary,
      issues: list,
      whole: key.endsWith(":all"),
    });
  }
  return items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        LEARNING_PATH.indexOf(a.item.tab) - LEARNING_PATH.indexOf(b.item.tab) || a.index - b.index,
    )
    .map((entry) => entry.item);
}

/** What Publish is waiting for: nothing flagged, neither a must fix nor a please confirm. */
export const nothingFlagged = (issues: Issue[]) => flaggedItems(issues).length === 0;

/** "Review 11 items" / "Review 1 item". */
export const reviewLabel = (count: number) => `Review ${count} ${count === 1 ? "item" : "items"}`;

/** The pill of an item card: the most important issue as text, or null for an item without an issue. */
export function pillOf(
  issues: Issue[],
  key: string,
): { text: string; kind: "must" | "confirm" } | null {
  const item = flaggedItems(issues).find((entry) => entry.key === key);
  if (!item) return null;
  return item.kind === "must"
    ? { text: item.primary.reason, kind: "must" }
    : { text: "Please confirm", kind: "confirm" };
}

/** "Guide 2 · Steps 4 · Scenario 1 · Quiz 4": the flagged items per part, parts with none left out. */
export function partCounts(items: FlaggedItem[]): string {
  const names: Record<PathPart, string> = {
    guide: "Guide",
    steps: "Steps",
    scenario: "Scenario",
    quiz: "Quiz",
  };
  return LEARNING_PATH.flatMap((part) => {
    const n = items.filter((item) => item.tab === part).length;
    return n > 0 ? [`${names[part]} ${n}`] : [];
  }).join(" · ");
}

/**
 * The ONE plain sentence under a disabled "Save and next": what the item still needs, or "" when it
 * is resolvable. A picture problem is fixed with the image block, the rest in the fields above.
 */
export function needsSentence(problems: Issue[]): string {
  if (problems.length === 0) return "";
  if (
    problems.some((issue) =>
      /^Image .* was not selected|larger than 300 KB|not a png/.test(issue.reason),
    )
  )
    return "Choose the image file or remove the image to continue.";
  if (problems.some((issue) => /has no alt text/.test(issue.reason)))
    return "Add an image description to continue.";
  return problems.length === 1
    ? "Fix the point above to continue."
    : "Fix the points above to continue.";
}

/**
 * The round after a save: the items already visited stay (so "Item N of M" keeps its place) followed by
 * the items of the old round that are still flagged. `next` is the index to open, or null at the end.
 */
export function nextRound(
  round: string[],
  at: number,
  flagged: Set<string>,
): { round: string[]; next: number | null } {
  const visited = round.slice(0, at + 1);
  const rest = round.slice(at + 1).filter((key) => flagged.has(key));
  return {
    round: [...visited, ...rest],
    next: rest.length > 0 ? at + 1 : null,
  };
}

// ---- keys in addresses and the items of a package -------------------------------------------

/** "steps:0:2" in an address: "steps-0-2". */
export const keySlug = (key: string) => key.replace(/:/g, "-");
const SLUG = /^(guide|scenario|questions)-(\d{1,3}|all)$|^steps-\d{1,3}-(\d{1,3}|all)$/;
/** The key of an address segment, or null when it is not an item. */
export const keyOfSlug = (slug: string): string | null =>
  SLUG.test(slug) ? slug.replace(/-/g, ":") : null;

export type ItemRef =
  | { part: "guide"; index: number }
  | { part: "steps"; list: number; index: number }
  | { part: "scenario"; index: number }
  | { part: "questions"; index: number };

/** The place an item key points at in the package data, or null for a whole-part key or a stale one. */
export function parseKey(data: PackageData, key: string): ItemRef | null {
  const [part, a, b] = key.split(":");
  const i = Number(a);
  if (!Number.isInteger(i)) return null;
  if (part === "guide") return data.guide?.[i] ? { part, index: i } : null;
  if (part === "scenario") return data.scenario?.[i] ? { part, index: i } : null;
  if (part === "questions") return data.questions?.[i] ? { part, index: i } : null;
  const j = Number(b);
  if (part === "steps" && Number.isInteger(j) && data.steps?.[i]?.steps[j]) {
    return { part, list: i, index: j };
  }
  return null;
}

/** A name for an item: "Guide section 2", "Step 3 of When the alarm sounds", "Scenario step 1", "Question 4". */
export function itemName(data: PackageData, key: string): string {
  const ref = parseKey(data, key);
  if (ref?.part === "guide")
    return `Guide section ${data.guide![ref.index].section || ref.index + 1}`;
  if (ref?.part === "steps") {
    const list = data.steps![ref.list];
    return `Step ${list.steps[ref.index].step || ref.index + 1}${list.title ? ` of ${list.title}` : ""}`;
  }
  if (ref?.part === "scenario")
    return `Scenario step ${data.scenario![ref.index].step || ref.index + 1}`;
  if (ref?.part === "questions") return `Question ${ref.index + 1}`;
  const part = key.split(":")[0];
  return (
    { guide: "Guide", steps: "Steps", scenario: "Scenario", questions: "Quiz" }[part] ?? "Item"
  );
}
