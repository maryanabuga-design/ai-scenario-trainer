/** The deadline text of an assigned exam (DESIGN.md: Exam readiness). Pure: "now" is a parameter. */

export type Deadline = {
  /** "Due 25 Oct · 6 days left", "Due tomorrow", "Due today" or "Overdue since 20 Oct". */
  label: string;
  /** The same without the days left: "Due 25 Oct", "Due tomorrow", "Due today", "Overdue since 20 Oct". */
  short: string;
  /** Overdue is plain text with a clock icon in the normal colour, never red: it only drives the icon. */
  tone: "normal" | "overdue";
};

const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const DAY = 24 * 60 * 60 * 1000;

/** A "YYYY-MM-DD" date at local midnight, or null when it is not a date. */
export function parseDeadline(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) || date.getMonth() !== Number(match[2]) - 1 ? null : date;
}

/** The local "YYYY-MM-DD" of a moment, plus a number of days. */
export function isoDay(now: Date, plusDays = 0): string {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + plusDays);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The deadline text for a "YYYY-MM-DD" deadline at the moment `now`. */
export function deadlineText(deadline: string, now: Date): Deadline {
  const due = parseDeadline(deadline);
  if (!due) return { label: "No deadline", short: "No deadline", tone: "normal" };
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((due.getTime() - today.getTime()) / DAY);
  const date = dayMonth.format(due);
  if (days < 0) {
    const text = `Overdue since ${date}`;
    return { label: text, short: text, tone: "overdue" };
  }
  if (days === 0) return { label: "Due today", short: "Due today", tone: "normal" };
  if (days === 1) return { label: "Due tomorrow", short: "Due tomorrow", tone: "normal" };
  return { label: `Due ${date} · ${days} days left`, short: `Due ${date}`, tone: "normal" };
}
