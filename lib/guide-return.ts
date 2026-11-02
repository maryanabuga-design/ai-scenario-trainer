/**
 * Opening the Guide from a quiz sheet leaves the question screen; when the reader comes back, the
 * question is restored from the saved session, and this note puts the scroll position and the focus
 * back (DESIGN.md: Quiz sheets: a centred title and the Guide as a full screen). Kept in
 * `sessionStorage`, once: it is removed as soon as it is read. CLIENT ONLY.
 */
const KEY = "ast.guide-return.v1";

export type GuideReturn = {
  itemId: string;
  y: number;
  /** Where the focus goes back to: the lightbulb (the hint was open) or the feedback sheet. */
  from: "hint" | "feedback";
};

export function noteGuideReturn(note: GuideReturn) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(note));
  } catch {
    // blocked storage: the question simply comes back at the top
  }
}

/** The note for this question, once; a note for another question is dropped. */
export function takeGuideReturn(itemId: string): GuideReturn | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    const note = JSON.parse(raw ?? "null");
    return note && note.itemId === itemId && typeof note.y === "number" ? note : null;
  } catch {
    return null;
  }
}
