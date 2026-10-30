import type { ExamStatus } from "@/lib/cohort";

/**
 * The words of an exam status (DESIGN.md: One status chip for the whole app). Passed is positive,
 * Not passed and Missed attention, In progress and Not started neutral (`examTone`).
 */
export type StatusKind = ExamStatus["kind"];

export const statusLabel: Record<StatusKind, string> = {
  passed: "Passed",
  "not-passed": "Not passed",
  "in-progress": "In progress",
  "not-started": "Not started",
  missed: "Missed",
};
