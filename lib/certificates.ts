import { PASS_MARK } from "@/lib/config";

/**
 * Completion certificates (DESIGN.md: Completion certificates): simulated records kept in this
 * browser for a passed exam. Pure: storage lives in `lib/certificates-store.ts`.
 */
export type Certificate = {
  /** A short code, "QT-2026-0042". */
  id: string;
  /** The email of the account it belongs to. */
  accountId: string;
  examTitle: string;
  /** When it was earned (ms). */
  date: number;
  correct: number;
  total: number;
  passMark: number;
  /** The finish time of the exam attempt it belongs to: one certificate per attempt. */
  attemptAt: number;
};

export const CERTIFICATE_FOOTER = "Prototype certificate, not an official document.";
export const CERTIFICATES_EMPTY = "Pass an exam to earn a certificate.";

/** "QT-2026-0042": the year and the number in order on this device, at least 4 digits. */
export function certificateCode(year: number, number: number): string {
  return `QT-${year}-${String(number).padStart(4, "0")}`;
}

/** Whether a score earns a certificate: the pass mark or more. */
export function earnsCertificate(correct: number, total: number): boolean {
  return total > 0 && Math.floor((correct * 100) / total) >= PASS_MARK;
}

/**
 * The list with the certificate of a passed attempt added, or the list as it is when the score does
 * not pass, or when the attempt already has its certificate (one per attempt).
 */
export function withCertificate(
  list: Certificate[],
  input: {
    accountId: string;
    examTitle: string;
    correct: number;
    total: number;
    attemptAt: number;
    now: number;
  },
): Certificate[] {
  if (!earnsCertificate(input.correct, input.total)) return list;
  if (list.some((entry) => entry.attemptAt === input.attemptAt)) return list;
  const year = new Date(input.now).getFullYear();
  let number = list.length + 1;
  while (list.some((entry) => entry.id === certificateCode(year, number))) number += 1;
  return [
    {
      id: certificateCode(year, number),
      accountId: input.accountId,
      examTitle: input.examTitle,
      date: input.now,
      correct: input.correct,
      total: input.total,
      passMark: PASS_MARK,
      attemptAt: input.attemptAt,
    },
    ...list,
  ];
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

/** Tolerant loading: a broken record is dropped, never a crash; newest first, no repeated id. */
export function cleanCertificates(value: unknown): Certificate[] | null {
  if (!Array.isArray(value)) return null;
  const list: Certificate[] = [];
  for (const entry of value) {
    if (!isObject(entry)) continue;
    const { id, accountId, examTitle, date, correct, total, passMark, attemptAt } = entry;
    if (typeof id !== "string" || !/^QT-\d{4}-\d{4,}$/.test(id)) continue;
    if (typeof accountId !== "string" || typeof examTitle !== "string") continue;
    if (typeof date !== "number" || !Number.isFinite(date)) continue;
    if (!isCount(correct) || !isCount(total) || total === 0 || correct > total) continue;
    if (list.some((other) => other.id === id)) continue;
    list.push({
      id,
      accountId,
      examTitle,
      date,
      correct,
      total,
      passMark: typeof passMark === "number" ? passMark : PASS_MARK,
      attemptAt: typeof attemptAt === "number" ? attemptAt : date,
    });
  }
  list.sort((a, b) => b.date - a.date);
  return list.length > 0 ? list : null;
}

const dayMonthYear = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
export const certificateDate = (date: number) => dayMonthYear.format(new Date(date));
export const correctLine = (certificate: Pick<Certificate, "correct" | "total">) =>
  `${certificate.correct} of ${certificate.total} correct`;
