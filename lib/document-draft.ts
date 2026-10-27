import type { PackageFile } from "@/lib/package-read";

/**
 * The document chosen on Import, handed to the Analysing screen (DESIGN.md: One document in, a draft
 * topic out): kept in memory only, so a reload starts a new import and nothing is stored before the
 * analysis finishes. CLIENT ONLY.
 */
export type DocumentDraft = {
  name: string;
  size: number;
  bytes: Uint8Array;
  images: PackageFile[];
};

let draft: DocumentDraft | null = null;

export const getDocumentDraft = () => draft;
export const setDocumentDraft = (next: DocumentDraft) => {
  draft = next;
};
export const clearDocumentDraft = () => {
  draft = null;
};
