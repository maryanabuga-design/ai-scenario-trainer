import type { Checklist } from "@/lib/checklists";
import { checklists } from "@/lib/checklists";
import { createStore } from "@/lib/store";

/** The done steps of every step guide: topic id → the ids of its done steps. */
export type StepsProgress = Record<string, string[]>;

/** Keeps only known step ids of known guides; anything else, or broken data, is dropped. */
export function cleanStepsProgress(value: unknown): StepsProgress | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const clean: StepsProgress = {};
  for (const checklist of checklists) {
    const done = doneIds(value, checklist);
    if (done.length > 0) clean[checklist.id] = done;
  }
  return Object.keys(clean).length > 0 ? clean : null;
}

const store = createStore<StepsProgress>("ast.steps.v1", { sanitize: cleanStepsProgress });

export const useStepsProgress = store.useValue;
export const clearStepsProgress = () => store.write(null);

/** The done step ids of one guide, in step order, from whatever was read; never throws. */
export function doneIds(all: unknown, checklist: Checklist): string[] {
  if (typeof all !== "object" || all === null || Array.isArray(all)) return [];
  const saved = (all as Record<string, unknown>)[checklist.id];
  if (!Array.isArray(saved)) return [];
  return checklist.steps.map((step) => step.id).filter((id) => saved.includes(id));
}

export const doneCount = (all: unknown, checklist: Checklist) => doneIds(all, checklist).length;

/** "2 of 5 steps done". */
export function doneLabel(done: number, total: number): string {
  return `${done} of ${total} steps done`;
}

/** "5 steps · 2 done", the second line of a list card. */
export function listLine(done: number, total: number): string {
  return `${total} ${total === 1 ? "step" : "steps"} · ${done} done`;
}

/** The progress after toggling one step; an unknown step changes nothing. */
export function toggled(all: unknown, checklist: Checklist, stepId: string): StepsProgress {
  const base = (cleanStepsProgress(all) ?? {}) as StepsProgress;
  if (!checklist.steps.some((step) => step.id === stepId)) return base;
  const done = new Set(doneIds(all, checklist));
  if (done.has(stepId)) done.delete(stepId);
  else done.add(stepId);
  const next = { ...base };
  if (done.size === 0) delete next[checklist.id];
  else next[checklist.id] = checklist.steps.map((step) => step.id).filter((id) => done.has(id));
  return next;
}

/** Toggles one step in this browser. */
export function toggleStep(checklist: Checklist, stepId: string) {
  const next = toggled(store.read(), checklist, stepId);
  store.write(Object.keys(next).length > 0 ? next : null);
}
