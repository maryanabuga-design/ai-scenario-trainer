import { useSyncExternalStore } from "react";
import { titleFromFileName } from "@/lib/content-import";

/**
 * The Import screen's unfinished form (DESIGN.md: Instructor, Content): kept in memory only, so the
 * topic picker (its own screen) can return to it. A chosen file cannot be saved in the browser, so a
 * reload starts a new form. CLIENT ONLY.
 */
export type ImportDraft = {
  file: File | null;
  title: string;
  /** The title was typed by the person, so a new file no longer replaces it. */
  titleEdited: boolean;
  /** The topic chosen in the picker. */
  topic: string | null;
  /** The topic found in the CSV's topic column. */
  detected: string | null;
};

const empty: ImportDraft = {
  file: null,
  title: "",
  titleEdited: false,
  topic: null,
  detected: null,
};
let draft: ImportDraft = empty;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export const readDraft = () => draft;

export function updateDraft(change: Partial<ImportDraft>) {
  draft = { ...draft, ...change };
  emit();
}

/** A new file: the title follows its name until the person edits it; a new file forgets the old detection. */
export function chooseDraftFile(file: File, detected: string | null) {
  draft = {
    ...draft,
    file,
    detected,
    title: draft.titleEdited ? draft.title : titleFromFileName(file.name),
  };
  emit();
}

export function removeDraftFile() {
  draft = { ...draft, file: null, detected: null, title: draft.titleEdited ? draft.title : "" };
  emit();
}

export function clearDraft() {
  draft = empty;
  emit();
}

/** The topic the import will use: the one found in the file, else the chosen one. */
export const draftTopic = (value: ImportDraft) => value.detected ?? value.topic;

export function useImportDraft(): ImportDraft {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => draft,
    () => empty,
  );
}
